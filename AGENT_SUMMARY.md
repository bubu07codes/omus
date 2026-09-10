# omus — Master Codebase Summary (for AI agents)

> **READ THIS FIRST for any task in this repo.** This single file documents every folder,
> system, data flow and convention in the `omus` project. It exists to save tokens: future
> agents should read this file (and then only the specific source files they need) instead of
> re-exploring the whole tree. Last verified against commit `2b66447` (v1.3.0).

---

## 1. What is omus

A fast, lightweight **offline desktop music player** for local media collections (MP3, FLAC, WAV,
M4A, OGG, AAC, WMA, ALAC, AIFF **plus music-video containers** MP4/WEBM/MKV/MOV/AVI/FLV/WMV/OGV/
MPG/3GP/TS...). No accounts, no cloud, no tracking. Features: synced LRC lyrics w/ online lookup
(LRCLIB), 10-band Web Audio equalizer with presets, seamless crossfade transitions, sleep timer,
live visualizers, library import/tag editing, playlist management (+ M3U import/export), custom
themes/fonts/animations, fluid ambient backgrounds, fullscreen now-playing (incl. video mirror),
Discord Rich Presence, OS media keys, GitHub release checker, drag-and-drop import.

## 2. Stack (key versions)

| Layer | Tech |
|---|---|
| Framework | Electron `39.2.6` (Node 22.x toolchain), electron-vite `5.0.0`, electron-builder `26.15.3` |
| Language | TypeScript `5.9.3` (two tsconfigs: node + web) |
| UI | React `19.2.1` (uses `memo`, `useTransition`, `useDeferredValue`), lucide-react icons |
| Styling | Tailwind CSS `4.3.3` (partial), most UI is custom CSS (`constants/globalCss.ts`) |
| Data | better-sqlite3 `13.0.3` (sync, native module), JSON settings file |
| Media | music-metadata `7.14.0` (tag/cover parsing), HTML5 `<audio>`/`<video>` + Web Audio API |
| Integration | discord-rpc `4.0.1`, chokidar, clsx/tailwind-merge (class utils) |
| Tooling | ESLint 9 + prettier 3.7, @electron/rebuild, vite 7.2.6, @vitejs/plugin-react |

## 3. Commands (package.json)

```bash
npm run dev          # electron-vite dev (hot renderer)
npm start            # electron-vite preview (built output)
npm run build        # typecheck + electron-vite build → ./out
npm run typecheck    # tsc --noEmit for node (main+preload) then web (renderer)  ← source of truth for types
npm run lint         # eslint --cache .
npm run format       # prettier --write .
npm run build:win    # build + electron-builder --win (NSIS installer)
npm install          # runs postinstall → electron-builder install-app-deps (rebuilds native better-sqlite3)
```

## 4. Architecture (Electron 3-process model)

```
┌──────────────────────────────────────────────────────────────────┐
│  src/main/index.ts  (main process = backend)                     │
│   • SQLite DB + settings.json  • IPC handlers  • omus-media://   │
│     streaming protocol (HTTP Range)  • window mgmt               │
│   • ./discordRPC.ts (Rich Presence)  • ./updater.ts (GitHub)     │
└───────────────┬────────────────────────────┬─────────────────────┘
                │ electron IPC               │
┌───────────────▼────────────────────────────▼─────────────────────┐
│ src/preload/index.ts — contextBridge exposes the ENTIRE API      │
│ as `window.api.*` (typed in index.d.ts → CustomAPI)              │
└───────────────┬──────────────────────────────────────────────────┘
                │ (same process as renderer, runs before page)
┌───────────────▼──────────────────────────────────────────────────┐
│ src/renderer/src/main.tsx → ErrorBoundary → App.tsx (monolith)   │
│   hooks/: useAudioEngine · useLyrics · useToast                  │
│   components/ · constants/ · types/ · assets/                    │
└──────────────────────────────────────────────────────────────────┘
```

- **Main** = the only process with filesystem/DB access. Renderer never touches the DB.
- **Preload** = thin typed bridge. Every renderer→main call goes through `window.api.*`.
- **Renderer** = pure React UI. Sends IPC via `window.api`, subscribes to a few main→renderer events (`window:maximized`, `update-status`).

## 5. Directory map (annotated)

