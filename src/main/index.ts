import { app, BrowserWindow, ipcMain, dialog, protocol, shell, screen } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { Readable } from 'stream'
import Database from 'better-sqlite3'
import {
  updateDiscordPresence,
  clearDiscordPresence,
  destroyDiscordRPC,
  type DiscordActivity
} from './discordRPC'
import { checkForUpdates } from './updater'
import { initDatabaseSchema } from './db'
import { initLogger, logError, logInfo } from './logger'

app.name = 'omus'

// Register privileged custom audio streaming protocol before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'omus-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  },
  {
    scheme: 'omus-cover',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  }
])

// Overridable in tests so the smoke suite never touches the real library.
const USER_DATA_PATH = process.env.OMUS_USER_DATA_PATH || app.getPath('userData')
const MUSIC_STORE_PATH = path.join(USER_DATA_PATH, 'OmusLibrary')
const COVERS_DIR = path.join(MUSIC_STORE_PATH, 'covers')
const DB_PATH = path.join(USER_DATA_PATH, 'omus.db')
const SETTINGS_PATH = path.join(USER_DATA_PATH, 'settings.json')

initLogger(USER_DATA_PATH)

// Capture unexpected errors to the log file — the app must never die silently.
process.on('uncaughtException', (err) => {
  logError('Uncaught exception', err)
})
process.on('unhandledRejection', (err) => {
  logError('Unhandled promise rejection', err)
})

let db: Database.Database
let mainWindow: BrowserWindow | null = null

const MINI_SIZE = 240
let miniModeActive = false
let normalBounds: Electron.Rectangle | null = null
let wasMaximizedBeforeMini = false

async function initStorage(): Promise<void> {
  await fs.mkdir(MUSIC_STORE_PATH, { recursive: true })
  await fs.mkdir(COVERS_DIR, { recursive: true })
  db = new Database(DB_PATH)
  initDatabaseSchema(db)
}

function createWindow(): void {
  let iconPath: string

  if (process.platform === 'win32') {
    iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'build/icon.ico')
      : path.join(__dirname, '../../build/icon.ico')
  } else {
    iconPath = app.isPackaged
      ? path.join(__dirname, '../renderer/logo.svg')
      : path.join(__dirname, '../renderer/public/logo.svg')
  }

  const isWindows = process.platform === 'win32'

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 860,
    minHeight: 600,
    backgroundColor: '#080808',
    autoHideMenuBar: true,
    title: 'omus',
    icon: iconPath,
    ...(isWindows ? { frame: false } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setTitle('omus')

  const win = mainWindow
  const sendMaxState = (): void => {
    if (!win.isDestroyed()) win.webContents.send('window:maximized', win.isMaximized())
  }
  win.on('maximize', sendMaxState)
  win.on('unmaximize', sendMaxState)
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  win.webContents.on('did-finish-load', () => {
    if (!win.isDestroyed()) win.webContents.send('window:mini-mode', miniModeActive)
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

async function walkDir(dir: string, visited: Set<string> = new Set()): Promise<string[]> {
  let results: string[] = []
  try {
    // Resolve symlinks/junctions and share one `visited` set across the whole
    // traversal so a directory loop can never cause unbounded recursion.
    const real = await fs.realpath(dir)
    if (visited.has(real)) return []
    visited.add(real)

    const list = await fs.readdir(dir, { withFileTypes: true })
    for (const file of list) {
      const fullPath = path.resolve(dir, file.name)
      if (file.isDirectory()) {
        results = results.concat(await walkDir(fullPath, visited))
      } else {
        results.push(fullPath)
      }
    }
  } catch {
    // Ignore inaccessible directories
  }
  return results
}

const AUDIO_EXTS = new Set([
  '.mp3',
  '.flac',
  '.wav',
  '.m4a',
  '.ogg',
  '.aac',
  '.wma',
  '.alac',
  '.aiff'
])

const MIME_BY_EXT: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/opus',
  '.aac': 'audio/aac',
  '.wma': 'audio/x-ms-wma',
  '.aiff': 'audio/aiff',
  '.alac': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.flv': 'video/x-flv',
  '.wmv': 'video/x-ms-wmv',
  '.ogv': 'video/ogg',
  '.mpg': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.3gp': 'video/3gpp',
  '.ts': 'video/mp2t',
  '.m2ts': 'video/mp2t'
}

const VIDEO_EXTS = new Set([
  '.mp4',
  '.m4v',
  '.webm',
  '.mkv',
  '.mov',
  '.avi',
  '.flv',
  '.wmv',
  '.ogv',
  '.mpg',
  '.mpeg',
  '.3gp',
  '.ts',
  '.m2ts'
])

const MEDIA_EXTS = new Set([...AUDIO_EXTS, ...VIDEO_EXTS])

interface ParsedTrack {
  sourcePath: string
  filename: string
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  lyrics: string
  lyrics_offset?: number
}

interface SavedTrack {
  id: string
  filename: string
  filepath: string
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  lyrics: string
  lyrics_offset: number
  added_at: number
}

async function parseAudioFile(
  sourcePath: string,
  options: { skipCovers?: boolean } = {}
): Promise<ParsedTrack | null> {
  const ext = path.extname(sourcePath).toLowerCase()
  const fallback: ParsedTrack = {
    sourcePath,
    filename: path.basename(sourcePath),
    title: path.parse(sourcePath).name,
    artist: '',
    album: '',
    duration: 0,
    cover: '',
    lyrics: ''
  }

  try {
    const skipCovers = options.skipCovers === true
    const { parseFile } = await import('music-metadata')
    const metadata = await parseFile(sourcePath, { duration: true, skipCovers })
    let coverBase64 = ''
    if (!skipCovers && metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0]
      coverBase64 = `data:${pic.format};base64,${pic.data.toString('base64')}`
    }
    return {
      ...fallback,
      title: metadata.common.title || fallback.title,
      artist: metadata.common.artist || '',
      album: metadata.common.album || '',
      duration: metadata.format.duration || 0,
      cover: coverBase64
    }
  } catch {
    return VIDEO_EXTS.has(ext) ? fallback : null
  }
}

const COVER_EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/tiff': '.tif',
  'image/avif': '.avif'
}

