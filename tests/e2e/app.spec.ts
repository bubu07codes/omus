import { _electron as electron, test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { createHash } from 'crypto'

/**
 * Smoke tests for the whole omus app.
 *
 * These launch the REAL built app (out/main + out/renderer) with Playwright,
 * but with a PRIVATE user-data directory (OMUS_USER_DATA_PATH) so your real
 * library, database and settings are never touched. Native OS dialogs are
 * stubbed to always cancel and `shell` is stubbed so nothing opens on your
 * desktop during the run.
 *
 * Run with:  npm run test:e2e   (builds the app first, then runs this file)
 */
const APP_ENTRY = path.join(__dirname, '../../out/main/index.js')

/** Generates a tiny, valid 1-second 16-bit mono WAV to exercise the file parsers. */
function makeWavBytes(): Uint8Array {
  const rate = 8000
  const seconds = 1
  const dataSize = rate * seconds * 2
  const buf = new Uint8Array(44 + dataSize)
  const view = new DataView(buf.buffer, 0)
  const ascii = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) buf[off + i] = s.charCodeAt(i)
  }
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, dataSize, true)
  for (let i = 0; i < rate * seconds; i++) {
    view.setInt16(44 + i * 2, Math.floor(Math.sin(i / 20) * 7000), true)
  }
  return buf
}

/** Builds an MP3 with a tiny embedded ID3v2.3 APIC cover (22-byte JPEG). */
function makeCoverMp3Bytes(): Buffer {
  const mime = 'image/jpeg'
  const description = ''
  const picture = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xd9
  ])
  const encoder = Buffer.from([0])
  const frameData = Buffer.concat([
    encoder,
    Buffer.from(mime + '\0', 'latin1'),
    Buffer.from([0x03]),
    Buffer.from(description + '\0', 'latin1'),
    picture
  ])
  const frame = Buffer.alloc(10 + frameData.length)
  frame.set(Buffer.from('APIC', 'latin1'), 0)
  const fv = new DataView(frame.buffer, 0)
  fv.setUint32(4, frameData.length, false)
  fv.setUint16(8, 0, false)
  frame.set(frameData, 10)

  const syncsafe = (n: number) =>
    Buffer.from([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f])
  const tag = Buffer.concat([
    Buffer.from('ID3', 'latin1'),
    Buffer.from([3, 0, 0]),
    syncsafe(frame.length)
  ])
  return Buffer.concat([tag, frame, Buffer.alloc(512, 0x55)])
}