```
omus/
├── AGENT_SUMMARY.md        ← you are here
├── package.json            scripts, deps, electron-builder inline build{} block
├── package-lock.json
├── electron.vite.config.ts vite config: @renderer alias, react plugin,
│                           manualChunks vendor(react)/icons(lucide)
├── electron-builder.yml    packaging: NSIS (win), dmg/AppImage/snap/deb; GH publish
├── tsconfig.json           project refs → tsconfig.node.json + tsconfig.web.json
├── tsconfig.node.json      main + preload (extends @electron-toolkit tsconfig.node)
├── tsconfig.web.json       renderer + preload/*.d.ts (extends .../tsconfig.web)
├── tailwind.config.js      omus color palette (green #1DB954, base #121212, etc.)
├── postcss.config.js       @tailwindcss/postcss + autoprefixer
├── eslint.config.mjs       TS/React/React-hooks/refresh; explicit-function-return-type OFF
├── .prettierrc.yaml        singleQuote, no semi, printWidth 100, no trailingComma
├── .editorconfig · .gitignore · .prettierignore
├── README.md / LICENSE     (source-available, non-commercial)
│
├── src/
│   ├── main/                         === MAIN PROCESS (backend) ===
│   │   ├── index.ts        ~790 lines — everything (see §6)
│   │   ├── discordRPC.ts   Discord Rich Presence client (see §7)
│   │   └── updater.ts      GitHub release check + dialogs (see §7)
│   ├── preload/                      === BRIDGE ===
│   │   ├── index.ts        contextBridge → window.api (see §8)
│   │   └── index.d.ts      CustomAPI type + window.api global declaration
│   └── renderer/                     === FRONTEND ===
│       ├── index.html       CSP meta tag, #root div, loads /src/main.tsx
│       ├── public/          app.svg, logo.svg
│       └── src/
│           ├── main.tsx      entry: createRoot, ErrorBoundary (global error catcher)
│           ├── App.tsx       ★ 6064-line MONOLITH — ~all UI lives here (see §9)
│           ├── env.d.ts      vite/client ref
│           ├── assets/       base.css (legacy scaffold), main.css (tailwind import + base)
│           ├── types/index.ts    all shared interfaces (Track, Playlist, Theme, EQ, …)
│           ├── constants/
│           │   ├── presets.ts     PRESET_THEMES · PRESET_FONTS · PRESET_ANIMATIONS ·
│           │   │                   NAV_ITEMS · PL_PALETTES · playlistGradient() · parseGradient()
│           │   ├── globalCss.ts   GLOBAL_CSS: scrollbars, keyframes, .app-shell, fluid orbs,
│           │   │                   layout classes, button/input/track/row/modal/lyric styles…
│           │   └── media.ts       VIDEO_EXTS set, getFileExt(), isVideoFile()
│           ├── hooks/
│           │   ├── useAudioEngine.ts  ★ the whole audio graph (see §10)
│           │   ├── useLyrics.ts       LRC parser, LRCLIB fetch, offsets (see §10)
│           │   └── useToast.ts        toast queue (max 5)
│           └── components/
│               ├── ErrorScreen.tsx · LoadingScreen.tsx · Versions.tsx
│               ├── GlobalSearch.tsx   Ctrl+K command palette (tracks/artists/albums/playlists)
│               ├── TitleBar.tsx       frameless window bar (Win only) + maximize state
│               ├── LyricLine.tsx      per-line lyric animation (memoized)
│               ├── TrackRows.tsx      LibraryTableRow / LibraryCardRow / LibraryGroupRow / QueueCard
│               ├── Visualizer/AudioVisualizer.tsx  canvas bars/wave/radial from analyser node
│               ├── Equalizer/EqualizerModal.tsx   10-band EQ with presets
│               ├── Modals/            AboutModal · ManualLyricsModal · SleepTimerModal · TagEditorModal
│               ├── Shared/            ContextMenu · TrackContextMenu · PlaylistCoverArt
│               └── Toast/ToastContainer.tsx
│
├── build/                    electron-builder resources: icon.ico, icon.png, entitlements.mac.plist
├── docs/index.html           marketing website (GH Pages) — NOT the app
├── github-assets/            images/gifs used by README & docs site
├── node_modules/ · out/ · dist/    deps + build outputs (all gitignored)
```