/** Cover art is stored on disk and served through the `omus-cover://` protocol. */
function coverUrl(coverName: string): string {
  return `omus-cover://cover?path=${encodeURIComponent(coverName)}`
}

/**
 * Maps a DB row to the shape the renderer expects: disk-backed covers become
 * tiny `omus-cover://` URLs so <img> can stream them lazily. This keeps cover
 * bytes out of IPC payloads (which used to exhaust memory on large libraries).
 */
function toTrackView(row: unknown): Record<string, unknown> {
  if (!row || typeof row !== 'object') return {}
  const r = row as { cover?: string; cover_path?: string | null }
  if (r.cover_path) {
    return { ...r, cover_path: undefined, cover: coverUrl(r.cover_path) }
  }
  return r
}

/**
 * Extracts only the embedded cover art of a file as raw bytes + mime type.
 * Kept separate from `parseAudioFile` so folder scans can defer the
 * (memory heavy) artwork to save-time, one file at a time.
 */
async function extractCoverPicture(
  sourcePath: string
): Promise<{ mime: string; data: Buffer } | null> {
  try {
    const { parseFile } = await import('music-metadata')
    const metadata = await parseFile(sourcePath, { duration: false, skipCovers: false })
    const pic = metadata.common.picture?.[0]
    if (!pic || !pic.data?.length) return null
    const mime = pic.format?.startsWith('image/') ? pic.format : 'image/jpeg'
    return { mime, data: Buffer.from(pic.data) }
  } catch {
    return null
  }
}

/**
 * Writes the embedded cover of a file to the covers directory and returns the
 * short file name to store in the DB (or null when the file has no artwork).
 */
async function persistCover(trackId: string, sourcePath: string): Promise<string | null> {
  try {
    const pic = await extractCoverPicture(sourcePath)
    if (!pic) return null
    const ext = COVER_EXT_BY_MIME[pic.mime] || '.jpg'
    const name = `${createHash('sha1').update(trackId).digest('hex')}${ext}`
    await fs.writeFile(path.join(COVERS_DIR, name), pic.data)
    return name
  } catch {
    return null
  }
}

/**
 * One-time background migration: moves covers that older builds stored inline
 * (base64 in the `cover` column) to the covers directory. Runs lazily after
 * startup so big libraries are never loaded into memory at once, and so list
 * operations can't trigger the same out-of-memory crash for upgraded users.
 */
