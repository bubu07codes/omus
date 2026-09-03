import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { PendingTrack } from '../renderer/src/types'

contextBridge.exposeInMainWorld('api', {
  getMediaUrl: (filepath: string) => `omus-media://audio?path=${encodeURIComponent(filepath)}`,
  getLibrary: () => ipcRenderer.invoke('library:get'),
  parseUploads: () => ipcRenderer.invoke('library:parse-uploads'),
  parseFolder: () => ipcRenderer.invoke('library:parse-folder'),
  parsePaths: (paths: string[]) => ipcRenderer.invoke('library:parse-paths', paths),
  getPathForFile: (file: File) => {
    try {
      return webUtils.getPathForFile(file) || ''
    } catch {
      return ''
    }
  },
  selectCover: () => ipcRenderer.invoke('library:select-cover'),
  saveTracks: (tracks: PendingTrack[]) => ipcRenderer.invoke('library:save-tracks', tracks),
  deleteTrack: (trackId: string) => ipcRenderer.invoke('library:delete-track', trackId),
  updateTrackLyrics: (trackId: string, lyrics: string) =>
    ipcRenderer.invoke('library:update-track-lyrics', { trackId, lyrics }),
  updateTrackMetadata: (data: {
    id: string
    title?: string
    artist?: string
    album?: string
    lyrics?: string
    cover?: string
  }) => ipcRenderer.invoke('library:update-track-metadata', data),
  revealInExplorer: (filepath: string) =>
    ipcRenderer.invoke('library:reveal-in-explorer', filepath),
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
  getPlaylists: () => ipcRenderer.invoke('playlists:get'),
  createPlaylist: (name: string) => ipcRenderer.invoke('playlists:create', name),
  deletePlaylist: (playlistId: string) => ipcRenderer.invoke('playlists:delete', playlistId),
  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    ipcRenderer.invoke('playlists:add-track', { playlistId, trackId }),
  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    ipcRenderer.invoke('playlists:remove-track', { playlistId, trackId }),
  getPlaylistTracks: (playlistId: string) => ipcRenderer.invoke('playlists:get-tracks', playlistId),
  reorderPlaylistTracks: (playlistId: string, trackIds: string[]) =>
    ipcRenderer.invoke('playlists:reorder-tracks', { playlistId, trackIds }),
  updatePlaylist: (playlistId: string, data: Record<string, unknown>) =>
    ipcRenderer.invoke('playlists:update', playlistId, data),
  getPlaylistCovers: () => ipcRenderer.invoke('playlists:covers'),
  exportPlaylist: (playlistId: string) => ipcRenderer.invoke('playlists:export', playlistId),
  importPlaylist: () => ipcRenderer.invoke('playlists:import-m3u'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('settings:set', settings),
  // Best-effort synchronous flush used right before the window closes.
  flushSettings: (settings: unknown) => ipcRenderer.send('settings:set-sync', settings),
  // GitHub release checker ("Check for updates").
  checkForUpdates: () => ipcRenderer.send('updates:check'),
  // Discord Rich Presence
  updateDiscordPresence: (activity: {
    title: string
    artist: string
    album: string
    isPlaying: boolean
    startTimestamp?: number
  }) => ipcRenderer.send('discord:update', activity),
  clearDiscordPresence: () => ipcRenderer.send('discord:clear'),
  // Custom frameless window controls
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowClose: () => ipcRenderer.send('window:close'),
  windowToggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onWindowMaximizeChange: (callback: (maximized: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, maximized: boolean) => callback(maximized)
    ipcRenderer.on('window:maximized', listener)
    return () => {
      ipcRenderer.removeListener('window:maximized', listener)
    }
  },
  platform: process.platform
})