**Convention:** ALL backend logic is in `src/main/index.ts` (no backend modules split out except
discordRPC/updater). ALL frontend logic/UI is in `src/renderer/src/App.tsx` — small per-component
files exist only for reusable pieces under `components/`. If you add a big new modal/panel, follow
the existing pattern (new file in `components/…`, import into App.tsx).

## 6. Main process — `src/main/index.ts`

### 6.1 Storage locations (all under `app.getPath('userData')`, e.g. `%APPDATA%/omus`)
| Constant | Path | Purpose |
|---|---|---|
| `MUSIC_STORE_PATH` | `<userData>/OmusLibrary` | created dir (many features reference original file paths; tracks are NOT copied) |
| `DB_PATH` | `<userData>/omus.db` | SQLite via better-sqlite3 (sync API) |
| `SETTINGS_PATH` | `<userData>/settings.json` | whole-app settings, JSON |

⚠ **File paths ARE the primary key.** Track `id` = absolute source `filepath`. If users move
files, entries break (no re-scan logic yet).

### 6.2 SQLite schema (`initStorage()`, runs at startup, auto-migrates)
```sql
tracks(id TEXT PK /*=filepath*/, filename, filepath, title, artist, album,
       duration REAL, cover TEXT /*base64 data URL*/, lyrics TEXT /*LRC*/,
       lyrics_offset INTEGER DEFAULT 0, added_at INTEGER);
playlists(id TEXT PK, name TEXT, created_at INTEGER, cover_type TEXT /*auto|gradient|image*/,
          cover_image TEXT, cover_gradient TEXT);
playlist_tracks(playlist_id TEXT, track_id TEXT, added_at INTEGER, PRIMARY KEY(playlist_id, track_id));
```
Migrations: `PRAGMA table_info(...)` checks add missing columns (`lyrics_offset`, `cover_type`,
`cover_image`, `cover_gradient`).

### 6.3 Audio/Video import
- Extension sets: `AUDIO_EXTS` (.mp3 .flac .wav .m4a .ogg .aac .wma .alac .aiff), `VIDEO_EXTS`
  (14 containers incl. .mp4 .webm .mkv .mov .avi .flv .wmv .ts…), `MEDIA_EXTS` = union.
- `parseAudioFile()` uses **music-metadata** `parseFile({duration:true, skipCovers:false})`;
  extracts title/artist/album/duration/first embedded picture → base64 data URL. Video
  containers use a filename fallback (artist/album empty, duration 0 — real duration comes
  from the HTML media element at playback).
- `walkDir()` recursively lists a folder (ignores inaccessible dirs).
- Import entry points: file dialog (`library:parse-uploads`), folder dialog (`library:parse-folder`),
  explicit paths incl. drag-drop (`library:parse-paths`).

### 6.4 `omus-media://` streaming protocol (⭐ core piece)
- Registered as **privileged scheme before app ready** with `stream:true, supportFetchAPI:true, corsEnabled:true, bypassCSP:true`.
- Renderer never reads raw file bytes via JS; it plays `omus-media://audio?path=<encodeURIComponent(filepath)>`.
- Handler in `app.whenReady()` → `protocol.handle('omus-media', …)`:
  - Resolves `path` param → `fs.stat` → MIME via `MIME_BY_EXT` → streams file.
  - **Full HTTP Range support**: responds `206 Partial Content` + `Content-Range` when a
    `Range` header is present, `416` when out-of-range, plain `200` otherwise.
  - **Why it matters (known bug history):** HTML5 audio sends Range requests on seek. Ignoring
    them made every seek restart the track from 0 — the “clicking the slider resets the song”
    bug. Never remove Range handling.

### 6.5 Window
- 1320×860 (min 860×600), bg `#080808`, `autoHideMenuBar`, icon from `build/icon.ico` (win).
- **Frameless on Windows only** (`frame:false`): custom in-app title bar (`TitleBar.tsx`,
  `TITLEBAR_H=40`). Maximize state is pushed to renderer via `window:maximized` event.
- Loads `ELECTRON_RENDERER_URL` (dev) or `out/renderer/index.html`.
- Auto-update check 4s after launch (non-blocking, `checkForUpdates(mainWindow)`).
- `window-all-closed` quits (except darwin); `before-quit` destroys Discord RPC.