async function migrateLegacyCoversToDisk(): Promise<void> {
  try {
    const cols = db.prepare(`PRAGMA table_info(tracks)`).all() as { name: string }[]
    if (!cols.some((c) => c.name === 'cover_path')) return

    const rows = db.prepare(
      `SELECT id, cover FROM tracks WHERE cover != '' AND cover_path IS NULL`
    )
    const update = db.prepare(`UPDATE tracks SET cover = '', cover_path = ? WHERE id = ?`)

    let migrated = 0
    for (const row of rows.iterate() as IterableIterator<{ id: string; cover: string }>) {
      const parsed = /^data:([^;]+);base64,(.+)$/s.exec(row.cover)
      if (!parsed) continue
      const buf = Buffer.from(parsed[2], 'base64')
      if (!buf.length) continue
      const ext = COVER_EXT_BY_MIME[parsed[1]] || '.jpg'
      const name = `${createHash('sha1').update(row.id).digest('hex')}${ext}`
      try {
        await fs.writeFile(path.join(COVERS_DIR, name), buf)
        update.run(name, row.id)
        migrated++
      } catch {
        // Keep the inline cover on failure; migration is best-effort.
      }
    }
    if (migrated > 0) logInfo(`Migrated ${migrated} inline covers to disk`)
  } catch {
    /* best-effort */
  }
}

async function saveSingleTrack(
  t: ParsedTrack,
  coverPath: string | null = null
): Promise<SavedTrack | null> {
  try {
    const targetPath = t.sourcePath
    const trackRecord = {
      id: targetPath,
      filename: t.filename,
      filepath: targetPath,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      cover: t.cover,
      lyrics: t.lyrics,
      lyrics_offset: t.lyrics_offset ?? 0,
      added_at: Date.now(),
      cover_path: coverPath
    }

    db.prepare(
      `
      INSERT OR REPLACE INTO tracks (id, filename, filepath, title, artist, album, duration, cover, lyrics, lyrics_offset, added_at, cover_path)
      VALUES (@id, @filename, @filepath, @title, @artist, @album, @duration, @cover, @lyrics, @lyrics_offset, @added_at, @cover_path)
    `
    ).run(trackRecord)

    return trackRecord
  } catch {
    return null
  }
}

// ----------------------------------------------------
// IPC HANDLERS
// ----------------------------------------------------

async function showOpenDialog(
  event: Electron.IpcMainInvokeEvent,
  options: Electron.OpenDialogOptions
): Promise<Electron.OpenDialogReturnValue> {
  const win = BrowserWindow.fromWebContents(event.sender) ?? mainWindow
  return win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options)
}

async function showSaveDialog(
  event: Electron.IpcMainInvokeEvent,
  options: Electron.SaveDialogOptions
): Promise<Electron.SaveDialogReturnValue> {
  const win = BrowserWindow.fromWebContents(event.sender) ?? mainWindow
  return win ? dialog.showSaveDialog(win, options) : dialog.showSaveDialog(options)
}

ipcMain.handle('library:get', () => {
  return db
    .prepare('SELECT * FROM tracks ORDER BY added_at DESC')
    .all()
    .map(toTrackView)
})

ipcMain.handle('library:parse-uploads', async (event) => {
  try {
    const { canceled, filePaths } = await showOpenDialog(event, {
      title: 'Select Media Files',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Media Files',
          extensions: [
            'mp3',
            'flac',
            'wav',
            'm4a',
            'ogg',
            'aac',
            'alac',
            'aiff',
            'mp4',
            'm4v',
            'webm',
            'mkv',
            'mov',
            'avi',
            'flv',
            'wmv',
            'ogv',
            'mpg',
            'mpeg',
            '3gp'
          ]
        }
      ]
    })

    if (canceled || filePaths.length === 0) return []

    const parsedTracks: ParsedTrack[] = []
    for (const sourcePath of filePaths) {
      const parsed = await parseAudioFile(sourcePath)
      if (parsed) parsedTracks.push(parsed)
    }
    return parsedTracks
  } catch (err) {
    console.error('Failed to open file dialog:', err)
    return []
  }
})

