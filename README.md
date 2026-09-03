# omus

A fast, offline desktop music player for your local music library.

Built with Electron, React, Vite, and TypeScript.

No accounts. No subscriptions. No cloud uploads. Just your music, and ton of fun and useful features.

---

## Features

### Music

- Play local MP3, FLAC, WAV, M4A, OGG, AAC, and more
- Instant playback and seeking
- Shuffle, repeat, queue, and playback speed controls
- Crossfade between songs
- Sleep timer with optional fade-out
- Media key and OS media control support

### Audio

- 10-band graphic equalizer
- Built-in EQ presets
- Live audio visualizers
- Waveform, frequency bars, radial modes, and more
- Smooth volume controls and mute

### Lyrics

- Synchronized LRC lyrics
- Automatic lyric lookup with LRCLIB
- Click lyrics to seek through a song
- Manual lyric search and editing
- Adjustable lyric timing offset

### Library

- Import individual files or entire folders
- Drag and drop music directly into omus
- List, grid, and album views
- Search by title, artist, or album
- Custom track ordering

### Playlists

- Create and manage playlists
- Reorder tracks with drag and drop
- Import and export M3U / M3U8 playlists
- Custom playlist covers
- Automatic collage and gradient covers

### Metadata

- Edit song title, artist, and album
- Change cover artwork
- Edit lyrics
- Reveal tracks in your system file explorer

### Customization

- Multiple built-in themes
- Animated ambient backgrounds
- Custom fonts
- Animation presets

---

## Getting Started

### Requirements

- Node.js 20+
- npm

### Install

```bash
npm install
````

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Platform-specific builds:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

Create an unpacked build:

```bash
npm run build:unpack
```

Start a built version:

```bash
npm run start
```

---

## Keyboard Shortcuts

| Key         | Action                    |
| ----------- | ------------------------- |
| `Space`     | Play / Pause              |
| `←` / `→`   | Seek 5 seconds            |
| `Shift + ←` | Previous track            |
| `Shift + →` | Next track                |
| `L`         | Toggle lyrics             |
| `Q`         | Toggle queue              |
| `M`         | Mute                      |
| `F`         | Toggle fullscreen player  |
| `E`         | Open equalizer            |
| `Esc`       | Close modals / fullscreen |

Media keys from keyboards, headphones, and your operating system are also supported.

---

## Tech Stack

* Electron
* React
* TypeScript
* Vite
* SQLite
* Web Audio API

---

## Architecture

omus uses a custom `omus-media://` protocol to stream local audio files directly from disk with range request support.

The audio pipeline uses the Web Audio API:

```text
Audio File
    ↓
Media Element
    ↓
Equalizer
    ↓
Analyser
    ↓
Volume
    ↓
Speakers
```

SQLite stores the music library and playlists, while application settings are stored locally.

---

## Project Structure

```text
src/
├── main/          # Electron main process
├── preload/       # Secure IPC bridge
└── renderer/      # React application
    └── src/
        ├── components/
        ├── hooks/
        ├── constants/
        └── types/
```

---

## Development Checks

```bash
npm run typecheck
npm run lint
npm run build
```

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the development checks
5. Open a pull request

---

## License

Distributed under a non-commercial, source-available license.

See [LICENSE](LICENSE) for details.