### 6.6 Full IPC surface (main process)
| Channel | Type | Behavior |
|---|---|---|
| `library:get` | handle | `SELECT * FROM tracks ORDER BY added_at DESC` |
| `library:parse-uploads` / `parse-folder` / `parse-paths` | handle | dialogs/DnD paths → parsed `PendingTrack[]` |
| `library:select-cover` | handle | image dialog → `data:<mime>;base64,…` or null |
| `library:save-tracks` | handle | upsert each (`INSERT OR REPLACE`) → saved tracks |
| `library:delete-track` | handle | deletes track + its `playlist_tracks` rows |
| `library:update-track-lyrics` | handle | set `lyrics` by id |
| `track:update-lyric-offset` | handle | set `lyrics_offset` ms |
| `library:update-track-metadata` | handle | partial UPDATE of title/artist/album/lyrics/cover |
| `library:reveal-in-explorer` | handle | `shell.showItemInFolder` |
| `app:open-external` | handle | validates `^https?://` then `shell.openExternal` |
| `playlists:get/create/delete` | handle | CRUD |
| `playlists:add-track` / `remove-track` | handle | junction rows |
| `playlists:get-tracks` | handle | tracks of a playlist (join) |
| `playlists:reorder-tracks` | handle | rewrite junction ordering |
| `playlists:update` | handle | partial update (name/cover_*) |
| `playlists:covers` | handle | `Record<playlistId, string[]>` for card art |
| `playlists:export` | handle | writes `.m3u` (relative paths) + save dialog |
| `playlists:import-m3u` | handle | parses `.m3u/.m3u8`, resolves relative paths, auto-imports + saves missing tracks, creates playlist |
| `settings:get` / `settings:set` | handle | read/write `settings.json` |
| `settings:set-sync` | on | **synchronous** `writeFileSync` — final flush during window close |
| `updates:check` | on | manual `checkForUpdates(win, manual=true)` |
| `discord:update` / `discord:clear` | on | rich presence |
| `window:minimize` / `window:close` | on | BrowserWindow controls |
| `window:toggle-maximize` / `window:is-maximized` | handle | returns bool |
| *(event)* `window:maximized` | →renderer | maximize state push |

## 7. Support modules (main process)

### `src/main/discordRPC.ts`
- Uses `discord-rpc` (IPC transport) with a **hardcoded DISCORD_CLIENT_ID** (must be a real
  Discord app ID, or login silently fails — app keeps working).
- Exports `updateDiscordPresence(activity)`, `clearDiscordPresence()`, `destroyDiscordRPC()`
  and the `DiscordActivity` interface `{title, artist, album, isPlaying, startTimestamp?}`.
- Auto-reconnects every 15s on failure; re-pushes last activity after reconnect; callbacks are
  **non-fatal** (all wrapped in try/catch).

### `src/main/updater.ts`
- `checkForUpdates(win, manual?)` → GETs `https://api.github.com/repos/bubu07codes/omus/releases/latest`
  (anonymous — GitHub rate limit applies), compares semver (`parseVersion`/`isNewer`, strips leading
  `v` and `-prerelease` suffixes), shows message boxes (manual) or silently ignores (auto).
- Manual mode sends staged status events to renderer: `update-status {stage: connecting|fetching|comparing|done|error, message}`.
- “Get Update” opens the release HTML page in the browser. Drafts/prereleases = “No update”.

## 8. Preload bridge — `src/preload/index.ts` (+ index.d.ts)

`contextBridge.exposeInMainWorld('api', …)` — this is **the only** way the renderer talks to
main. The `CustomAPI` interface in `index.d.ts` is the typed contract and declares
`global { interface Window { api: CustomAPI } }` so `window.api.*` typechecks in the renderer.

Complete `window.api` surface (grouped):
- **Media URL:** `getMediaUrl(filepath) → 'omus-media://audio?path=…'`
- **Library:** `getLibrary()`, `parseUploads()`, `parseFolder()`, `parsePaths(paths)`,
  `getPathForFile(file)`, `selectCover()`, `saveTracks(pending)`, `deleteTrack(id)`,
  `updateTrackLyrics(id, lyrics)`, `updateTrackLyricOffset(id, ms)`, `updateTrackMetadata({id,…})`,
  `revealInExplorer(path)`
