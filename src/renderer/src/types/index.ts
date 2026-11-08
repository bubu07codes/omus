export interface Track {
  id: string
  filepath: string
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  lyrics: string
  lyrics_offset?: number
  added_at?: number
}

export interface PendingTrack extends Omit<Track, 'id' | 'filepath'> {
  sourcePath: string
  filename: string
}

export interface Playlist {
  id: string
  name: string
  created_at: number
  cover_type?: 'auto' | 'gradient' | 'image' | null
  cover_image?: string | null
  cover_gradient?: string | null
}

/**
 * A single word of a lyric line with its own playback time. Only produced by
 * word-synced sources — enhanced (A2) LRC files that carry inline `<mm:ss.xx>`
 * tags in front of every word.
 */
export interface LyricWord {
  /** Playback time (seconds) the word starts at (offset already applied). */
  time: number
  /** Word text exactly as written — includes any trailing space so the line can be rebuilt verbatim. */
  text: string
}

export interface LyricLine {
  time: number
  text: string
  /** Word-level timings from enhanced (A2) LRC. Absent on line-synced lyrics. */
  words?: LyricWord[]
  /** Playback time (seconds) the line stops being sung (next line start, or a fallback tail). */
  endTime?: number
}

/**
 * How word-by-word highlighting behaves:
 *  - `off`         — line-by-line only (classic behaviour).
 *  - `auto`        — highlight words only when the lyrics carry word timings.
 *  - `interpolate` — like `auto`, but also spreads the words of plain
 *                    line-synced lyrics evenly across the line's duration.
 */
export type LyricWordSyncMode = 'off' | 'auto' | 'interpolate'

export interface Theme {
  id: string
  name: string
  bg: string
  sidebarBg: string
  cardBg: string
  textPrimary: string
  textSecondary: string
  accent: string
  customCss?: string
}

export interface GoogleFontPreset {
  name: string
  family: string
}

export interface AnimationPreset {
  id: string
  name: string
  tagline: string
  uiTransition: string
  scrollBehavior: 'auto' | 'smooth'
  globalCss: string
}

export interface EQBand {
  freq: number
  label: string
  gain: number
  type?: BiquadFilterType
}

export interface EQPreset {
  id: string
  name: string
  preamp: number
  gains: number[]
}

export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'off'

export type LyricAnimationType = 'scale' | 'slide' | 'glow' | 'fade' | 'wave'

export interface SleepTimerState {
  active: boolean
  remainingSeconds: number
  targetMinutes: number
  mode: 'duration' | 'end_of_track'
  fadeVolume: boolean
}

export interface ToastMessage {
  id: string
  title: string
  message?: string
  type?: 'success' | 'info' | 'error'
  duration?: number
}

export type SortField = 'default' | 'title' | 'artist' | 'album' | 'duration' | 'added_at'

export type LibrarySortField = 'title' | 'artist' | 'album' | 'duration' | 'added_at'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: SortField
  dir: SortDirection
}
