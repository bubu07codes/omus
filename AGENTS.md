# AGENTS.md — Operational Rules for `omus`

> **Token-Saving Mandate:** Read `AGENT_SUMMARY.md` first for the full architecture map. **Do NOT run broad directory trees, glob searches, or read `App.tsx` top-to-bottom.** Jump directly to the exact file or line range you need using targeted symbol/grep lookups.

## 1. Execution & Token-Efficiency Protocol

1. **Targeted Reads Only:**
   - `src/renderer/src/App.tsx` is a **~6,000-line monolith**. Never read the whole file. Search for the specific state, handler, or view anchor first (see `AGENT_SUMMARY.md §9.2` for approximate line numbers), then read only a ~150-line window.
   - Before adding a feature, check `AGENT_SUMMARY.md §5` and `§12` to see if a hook or component already exists.
2. **Concise, High-Signal Responses:**
   - Skip boilerplate apologies, recaps of user prompts, and full-file code dumps.
   - State the plan in ≤3 bullet points, apply surgical edits, and verify.
3. **Mandatory Verification Loop:**
   - Before concluding any code task, run:
     ```bash
     npm run typecheck && npm run test:unit && npm run lint
     ```
   - Never break `tsconfig.node.json` (main/preload) or `tsconfig.web.json` (renderer).

## 2. Hard Architectural Boundaries

- **3-Process Isolation:**
  - `src/main/*` = Only process allowed to touch `better-sqlite3`, `fs`, `os`, `shell`, or native APIs.
  - `src/preload/index.ts` + `index.d.ts` = The **only** bridge (`window.api.*`). Any new IPC channel **must** be added in three places simultaneously: `src/main/index.ts` → `src/preload/index.ts` → `src/preload/index.d.ts` (`CustomAPI`).
  - `src/renderer/*` = Pure React UI. Never import Node/Electron built-ins here.
- **Component Placement Rule:**
  - Small/inline UI tweaks → edit inside `src/renderer/src/App.tsx`.
  - New self-contained modals, panels, or heavy widgets → create a dedicated file under `src/renderer/src/components/<Category>/` and import it into `App.tsx`.
- **Track Identity Invariant:**
  - A track's primary key `id` is its **absolute source `filepath`**. Never generate UUIDs for tracks.

## 3. Anti-"AI Slop" & Modern Fluid Design Standards

`omus` is a tactile, local-first desktop audio instrument—not a generic SaaS dashboard. Every UI change must look bespoke, atmospheric, and fluid.

### 3.1 Zero "AI Slop" Patterns (Strictly Forbidden)
- **No Generic Boilerplate Layouts:** Never build lifeless 3-column feature cards, gratuitous hero banners, repetitive icon-in-a-circle badges, or excessive vertical padding where dense, scannable music metadata belongs.
- **No Unsolicited Purple/Indigo Gradients:** Never hardcode cliché "AI-purple" (`#6366f1` / `#8b5cf6`) accents or white-on-grey card boxes. All surfaces and highlights must derive organically from the active theme variables (`var(--bg)`, `var(--sidebar-bg)`, `var(--card-bg)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--accent)`).
- **No Heavy Drop-Shadows or Thick Borders:** Depth comes from subtle luminance shifts, translucent layers, and hairline `1px` borders (`color-mix(in srgb, var(--text-primary) 8%, transparent)`), not muddy black drop shadows.
- **No Cluttered Copy:** Desktop audio tools rely on crisp iconography, tabular numerals (`font-variant-numeric: tabular-nums`) for timestamps/durations/frequencies, and terse labels. Cut helper paragraphs and redundant titles.