- **Playlists:** `getPlaylists()`, `createPlaylist(name)`, `deletePlaylist(id)`,
  `addTrackToPlaylist(plId, trId)`, `removeTrackFromPlaylist(plId, trId)`,
  `getPlaylistTracks(plId)`, `reorderPlaylistTracks(plId, trackIds)`, `updatePlaylist(plId, data)`,
  `getPlaylistCovers()`, `exportPlaylist(plId)`, `importPlaylist()`
- **Settings:** `getSettings()`, `saveSettings(obj)` (async), `flushSettings(obj)` (sync on close)
- **Integrations:** `checkForUpdates()` (fire-and-forget), `updateDiscordPresence(activity)`, `clearDiscordPresence()`
- **Window:** `windowMinimize()`, `windowClose()`, `windowToggleMaximize()`,
  `isWindowMaximized()`, `onWindowMaximizeChange(cb) → unsubscribe`, `setZoomFactor(f)`, `getZoomFactor()`
- **Env:** `platform` (NodeJS.Platform), `getSystemInfo()` → `{platform, cpu, cpusCount, totalMemory, freeMemory, userLanguage}` (built with `os` from 'node:os')

## 9. Renderer — `src/renderer/src`

### 9.1 Entry (`main.tsx`)
`createRoot` → `<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>`.
`ErrorBoundary` catches render errors **and** global `error`/`unhandledrejection` events,
rendering `ErrorScreen` (message + stack + one-click copy) instead of a black window.

### 9.2 `App.tsx` — the monolith (6064 lines)
Single `export default function App()` containing ALL state, handlers and views.

**State sections** (all `useState` at top): library/playlists, queue + currentIndex, view +
previousView, searchQuery/detailSearch, library layout/density/order, collapsible+resizable left
rail, playback (shuffle/repeat/shuffleHistory), likedTrackIds, settings (~30 persisted knobs:
confirmBeforeDelete, resumePlayback, autoFetchLyrics, crossfade transition, fluid-bg params,
fullscreen mode, lyric styling, EQ, visualizer, discordEnabled…), play history (playCounts +
recentlyPlayed), fluid bg prefs, fullscreen prefs, modals (showCoverModal, isFullscreenCover,
isUploadModalOpen, isEqOpen, isSleepTimerOpen, tagEditorTrack, isManualLyricsOpen, contextMenu,
lyricsOptionsOpen…), upload flow (pendingUploads, editingIndex), playlist editing, zoom.

**Key behaviors:**
- Hydration `init()` on mount: load settings → apply theme/font/anim/layout/volume/shuffle/EQ/
  lyrics prefs → `getLibrary()` → if `resumePlayback`, `cue()` the last track + position.
  Also injects Google Fonts link (Plus Jakarta Sans / Space Grotesk).
- **Views** (switched by `view` state; `navigateView` uses `useTransition()` for smoothness):
  | view | App.tsx line ~ | content |
  |---|---|---|
  | `home` | 2587 | bento tiles: Recently Played, Most Played, Recent Added, Liked, Albums, Artists, empty-state quick start |
  | `library` | 3328 | toolbar (import/sort/seek/select), table / card / group layouts, density, per-row actions |
  | `playlists` | 3550 | playlist grid + detail view w/ hero cover art, custom covers, sorting, export/import |
  | `queue` | 3869 | play queue list (QueueCard, reorder/remove/clear) |
  | `lyrics` | 3917 | full-page synced lyrics, auto-centers active line, align/options |
  | `settings` | 4114 | sidebar w/ 10 categories (§9.3) |
- **Fullscreen now-playing** (~5412): cover art or **muted video mirror** + visualizer + lyrics
  overlay; chrome auto-hides; modes `normal`/`cover`; optional fluid ambience. F toggles.
- Modals: Equalizer, Sleep Timer, Tag Editor, Manual Lyrics, About, full-res cover lightbox,
  upload/import flow.
- **Keyboard shortcuts** (ignored inside INPUT/TEXTAREA/SELECT):
  `Space` play/pause · `←`/`→` ±5s · `Shift+←/→` prev/next · `L` lyrics · `S` settings · `Q` queue ·
  `M` mute · `F` fullscreen · `E` equalizer · `Esc` close overlay/fullscreen · Ctrl/Cmd+K global search.
- Drag-and-drop import, custom context menus (per-view actions), toasts, Discord presence sync,
  OS media-session metadata + artwork, global search palette, rail resize/collapse.
- `SavedSettings` interface (~line 125) documents every persisted key — keep it in sync when
  adding settings (hydration applies them one by one).