ipcMain.handle('library:parse-folder', async (event) => {
  try {
    const { canceled, filePaths } = await showOpenDialog(event, {
      title: 'Select Music Folder',
      properties: ['openDirectory', 'multiSelections']
    })

    if (canceled || filePaths.length === 0) return []

    const parsedTracks: ParsedTrack[] = []
    for (const folderPath of filePaths) {
      const allFiles = await walkDir(folderPath)
      const mediaFiles = allFiles.filter((f) => MEDIA_EXTS.has(path.extname(f).toLowerCase()))

      for (const sourcePath of mediaFiles) {
        // Covers are skipped here (and backfilled when the user saves) so that
        // scanning a big library can never exhaust memory holding every cover.
        const parsed = await parseAudioFile(sourcePath, { skipCovers: true })
        if (parsed) parsedTracks.push(parsed)
      }
    }
    return parsedTracks
  } catch (err) {
    logError('Failed to scan folder', err)
    console.error('Failed to scan folder:', err)
    return []
  }
})

ipcMain.handle('library:parse-paths', async (_, paths: string[]) => {
  if (!Array.isArray(paths) || paths.length === 0) return []

  let scannedDir = false
  const files: string[] = []
  for (const p of paths) {
    const st = await fs.stat(p).catch(() => null)
    if (!st) continue
    if (st.isDirectory()) {
      scannedDir = true
      files.push(...(await walkDir(p)))
    } else {
      files.push(p)
    }
  }

  const parsedTracks: ParsedTrack[] = []
  // Defer covers for folder scans and large batches (bounded memory); small
  // drags of individual files keep instant cover previews.
  const skipCovers = scannedDir || files.length > 50
  for (const sourcePath of files) {
    if (!MEDIA_EXTS.has(path.extname(sourcePath).toLowerCase())) continue
    const parsed = await parseAudioFile(sourcePath, { skipCovers })
    if (parsed) parsedTracks.push(parsed)
  }
  return parsedTracks
})

ipcMain.handle('library:select-cover', async (event) => {
  try {
    const { canceled, filePaths } = await showOpenDialog(event, {
      title: 'Select Cover Image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif'] }]
    })

    if (canceled || filePaths.length === 0) return null

    const imagePath = filePaths[0]
    const imageBuffer = await fs.readFile(imagePath)
    const ext = path.extname(imagePath).replace('.', '').toLowerCase()
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
  } catch {
    return null
  }
})

ipcMain.handle('library:save-tracks', async (_, tracks: ParsedTrack[]) => {
  const saved: SavedTrack[] = []
  for (const t of tracks) {
    // Tracks imported without artwork (folder scans) get their cover written
    // to disk here — one file at a time — and are returned to the renderer as
    // tiny omus-cover:// URLs instead of megabytes of base64 text.
    let coverPath: string | null = null
    if (!t.cover) {
      coverPath = await persistCover(t.sourcePath, t.sourcePath)
    }
    const rec = await saveSingleTrack(t, coverPath)
    if (rec) saved.push(toTrackView(rec) as unknown as SavedTrack)
  }
  return saved
})

ipcMain.handle('library:delete-track', async (_, trackId: string) => {
  try {
    const existing = db
      .prepare('SELECT cover_path FROM tracks WHERE id = ?')
      .get(trackId) as { cover_path?: string | null } | undefined
    db.prepare('DELETE FROM playlist_tracks WHERE track_id = ?').run(trackId)
    db.prepare('DELETE FROM tracks WHERE id = ?').run(trackId)
    if (existing?.cover_path) {
      try {
        await fs.unlink(path.join(COVERS_DIR, existing.cover_path))
      } catch {
        // Orphaned cover files are harmless.
      }
    }
    return true
  } catch {
    return false
  }
})

ipcMain.handle(
  'library:update-track-lyrics',
  async (_, { trackId, lyrics }: { trackId: string; lyrics: string }) => {
    try {
      db.prepare('UPDATE tracks SET lyrics = ? WHERE id = ?').run(lyrics, trackId)
      return true
    } catch {
      return false
    }
  }
)

ipcMain.handle(
  'track:update-lyric-offset',
  async (_, { trackId, offsetMs }: { trackId: string; offsetMs: number }) => {
    try {
      db.prepare('UPDATE tracks SET lyrics_offset = ? WHERE id = ?').run(
        Math.round(offsetMs) || 0,
        trackId
      )
      return true
    } catch {
      return false
    }
  }
)