### 3.2 Fluid, Atmospheric & Tactile Craft
- **Organic Depth & Glass:** Let the ambient fluid background breathe through translucent surfaces (`backdrop-filter: blur(...)` paired with low-opacity `color-mix()` fills) so album art and theme colors subtly tint the workspace without sacrificing text contrast.
- **Intentional Hierarchy & Rhythm:** Use asymmetric bento proportions (like `.home-grid`), tight alignment, and generous negative space around primary focal points (Now Playing, Lyrics, Visualizer) while keeping library/queue rows compact and keyboard-friendly.
- **Expressive Micro-Interactions:** Buttons, sliders, and track rows should feel physically responsive—use subtle scale detents (`scale(0.97)` on press), smooth spring/cubic-bezier transitions (`[data-anim=…]`), and continuous progress fills (like `--lyric-word-fill`) rather than abrupt state jumps.
- **Typography Discipline:** Pair expressive display headings (`Space Grotesk` / `Plus Jakarta Sans`) with crisp, high-legibility metadata and `tabular-nums` on every timer, bitrate, or EQ readout so numbers never jitter during 4Hz playback ticks.

### 3.3 Styling & GPU Invariants
- **Single Stylesheet Truth:** Primary styles live in `src/renderer/src/constants/globalCss.ts` (`GLOBAL_CSS`), not Tailwind utility sprawl. **Never** insert unescaped backticks (`` ` ``) or `${` inside `GLOBAL_CSS`.
- **60fps Compositor-Only Motion:** Animate **only** `transform`, `opacity`, and registered `@property` custom properties. **Never** animate `filter: blur()`, `width`, `height`, `top/left`, or `box-shadow` on lists/lyrics.
- **Fluid Background Memory Budget (Prevent Renderer OOM):** Never increase bleed insets (`-6%` container, `-12%`/`-18%` layers) or blur caps (`40px` max) on `.fluid-bg-container` or its sub-layers (`contain: paint; isolation: isolate` must stay intact).
- **Layout & Platform Guards:** Keep `scrollbar-gutter: stable` on `main.content`, respect the player-bar cutoffs (`1400px` / `1240px`) and `.home-grid` ladder (`1200px` / `860px` / `680px`), and guard `TITLEBAR_H = 40` with `window.api?.platform === 'win32'`.

## 4. Non-Negotiable Regression Guards (Do Not Touch Unless Asked)

| System | Invariant | Consequence if Broken |
| --- | --- | --- |
| **`omus-media://` protocol** (`main/index.ts`) | Must retain HTTP `206 Partial Content` + `Content-Range` handling | Clicking the seek bar restarts tracks from `0:00` |
| **`playTrack`** (`useAudioEngine.ts`) | Skip re-assigning `audio.src` if the same track is already loaded | Toggling fullscreen/video mirror restarts playback |
| **React 19 Memoization** (`App.tsx` & `TrackRows.tsx`) | Keep props passed to memoized rows & `LyricLine` referentially stable; pass `activeWordState` **only** to the active lyric line | Audio engine ticks (~4Hz) will cause full-library UI lag |
| **Settings Hydration** (`App.tsx`) | Keep `SavedSettings` interface in sync with `init()` hydration and `flushSettings` on close | User settings silently reset on restart or `.ocfg` import |
| **CSP** (`renderer/index.html`) | Restrictive `connect-src` (`'self' https://lrclib.net`) | Any new external API call will silently fail unless CSP is updated |
| **ESLint Rules** (`eslint.config.mjs`) | `explicit-function-return-type` and `preserve-manual-memoization` are intentionally `off` | Do not add unnecessary return-type noise or strip manual `useMemo`/`useCallback` |

## 5. Fast Lookup Cheatsheet

- **Add a new persistent setting:** `App.tsx` (`SavedSettings` type + `useState` + `init()` hydration + settings save effect) → Settings UI in `App.tsx` (`SETTINGS_CATS`).
- **Add a new IPC call:** `src/main/index.ts` (`ipcMain.handle`/`on`) → `src/preload/index.ts` → `src/preload/index.d.ts`.
- **Add/edit global styles or keyframes:** `src/renderer/src/constants/globalCss.ts`.
- **Add/edit themes or animations:** `src/renderer/src/constants/presets.ts`.
- **Audio graph / EQ / crossfade / MediaSession:** `src/renderer/src/hooks/useAudioEngine.ts`.
- **LRC parsing / word-sync / LRCLIB:** `src/renderer/src/hooks/useLyrics.ts` + `src/renderer/src/components/LyricLine.tsx`.