### 9.3 Settings categories (`SETTINGS_CATS` in App.tsx)
`lyrics` · `audio` (Sound & Vision: EQ, visualizer, crossfade, sleep…) · `fullscreen` ·
`ambience` (fluid background) · `integrations` (Discord + updater) · `appearance` (theme/font/
animation/UI scale/custom CSS) · `playback` (resume, shuffle, media keys…) · `library`
(layout, density, confirm-delete) · `shortcuts` (reference) · `advanced` (reset settings, system info).

## 10. Hooks

### `useAudioEngine.ts` (⭐ audio pipeline, ~576 lines)
Owns the entire audio stack. Public return: `isPlaying, currentTime, duration, volume, isMuted,
playbackRate, isLoading, audioError, playTrack, togglePlay, cue, seek, seekRelative,
handleVolumeChange, toggleMute, handlePlaybackRateChange, analyserNode, eqBands, eqPreamp,
currentEQPreset, balance, setEQBandGain, setPreampGain, setBalance, applyEQPreset, sleepTimer,
startSleepTimer, cancelSleepTimer, setSongTransition`.

- **Graph** (`initAudioGraph`): `new Audio()` element → `createMediaElementSource` → preamp gain →
  **10 BiquadFilterNodes** (EQ_FREQUENCIES: 32Hz lowshelf … 16kHz highshelf, Q=1.4) → Analyser
  (fftSize 256, smoothing 0.8) → StereoPanner (balance) → master gain → destination.