ipcMain.handle(
  'library:update-track-metadata',
  async (
    _,
    trackData: {
      id: string
      title?: string
      artist?: string
      album?: string
      lyrics?: string
      cover?: string
    }
  ) => {
    try {
      const sets: string[] = []
      const vals: unknown[] = []
      const fields = ['title', 'artist', 'album', 'lyrics', 'cover'] as const
      for (const f of fields) {
        if (trackData[f] !== undefined) {
          sets.push(`${f} = ?`)
          vals.push(trackData[f])
        }
      }
      if (sets.length === 0) return false
      db.prepare(`UPDATE tracks SET ${sets.join(', ')} WHERE id = ?`).run(...vals, trackData.id)
      return true
    } catch {
      return false
    }
  }
)

ipcMain.handle('library:reveal-in-explorer', async (_, filepath: string) => {
  try {
    if (filepath) {
      shell.showItemInFolder(filepath)
      return true
    }
    return false
  } catch {
    return false
  }
})

ipcMain.handle('app:open-external', async (_, url: string) => {
  try {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      await shell.openExternal(url)
      return true
    }
    return false
  } catch {
    return false
  }
})

ipcMain.handle('playlists:get', () => {
  return db.prepare('SELECT * FROM playlists ORDER BY created_at DESC').all()
})

ipcMain.handle('playlists:create', (_, name: string) => {
  const playlist = { id: `pl_${Date.now()}`, name, created_at: Date.now(), cover_type: 'auto' }
  db.prepare(
    'INSERT INTO playlists (id, name, created_at, cover_type) VALUES (@id, @name, @created_at, @cover_type)'
  ).run(playlist)
  return playlist
})

ipcMain.handle('playlists:delete', (_, playlistId: string) => {
  try {
    db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(playlistId)
    db.prepare('DELETE FROM playlists WHERE id = ?').run(playlistId)
    return true
  } catch {
    return false
  }
})

ipcMain.handle(
  'playlists:add-track',
  (_, { playlistId, trackId }: { playlistId: string; trackId: string }) => {
    db.prepare(
      'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, added_at) VALUES (?, ?, ?)'
    ).run(playlistId, trackId, Date.now())
  }
)

ipcMain.handle(
  'playlists:remove-track',
  (_, { playlistId, trackId }: { playlistId: string; trackId: string }) => {
    db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(
      playlistId,
      trackId
    )
  }
)

ipcMain.handle('playlists:get-tracks', (_, playlistId: string) => {
  return db
    .prepare(
      `
    SELECT t.* FROM tracks t
    JOIN playlist_tracks pt ON t.id = pt.track_id
    WHERE pt.playlist_id = ?
    ORDER BY pt.added_at ASC
  `
    )
    .all(playlistId)
    .map(toTrackView)
})

ipcMain.handle(
  'playlists:reorder-tracks',
  async (_, { playlistId, trackIds }: { playlistId: string; trackIds: string[] }) => {
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(playlistId)
        const insert = db.prepare(
          'INSERT INTO playlist_tracks (playlist_id, track_id, added_at) VALUES (?, ?, ?)'
        )
        let time = Date.now()
        for (const trackId of trackIds) {
          insert.run(playlistId, trackId, time++)
        }
      })()
      return true
    } catch {
      return false
    }
  }
)

