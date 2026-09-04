import { app, BrowserWindow, ipcMain, dialog, protocol, shell } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream, writeFileSync } from 'fs'
import { Readable } from 'stream'
import Database from 'better-sqlite3'
import {
  updateDiscordPresence,
  clearDiscordPresence,
  destroyDiscordRPC,
  type DiscordActivity
} from './discordRPC'
import { checkForUpdates } from './updater'

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
  }
])

const USER_DATA_PATH = app.getPath('userData')
const MUSIC_STORE_PATH = path.join(USER_DATA_PATH, 'OmusLibrary')
const DB_PATH = path.join(USER_DATA_PATH, 'omus.db')
const SETTINGS_PATH = path.join(USER_DATA_PATH, 'settings.json')

let db: Database.Database
let mainWindow: BrowserWindow | null = null

async function initStorage(): Promise<void> {
  await fs.mkdir(MUSIC_STORE_PATH, { recursive: true })
  db = new Database(DB_PATH)

  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      filename TEXT,
      filepath TEXT,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration REAL,
      cover TEXT,
      lyrics TEXT,
      added_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at INTEGER,
      cover_type TEXT,
      cover_image TEXT,
      cover_gradient TEXT
    );
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT,
      track_id TEXT,
      added_at INTEGER,
      PRIMARY KEY (playlist_id, track_id)
    );
  `)

  // Migrations for existing databases
  const plCols = db.prepare(`PRAGMA table_info(playlists)`).all() as { name: string }[]
  const plColNames = new Set(plCols.map((c) => c.name))
  if (!plColNames.has('cover_type')) db.exec(`ALTER TABLE playlists ADD COLUMN cover_type TEXT`)
  if (!plColNames.has('cover_image')) db.exec(`ALTER TABLE playlists ADD COLUMN cover_image TEXT`)
  if (!plColNames.has('cover_gradient'))
    db.exec(`ALTER TABLE playlists ADD COLUMN cover_gradient TEXT`)
}

function createWindow(): void {
  // Determine appropriate icon path depending on platform and environment
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

  // Frameless window on Windows: the native OS title bar / borders are removed
  // and replaced by a custom, in-app title bar rendered by the <TitleBar />.
  const isWindows = process.platform === 'win32'

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1300,
    minHeight: 800,
    backgroundColor: '#080808',
    autoHideMenuBar: true,
    title: 'omus',
    icon: iconPath,
    // Remove the default OS window frame on Windows (kept on macOS/Linux).
    ...(isWindows ? { frame: false } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setTitle('omus')

  // Keep the renderer in sync with the real maximize state so the custom
  // title bar can swap its maximize / restore icon and react to shortcuts.
  const win = mainWindow
  const sendMaxState = (): void => {
    if (!win.isDestroyed()) win.webContents.send('window:maximized', win.isMaximized())
  }
  win.on('maximize', sendMaxState)
  win.on('unmaximize', sendMaxState)
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

async function walkDir(dir: string): Promise<string[]> {
  let results: string[] = []
  try {
    const list = await fs.readdir(dir, { withFileTypes: true })
    for (const file of list) {
      const fullPath = path.resolve(dir, file.name)
      if (file.isDirectory()) {
        results = results.concat(await walkDir(fullPath))
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
  // Music video / video container mappings (used by the streaming protocol).
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

// Video containers accepted as music videos. Even when `music-metadata` cannot
// read tags from a container, the file is still imported (the HTML media
// element reports the real duration at playback time).
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

// Everything the library can import — audio plus music-video containers.
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
  added_at: number
}

async function parseAudioFile(sourcePath: string): Promise<ParsedTrack | null> {
  const ext = path.extname(sourcePath).toLowerCase()
  // Video containers may not carry audio-tag metadata; keep a usable fallback
  // so the file still gets imported (duration is reported at playback time).
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
    const { parseFile } = await import('music-metadata')
    const metadata = await parseFile(sourcePath, { duration: true, skipCovers: false })
    let coverBase64 = ''
    if (metadata.common.picture && metadata.common.picture.length > 0) {
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

async function saveSingleTrack(t: ParsedTrack): Promise<SavedTrack | null> {
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
      added_at: Date.now()
    }

    db.prepare(
      `
      INSERT OR REPLACE INTO tracks (id, filename, filepath, title, artist, album, duration, cover, lyrics, added_at)
      VALUES (@id, @filename, @filepath, @title, @artist, @album, @duration, @cover, @lyrics, @added_at)
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

