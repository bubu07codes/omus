import type { Track, PendingTrack, Playlist } from '../renderer/src/types'

export interface CustomAPI {
  getMediaUrl: (filepath: string) => string
  getLibrary: () => Promise<Track[]>
  parseUploads: () => Promise<PendingTrack[]>
  parseFolder: () => Promise<PendingTrack[]>
  parsePaths: (paths: string[]) => Promise<PendingTrack[]>
  getPathForFile: (file: File) => string
  selectCover: () => Promise<string | null>
  saveTracks: (tracks: PendingTrack[]) => Promise<Track[]>
  deleteTrack: (trackId: string) => Promise<boolean>
  updateTrackLyrics: (trackId: string, lyrics: string) => Promise<boolean>
  updateTrackMetadata: (data: {
    id: string
    title?: string
    artist?: string
    album?: string
    lyrics?: string
    cover?: string
  }) => Promise<boolean>
  revealInExplorer: (filepath: string) => Promise<boolean>
  openExternal: (url: string) => Promise<boolean>
  getPlaylists: () => Promise<Playlist[]>
  createPlaylist: (name: string) => Promise<Playlist>
  deletePlaylist: (playlistId: string) => Promise<boolean>
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
  getPlaylistTracks: (playlistId: string) => Promise<Track[]>
  reorderPlaylistTracks: (playlistId: string, trackIds: string[]) => Promise<boolean>
  updatePlaylist: (playlistId: string, data: Record<string, unknown>) => Promise<boolean>
  getPlaylistCovers: () => Promise<Record<string, string[]>>
  exportPlaylist: (playlistId: string) => Promise<boolean>
  importPlaylist: () => Promise<Playlist | null>
  getSettings: () => Promise<unknown>
  saveSettings: (settings: unknown) => Promise<boolean>
  // Best-effort synchronous flush used right before the window closes.
  flushSettings: (settings: unknown) => void
  // GitHub release checker ("Check for updates").
  checkForUpdates: () => void
  // Discord Rich Presence
  updateDiscordPresence: (activity: {
    title: string
    artist: string
    album: string
    isPlaying: boolean
    startTimestamp?: number
  }) => void
  clearDiscordPresence: () => void
  // Custom frameless window controls
  windowMinimize: () => void
  windowClose: () => void
  windowToggleMaximize: () => Promise<boolean>
  isWindowMaximized: () => Promise<boolean>
  onWindowMaximizeChange: (callback: (maximized: boolean) => void) => () => void
  setZoomFactor?: (factor: number) => void
  getZoomFactor?: () => number
  platform: NodeJS.Platform
}

declare global {
  interface Window {
    api: CustomAPI
  }
}
