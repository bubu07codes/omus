<img src="https://github.com/bubu07codes/omus/blob/master/src/renderer/public/logo.svg" />

Desktop music player for local files, with a ton of features.

Built with Electron, React, Vite, TypeScript, and SQLite. No tracking, no accounts, no cloud setup.

<img src="https://raw.githubusercontent.com/bubu07codes/omus/master/github-assets/appgif1.3.0.gif" width="100%" alt="omus demo">

---

## What's Inside

* **Format Support:** MP3, FLAC, WAV, M4A, OGG, AAC, and local video files.
* **Synced Lyrics:** Auto-fetches lyrics via LRCLIB with manual search, timing offsets, and click-to-seek support.
* **Audio Controls:** 10-band equalizer with presets, customizable crossfade, sleep timer, and live visualizers (waveform, bars, radial).
* **Library & Playlists:** Drag-and-drop import, local play count tracking, custom metadata editing, album covers, and M3U/M3U8 import/export.
* **Customization:** Built-in UI themes, ambient background modes, and full UI scaling (70–160%).

## Local Development

```bash
# Install dependencies
npm install

# Run dev mode
npm run dev

# Package for Windows
npm run build:win

```

### Architecture Overview

* **Storage:** Local SQLite database for library indexing and playback history.
* **Audio:** Web Audio API (`Source -> EQ -> Analyser -> Output`) served via a custom `omus-media://` protocol for direct disk streaming.
* **Process Structure:** `src/main` (Electron), `src/preload` (IPC bridge), `src/renderer` (React UI).

---

## License

Source-available under a non-commercial license. See [LICENSE](https://www.google.com/search?q=LICENSE) for details.