- Tracks stream via `window.api.getMediaUrl(filepath)` (the omus-media:// protocol).
- Playback events wired: play/pause/ended (`onTrackEnded` → auto-advance), timeupdate (drives
  progress + **tail fade-out** for crossfade), durationchange, waiting/canplay (loading state), error.
- **Crossfade transition** (`transitionRef`): optional fade-out over last N sec + fade-in at start.
- **Sleep timer**: countdown interval; optional volume fade over last 20s; stops playback at 0.
- Volume curve is cubic (`gain = v³`), stored in ref for startup resume correctness.
- **OS MediaSession** integration: play/pause/seek ±10s/prev/next/seekto handlers + rich metadata
  (title/artist/album/artwork) synced on each track.
- **Media Mirror regression guard:** if the same track is already the loaded, ready source,
  `playTrack` skips re-assigning `src` (prevents “track replays from 0” bug).
- Cleanup on unmount: pause, clear src, close AudioContext.

### `useLyrics.ts`
- Parses raw LRC text → sorted `LyricLine[] {time, text}`; supports multi `[mm:ss.xxx]` tags per
  line, `[offset:±ms]` tag (overridden by user-set manual offset), skips ID tags
  (`[ar:] [ti:] [al:] [by:] [length:] [re:] [ve:]`); **plain-text fallback** spreads lines 4s apart.
- `fetchLyricsFromOnline(track)`: LRCLIB — exact `/api/get` then fallback `/api/search?q=`; sends
  `Lrclib-Client: omus v1.0.0 (https://github.com/omus-music)` header. Network or CSP failures
  surface as lyricStatus strings ("Searching LRCLIB...", "Lyrics Synced", "No lyrics found", …).
- `getActiveLyricIndex(currentTime)`, `adjustOffset(deltaMs)`, `resetOffset()`.

### `useToast.ts`
- Simple queue (capped at 5 visible), `addToast(title, message?, type?, duration?)`, auto-dismiss.

## 11. Shared types — `src/renderer/src/types/index.ts`
`Track` (id=filepath, filepath, title, artist, album, duration, cover, lyrics, lyrics_offset?,
added_at?) · `PendingTrack` (Track minus id/filepath, + sourcePath, filename) · `Playlist`
(cover_type: auto|gradient|image, cover_image, cover_gradient) · `LyricLine` · `Theme` (bg/
sidebarBg/cardBg/textPrimary/textSecondary/accent/customCss) · `GoogleFontPreset` ·
`AnimationPreset` (uiTransition, scrollBehavior, globalCss) · `EQBand`/`EQPreset` ·
`VisualizerMode = bars|wave|radial|off` · `LyricAnimationType = scale|slide|glow|fade|wave` ·
`SleepTimerState` · `ToastMessage` · `SortField`/`SortDirection`/`SortConfig`.

## 12. Components (per-file purpose)

| Component | Purpose |
|---|---|
| `GlobalSearch.tsx` | Ctrl/Cmd+K overlay; sections Tracks/Artists/Albums/Playlists; keyboard-navigable; album separator matches App.tsx (U+2502 `│`) |
| `TitleBar.tsx` | frameless **Windows** title bar: minimize/max/close, double-click maximize, drag region; subscribes `window:maximized` |
| `LyricLine.tsx` | memoized lyric row; anim modes via transform/opacity/color only (compositor-safe, no animated blur) |
| `AudioVisualizer.tsx` | canvas visualizer (bars/wave/radial); reads AnalyserNode FFT; resolves CSS `var(--accent)` for canvas colors; idle mode when paused |
| `TrackRows.tsx` | memoized `LibraryTableRow` / `LibraryCardRow` / `LibraryGroupRow` / `QueueCard` (pure render, callbacks passed down) |
| `ErrorScreen.tsx` | error + stack + Copy details (used by ErrorBoundary) |
| `LoadingScreen.tsx` | branded startup screen (fixed overlay) |
| `Versions.tsx` | tiny Electron/Chromium/Node version line (scaffold leftover) |
| `Equalizer/EqualizerModal.tsx` | 10-band sliders + presets, preamp, balance |
| `Modals/AboutModal.tsx` | about/versions/credits |
| `Modals/ManualLyricsModal.tsx` | paste/edit LRC + fetch button |
| `Modals/SleepTimerModal.tsx` | duration / end-of-track modes, fade toggle |
| `Modals/TagEditorModal.tsx` | edit title/artist/album/lyrics/cover |
| `Shared/ContextMenu.tsx` | generic positioned menu |
| `Shared/TrackContextMenu.tsx` | track actions (play, add to playlist, edit, delete…) |
| `Shared/PlaylistCoverArt.tsx` | auto (track covers) / gradient / image cover rendering |
| `Toast/ToastContainer.tsx` | toast list renderer |

## 13. Constants
- `presets.ts`: `PRESET_FONTS` (Plus Jakarta Sans, Space Grotesk) · `PRESET_THEMES` (dark, amber,
  red, midnight, nord, gruvbox, forest, cyber, dracula, synthwave, concrete, light) ·
  `PRESET_ANIMATIONS` (off/subtle/snappy/smooth/spring/glow — each injects global CSS via
  `[data-anim=…]` selectors) · `NAV_ITEMS` (home/library/playlists/lyrics rail) ·
  `PL_PALETTES` + `playlistGradient(id)` (hash→gradient) + `parseGradient()`.
- `globalCss.ts`: one big `GLOBAL_CSS` string injected as a `<style>` — **the real stylesheet**
  (theme `var()`s, keyframes, `.app-shell`, track rows/cards, modals, lyrics view, player bar,
  fullscreen, settings, scrollbars…). Most UI classes live here, not Tailwind.
- `media.ts`: mirrored `VIDEO_EXTS` + `isVideoFile()` (keep in sync with main/index.ts).

## 14. Data & persistence summary

| Store | Where | What's in it |
|---|---|---|
| SQLite `omus.db` | `<userData>/omus.db` | tracks + playlists + playlist_tracks (schema §6.2). Covers & lyrics stored inline (base64 / LRC text) |
| `settings.json` | `<userData>/settings.json` | every persisted knob (SavedSettings). Written async on change, **sync flush on close** (`flushSettings`) |
| Media files | anywhere on disk | **not copied** — referenced by absolute path |

Play counts / recently played / liked ids / custom track order / rail size are persisted inside
settings.json (not a separate table).

## 15. Gotchas, invariants & conventions (★ read before editing)

1. **Never touch the DB from the renderer.** All DB/file ops live in `src/main/index.ts` behind
   IPC. New features needing persistence = add IPC handler + preload method + `.d.ts` type.
2. **`App.tsx` is one giant file.** Keep the pattern: new isolated UI → new file under
   `components/`, import into App.tsx; simple additions → inline in App.tsx.
3. **Track `id` = absolute filepath.** Deleting/moving source files breaks playback (by design,
   offline player). `PendingTrack` uses `sourcePath` pre-save.
4. **`omus-media://` protocol must keep Range/206 handling** (seek bug history §6.4).
5. **`playTrack` must not re-assign `src` for already-loaded same track** (replay-from-start bug).
6. **Manual lyric offset math:** user offset (ms) replaces the LRC `[offset:]` tag; applied in
   useLyrics parse; persisted per-track in `lyrics_offset`.
7. **Windows-only frameless chrome.** `IS_WINDOWS`/`TITLEBAR_H=40` in App.tsx; `TitleBar.tsx`
   no-ops on other platforms. Always guard with `window.api?.platform === 'win32'`.
8. **CSP is restrictive** (`src/renderer/index.html`): `connect-src 'self' https://lrclib.net`.
   New network integrations need a CSP update too.
9. **Typecheck = contract.** `npm run typecheck` (node + web) must pass. ESLint has
   `explicit-function-return-type: off` and `react-hooks/preserve-manual-memoization: off`
   deliberately — don't "fix" those. Renderer+preload typecheck via `tsconfig.web.json`; the
   `CustomAPI` d.ts is the bridge contract — keep `.d.ts` in sync with `index.ts` exactly.
10. **Native module:** better-sqlite3 must be rebuilt for new Electron/Node versions
    (`postinstall` handles it). Wrong ABI = crashes at `new Database(...)`.
11. **ID strings:** playlists use `pl_<epoch>` ids; toasts `toast_<epoch>_<rand>`. Albums group by
    `${artist}│${album}` (U+2502) — this separator is duplicated in GlobalSearch; keep in sync.
12. **React 19 experimental hooks** (`useTransition`, `useDeferredValue`, `memo`) are used for
    view-switch/search/non-critical rows. Rows are memoized because the audio engine re-renders
    App ~4×/sec — keep row props referentially stable.
13. **Tailwind is barely used** — most styling is `GLOBAL_CSS` + inline styles. Tailwind config
    defines the `omus` palette (green #1DB954 etc.).
14. **No test framework** is set up. Validation = `npm run typecheck` + `npm run lint` +
    `npm run build` + manual `npm run dev`.
15. **Discord & updater are best-effort** — every failure is caught silently; the app must never
    crash because Discord/GitHub are unreachable.
16. **`onWindowMaximizeChange` returns an unsubscribe fn** and `setZoomFactor/getZoomFactor` are
    optional in CustomAPI — call defensively (`window.api?.setZoomFactor?.(…)`).

## 16. Build & packaging (`electron-builder.yml` + package.json `build{}`)
- Win: **NSIS** installer, `install-omus.exe` (yml) / `com.omus.app` (appId), x64 only,
  always creates desktop shortcut, uninstall display name `omus`.
- mac: dmg, no notarize, camera/mic/docs/downloads usage descriptions.
- linux: AppImage + snap + deb, `npmRebuild: true`.
- Publish provider: GitHub (`bubu07codes/omus`) for auto-update releases.
- `asarUnpack`: `resources/**` + `**/*.node` (native better-sqlite3).
- Files excluded from package: src, docs, tests, maps, dev configs (see yml `files` block).
- Icon: `build/icon.ico` (win), `logo.svg` (mac/linux runtime).

## 17. External services (no keys in repo besides Discord ID)
| Service | Used for | Where |
|---|---|---|
| LRCLIB (lrclib.net) | synced lyrics auto-fetch | `useLyrics.ts` (CSP allowlisted) |
| GitHub API | release update checks | `src/main/updater.ts` (anonymous) |
| Discord IPC | Rich Presence | `src/main/discordRPC.ts` — **hardcoded client ID** |
| Google Fonts | Plus Jakarta Sans / Space Grotesk | `App.tsx` init + `LoadingScreen` (CSP allowlisted) |

## 18. Git / version history notes
- Branch `master`; tags: `v1.0.0`, `v1.1.0`, `v1.3.0` (current), `stable`. package.json = `1.3.0`.
- Notable past work: **v1.3.0** “website for smaller devices / docs folder” (docs site),
  **v1.1.0–1.3.0** global search, collapsible sidebar, top settings, smooth lyrics, UI overhaul,
  video/fullscreen/scaling, better loading states. Many “old bugs” are guarded in code comments —
  respect them (see §15.4/15.5/8 for seek/resume/error-handling rationale).

---

*End of summary. When a task needs more depth, read the referenced file ranges in the target
file (line numbers above are approximate for `App.tsx` only — verify with a quick search).*