ipcMain.handle('playlists:update', (_, id: string, data: Record<string, unknown>) => {
  try {
    const allowed = ['name', 'cover_type', 'cover_image', 'cover_gradient'] as const
    const sets: string[] = []
    const vals: unknown[] = []
    for (const k of allowed) {
      if (data && data[k] !== undefined) {
        sets.push(`${k} = ?`)
        vals.push(data[k])
      }
    }
    if (sets.length === 0) return false
    const stmt = db.prepare(`UPDATE playlists SET ${sets.join(', ')} WHERE id = ?`)
    stmt.run(...vals, id)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('playlists:covers', () => {
  const pls = db.prepare('SELECT id FROM playlists').all() as { id: string }[]
  const map: Record<string, string[]> = {}
  for (const pl of pls) {
    const rows = db
      .prepare(
        `
      SELECT t.cover, t.cover_path FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ? AND (
        (t.cover IS NOT NULL AND t.cover != '') OR
        (t.cover_path IS NOT NULL AND t.cover_path != '')
      )
      LIMIT 4
    `
      )
      .all(pl.id) as { cover: string; cover_path?: string | null }[]
    map[pl.id] = rows.map((r) => toTrackView(r).cover as string)
  }
  return map
})

ipcMain.handle('playlists:export', async (event, playlistId: string) => {
  try {
    const pl = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId) as
      | { name: string }
      | undefined
    if (!pl) return false
    const rows = db
      .prepare(
        `
      SELECT t.filepath FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ?
      ORDER BY pt.added_at ASC
    `
      )
      .all(playlistId) as { filepath: string }[]
    const safeName = pl.name.replace(/[\\/:*?"<>|]/g, '_') || 'Playlist'
    const { canceled, filePath } = await showSaveDialog(event, {
      title: 'Export Playlist',
      defaultPath: `${safeName}.m3u`,
      filters: [{ name: 'M3U Playlist', extensions: ['m3u', 'm3u8'] }]
    })
    if (canceled || !filePath) return false
    const lines = ['#EXTM3U']
    for (const t of rows) {
      lines.push(`#EXTINF:-1,${path.basename(t.filepath)}`)
      lines.push(t.filepath)
    }
    await fs.writeFile(filePath, lines.join('\n'), 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('playlists:import-m3u', async (event) => {
  try {
    const { canceled, filePaths } = await showOpenDialog(event, {
      title: 'Import M3U Playlist',
      properties: ['openFile'],
      filters: [{ name: 'M3U Playlist', extensions: ['m3u', 'm3u8'] }]
    })

    if (canceled || filePaths.length === 0) return null

    const m3uPath = filePaths[0]
    const playlistName = path.parse(m3uPath).name || 'Imported Playlist'
    const content = await fs.readFile(m3uPath, 'utf-8')
    const lines = content.split(/\r?\n/)
    const audioPaths: string[] = []

    for (let line of lines) {
      line = line.trim()
      if (!line || line.startsWith('#')) continue
      const resolved = path.isAbsolute(line) ? line : path.resolve(path.dirname(m3uPath), line)
      if (AUDIO_EXTS.has(path.extname(resolved).toLowerCase())) {
        audioPaths.push(resolved)
      }
    }

    const playlist = {
      id: `pl_${Date.now()}`,
      name: playlistName,
      created_at: Date.now(),
      cover_type: 'auto'
    }
    db.prepare(
      'INSERT INTO playlists (id, name, created_at, cover_type) VALUES (@id, @name, @created_at, @cover_type)'
    ).run(playlist)

    for (const p of audioPaths) {
      let track = db.prepare('SELECT id FROM tracks WHERE filepath = ?').get(p) as
        | { id: string }
        | undefined
      if (!track) {
        const parsed = await parseAudioFile(p)
        if (parsed) {
          const saved = await saveSingleTrack(parsed)
          if (saved) track = { id: saved.id }
        }
      }
      if (track) {
        db.prepare(
          'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, added_at) VALUES (?, ?, ?)'
        ).run(playlist.id, track.id, Date.now())
      }
    }

    return playlist
  } catch {
    return null
  }
})

ipcMain.handle('settings:get', async () => {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
})

ipcMain.handle('settings:set', async (_, settings: unknown) => {
  try {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.on('settings:set-sync', (_event, settings: unknown) => {
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
  } catch {
    /* non-fatal */
  }
})

ipcMain.on('updates:check', () => {
  void checkForUpdates(mainWindow, true)
})

// ----------------------------------------------------
// WINDOW CONTROLS
// ----------------------------------------------------
ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.on('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.handle('window:toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false
  if (win.isMaximized()) win.unmaximize()
  else win.maximize()
  return win.isMaximized()
})

ipcMain.handle('window:is-maximized', (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
})

// ----------------------------------------------------
// MINI PLAYER MODE
// ----------------------------------------------------
function enterMiniMode(win: BrowserWindow): void {
  if (miniModeActive || win.isDestroyed()) return

  wasMaximizedBeforeMini = win.isMaximized()
  if (wasMaximizedBeforeMini) win.unmaximize()
  normalBounds = win.getBounds()

  const workArea = screen.getDisplayMatching(normalBounds).workArea
  const x = workArea.x + workArea.width - MINI_SIZE - 16
  const y = workArea.y + workArea.height - MINI_SIZE - 16

  win.setAlwaysOnTop(true, 'floating')
  win.setResizable(false)
  win.setMaximizable(false)
  win.setFullScreenable(false)
  win.setBounds({ x, y, width: MINI_SIZE, height: MINI_SIZE }, false)
  win.webContents.send('window:mini-mode', true)
  miniModeActive = true
}

function exitMiniMode(win: BrowserWindow): void {
  if (!miniModeActive || win.isDestroyed()) return
  miniModeActive = false

  win.setAlwaysOnTop(false)
  win.setResizable(true)
  win.setMaximizable(true)
  win.setFullScreenable(true)
  if (normalBounds) win.setBounds(normalBounds, false)
  normalBounds = null
  if (wasMaximizedBeforeMini) win.maximize()
  wasMaximizedBeforeMini = false
  win.webContents.send('window:mini-mode', false)
}

ipcMain.handle('window:enter-mini', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) enterMiniMode(win)
})

ipcMain.handle('window:exit-mini', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) exitMiniMode(win)
})

// ----------------------------------------------------
// DISCORD RICH PRESENCE
// ----------------------------------------------------
ipcMain.on('discord:update', (_event, activity: DiscordActivity) => {
  updateDiscordPresence(activity)
})

ipcMain.on('discord:clear', () => {
  clearDiscordPresence()
})

// ----------------------------------------------------
// APP LIFECYCLE
// ----------------------------------------------------

app.whenReady().then(async () => {
  protocol.handle('omus-cover', async (request) => {
    try {
      const url = new URL(request.url)
      const rawName = url.searchParams.get('path')
      if (!rawName) {
        return new Response('Not found', { status: 404 })
      }
      const name = path.basename(decodeURIComponent(rawName))
      if (!name || name === '.' || name === '..') {
        return new Response('Forbidden', { status: 403 })
      }
      const coverFile = path.join(COVERS_DIR, name)
      if (path.resolve(coverFile) !== path.resolve(COVERS_DIR, name)) {
        return new Response('Forbidden', { status: 403 })
      }
      const data = await fs.readFile(coverFile)
      const ext = path.extname(name).toLowerCase()
      const contentType =
        {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
          '.bmp': 'image/bmp',
          '.tif': 'image/tiff',
          '.avif': 'image/avif'
        }[ext] || 'application/octet-stream'
      return new Response(data as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch {
      return new Response('Cover error', { status: 500 })
    }
  })

  protocol.handle('omus-media', async (request) => {
    try {
      const url = new URL(request.url)
      const rawPath = url.searchParams.get('path')
      if (!rawPath) {
        return new Response('Not found', { status: 404 })
      }
      const filePath = decodeURIComponent(rawPath)

      const stat = await fs.stat(filePath)
      if (!stat.isFile()) {
        return new Response('Not a file', { status: 404 })
      }
      const size = stat.size
      const contentType =
        MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
      const baseHeaders: Record<string, string> = {
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType
      }

      const rangeHeader = request.headers.get('range')
      if (rangeHeader) {
        const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
        let start = match?.[1] && match[1] !== '' ? parseInt(match[1], 10) : 0
        let end = match?.[2] && match[2] !== '' ? parseInt(match[2], 10) : NaN
        if (isNaN(start) || start < 0) start = 0
        if (isNaN(end) || end < start) end = size - 1
        if (start >= size) {
          return new Response(null, {
            status: 416,
            headers: { 'Content-Range': `bytes */${size}` }
          })
        }
        const chunkSize = end - start + 1
        const body = Readable.toWeb(
          createReadStream(filePath, { start, end })
        ) as unknown as BodyInit
        return new Response(body, {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Length': String(chunkSize),
            'Content-Range': `bytes ${start}-${end}/${size}`
          }
        })
      }

      const body = Readable.toWeb(createReadStream(filePath)) as unknown as BodyInit
      return new Response(body, {
        status: 200,
        headers: { ...baseHeaders, 'Content-Length': String(size) }
      })
    } catch {
      return new Response('Audio stream error', { status: 500 })
    }
  })

  await initStorage()
  createWindow()

  // Move any legacy inline (base64) covers to disk in the background so large
  // upgraded libraries never ship megabyte-sized covers over IPC.
  setTimeout(() => {
    void migrateLegacyCoversToDisk()
  }, 500)

  logInfo(`App started (v${app.getVersion()}, ${process.platform}, userData=${USER_DATA_PATH})`)

  setTimeout(() => {
    void checkForUpdates(mainWindow)
  }, 4000)
})

app.on('window-all-closed', () => {
  logInfo('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logInfo('Quitting')
  destroyDiscordRPC()
})