ipcMain.handle('library:get', () => {
  return db.prepare('SELECT * FROM tracks ORDER BY added_at DESC').all()
})

ipcMain.handle('library:parse-uploads', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
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
})

ipcMain.handle('library:parse-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Music Folder',
    properties: ['openDirectory']
  })

  if (canceled || filePaths.length === 0) return []

  const allFiles = await walkDir(filePaths[0])
  const mediaFiles = allFiles.filter((f) => MEDIA_EXTS.has(path.extname(f).toLowerCase()))

  const parsedTracks: ParsedTrack[] = []
  for (const sourcePath of mediaFiles) {
    const parsed = await parseAudioFile(sourcePath)
    if (parsed) parsedTracks.push(parsed)
  }
  return parsedTracks
})

ipcMain.handle('library:parse-paths', async (_, paths: string[]) => {
  if (!Array.isArray(paths) || paths.length === 0) return []

  const files: string[] = []
  for (const p of paths) {
    const st = await fs.stat(p).catch(() => null)
    if (!st) continue
    if (st.isDirectory()) files.push(...(await walkDir(p)))
    else files.push(p)
  }

  const parsedTracks: ParsedTrack[] = []
  for (const sourcePath of files) {
    if (!MEDIA_EXTS.has(path.extname(sourcePath).toLowerCase())) continue
    const parsed = await parseAudioFile(sourcePath)
    if (parsed) parsedTracks.push(parsed)
  }
  return parsedTracks
})

ipcMain.handle('library:select-cover', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Cover Image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif'] }]
  })

  if (canceled || filePaths.length === 0) return null

  try {
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
    const rec = await saveSingleTrack(t)
    if (rec) saved.push(rec)
  }
  return saved
})

ipcMain.handle('library:delete-track', async (_, trackId: string) => {
  try {
    db.prepare('DELETE FROM playlist_tracks WHERE track_id = ?').run(trackId)
    db.prepare('DELETE FROM tracks WHERE id = ?').run(trackId)
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
      SELECT t.cover FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ? AND t.cover IS NOT NULL AND t.cover != ''
      LIMIT 4
    `
      )
      .all(pl.id) as { cover: string }[]
    map[pl.id] = rows.map((r) => r.cover)
  }
  return map
})

ipcMain.handle('playlists:export', async (_, playlistId: string) => {
  try {
    const pl = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlistId) as
      { name: string } | undefined
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
    const { canceled, filePath } = await dialog.showSaveDialog({
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

ipcMain.handle('playlists:import-m3u', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import M3U Playlist',
    properties: ['openFile'],
    filters: [{ name: 'M3U Playlist', extensions: ['m3u', 'm3u8'] }]
  })

  if (canceled || filePaths.length === 0) return null

  try {
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
        { id: string } | undefined
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

// Synchronous "best-effort" write used for the final settings flush when the
// window is closing (the async invoke above may not make it out in time).
ipcMain.on('settings:set-sync', (_event, settings: unknown) => {
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
  } catch {
    /* non-fatal */
  }
})

// Manual "Check for updates" from Settings.
ipcMain.on('updates:check', () => {
  void checkForUpdates(mainWindow, true)
})

// ----------------------------------------------------
// WINDOW CONTROLS — driven by the custom frameless title bar
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
  // Protocol handler for streaming audio with proper HTTP Range support.
  // HTML5 <audio> issues a Range request whenever it needs bytes (playback and,
  // critically, seeking). If we ignore Range and return a plain 200 with the
  // whole file, the element restarts from 0 on every seek — the cause of the
  // "clicking the slider sends the track back to the start" bug. Responding
  // with 206 Partial Content + Content-Range makes seeking instant and smooth.
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

  // Auto-check for updates shortly after launch (after the window has shown so
  // it doesn't interrupt the first paint / loading screen).
  setTimeout(() => {
    void checkForUpdates(mainWindow)
  }, 4000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  destroyDiscordRPC()
})