test.describe('omus app smoke tests', () => {
  let app: Awaited<ReturnType<typeof electron.launch>>
  let window: Page
  let dataDir: string

  test.beforeAll(async () => {
    try {
      await fs.access(APP_ENTRY)
    } catch {
      throw new Error(
        `Built app not found at ${APP_ENTRY}. Run \`npm run test:e2e\` (it builds first).`
      )
    }

    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'omus-e2e-'))

    app = await electron.launch({
      args: [APP_ENTRY],
      // `env` REPLACES process.env when provided, so keep everything and only override userData.
      env: { ...process.env, OMUS_USER_DATA_PATH: dataDir }
    })

    // Stub native dialogs and external shell actions inside the main process.
    // `evaluate` passes the result of require('electron') to the callback.
    await app.evaluate(({ dialog, shell }) => {
      dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] })
      dialog.showSaveDialog = async () => ({ canceled: true, filePath: '' })
      dialog.showMessageBox = async () => ({ response: 1 })
      dialog.showErrorBox = () => {}
      shell.openExternal = async () => true
    })

    window = await app.firstWindow()
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    if (app) {
      await app.close()
    }
    try {
      await fs.remove(dataDir, { recursive: true })
    } catch {
      // Leftover temp files are harmless.
    }
  })

  /** Invoke a renderer-side `window.api.*` method and return its result. */
  function invoke<T>(method: string, ...args: unknown[]): Promise<T> {
    return window.evaluate(({ method, args }) => (globalThis as any).api[method](...args), {
      method,
      args
    })
  }

  test('window opens and the full UI renders', async () => {
    expect(await window.title()).toBe('omus')
    await expect(window.locator('.app-shell')).toBeVisible({ timeout: 20_000 })

    const state = await window.evaluate(() => ({
      ready: document.readyState,
      hasRoot: Boolean(document.querySelector('#root')),
      hasShell: Boolean(document.querySelector('.app-shell')),
      hasApi: typeof (globalThis as any).api === 'object'
    }))
    expect(state.ready).toBe('complete')
    expect(state.hasRoot).toBe(true)
    expect(state.hasShell).toBe(true)
    expect(state.hasApi).toBe(true)
  })

  test('main process is healthy and serves exactly one window', async () => {
    const info = await app.evaluate(({ app, BrowserWindow }) => ({
      name: app.name,
      version: app.getVersion(),
      windows: BrowserWindow.getAllWindows().length
    }))
    expect(info.name).toBe('omus')
    expect(info.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(info.windows).toBe(1)
  })

  test('library round-trip: save, read, update, delete tracks', async () => {
    const pending = {
      sourcePath: '/e2e/audio/song.mp3',
      filename: 'song.mp3',
      title: 'Test Song',
      artist: 'Tester',
      album: 'E2E',
      duration: 123.4,
      cover: '',
      lyrics: '[00:00.00]Hello',
      lyrics_offset: 0
    }

    const saved = await invoke<Array<{ id: string; title: string }>>('saveTracks', [pending])
    expect(saved).toHaveLength(1)
    expect(await invoke<unknown[]>('getLibrary')).toHaveLength(1)

    expect(
      await invoke<boolean>('updateTrackMetadata', { id: saved[0].id, title: 'Renamed' })
    ).toBe(true)
    const renamed = await invoke<Array<{ id: string; title: string }>>('getLibrary')
    expect(renamed[0].title).toBe('Renamed')

    expect(await invoke<boolean>('updateTrackLyrics', saved[0].id, '[00:01.00]Bye')).toBe(true)
    expect(await invoke<boolean>('updateTrackLyricOffset', saved[0].id, 500)).toBe(true)
    expect(await invoke<boolean>('deleteTrack', saved[0].id)).toBe(true)
    expect(await invoke<unknown[]>('getLibrary')).toEqual([])
  })

  test('playlist round-trip: create, update, covers, delete', async () => {
    const created = await invoke<{ id: string; name: string }>('createPlaylist', 'Smoke')
    expect(created.id).toBeTruthy()
    expect(await invoke<Array<{ id: string }>>('getPlaylists')).toHaveLength(1)

    expect(
      await invoke<boolean>('updatePlaylist', created.id, {
        name: 'Smoke 2',
        cover_type: 'gradient',
        cover_gradient: 'linear-gradient(#111, #222)'
      })
    ).toBe(true)

    // Adding a nonexistent track must not crash the handler.
    await invoke('addTrackToPlaylist', created.id, 'does-not-exist')
    expect(await invoke<unknown[]>('getPlaylistTracks', created.id)).toEqual([])
    expect(await invoke<boolean>('reorderPlaylistTracks', created.id, [])).toBe(true)

    const covers = await invoke<Record<string, string[]>>('getPlaylistCovers')
    expect(covers[created.id]).toEqual([])

    expect(await invoke<boolean>('deletePlaylist', created.id)).toBe(true)
    expect(
      (await invoke<Array<{ id: string }>>('getPlaylists')).some((p) => p.id === created.id)
    ).toBe(false)
  })

  test('settings round-trip and sync flush', async () => {
    expect(await invoke<boolean>('saveSettings', { theme: 'dark', volume: 0.7 })).toBe(true)
    expect(await invoke<unknown>('getSettings')).toEqual({ theme: 'dark', volume: 0.7 })

    const flushed = await window.evaluate(() => {
      ;(globalThis as any).api.flushSettings({ theme: 'dark', flushed: true })
      return true
    })
    expect(flushed).toBe(true)
    expect(await invoke<unknown>('getSettings')).toEqual({ theme: 'dark', flushed: true })
  })

  test('window controls: maximize toggle + mini player mode', async () => {
    expect(await invoke<boolean>('isWindowMaximized')).toBe(false)

    expect(await invoke<boolean>('windowToggleMaximize')).toBe(true)
    expect(await invoke<boolean>('isWindowMaximized')).toBe(true)
    expect(await invoke<boolean>('windowToggleMaximize')).toBe(false)
    expect(await invoke<boolean>('isWindowMaximized')).toBe(false)

    await invoke('enterMiniMode')
    const bounds = await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0]
      const b = w.getBounds()
      return { width: b.width, height: b.height }
    })
    expect(bounds.width).toBe(240)
    expect(bounds.height).toBe(240)

    await invoke('exitMiniMode')
    await expect(window.locator('.app-shell')).toBeVisible()
  })

  test('dialog-based handlers cancel safely and never crash the app', async () => {
    expect(await invoke<unknown[]>('parseUploads')).toEqual([])
    expect(await invoke<unknown[]>('parseFolder')).toEqual([])
    expect(await invoke<unknown[]>('parsePaths', ['/definitely/not/here.mp3'])).toEqual([])
    expect(await invoke<unknown>('selectCover')).toBeNull()
    expect(await invoke<unknown>('importPlaylist')).toBeNull()
    expect(await invoke<boolean>('exportPlaylist', 'nope')).toBe(false)
    expect(await invoke<boolean>('revealInExplorer', '')).toBe(false)
    expect(await invoke<boolean>('openExternal', 'not a url')).toBe(false)
  })

  test('folder scan ("add folder") parses many files without crashing the app', async () => {
    const musicDir = path.join(dataDir, 'music')
    await fs.mkdir(path.join(musicDir, 'nested'), { recursive: true })

    const wav = makeWavBytes()
    const WAV_COUNT = 40
    for (let i = 0; i < WAV_COUNT; i++) {
      const sub = i % 4 === 0 ? 'nested' : ''
      await fs.writeFile(path.join(musicDir, sub, `track-${String(i).padStart(3, '0')}.wav`), wav)
    }
    // One MP3 with an embedded cover — exercises the disk-backed cover pipeline.
    const mp3Source = path.join(musicDir, 'cover-song.mp3')
    await fs.writeFile(mp3Source, makeCoverMp3Bytes())
    // Junk that must be filtered out (non-media extensions) — never crash on.
    await fs.writeFile(path.join(musicDir, 'notes.txt'), 'not audio')
    await fs.writeFile(path.join(musicDir, 'readme.md'), '# not audio')
    await fs.writeFile(path.join(musicDir, 'nested', 'cover.png'), Buffer.alloc(96, 0x89))

    try {
      await app.evaluate(({ dialog }, folderPath: string) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folderPath] })
      }, musicDir)
      const tracks = await invoke<Array<{ title: string; duration: number }>>('parseFolder')
      expect(tracks).toHaveLength(WAV_COUNT + 1)
      expect(tracks.filter((t) => t.title.startsWith('track-'))).toHaveLength(WAV_COUNT)
      expect(tracks.find((t) => t.title === 'cover-song')).toBeDefined()

      // Save the scanned folder — the exact action that used to crash on big
      // libraries because every base64 cover was held in memory + sent via IPC.
      const saved = await invoke<Array<{ id: string; filename: string; cover: string }>>(
        'saveTracks',
        tracks
      )
      expect(saved).toHaveLength(WAV_COUNT + 1)
      expect(saved.filter((s) => s.filename.endsWith('.wav')).every((s) => s.cover === '')).toBe(
        true
      )

      // The MP3 cover went to <OmusLibrary>/covers/<sha1-of-id>.jpg and is
      // served back through the omus-cover:// protocol as a tiny URL.
      const savedMp3 = saved.find((s) => s.filename === 'cover-song.mp3')
      expect(savedMp3!.cover).toMatch(/^omus-cover:\/\/cover\?path=/)
      const coverName = `${createHash('sha1').update(mp3Source).digest('hex')}.jpg`
      await fs.access(path.join(dataDir, 'OmusLibrary', 'covers', coverName))

      const fetched = await window.evaluate(async (coverUrl: string) => {
        const res = await fetch(coverUrl)
        return res.ok
          ? { ok: true, bytes: (await res.arrayBuffer()).byteLength }
          : { ok: false, bytes: 0 }
      }, savedMp3!.cover)
      expect(fetched.ok).toBe(true)
      expect(fetched.bytes).toBe(22)

      // Same fetch→data: URL conversion the renderer uses for the OS media
      // session artwork (MediaImage only accepts http/https/data/blob srcs).
      const dataUrl = await window.evaluate(async (coverUrl: string) => {
        const res = await fetch(coverUrl)
        if (!res.ok) return ''
        const blob = await res.blob()
        const bytes = new Uint8Array(await blob.arrayBuffer())
        let bin = ''
        for (let i = 0; i < bytes.length; i += 0x8000) {
          const chunk = Array.from(bytes.subarray(i, Math.min(i + 0x8000, bytes.length)))
          bin += String.fromCharCode(...chunk)
        }
        return `data:${blob.type};base64,${btoa(bin)}`
      }, savedMp3!.cover)
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/)
      expect(Buffer.from(dataUrl.split(',')[1] || '', 'base64').length).toBe(22)

      // The library reloads with covers as URLs, no embedded base64 anywhere.
      const library = await invoke<Array<{ cover: string }>>('getLibrary')
      expect(library).toHaveLength(WAV_COUNT + 1)
      expect(library.some((t) => t.cover.startsWith('omus-cover://'))).toBe(true)

      // The file logger must have written its startup line to userData/logs/app.log.
      const logContent = await fs.readFile(path.join(dataDir, 'logs', 'app.log'), 'utf-8')
      expect(logContent).toContain('App started')
    } finally {
      // Restore the "always cancel" stub the other tests rely on.
      await app.evaluate(({ dialog }) => {
        dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] })
      })
    }
  })

  test('app stays alive after all smoke interactions', async () => {
    const info = await app.evaluate(({ app, BrowserWindow }) => ({
      name: app.name,
      windows: BrowserWindow.getAllWindows().length
    }))
    expect(info.name).toBe('omus')
    expect(info.windows).toBe(1)
  })
})
