import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  ListOrdered,
  Mic2,
  Plus,
  FolderPlus,
  Search,
  LayoutList,
  LayoutGrid,
  Trash2,
  X,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Music,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Shuffle,
  Repeat,
  Repeat1,
  RotateCcw,
  Rows3,
  Rows2,
  Sparkles,
  Heart,
  Maximize2,
  Minimize2,
  RefreshCw,
  Pencil,
  EllipsisVertical,
  Download,
  ImagePlus,
  ArrowDownAZ,
  Sliders,
  Moon,
  ListPlus,
  FolderOpen,
  Upload,
  Edit3,
  GripVertical
} from 'lucide-react'
import {
  Track,
  PendingTrack,
  Playlist,
  Theme,
  VisualizerMode,
  SortConfig,
  LyricAnimationType
} from './types'
import { useAudioEngine, EQ_PRESETS } from './hooks/useAudioEngine'
import { useLyrics } from './hooks/useLyrics'
import { useToast } from './hooks/useToast'
import { AudioVisualizer } from './components/Visualizer/AudioVisualizer'
import { EqualizerModal } from './components/Equalizer/EqualizerModal'
import { ToastContainer } from './components/Toast/ToastContainer'
import { TagEditorModal } from './components/Modals/TagEditorModal'
import { SleepTimerModal } from './components/Modals/SleepTimerModal'
import { ManualLyricsModal } from './components/Modals/ManualLyricsModal'
import { AboutModal } from './components/Modals/AboutModal'

import {
  PRESET_FONTS,
  PRESET_THEMES,
  PRESET_ANIMATIONS,
  NAV_ITEMS,
  PL_PALETTES,
  playlistGradient,
  parseGradient
} from './constants/presets'
import { GLOBAL_CSS } from './constants/globalCss'
import { PlaylistCoverArt } from './components/Shared/PlaylistCoverArt'
import { ContextMenu, ContextMenuOption } from './components/Shared/ContextMenu'
import { TitleBar } from './components/TitleBar'
import { LoadingScreen } from './components/LoadingScreen'

// The custom frameless title bar is only shown on Windows (where the native
// frame is removed); TITLEBAR_H is the reserved strip height in pixels.
const IS_WINDOWS = window.api?.platform === 'win32'
const TITLEBAR_H = IS_WINDOWS ? 40 : 0

// GPU-safe override for the fluid ambient background. The original rule applies
// a full-viewport `blur()` to a container of continuously-morphing image orbs —
// on Windows/Electron that overloads the compositor when a track with cover art
// plays and can crash the renderer (whole window → pure-black `#000` body).
// This override (applied in a later <style>, so it wins at equal specificity):
//  - taps the orb sizes avoids giant off-screen raster targets,
//  - promotes the blurred container to its own compositor layer so the heavy
//    blur+saturate is baked once andorb transforms juste re-composite the cached
//    layer — no per-frame full-viewport re-rasterisation.

interface SavedSettings {
  themeId?: string
  customCss?: string
  fontName?: string
  animId?: string
  libraryLayout?: 'grid' | 'table' | 'group'
  libraryDensity?: 'comfortable' | 'compact'
  volume?: number
  shuffleOn?: boolean
  repeatMode?: 'off' | 'all' | 'one'
  confirmBeforeDelete?: boolean
  resumePlayback?: boolean
  autoFetchLyrics?: boolean
  libraryOrder?: string[]
  songTransitionEnabled?: boolean
  songTransitionDuration?: number
  fluidBgEnabled?: boolean
  fluidBgBlur?: number
  fluidBgOpacity?: number
  fluidBgSpeed?: 'calm' | 'smooth' | 'dynamic'
  fluidBgSaturation?: number
  likedTrackIds?: string[]
  lyricFontSize?: number
  lyricAlignment?: 'left' | 'center' | 'right'
  lyricLineGap?: number
  lyricInactiveBlur?: number
  lyricDimLevel?: number
  lyricActiveScale?: number
  lyricUppercase?: boolean
  lyricAnimation?: 'scale' | 'slide' | 'glow' | 'fade' | 'wave'
  visualizerMode?: VisualizerMode
  eqPreset?: string
  eqPreamp?: number
  eqBands?: number[]
  eqBalance?: number
  discordEnabled?: boolean
  lastTrackId?: string
  lastPositionSecs?: number
}

export default function App() {
  // ---- Library & playlists state ----
  const [library, setLibrary] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [playlistCovers, setPlaylistCovers] = useState<Record<string, string[]>>({})
  const [isAddTracksOpen, setIsAddTracksOpen] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addSelection, setAddSelection] = useState<Set<string>>(new Set())
  const [detailSearch, setDetailSearch] = useState('')

  // ---- Queue state ----
  const [queue, setQueue] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  // ---- Views & Navigation ----
  const [view, setView] = useState<'library' | 'playlists' | 'queue' | 'lyrics' | 'settings'>(
    'library'
  )
  const [previousView, setPreviousView] = useState<'library' | 'playlists' | 'queue' | 'settings'>(
    'library'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [libraryLayout, setLibraryLayout] = useState<'grid' | 'table' | 'group'>('table')
  const [libraryDensity, setLibraryDensity] = useState<'comfortable' | 'compact'>('comfortable')

  // ---- Playback Controls ----
  const [shuffleOn, setShuffleOn] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')
  const shuffleHistoryRef = useRef<number[]>([])

  // ---- Liked tracks ----
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([])

  // ---- Settings ----
  const [confirmBeforeDelete, setConfirmBeforeDelete] = useState(true)
  const [resumePlayback, setResumePlayback] = useState(true)
  const [autoFetchLyrics, setAutoFetchLyrics] = useState(true)
  const [customTrackOrder, setCustomTrackOrder] = useState<string[] | null>(null)
  const [songTransitionEnabled, setSongTransitionEnabled] = useState(false)
  const [songTransitionDuration, setSongTransitionDuration] = useState(2)
  const hydratedRef = useRef(false)
  // True until the library/playlists/settings are hydrated on first mount.
  const [isInitializing, setIsInitializing] = useState(true)

  // ---- Fluid Animated Background ----
  const [fluidBgEnabled, setFluidBgEnabled] = useState(true)
  const [fluidBgBlur, setFluidBgBlur] = useState(22)
  const [fluidBgOpacity, setFluidBgOpacity] = useState(0.35)
  const [fluidBgSpeed, setFluidBgSpeed] = useState<'calm' | 'smooth' | 'dynamic'>('smooth')
  const [fluidBgSaturation, setFluidBgSaturation] = useState(140)

  // ---- Modals / Overlays ----
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [isFullscreenCover, setIsFullscreenCover] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEqOpen, setIsEqOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [tagEditorTrack, setTagEditorTrack] = useState<Track | null>(null)
  const [isManualLyricsOpen, setIsManualLyricsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)

  // ---- Upload Flow ----
  const [pendingUploads, setPendingUploads] = useState<PendingTrack[]>([])
  const [editingIndex, setEditingIndex] = useState<number>(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false)
  const [lyricStatus, setLyricStatus] = useState('LRC Lyrics')

  // ---- Playlist editing ----
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [playlistSort, setPlaylistSort] = useState<SortConfig>({ key: 'default', dir: 'asc' })
  const coverInputRef = useRef<HTMLInputElement>(null)

  // ---- Seek bar hover ----
  const [hoverSeekSecs, setHoverSeekSecs] = useState<number | null>(null)
  const [hoverSeekPercent, setHoverSeekPercent] = useState<number | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const fullscreenProgressRef = useRef<HTMLDivElement>(null)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenLyricsRef = useRef<HTMLDivElement>(null)

  // ---- Context menu ----
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    trackId: string
    trackIdx: number
    fromPlaylist?: boolean
  } | null>(null)

  // ---- Library grouping drag state ----
  const [dragGroupKey, setDragGroupKey] = useState<string | null>(null)
  const [overGroupKey, setOverGroupKey] = useState<string | null>(null)
  const [dragTrackId, setDragTrackId] = useState<string | null>(null)
  const [overTrackId, setOverTrackId] = useState<string | null>(null)

  // ---- Playback speed ----
  const [playbackRateDisplay, setPlaybackRateDisplay] = useState(1.0)

  // ---- Visualizer mode ----
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('off')

  // ---- Theme & Appearance ----
  const [currentTheme, setCurrentTheme] = useState<Theme>(PRESET_THEMES[0])
  const [customCssInput, setCustomCssInput] = useState('')
  const [currentFont, setCurrentFont] = useState<string>('Original')
  const [animId, setAnimId] = useState<string>('modern')

  const selectedFontPreset = PRESET_FONTS.find((f) => f.name === currentFont)
  const activeFontFamily = selectedFontPreset
    ? `"${selectedFontPreset.family}", sans-serif`
    : `"${currentFont}", sans-serif`
  const currentAnim = PRESET_ANIMATIONS.find((a) => a.id === animId) ?? PRESET_ANIMATIONS[1]
  const animOff = currentAnim.id === 'off'
  const uiTransition = currentAnim.uiTransition
  const scrollBehavior = currentAnim.scrollBehavior

  // ---- Lyrics display settings ----
  const [lyricFontSize, setLyricFontSize] = useState<number>(28)
  const [lyricAlignment, setLyricAlignment] = useState<'left' | 'center' | 'right'>('left')
  const [lyricLineGap, setLyricLineGap] = useState<number>(0.35)
  const [lyricInactiveBlur, setLyricInactiveBlur] = useState<number>(4)
  const [lyricDimLevel, setLyricDimLevel] = useState<number>(0.3)
  const [lyricActiveScale, setLyricActiveScale] = useState<number>(1.04)
  const [lyricUppercase, setLyricUppercase] = useState<boolean>(false)
  // Animation style for the active lyric line.
  const [lyricAnimation, setLyricAnimation] = useState<
    'scale' | 'slide' | 'glow' | 'fade' | 'wave'
  >('scale')

  // ---- Discord Rich Presence ----
  const [discordEnabled, setDiscordEnabled] = useState<boolean>(false)

  // Lyric animation styles available in Settings.
  const LYRIC_ANIM_OPTIONS: { id: LyricAnimationType; name: string }[] = [
    { id: 'scale', name: 'Scale' },
    { id: 'slide', name: 'Slide' },
    { id: 'glow', name: 'Glow' },
    { id: 'fade', name: 'Fade' },
    { id: 'wave', name: 'Wave' }
  ]

  // Returns per-line style/class for the chosen lyric animation mode.
  // Smoothness rules:
  //  - animate ONLY compositor-friendly properties (transform, opacity) plus
  //    cheap color/text-shadow; never animate `filter: blur()` (full re-raster
  //    every frame = the worst lyric stutter).
  //  - every changed property is covered by the transition string so nothing
  //    "pops" instantly when a line toggles active/inactive.
  const getLyricAnim = (isActive: boolean, isPast: boolean) => {
    const origin =
      lyricAlignment === 'left'
        ? 'left center'
        : lyricAlignment === 'right'
          ? 'right center'
          : 'center'
    const blurPx = isActive ? 0 : isPast ? lyricInactiveBlur : lyricInactiveBlur * 0.5
    const dim = isActive ? 1 : isPast ? lyricDimLevel * 0.6 : lyricDimLevel
    const color = isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
    // Static (non-animated) per-state value; opacity/transform carry the motion.
    const base = { opacity: dim, color, filter: `blur(${blurPx}px)`, transformOrigin: origin }
    const smooth =
      'transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease, color 0.55s ease'

    switch (lyricAnimation) {
      case 'slide':
        return {
          className: '',
          style: {
            ...base,
            transform: isActive
              ? 'translateX(0)'
              : isPast
                ? 'translateX(18px)'
                : 'translateX(-14px)',
            transition: smooth
          }
        }
      case 'glow':
        return {
          className: '',
          style: {
            ...base,
            textShadow: isActive ? '0 0 18px var(--accent), 0 0 44px var(--accent)' : 'none',
            transition: `${smooth}, text-shadow 0.55s ease`
          }
        }
      case 'fade':
        return {
          className: '',
          style: {
            ...base,
            filter: `blur(${isActive ? 0 : blurPx * 0.3}px)`,
            transition: smooth
          }
        }
      case 'wave':
        return {
          className: isActive ? 'lyric-wave' : '',
          style: {
            ...base,
            // transform is driven by the lyricWave keyframes (compositor-only),
            // so we only transition opacity/color here — no conflict.
            transition: 'opacity 0.55s ease, color 0.55s ease'
          }
        }
      case 'scale':
      default:
        return {
          className: '',
          style: {
            ...base,
            transform: isActive ? `scale(${lyricActiveScale})` : 'scale(0.96)',
            transition: smooth
          }
        }
    }
  }

  // ---- Toast ----
  const { toasts, addToast, removeToast } = useToast()

  // ---- Audio engine callbacks ----
  const advanceToNextRef = useRef<() => void>(() => {})
  const handleNextRef = useRef<() => void>(() => {})
  const handlePrevRef = useRef<() => void>(() => {})

  const handleTrackEnded = useCallback(() => {
    advanceToNextRef.current()
  }, [])

  const handlePrevCb = useCallback(() => handlePrevRef.current(), [])
  const handleNextCb = useCallback(() => handleNextRef.current(), [])

  const audioEngine = useAudioEngine(handleTrackEnded, handlePrevCb, handleNextCb)
  const {
    isPlaying,
    currentTime,
    duration,
    volume: sliderVal,
    isMuted,
    isLoading,
    playTrack,
    togglePlay,
    cue,
    seek,
    seekRelative,
    handleVolumeChange,
    toggleMute,
    handlePlaybackRateChange,
    analyserNode,
    eqBands,
    eqPreamp,
    currentEQPreset,
    balance,
    setEQBandGain,
    setPreampGain,
    setBalance,
    applyEQPreset,
    sleepTimer,
    startSleepTimer,
    cancelSleepTimer,
    setSongTransition
  } = audioEngine

  // Keep the audio engine's transition config in sync with the settings.
  useEffect(() => {
    setSongTransition(songTransitionEnabled, songTransitionDuration)
  }, [songTransitionEnabled, songTransitionDuration, setSongTransition])

  // ---- Lyrics engine ----
  const lyricsEngine = useLyrics()
  const {
    setRawLyrics,
    parsedLyrics,
    offsetMs,
    adjustOffset,
    resetOffset,
    getActiveLyricIndex,
    fetchLyricsFromOnline,
    isFetchingLyrics: isFetchingCurrentLyrics
  } = lyricsEngine

  const activeLyricIndex = useMemo(
    () => getActiveLyricIndex(currentTime),
    [currentTime, getActiveLyricIndex]
  )

  // ----- Computed -----
  const currentTrack = currentIndex !== null && queue[currentIndex] ? queue[currentIndex] : null
  const isCurrentLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0

  // Scrolls a lyric line to a stable ~38% from the top of the visible panel.
  // Unlike scrollIntoView({ block: 'center' }), this clamps to the scroll
  // bounds so the first/last lines never end up parked under the panel's edge
  // fade masks. Works for both the in-app and the fullscreen lyric panels.
  const scrollLyricToCenter = useCallback(
    (container: HTMLDivElement | null, index: number): void => {
      if (!container) return
      const el = container.children[index] as HTMLElement | undefined
      if (!el) return
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      // Distance of the line from the top of the scroll content.
      const elTopInContent = elRect.top - containerRect.top + container.scrollTop
      const target = elTopInContent - container.clientHeight * 0.38
      const max = Math.max(0, container.scrollHeight - container.clientHeight)
      const clamped = Math.max(0, Math.min(max, target))

      // The theme's animation preset sets scroll-behavior to "smooth"; a
      // programmatic scrollTop would then animate and fight the lyric line
      // transitions, causing the stutter. Force an instant "auto" jump.
      container.style.scrollBehavior = 'auto'
      container.scrollTop = clamped
      requestAnimationFrame(() => {
        // Let the stylesheet rule take over again for any user/timer scrolling.
        if (container) container.style.scrollBehavior = ''
      })
    },
    []
  )

  // ----- Navigation & Lyrics auto-scroll -----
  useEffect(() => {
    if (activeLyricIndex < 0) return
    if (lyricsContainerRef.current && view === 'lyrics') {
      scrollLyricToCenter(lyricsContainerRef.current, activeLyricIndex)
    }
    if (fullscreenLyricsRef.current && isFullscreenCover) {
      scrollLyricToCenter(fullscreenLyricsRef.current, activeLyricIndex)
    }
  }, [activeLyricIndex, view, isFullscreenCover, scrollLyricToCenter])

  // Initial scroll when fullscreen opens
  useEffect(() => {
    if (isFullscreenCover && fullscreenLyricsRef.current && activeLyricIndex >= 0) {
      scrollLyricToCenter(fullscreenLyricsRef.current, activeLyricIndex)
    }
  }, [isFullscreenCover, activeLyricIndex, scrollLyricToCenter])

  // MediaSession position state
  useEffect(() => {
    if ('mediaSession' in navigator && duration > 0) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: playbackRateDisplay,
        position: Math.min(currentTime, duration)
      })
    }
  }, [currentTime, duration, playbackRateDisplay])

  // ----- Persist lyrics (DB + all in-memory lists) -----
  const persistLyrics = useCallback(
    (track: Track, lyrics: string) => {
      const patch = (list: Track[]) => list.map((t) => (t.id === track.id ? { ...t, lyrics } : t))
      setLibrary(patch)
      setQueue(patch)
      setPlaylistTracks(patch)
      if (currentTrack?.id === track.id) setRawLyrics(lyrics)
      if (window.api?.updateTrackLyrics) window.api.updateTrackLyrics(track.id, lyrics)
    },
    [currentTrack, setRawLyrics]
  )

  // ----- Auto-fetch lyrics when a track has none (toggleable in Settings) -----
  const maybeAutoFetchLyrics = useCallback(
    (track: Track) => {
      if (autoFetchLyrics && track && !(track.lyrics || '').trim()) {
        fetchLyricsFromOnline(track).then((lrc) => {
          if (lrc) persistLyrics(track, lrc)
        })
      }
    },
    [autoFetchLyrics, fetchLyricsFromOnline, persistLyrics]
  )

  // ----- Load track at index -----
  const loadAndPlayIndex = useCallback(
    async (index: number, customQueue?: Track[]) => {
      const targetQueue = customQueue || queue
      if (index < 0 || index >= targetQueue.length) return
      if (customQueue) setQueue(customQueue)

      const track = targetQueue[index]
      setCurrentIndex(index)
      setRawLyrics(track.lyrics || '')
      maybeAutoFetchLyrics(track)

      await playTrack(track)
    },
    [queue, playTrack, setRawLyrics, maybeAutoFetchLyrics]
  )

  const advanceToNext = useCallback(() => {
    if (currentIndex === null || queue.length === 0) return
    if (repeatMode === 'one') {
      loadAndPlayIndex(currentIndex)
      return
    }
    if (shuffleOn && queue.length > 1) {
      shuffleHistoryRef.current.push(currentIndex)
      let nextIdx = Math.floor(Math.random() * queue.length)
      while (nextIdx === currentIndex) nextIdx = Math.floor(Math.random() * queue.length)
      loadAndPlayIndex(nextIdx)
      return
    }
    const nextIdx = currentIndex + 1
    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') loadAndPlayIndex(0)
      return
    }
    loadAndPlayIndex(nextIdx)
  }, [currentIndex, queue, repeatMode, shuffleOn, loadAndPlayIndex])

  function handleNext() {
    if (currentIndex === null || queue.length === 0) return
    if (repeatMode === 'one') {
      loadAndPlayIndex(currentIndex)
      return
    }
    if (shuffleOn && queue.length > 1) {
      shuffleHistoryRef.current.push(currentIndex)
      let nextIdx = Math.floor(Math.random() * queue.length)
      while (nextIdx === currentIndex) nextIdx = Math.floor(Math.random() * queue.length)
      loadAndPlayIndex(nextIdx)
      return
    }
    const nextIdx = currentIndex + 1
    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') loadAndPlayIndex(0)
      return
    }
    loadAndPlayIndex(nextIdx)
  }

  function handlePrev() {
    if (currentIndex === null || queue.length === 0) return
    if (currentTime > 3) {
      seek(0)
      return
    }
    if (shuffleOn && shuffleHistoryRef.current.length > 0) {
      const prevIdx = shuffleHistoryRef.current.pop() as number
      loadAndPlayIndex(prevIdx)
      return
    }
    const prevIdx = currentIndex - 1
    if (prevIdx < 0) {
      if (repeatMode === 'all') loadAndPlayIndex(queue.length - 1)
      return
    }
    loadAndPlayIndex(prevIdx)
  }

  // Latest references for the stable audio-engine callbacks (avoids stale closures).
  useEffect(() => {
    advanceToNextRef.current = advanceToNext
    handleNextRef.current = handleNext
    handlePrevRef.current = handlePrev
  })

  const cueTrack = useCallback(
    async (index: number, offsetSecs = 0, sourceQueue?: Track[]) => {
      const targetQueue = sourceQueue || queue
      if (index < 0 || index >= targetQueue.length) return
      if (sourceQueue) setQueue(sourceQueue)
      const track = targetQueue[index]
      setCurrentIndex(index)
      setRawLyrics(track.lyrics || '')
      maybeAutoFetchLyrics(track)

      // Load the source and seek into the live audio engine without
      // auto-playing (resumes later on user play gesture).
      await cue(track, offsetSecs)
    },
    [queue, setRawLyrics, cue, maybeAutoFetchLyrics]
  )

  // ---- Initialization ----
  useEffect(() => {
    async function init() {
      try {
        if (window.api) {
          const [storedTracks, storedPlaylists, savedSettings] = await Promise.all([
            window.api.getLibrary(),
            window.api.getPlaylists(),
            window.api.getSettings ? window.api.getSettings() : null
          ])

          setLibrary(storedTracks)
          setPlaylists(storedPlaylists)
          if (storedTracks.length > 0) setQueue(storedTracks)

          const saved = savedSettings as SavedSettings
          if (saved) {
            const theme = PRESET_THEMES.find((t) => t.id === saved.themeId)
            if (theme) setCurrentTheme({ ...theme, customCss: saved.customCss || '' })
            if (saved.customCss) setCustomCssInput(saved.customCss)
            if (saved.fontName) setCurrentFont(saved.fontName)
            if (saved.animId) setAnimId(saved.animId)
            if (saved.libraryLayout) setLibraryLayout(saved.libraryLayout)
            if (saved.libraryDensity) setLibraryDensity(saved.libraryDensity)
            if (typeof saved.volume === 'number') handleVolumeChange(saved.volume)
            if (typeof saved.shuffleOn === 'boolean') setShuffleOn(saved.shuffleOn)
            if (saved.repeatMode) setRepeatMode(saved.repeatMode)
            if (typeof saved.confirmBeforeDelete === 'boolean')
              setConfirmBeforeDelete(saved.confirmBeforeDelete)
            if (typeof saved.resumePlayback === 'boolean') setResumePlayback(saved.resumePlayback)
            if (typeof saved.autoFetchLyrics === 'boolean')
              setAutoFetchLyrics(saved.autoFetchLyrics)
            if (Array.isArray(saved.libraryOrder)) setCustomTrackOrder(saved.libraryOrder)
            if (typeof saved.songTransitionEnabled === 'boolean')
              setSongTransitionEnabled(saved.songTransitionEnabled)
            if (typeof saved.songTransitionDuration === 'number')
              setSongTransitionDuration(saved.songTransitionDuration)
            if (typeof saved.fluidBgEnabled === 'boolean') setFluidBgEnabled(saved.fluidBgEnabled)
            if (typeof saved.fluidBgBlur === 'number') setFluidBgBlur(saved.fluidBgBlur)
            if (typeof saved.fluidBgOpacity === 'number') setFluidBgOpacity(saved.fluidBgOpacity)
            if (saved.fluidBgSpeed) setFluidBgSpeed(saved.fluidBgSpeed)
            if (typeof saved.fluidBgSaturation === 'number')
              setFluidBgSaturation(saved.fluidBgSaturation)
            if (Array.isArray(saved.likedTrackIds)) setLikedTrackIds(saved.likedTrackIds)
            if (typeof saved.lyricFontSize === 'number') setLyricFontSize(saved.lyricFontSize)
            if (saved.lyricAlignment) setLyricAlignment(saved.lyricAlignment)
            if (typeof saved.lyricLineGap === 'number') setLyricLineGap(saved.lyricLineGap)
            if (typeof saved.lyricInactiveBlur === 'number')
              setLyricInactiveBlur(saved.lyricInactiveBlur)
            if (typeof saved.lyricDimLevel === 'number') setLyricDimLevel(saved.lyricDimLevel)
            if (typeof saved.lyricActiveScale === 'number')
              setLyricActiveScale(saved.lyricActiveScale)
            if (typeof saved.lyricUppercase === 'boolean') setLyricUppercase(saved.lyricUppercase)
            if (saved.visualizerMode) setVisualizerMode(saved.visualizerMode)
            if (saved.eqPreset) applyEQPreset(saved.eqPreset)
            if (typeof saved.eqPreamp === 'number') setPreampGain(saved.eqPreamp)
            if (Array.isArray(saved.eqBands)) {
              saved.eqBands.forEach((g, idx) => setEQBandGain(idx, g))
            }
            if (typeof saved.eqBalance === 'number') setBalance(saved.eqBalance)
            if (saved.lyricAnimation) setLyricAnimation(saved.lyricAnimation)
            if (typeof saved.discordEnabled === 'boolean') setDiscordEnabled(saved.discordEnabled)

            if (saved.resumePlayback !== false && saved.lastTrackId && storedTracks.length > 0) {
              const idx = storedTracks.findIndex((t: Track) => t.id === saved.lastTrackId)
              if (idx >= 0) cueTrack(idx, saved.lastPositionSecs || 0, storedTracks)
            }
          }
        }
      } catch (err) {
        console.error('[App] initialization failed', err)
        // Re-throw so the global error handler / error screen captures it and
        // shows the full stack for debugging and bug reports.
        throw err
      } finally {
        hydratedRef.current = true
        setIsInitializing(false)
      }
    }
    init()
    // Load Google Fonts
    const fontNames = PRESET_FONTS.map((f) => f.family).join('&family=')
    const linkId = 'dynamic-google-fonts'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${fontNames}&display=swap`
      document.head.appendChild(link)
    }
  }, [])

  // ---- Keyboard Shortcuts ----
  const toggleLyricsView = () => {
    if (view === 'lyrics') {
      setView(previousView || 'library')
    } else {
      setPreviousView(view as 'library' | 'playlists' | 'queue' | 'settings')
      setView('lyrics')
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        e.shiftKey ? handlePrev() : seekRelative(-5)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        e.shiftKey ? handleNext() : seekRelative(5)
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        toggleLyricsView()
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setView((v) => (v === 'queue' ? 'library' : 'queue'))
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMute()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setIsFullscreenCover((v) => !v)
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setIsEqOpen((v) => !v)
      } else if (e.key === 'Escape') {
        if (isFullscreenCover) setIsFullscreenCover(false)
        if (isEqOpen) setIsEqOpen(false)
        if (isSleepTimerOpen) setIsSleepTimerOpen(false)
        if (contextMenu) setContextMenu(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    isPlaying,
    currentIndex,
    queue,
    view,
    previousView,
    isMuted,
    isFullscreenCover,
    isEqOpen,
    isSleepTimerOpen,
    contextMenu
  ])

  // ---- Persist Settings ----
  const buildSettings = useCallback(
    () => ({
      themeId: currentTheme.id,
      customCss: currentTheme.customCss || '',
      fontName: currentFont,
      animId,
      libraryLayout,
      libraryDensity,
      volume: sliderVal,
      shuffleOn,
      repeatMode,
      confirmBeforeDelete,
      resumePlayback,
      autoFetchLyrics,
      libraryOrder: customTrackOrder ?? undefined,
      songTransitionEnabled,
      songTransitionDuration,
      fluidBgEnabled,
      fluidBgBlur,
      fluidBgOpacity,
      fluidBgSpeed,
      fluidBgSaturation,
      likedTrackIds,
      lyricFontSize,
      lyricAlignment,
      lyricLineGap,
      lyricInactiveBlur,
      lyricDimLevel,
      lyricActiveScale,
      lyricUppercase,
      visualizerMode,
      eqPreset: currentEQPreset,
      eqPreamp,
      eqBands: eqBands.map((b) => b.gain),
      eqBalance: balance,
      lyricAnimation,
      discordEnabled,
      lastTrackId: currentTrack?.id || null,
      lastPositionSecs: Math.floor(currentTime)
    }),
    [
      currentTheme,
      currentFont,
      animId,
      libraryLayout,
      libraryDensity,
      sliderVal,
      shuffleOn,
      repeatMode,
      confirmBeforeDelete,
      resumePlayback,
      autoFetchLyrics,
      songTransitionEnabled,
      songTransitionDuration,
      customTrackOrder,
      fluidBgEnabled,
      fluidBgBlur,
      fluidBgOpacity,
      fluidBgSpeed,
      fluidBgSaturation,
      likedTrackIds,
      lyricFontSize,
      lyricAlignment,
      lyricLineGap,
      lyricInactiveBlur,
      lyricDimLevel,
      lyricActiveScale,
      lyricUppercase,
      visualizerMode,
      currentEQPreset,
      eqPreamp,
      eqBands,
      balance,
      lyricAnimation,
      discordEnabled,
      currentTrack,
      currentTime
    ]
  )

  const buildSettingsRef = useRef(buildSettings)
  useEffect(() => {
    buildSettingsRef.current = buildSettings
  })

  useEffect(() => {
    if (!hydratedRef.current || !window.api?.saveSettings) return
    const handle = setTimeout(() => window.api.saveSettings(buildSettingsRef.current()), 600)
    return () => clearTimeout(handle)
  }, [
    currentTheme,
    currentFont,
    animId,
    libraryLayout,
    libraryDensity,
    sliderVal,
    shuffleOn,
    repeatMode,
    confirmBeforeDelete,
    resumePlayback,
    autoFetchLyrics,
    songTransitionEnabled,
    songTransitionDuration,
    customTrackOrder,
    fluidBgEnabled,
    fluidBgBlur,
    fluidBgOpacity,
    fluidBgSpeed,
    fluidBgSaturation,
    likedTrackIds,
    lyricFontSize,
    lyricAlignment,
    lyricLineGap,
    lyricInactiveBlur,
    lyricDimLevel,
    lyricActiveScale,
    lyricUppercase,
    visualizerMode,
    currentEQPreset,
    eqPreamp,
    eqBands,
    balance,
    lyricAnimation,
    discordEnabled
  ])

  useEffect(() => {
    if (!hydratedRef.current || !window.api?.saveSettings) return
    window.api.saveSettings(buildSettingsRef.current())
  }, [isPlaying, currentTrack?.id])

  // Flush the latest settings (volume included) as the window closes, so the
  // debounced save above never loses the final state (e.g. set volume → quit).
  useEffect(() => {
    const flush = (): void => {
      if (!hydratedRef.current) return
      const settings = buildSettingsRef.current()
      if (window.api?.flushSettings) window.api.flushSettings(settings)
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [])

  // Save position every 5 seconds during playback
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      if (hydratedRef.current && window.api?.saveSettings)
        window.api.saveSettings(buildSettingsRef.current())
    }, 5000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // ---- Discord Rich Presence ----
  // Keep Discord in sync with what's playing. Timestamps are derived from the
  // current position so Discord's "elapsed" timer starts from the right place.
  // currentTime is read through a ref so the effect only fires on track/play
  // changes (not on every 250ms time tick).
  const currentTimeRef = useRef<number>(0)
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])
  useEffect(() => {
    if (!discordEnabled || !window.api?.updateDiscordPresence) {
      window.api?.clearDiscordPresence?.()
      return
    }
    window.api.updateDiscordPresence({
      title: currentTrack?.title || 'Nothing playing',
      artist: currentTrack?.artist || '',
      album: currentTrack?.album || '',
      isPlaying,
      startTimestamp: isPlaying ? Math.floor(Date.now() / 1000 - currentTimeRef.current) : undefined
    })
  }, [
    discordEnabled,
    currentTrack?.id,
    currentTrack?.title,
    currentTrack?.artist,
    currentTrack?.album,
    isPlaying
  ])

  // ---- Helpers ----
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00'
    return `${Math.floor(secs / 60)}:${Math.floor(secs % 60)
      .toString()
      .padStart(2, '0')}`
  }

  const toggleLikeTrack = (trackId: string) => {
    setLikedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    )
  }

  // ---- Upload / Import ----
  const openImportTracks = () => setIsUploadModalOpen(true)

  const addParsedToQueue = (parsed: PendingTrack[]) => {
    if (parsed.length === 0) return
    setPendingUploads((prev) => [...prev, ...parsed])
  }

  const handleFileSelect = async () => {
    setIsParsing(true)
    try {
      addParsedToQueue(await window.api.parseUploads())
    } finally {
      setIsParsing(false)
    }
  }

  const handleFolderSelect = async () => {
    setIsParsing(true)
    try {
      addParsedToQueue(await window.api.parseFolder())
    } finally {
      setIsParsing(false)
    }
  }

  const addDroppedPaths = async (paths: string[]) => {
    if (paths.length === 0) return
    setIsUploadModalOpen(true)
    setIsParsing(true)
    try {
      addParsedToQueue(await window.api.parsePaths(paths))
    } finally {
      setIsParsing(false)
    }
  }

  const walkDroppedEntry = (entry: FileSystemEntry, acc: string[]): Promise<void> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry
        fileEntry.file((file: File) => {
          const p = window.api.getPathForFile(file)
          if (p) acc.push(p)
          resolve()
        })
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry
        const reader = dirEntry.createReader()
        const readBatch = () => {
          reader.readEntries(async (entries: FileSystemEntry[]) => {
            if (entries.length === 0) return resolve()
            for (const child of entries) await walkDroppedEntry(child, acc)
            readBatch()
          })
        }
        readBatch()
      } else {
        resolve()
      }
    })
  }

  const collectDroppedPaths = (items: DataTransferItemList): Promise<string[]> => {
    const acc: string[] = []
    const entries: FileSystemEntry[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const getAsEntry = (
        item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }
      ).webkitGetAsEntry
      const entry = typeof getAsEntry === 'function' ? getAsEntry.call(item) : null
      if (entry) entries.push(entry)
      else {
        const f = item.getAsFile()
        if (f) {
          const p = window.api.getPathForFile(f)
          if (p) acc.push(p)
        }
      }
    }
    return Promise.all(entries.map((e) => walkDroppedEntry(e, acc))).then(() => acc)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const items = e.dataTransfer.items
    if (!items || items.length === 0) return
    collectDroppedPaths(items).then(addDroppedPaths)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleSelectCover = async () => {
    const b64 = await window.api.selectCover()
    if (b64) updatePendingTrack(editingIndex, 'cover', b64)
  }

  const handleSaveUploads = async () => {
    const saved = await window.api.saveTracks(pendingUploads)
    setLibrary((prev) => [...saved, ...prev])
    setQueue((prev) => [...prev, ...saved])
    setPendingUploads([])
    setIsUploadModalOpen(false)
    addToast(`${saved.length} track${saved.length > 1 ? 's' : ''} added`, undefined, 'success')
  }

  const updatePendingTrack = (index: number, field: keyof PendingTrack, value: string) => {
    setPendingUploads((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removePendingTrack = (index: number) => {
    setPendingUploads((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      if (editingIndex >= updated.length && updated.length > 0) setEditingIndex(updated.length - 1)
      return updated
    })
  }

  const fetchLyricsApi = async (track: PendingTrack) => {
    if (!track.title && !track.artist) {
      setLyricStatus('Title or Artist required')
      return
    }
    setIsFetchingLyrics(true)
    setLyricStatus('Searching LRCLIB...')
    try {
      const url = new URL('https://lrclib.net/api/get')
      url.searchParams.append('track_name', track.title)
      url.searchParams.append('artist_name', track.artist)
      if (track.album) url.searchParams.append('album_name', track.album)
      if (track.duration > 0)
        url.searchParams.append('duration', Math.round(track.duration).toString())
      const res = await fetch(url.toString(), { headers: { 'Lrclib-Client': 'omus v1.0.0' } })
      if (res.ok) {
        const data = await res.json()
        const lyrics = data.syncedLyrics || data.plainLyrics || ''
        if (lyrics) {
          updatePendingTrack(editingIndex, 'lyrics', lyrics)
          setLyricStatus('Lyrics Found!')
        } else {
          const sr = await fetch(
            `https://lrclib.net/api/search?q=${encodeURIComponent(`${track.artist} ${track.title}`)}`,
            { headers: { 'Lrclib-Client': 'omus v1.0.0' } }
          )
          if (sr.ok) {
            const results = await sr.json()
            const best =
              Array.isArray(results) && results.length > 0
                ? results.find((r) => r.syncedLyrics) || results[0]
                : null
            if (best) {
              const lrc = best.syncedLyrics || best.plainLyrics || ''
              if (lrc) {
                updatePendingTrack(editingIndex, 'lyrics', lrc)
                setLyricStatus('Lyrics Found!')
              } else setLyricStatus('No lyrics found')
            } else setLyricStatus('No results')
          } else setLyricStatus('Search failed')
        }
      } else setLyricStatus('Not found')
    } catch {
      setLyricStatus('Fetch failed')
    }
    setIsFetchingLyrics(false)
  }

  // ---- Track deletion ----
  const handleDeleteTrack = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirmBeforeDelete && !window.confirm('Delete this track? This cannot be undone.')) return
    const success = await window.api.deleteTrack(trackId)
    if (success) {
      setLibrary((prev) => prev.filter((t) => t.id !== trackId))
      setQueue((prev) => prev.filter((t) => t.id !== trackId))
      setPlaylistTracks((prev) => prev.filter((t) => t.id !== trackId))
      refreshPlaylistCovers()
      addToast('Track deleted', undefined, 'info')
    }
  }

  // ---- Tag Editor ----
  const handleSaveTagEdit = async (updated: Track) => {
    if (!window.api?.updateTrackMetadata) return
    await window.api.updateTrackMetadata({
      id: updated.id,
      title: updated.title,
      artist: updated.artist,
      album: updated.album,
      cover: updated.cover,
      lyrics: updated.lyrics
    })
    setLibrary((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
    setQueue((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
    setPlaylistTracks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
    if (currentTrack?.id === updated.id) setRawLyrics(updated.lyrics || '')
    addToast('Track metadata saved', undefined, 'success')
    setTagEditorTrack(null)
  }

  // ---- Playlists ----
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return
    const playlist = await window.api.createPlaylist(newPlaylistName.trim())
    setPlaylists((prev) => [playlist, ...prev])
    setNewPlaylistName('')
    setSelectedPlaylistId(playlist.id)
    setDetailSearch('')
    const tracks = await window.api.getPlaylistTracks(playlist.id)
    setPlaylistTracks(tracks)
  }

  const handleDeletePlaylist = async (playlistId: string, e?: React.MouseEvent | null) => {
    if (e) e.stopPropagation()
    setOptionsOpen(false)
    if (
      confirmBeforeDelete &&
      !window.confirm('Delete this playlist? Your tracks stay in your library.')
    )
      return
    const success = await window.api.deletePlaylist(playlistId)
    if (success) {
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null)
        setPlaylistTracks([])
        setDetailSearch('')
      }
    }
  }

  const handleSelectPlaylist = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId)
    setDetailSearch('')
    const tracks = await window.api.getPlaylistTracks(playlistId)
    setPlaylistTracks(tracks)
  }

  const handleBackToPlaylists = () => {
    setSelectedPlaylistId(null)
    setPlaylistTracks([])
    setDetailSearch('')
  }

  const handleOpenAddTracks = () => {
    setAddSelection(new Set())
    setAddSearch('')
    setIsAddTracksOpen(true)
  }

  const toggleAddSelection = (id: string) => {
    setAddSelection((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleConfirmAddTracks = async () => {
    if (!selectedPlaylistId) return
    for (const id of addSelection) await window.api.addTrackToPlaylist(selectedPlaylistId, id)
    const tracks = await window.api.getPlaylistTracks(selectedPlaylistId)
    setPlaylistTracks(tracks)
    refreshPlaylistCovers()
    setIsAddTracksOpen(false)
    addToast(
      `${addSelection.size} track${addSelection.size > 1 ? 's' : ''} added to playlist`,
      undefined,
      'success'
    )
  }

  const handlePlayPlaylistTrack = (trackId: string) => {
    const idx = playlistTracks.findIndex((t) => t.id === trackId)
    if (idx >= 0) loadAndPlayIndex(idx, playlistTracks)
  }

  const handleAddTrackToPlaylist = async (
    trackId: string,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const val = e.target.value
    if (!val) return
    await window.api.addTrackToPlaylist(val, trackId)
    if (selectedPlaylistId === val) {
      const tracks = await window.api.getPlaylistTracks(val)
      setPlaylistTracks(tracks)
    }
    refreshPlaylistCovers()
    e.target.value = ''
    addToast('Added to playlist', undefined, 'success')
  }

  const handleRemoveFromPlaylist = async (
    playlistId: string,
    trackId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation()
    await window.api.removeTrackFromPlaylist(playlistId, trackId)
    setPlaylistTracks((prev) => prev.filter((t) => t.id !== trackId))
    refreshPlaylistCovers()
  }

  const refreshPlaylistCovers = () => {
    window.api.getPlaylistCovers().then((m) => setPlaylistCovers(m || {}))
  }

  useEffect(() => {
    refreshPlaylistCovers()
  }, [playlists])

  const startRename = () => {
    setRenameValue(selectedPlaylist?.name || '')
    setIsRenaming(true)
    setOptionsOpen(false)
  }

  const handleCommitRename = async () => {
    const name = renameValue.trim()
    if (!name) {
      setIsRenaming(false)
      setRenameValue(selectedPlaylist?.name || '')
      return
    }
    if (selectedPlaylistId && selectedPlaylist && name !== selectedPlaylist.name) {
      await window.api.updatePlaylist(selectedPlaylistId, { name })
      setPlaylists((prev) => prev.map((p) => (p.id === selectedPlaylistId ? { ...p, name } : p)))
    }
    setIsRenaming(false)
  }

  const patchSelectedPlaylistCover = (patch: Partial<Playlist>) => {
    if (!selectedPlaylistId) return
    setPlaylists((prev) => prev.map((p) => (p.id === selectedPlaylistId ? { ...p, ...patch } : p)))
  }

  const handleSetCover = async (
    cover_type: 'auto' | 'gradient' | 'image',
    cover_gradient?: string | null,
    cover_image?: string | null
  ) => {
    if (!selectedPlaylistId) return
    const patch: Partial<Playlist> = { cover_type }
    if (cover_gradient !== undefined) patch.cover_gradient = cover_gradient
    if (cover_image !== undefined) patch.cover_image = cover_image
    if (cover_type === 'auto') {
      patch.cover_gradient = null
      patch.cover_image = null
    }
    await window.api.updatePlaylist(selectedPlaylistId, patch)
    patchSelectedPlaylistCover(patch)
  }

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => handleSetCover('image', null, String(reader.result))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleExportPlaylist = async () => {
    if (!selectedPlaylistId) return
    setOptionsOpen(false)
    const ok = await window.api.exportPlaylist(selectedPlaylistId)
    if (!ok) window.alert('Export cancelled or no tracks to export.')
    else addToast('Playlist exported', undefined, 'success')
  }

  const handleImportPlaylist = async () => {
    if (!window.api?.importPlaylist) return
    const pl = await window.api.importPlaylist()
    if (pl) {
      setPlaylists((prev) => [pl, ...prev])
      addToast(`Playlist "${pl.name}" imported`, undefined, 'success')
    }
  }

  const SORT_LABELS: Record<string, string> = {
    default: 'Original',
    title: 'Title',
    artist: 'Artist',
    album: 'Album',
    duration: 'Duration'
  }

  const cycleSort = (key: SortConfig['key']) => {
    setPlaylistSort((s) =>
      s.key === key ? { key: s.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )
  }

  const handleMoveQueueItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= queue.length) return
    const newQueue = [...queue]
    const [movedItem] = newQueue.splice(index, 1)
    newQueue.splice(targetIndex, 0, movedItem)
    setQueue(newQueue)
    if (currentIndex === index) setCurrentIndex(targetIndex)
    else if (currentIndex === targetIndex) setCurrentIndex(index)
  }

  const handleRemoveFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index)
    setQueue(newQueue)
    if (currentIndex === index) {
      setCurrentIndex(null)
    } else if (currentIndex !== null && currentIndex > index) setCurrentIndex(currentIndex - 1)
  }

  const handleClearQueue = () => {
    setQueue([])
    setCurrentIndex(null)
  }

  // ---- Scrubber seek ----
  const handleSeekAt = (
    e: React.MouseEvent<HTMLDivElement>,
    refTarget?: React.RefObject<HTMLDivElement | null>
  ) => {
    if (!currentTrack || duration <= 0) return
    const targetEl = refTarget?.current || progressBarRef.current
    const rect = targetEl?.getBoundingClientRect()
    if (!rect) return
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const seekTime = percent * duration
    seek(seekTime)
  }

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0 || !progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    setHoverSeekPercent(percent)
    setHoverSeekSecs(percent * duration)
  }

  const handleProgressMouseLeave = () => {
    setHoverSeekPercent(null)
    setHoverSeekSecs(null)
  }

  // ---- Context Menu actions ----
  const buildContextMenuOptions = (
    trackId: string,
    trackIdx: number,
    fromPlaylist = false
  ): ContextMenuOption[] => {
    const track = fromPlaylist
      ? playlistTracks.find((t) => t.id === trackId)
      : library.find((t) => t.id === trackId)
    const opts: ContextMenuOption[] = [
      {
        label: 'Play Now',
        icon: <Play size={14} />,
        onClick: () => {
          if (fromPlaylist) handlePlayPlaylistTrack(trackId)
          else loadAndPlayIndex(trackIdx, filteredLibrary)
        }
      },
      {
        label: 'Play Next',
        icon: <ListPlus size={14} />,
        onClick: () => {
          if (!track) return
          if (currentIndex !== null) {
            const newQueue = [...queue]
            newQueue.splice(currentIndex + 1, 0, track)
            setQueue(newQueue)
          } else {
            setQueue((prev) => [track, ...prev])
            setCurrentIndex(0)
          }
          addToast('Playing next', track.title, 'info')
        }
      },
      {
        label: 'Add to Queue',
        icon: <ListOrdered size={14} />,
        onClick: () => {
          if (!track) return
          setQueue((prev) => [...prev, track])
          addToast('Added to queue', track.title, 'info')
        }
      },
      {
        label: 'Edit Tags',
        icon: <Edit3 size={14} />,
        onClick: () => track && setTagEditorTrack(track)
      },
      {
        label: 'Show in Explorer',
        icon: <FolderOpen size={14} />,
        onClick: () =>
          track && window.api?.revealInExplorer && window.api.revealInExplorer(track.filepath)
      }
    ]
    if (fromPlaylist && selectedPlaylistId) {
      opts.push({
        label: 'Remove from Playlist',
        icon: <X size={14} />,
        danger: true,
        onClick: () => {
          if (track && selectedPlaylistId) handleRemoveFromPlaylist(selectedPlaylistId, trackId)
        }
      })
    } else {
      opts.push({
        label: 'Delete from Library',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => {
          if (
            track &&
            (!confirmBeforeDelete || window.confirm('Delete this track from your library?'))
          ) {
            window.api.deleteTrack(trackId).then((ok) => {
              if (ok) {
                setLibrary((prev) => prev.filter((t) => t.id !== trackId))
                setQueue((prev) => prev.filter((t) => t.id !== trackId))
                refreshPlaylistCovers()
                addToast('Track deleted', undefined, 'info')
              }
            })
          }
        }
      })
    }
    return opts
  }

  // ---- Reset Settings ----
  const handleResetSettings = () => {
    setCurrentTheme(PRESET_THEMES[0])
    setCustomCssInput('')
    setCurrentFont('Original')
    setAnimId('modern')
    setLibraryLayout('table')
    setLibraryDensity('comfortable')
    handleVolumeChange(0.8)
    setShuffleOn(false)
    setRepeatMode('off')
    setConfirmBeforeDelete(true)
    setResumePlayback(true)
    setAutoFetchLyrics(true)
    setCustomTrackOrder(null)
    setFluidBgEnabled(true)
    setFluidBgBlur(22)
    setFluidBgOpacity(0.35)
    setFluidBgSpeed('smooth')
    setFluidBgSaturation(140)
    setLyricFontSize(28)
    setLyricAlignment('left')
    setLyricLineGap(0.35)
    setLyricInactiveBlur(4)
    setLyricDimLevel(0.3)
    setLyricActiveScale(1.04)
    setLyricUppercase(false)
    setLyricAnimation('scale')
    setDiscordEnabled(false)
    setVisualizerMode('off')
    setSongTransitionEnabled(false)
    setSongTransitionDuration(2)
    applyEQPreset('flat')
    setBalance(0)
    addToast('Settings reset to defaults', undefined, 'info')
  }

  // ---- Filtered / sorted data ----
  const filteredLibrary = useMemo(
    () =>
      library.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.album.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [library, searchQuery]
  )

  // ---- Grouped library (by Artist + Album) ----
  const orderedTracks = useMemo(() => {
    if (customTrackOrder && customTrackOrder.length) {
      const byId = new Map(library.map((t) => [t.id, t]))
      return customTrackOrder.map((id) => byId.get(id)).filter((t): t is Track => !!t)
    }
    return library
  }, [library, customTrackOrder])

  const groupKeyOf = (t: Track): string =>
    `${t.artist || 'Unknown Artist'}│${t.album || 'Unknown Album'}`

  const libraryGroups = useMemo(() => {
    const filtered = orderedTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.album.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const map = new Map<string, { key: string; artist: string; album: string; tracks: Track[] }>()
    for (const t of filtered) {
      const k = groupKeyOf(t)
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          artist: t.artist || 'Unknown Artist',
          album: t.album || 'Unknown Album',
          tracks: []
        })
      }
      map.get(k)!.tracks.push(t)
    }
    return Array.from(map.values())
  }, [orderedTracks, searchQuery])

  const handleGroupDrop = (targetKey: string) => {
    const srcKey = dragGroupKey
    setDragGroupKey(null)
    setOverGroupKey(null)
    if (!srcKey || srcKey === targetKey) return
    const keys = libraryGroups.map((g) => g.key)
    const from = keys.indexOf(srcKey)
    const to = keys.indexOf(targetKey)
    if (from === -1 || to === -1 || from === to) return
    const newKeys = [...keys]
    const [moved] = newKeys.splice(from, 1)
    newKeys.splice(to, 0, moved)
    const byKey = new Map(libraryGroups.map((g) => [g.key, g.tracks.map((t) => t.id)]))
    setCustomTrackOrder(newKeys.flatMap((k) => byKey.get(k) || []))
  }

  const handleTrackDrop = (targetId: string) => {
    const srcId = dragTrackId
    setDragTrackId(null)
    setOverTrackId(null)
    if (!srcId || srcId === targetId) return
    // Only allow reordering within the same album group.
    const srcGroup = libraryGroups.find((g) => g.tracks.some((t) => t.id === srcId))
    const sameGroup = !!srcGroup?.tracks.some((t) => t.id === targetId)
    if (!sameGroup) return
    const ids = customTrackOrder ? [...customTrackOrder] : orderedTracks.map((t) => t.id)
    const from = ids.indexOf(srcId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1 || from === to) return
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    setCustomTrackOrder(ids)
  }

  const playGroup = (group: (typeof libraryGroups)[number]) => {
    const idx = orderedTracks.findIndex((t) => t.id === group.tracks[0]?.id)
    if (idx >= 0) loadAndPlayIndex(idx, orderedTracks)
  }

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null
  const selectedGradient = parseGradient(selectedPlaylist?.cover_gradient)
  const playlistTotalSecs = playlistTracks.reduce((s, t) => s + (t.duration || 0), 0)
  const heroCovers = playlistTracks.filter((t) => t.cover).slice(0, 4)
  const addCandidates = library.filter((t) => !playlistTracks.some((pt) => pt.id === t.id))
  const filteredAddCandidates = addCandidates.filter(
    (t) =>
      t.title.toLowerCase().includes(addSearch.toLowerCase()) ||
      t.artist.toLowerCase().includes(addSearch.toLowerCase()) ||
      t.album.toLowerCase().includes(addSearch.toLowerCase())
  )
  const filteredPlaylistTracks = playlistTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(detailSearch.toLowerCase()) ||
      t.artist.toLowerCase().includes(detailSearch.toLowerCase()) ||
      t.album.toLowerCase().includes(detailSearch.toLowerCase())
  )

  const displayedPlaylistTracks = useMemo(() => {
    const arr = [...filteredPlaylistTracks]
    if (playlistSort.key === 'duration') {
      arr.sort((a, b) =>
        playlistSort.dir === 'asc'
          ? (a.duration || 0) - (b.duration || 0)
          : (b.duration || 0) - (a.duration || 0)
      )
    } else if (playlistSort.key !== 'default') {
      const field = playlistSort.key as keyof Track
      arr.sort((a, b) => {
        const av = (a[field] || '').toString().toLowerCase()
        const bv = (b[field] || '').toString().toLowerCase()
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return playlistSort.dir === 'asc' ? cmp : -cmp
      })
    }
    return arr
  }, [filteredPlaylistTracks, playlistSort])

  const [prevPlaylistId, setPrevPlaylistId] = useState<string | null>(null)
  if (prevPlaylistId !== selectedPlaylistId) {
    setPrevPlaylistId(selectedPlaylistId)
    setIsRenaming(false)
    setOptionsOpen(false)
  }

  const fluidAnimDuration =
    fluidBgSpeed === 'dynamic' ? '14s' : fluidBgSpeed === 'calm' ? '34s' : '22s'

  const rootStyle = {
    '--bg': currentTheme.bg,
    '--sidebar-bg': currentTheme.sidebarBg,
    '--card-bg': currentTheme.cardBg,
    '--text-primary': currentTheme.textPrimary,
    '--text-secondary': currentTheme.textSecondary,
    '--accent': currentTheme.accent,
    '--transition': uiTransition,
    '--font': activeFontFamily,
    '--titlebar-h': `${TITLEBAR_H}px`
  } as React.CSSProperties

  return (
    <div className="app-shell" data-anim={currentAnim.id} style={rootStyle}>
      <style>{GLOBAL_CSS}</style>
      <style>{currentAnim.globalCss}</style>
      {currentTheme.customCss && <style>{currentTheme.customCss}</style>}

      {/* Custom frameless window title bar */}
      <TitleBar onAbout={() => setIsAboutOpen(true)} />

      {/* Full-viewport load screen shown while data hydrates */}
      {isInitializing && <LoadingScreen />}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={buildContextMenuOptions(
            contextMenu.trackId,
            contextMenu.trackIdx,
            contextMenu.fromPlaylist
          )}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* FLUID AMBIENT BACKGROUND */}
      {fluidBgEnabled && (
        <div
          className="fluid-bg-container"
          style={{
            opacity: currentTrack?.cover ? fluidBgOpacity * 0.4 : fluidBgOpacity,
            filter: `blur(${Math.min(fluidBgBlur, 48)}px) saturate(${Math.min(fluidBgSaturation, 200)}%)`,
            // Promote the blurred container to its own compositor layer so the
            // expensive blur+saturate is baked once andorb transforms just re-composite
            // the cached layer, instead of re-rasterising the whole viewport each frame.
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          {currentTrack?.cover ? (
            <>
              <div
                className="fluid-orb orb-1"
                style={{
                  backgroundImage: `url(${currentTrack.cover})`,
                  animation: `fluidMorph1 ${fluidAnimDuration} ease-in-out infinite`
                }}
              />
              <div
                className="fluid-orb orb-2"
                style={{
                  background: `radial-gradient(circle, var(--accent) 0%, var(--card-bg) 70%, transparent 100%)`,
                  animation: `fluidMorph2 ${parseFloat(fluidAnimDuration) * 1.2}s ease-in-out infinite reverse`
                }}
              />
              <div
                className="fluid-orb orb-3"
                style={{
                  background: `radial-gradient(circle, var(--sidebar-bg) 0%, var(--accent) 60%, transparent 100%)`,
                  animation: `fluidMorph3 ${parseFloat(fluidAnimDuration) * 0.8}s ease-in-out infinite`
                }}
              />
            </>
          ) : (
            <>
              <div
                className="fluid-orb orb-1"
                style={{
                  background: `radial-gradient(circle, var(--accent) 0%, var(--card-bg) 70%, transparent 100%)`,
                  animation: `fluidMorph1 ${fluidAnimDuration} ease-in-out infinite`
                }}
              />
              <div
                className="fluid-orb orb-2"
                style={{
                  background: `radial-gradient(circle, var(--sidebar-bg) 0%, var(--accent) 60%, transparent 100%)`,
                  animation: `fluidMorph2 ${parseFloat(fluidAnimDuration) * 1.2}s ease-in-out infinite reverse`
                }}
              />
            </>
          )}
        </div>
      )}
      {fluidBgEnabled && (
        <div
          className="fluid-scrim"
          style={{
            background: `radial-gradient(circle at 50% 40%, rgba(0,0,0,0.05) 0%, var(--bg) 100%)`,
            opacity: 0.85
          }}
        />
      )}

      {/* LEFT NAVIGATION RAIL */}
      <nav className="rail">
        <div className="rail-nav">
          {NAV_ITEMS.map(({ id, label, IconComp }) => (
            <button
              key={id}
              className="rail-btn"
              data-active={view === id}
              onClick={() => setView(id)}
            >
              <IconComp size={19} />
              <span className="lbl">{label}</span>
            </button>
          ))}
        </div>
        <div className="rail-actions">
          <button
            className="rail-fab primary"
            onClick={openImportTracks}
            title="Add tracks (files or folders)"
          >
            <Plus size={16} />
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main
        className="content"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* LIBRARY VIEW */}
        {view === 'library' && (
          <div key="library" className="view-fade">
            <div className="content-header">
              <div className="search-pill">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search library, artists, albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {libraryLayout === 'table' && (
                  <div className="seg">
                    <button
                      data-active={libraryDensity === 'comfortable'}
                      onClick={() => setLibraryDensity('comfortable')}
                      title="Comfortable"
                    >
                      <Rows2 size={14} />
                    </button>
                    <button
                      data-active={libraryDensity === 'compact'}
                      onClick={() => setLibraryDensity('compact')}
                      title="Compact"
                    >
                      <Rows3 size={14} />
                    </button>
                  </div>
                )}
                <div className="seg">
                  <button
                    data-active={libraryLayout === 'table'}
                    onClick={() => setLibraryLayout('table')}
                    title="List View"
                  >
                    <LayoutList size={14} /> List
                  </button>
                  <button
                    data-active={libraryLayout === 'grid'}
                    onClick={() => setLibraryLayout('grid')}
                    title="Grid View"
                  >
                    <LayoutGrid size={14} /> Grid
                  </button>
                  <button
                    data-active={libraryLayout === 'group'}
                    onClick={() => setLibraryLayout('group')}
                    title="Grouped by Artist & Album"
                  >
                    <Rows3 size={14} /> Albums
                  </button>
                </div>
              </div>
            </div>

            {filteredLibrary.length === 0 ? (
              <div className="pl-empty">
                {library.length === 0 ? (
                  <div>
                    <Music size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                      Your Library is Empty
                    </p>
                    <p style={{ fontSize: 12, marginBottom: 18 }}>
                      Import audio files or folders to start listening offline.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button className="btn btn-primary" onClick={openImportTracks}>
                        <Plus size={14} /> Add Tracks
                      </button>
                    </div>
                  </div>
                ) : (
                  'No matching songs found in your library.'
                )}
              </div>
            ) : libraryLayout === 'table' ? (
              <table className="track-table" data-density={libraryDensity}>
                <thead>
                  <tr className="track-head-row">
                    <span>#</span>
                    <span>TITLE</span>
                    <span>ARTIST</span>
                    <span>ALBUM</span>
                    <span>TIME</span>
                    <span>ADD TO PLAYLIST</span>
                    <span />
                    <span />
                  </tr>
                </thead>
                <tbody>
                  {filteredLibrary.map((track, idx) => {
                    const isActive = currentTrack?.id === track.id
                    return (
                      <tr
                        key={track.id}
                        className="track-row"
                        data-active={isActive}
                        onClick={() => loadAndPlayIndex(idx, filteredLibrary)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            trackId: track.id,
                            trackIdx: idx
                          })
                        }}
                      >
                        <td className="idx">
                          {isActive && isPlaying ? (
                            <div className="eq">
                              <span />
                              <span />
                              <span />
                            </div>
                          ) : (
                            idx + 1
                          )}
                        </td>
                        <td className="t-title">
                          <div className="art-thumb">
                            {track.cover && <img src={track.cover} alt="" />}
                          </div>
                          <span>{track.title}</span>
                        </td>
                        <td className="t-sub">{track.artist || 'Unknown Artist'}</td>
                        <td className="t-sub">{track.album || '—'}</td>
                        <td className="t-time">{formatTime(track.duration)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            className="field"
                            style={{ padding: '4px 8px', fontSize: 11, height: 28 }}
                            defaultValue=""
                            onChange={(e) => handleAddTrackToPlaylist(track.id, e)}
                          >
                            <option value="" disabled>
                              Add to playlist...
                            </option>
                            {playlists.map((pl) => (
                              <option key={pl.id} value={pl.id}>
                                {pl.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="row-action"
                            title="Edit Tags"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTagEditorTrack(track)
                            }}
                          >
                            <Edit3 size={13} />
                          </button>
                        </td>
                        <td>
                          <button
                            className="row-action"
                            title="Delete track"
                            onClick={(e) => handleDeleteTrack(track.id, e)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : libraryLayout === 'group' ? (
              <div className="library-groups">
                {libraryGroups.map((g) => (
                  <div key={g.key} className="library-group" style={{ marginBottom: 18 }}>
                    <div
                      draggable
                      onDragStart={() => setDragGroupKey(g.key)}
                      onDragEnd={() => {
                        setDragGroupKey(null)
                        setOverGroupKey(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setOverGroupKey(g.key)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        handleGroupDrop(g.key)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '10px 14px',
                        borderRadius: 12,
                        cursor: 'grab',
                        background: overGroupKey === g.key ? 'var(--card-bg)' : 'transparent',
                        border:
                          overGroupKey === g.key
                            ? '1px solid var(--accent)'
                            : '1px solid rgba(128,128,128,0.14)',
                        opacity: dragGroupKey === g.key ? 0.5 : 1,
                        marginBottom: 8
                      }}
                      onClick={() => playGroup(g)}
                    >
                      <div
                        className="art-thumb"
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 10,
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {g.tracks.find((t) => t.cover) ? (
                          <img
                            src={g.tracks.find((t) => t.cover)!.cover}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'var(--card-bg)'
                            }}
                          >
                            <Music size={20} opacity={0.4} />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>
                          {g.album}
                          <span style={{ opacity: 0.5, fontWeight: 500, marginLeft: 8 }}>
                            {g.artist}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {g.tracks.length} track{g.tracks.length > 1 ? 's' : ''} — drag to reorder
                        </div>
                      </div>
                      <GripVertical size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    {g.tracks.map((track, i) => {
                      const isActive = currentTrack?.id === track.id
                      const ordIdx = orderedTracks.findIndex((t) => t.id === track.id)
                      return (
                        <div
                          key={track.id}
                          draggable
                          onDragStart={() => setDragTrackId(track.id)}
                          onDragEnd={() => {
                            setDragTrackId(null)
                            setOverTrackId(null)
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            setOverTrackId(track.id)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            handleTrackDrop(track.id)
                          }}
                          onClick={() => loadAndPlayIndex(ordIdx, orderedTracks)}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              trackId: track.id,
                              trackIdx: ordIdx
                            })
                          }}
                          data-active={isActive}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '28px 1fr 90px',
                            alignItems: 'center',
                            padding: '7px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            background: overTrackId === track.id ? 'var(--card-bg)' : 'transparent',
                            border:
                              overTrackId === track.id
                                ? '1px solid var(--accent)'
                                : '1px solid transparent',
                            opacity: dragTrackId === track.id ? 0.5 : 1
                          }}
                        >
                          <span
                            style={{
                              color:
                                isActive && isPlaying ? 'var(--accent)' : 'var(--text-secondary)',
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            {isActive && isPlaying ? '♫' : i + 1}
                          </span>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: isActive ? 800 : 500
                            }}
                          >
                            {track.title}
                          </span>
                          <span
                            style={{
                              textAlign: 'right',
                              color: 'var(--text-secondary)',
                              fontSize: 11
                            }}
                          >
                            {formatTime(track.duration)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="track-grid">
                {filteredLibrary.map((track, idx) => (
                  <div
                    key={track.id}
                    className="track-card"
                    onClick={() => loadAndPlayIndex(idx, filteredLibrary)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        trackId: track.id,
                        trackIdx: idx
                      })
                    }}
                  >
                    <button
                      className="card-x"
                      title="Delete"
                      onClick={(e) => handleDeleteTrack(track.id, e)}
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="art">
                      {track.cover ? (
                        <img src={track.cover} alt="" />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Music size={28} opacity={0.3} />
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {track.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 2
                      }}
                    >
                      {track.artist || 'Unknown Artist'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLAYLISTS VIEW */}
        {view === 'playlists' && (
          <div key="playlists" className="view-fade">
            {!selectedPlaylist ? (
              <>
                <div className="pl-topbar">
                  <div className="search-pill" style={{ maxWidth: 300 }}>
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="New playlist name..."
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim()}
                  >
                    <Plus size={14} /> Create
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={handleImportPlaylist}
                    title="Import .m3u playlist"
                  >
                    <Upload size={14} /> Import M3U
                  </button>
                </div>
                {playlists.length === 0 ? (
                  <div className="pl-empty">No playlists yet. Type a name above to start.</div>
                ) : (
                  <div className="pl-grid">
                    {playlists.map((pl) => {
                      const grad = playlistGradient(pl.id)
                      return (
                        <div
                          key={pl.id}
                          className="pl-card"
                          onClick={() => handleSelectPlaylist(pl.id)}
                        >
                          <button
                            className="pl-card-x"
                            title="Delete Playlist"
                            onClick={(e) => handleDeletePlaylist(pl.id, e)}
                          >
                            <Trash2 size={12} />
                          </button>
                          <PlaylistCoverArt
                            covers={playlistCovers[pl.id] || []}
                            coverType={pl.cover_type || 'auto'}
                            coverImage={pl.cover_image}
                            coverGradient={parseGradient(pl.cover_gradient)}
                            fallbackGradient={grad}
                          />
                          <div className="pl-name">{pl.name}</div>
                          <div className="pl-count">
                            {(playlistCovers[pl.id] || []).length} track(s)
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div>
                <button
                  className="btn-plain"
                  onClick={handleBackToPlaylists}
                  style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ← Back to Playlists
                </button>

                <div className="pl-hero">
                  <PlaylistCoverArt
                    covers={heroCovers.map((t) => t.cover)}
                    coverType={selectedPlaylist.cover_type || 'auto'}
                    coverImage={selectedPlaylist.cover_image}
                    coverGradient={selectedGradient}
                    fallbackGradient={[
                      playlistGradient(selectedPlaylist.id)[0],
                      playlistGradient(selectedPlaylist.id)[1]
                    ]}
                    hero
                  />
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div className="pl-hero-type">PLAYLIST</div>
                    <div className="pl-hero-title-row">
                      {isRenaming ? (
                        <input
                          className="pl-hero-title-input"
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitRename()
                            if (e.key === 'Escape') {
                              setRenameValue(selectedPlaylist.name)
                              setIsRenaming(false)
                            }
                          }}
                          onBlur={handleCommitRename}
                        />
                      ) : (
                        <>
                          <h1 className="pl-hero-title">{selectedPlaylist.name}</h1>
                          <button
                            className="pl-hero-title-btn"
                            title="Rename playlist"
                            onClick={startRename}
                          >
                            <Pencil size={16} />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="pl-hero-meta">
                      <span>{playlistTracks.length} tracks</span>
                      <span>•</span>
                      <span>{formatTime(playlistTotalSecs)}</span>
                      {playlistSort.key !== 'default' && (
                        <span style={{ color: 'var(--accent)', fontSize: 11, fontStyle: 'italic' }}>
                          · Sorted: {SORT_LABELS[playlistSort.key]}{' '}
                          {playlistSort.dir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    <div className="pl-hero-actions">
                      <button
                        className="play-lg"
                        disabled={playlistTracks.length === 0}
                        onClick={() =>
                          playlistTracks.length > 0 && loadAndPlayIndex(0, displayedPlaylistTracks)
                        }
                        title="Play All"
                      >
                        <Play size={24} style={{ marginLeft: 3 }} />
                      </button>
                      <button className="btn btn-ghost" onClick={handleOpenAddTracks}>
                        <Plus size={14} /> Add Songs
                      </button>

                      <div className="pl-options-wrap">
                        <button
                          className="btn btn-ghost"
                          onClick={() => setOptionsOpen((v) => !v)}
                          title="Playlist options"
                          style={{ padding: '8px 10px' }}
                        >
                          <EllipsisVertical size={16} />
                        </button>
                        {optionsOpen && (
                          <>
                            <div
                              className="pl-options-backdrop"
                              onClick={() => setOptionsOpen(false)}
                            />
                            <div className="pl-options-menu" onClick={(e) => e.stopPropagation()}>
                              <div className="pl-opt-row" onClick={startRename}>
                                <Pencil size={15} /> Rename playlist
                              </div>
                              <div className="pl-opt-label">Sort tracks</div>
                              <div className="pl-opt-chips">
                                {(Object.keys(SORT_LABELS) as SortConfig['key'][]).map((key) => (
                                  <button
                                    key={key}
                                    className="pl-opt-chip"
                                    data-active={playlistSort.key === key}
                                    onClick={() => cycleSort(key)}
                                  >
                                    {SORT_LABELS[key]}
                                  </button>
                                ))}
                              </div>
                              {playlistSort.key !== 'default' && (
                                <div
                                  className="pl-opt-row"
                                  onClick={() =>
                                    setPlaylistSort((s) => ({
                                      ...s,
                                      dir: s.dir === 'asc' ? 'desc' : 'asc'
                                    }))
                                  }
                                >
                                  <ArrowDownAZ size={15} />{' '}
                                  {playlistSort.dir === 'asc'
                                    ? 'Ascending (A → Z)'
                                    : 'Descending (Z → A)'}
                                </div>
                              )}
                              <div className="pl-opt-divider" />
                              <div className="pl-opt-label">Custom Cover</div>
                              <div className="pl-opt-row" onClick={() => handleSetCover('auto')}>
                                <LayoutGrid size={15} /> Auto (album art collage)
                              </div>
                              <div className="pl-opt-chips">
                                {PL_PALETTES.map((pal, i) => {
                                  const active =
                                    selectedPlaylist.cover_type === 'gradient' &&
                                    selectedGradient &&
                                    selectedGradient[0] === pal[0]
                                  return (
                                    <button
                                      key={i}
                                      className="pl-gradient-sw"
                                      data-active={active}
                                      title="Use this gradient"
                                      onClick={() =>
                                        handleSetCover('gradient', JSON.stringify(pal))
                                      }
                                      style={{
                                        background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})`
                                      }}
                                    />
                                  )
                                })}
                              </div>
                              <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleCoverFile}
                              />
                              <div
                                className="pl-opt-row"
                                onClick={() => coverInputRef.current?.click()}
                              >
                                <ImagePlus size={15} /> Upload cover image
                              </div>
                              <div className="pl-opt-divider" />
                              <div className="pl-opt-row" onClick={handleExportPlaylist}>
                                <Download size={15} /> Export as .m3u file
                              </div>
                              <div
                                className="pl-opt-row danger"
                                onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                              >
                                <Trash2 size={15} /> Delete playlist
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Playlist detail search */}
                    <div className="search-pill" style={{ maxWidth: 280, marginTop: 8 }}>
                      <Search size={13} />
                      <input
                        type="text"
                        placeholder="Search in playlist..."
                        value={detailSearch}
                        onChange={(e) => setDetailSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {playlistTracks.length === 0 ? (
                  <div className="pl-empty">
                    This playlist is empty. Click &ldquo;Add Songs&rdquo; above to add tracks.
                  </div>
                ) : (
                  <div>
                    <div className="pl-track-head">
                      <span>#</span>
                      <span>TITLE</span>
                      <span>ARTIST</span>
                      <span>ALBUM</span>
                      <span>TIME</span>
                      <span />
                    </div>
                    {displayedPlaylistTracks.map((track, idx) => (
                      <div
                        key={track.id}
                        className="pl-track-row"
                        data-active={currentTrack?.id === track.id}
                        onClick={() => handlePlayPlaylistTrack(track.id)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            trackId: track.id,
                            trackIdx: idx,
                            fromPlaylist: true
                          })
                        }}
                      >
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {idx + 1}
                        </span>
                        <div className="t-title">
                          <div className="art-thumb">
                            {track.cover && <img src={track.cover} alt="" />}
                          </div>
                          <span>{track.title}</span>
                        </div>
                        <div className="t-sub">{track.artist || 'Unknown Artist'}</div>
                        <div className="t-sub">{track.album || '—'}</div>
                        <div className="t-time">{formatTime(track.duration)}</div>
                        <div>
                          <button
                            className="row-action"
                            title="Remove from playlist"
                            onClick={(e) =>
                              handleRemoveFromPlaylist(selectedPlaylist.id, track.id, e)
                            }
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* QUEUE VIEW */}
        {view === 'queue' && (
          <div key="queue" className="view-fade" style={{ maxWidth: 760 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
              }}
            >
              <p className="eyebrow" style={{ margin: 0 }}>
                Play Queue ({queue.length})
              </p>
              {queue.length > 0 && (
                <button
                  className="btn btn-ghost"
                  onClick={handleClearQueue}
                  style={{ padding: '6px 12px', fontSize: 11 }}
                >
                  Clear Queue
                </button>
              )}
            </div>
            {queue.length === 0 ? (
              <div className="pl-empty">
                Queue is empty. Play a song or album from your library.
              </div>
            ) : (
              <div>
                {queue.map((track, idx) => {
                  const isCurrent = currentIndex === idx
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className="queue-card"
                      data-active={isCurrent}
                      onClick={() => loadAndPlayIndex(idx)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 22 }}>
                          {idx + 1}
                        </span>
                        <div className="art-thumb">
                          {track.cover && <img src={track.cover} alt="" />}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 13,
                              color: isCurrent ? 'var(--accent)' : 'inherit',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {track.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {track.artist || 'Unknown Artist'}
                          </div>
                        </div>
                        <div
                          style={{ fontSize: 11, color: 'var(--text-secondary)', paddingRight: 10 }}
                        >
                          {formatTime(track.duration)}
                        </div>
                      </div>
                      <div className="queue-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="queue-btn"
                          disabled={idx === 0}
                          onClick={() => handleMoveQueueItem(idx, 'up')}
                          title="Move Up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          className="queue-btn"
                          disabled={idx === queue.length - 1}
                          onClick={() => handleMoveQueueItem(idx, 'down')}
                          title="Move Down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          className="queue-btn"
                          onClick={() => handleRemoveFromQueue(idx)}
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* LYRICS VIEW */}
        {view === 'lyrics' && (
          <div key="lyrics" className="lyrics-container-view view-fade">
            <div className="lyrics-header-clean">
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
                  {currentTrack ? currentTrack.title : 'Synchronized Lyrics'}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {currentTrack?.artist || 'Play a track to display synced lyrics'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Offset calibration */}
                {parsedLyrics.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="lyrics-offset-badge" title="Current lyric offset">
                      {offsetMs >= 0 ? `+${offsetMs}ms` : `${offsetMs}ms`}
                    </span>
                    <button
                      className="btn-plain"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => adjustOffset(-500)}
                      title="Shift lyrics back 0.5s"
                    >
                      −0.5s
                    </button>
                    <button
                      className="btn-plain"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => adjustOffset(500)}
                      title="Shift lyrics forward 0.5s"
                    >
                      +0.5s
                    </button>
                    {offsetMs !== 0 && (
                      <button
                        className="btn-plain"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={resetOffset}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}
                {currentTrack && (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 14px', fontSize: 11 }}
                      disabled={isFetchingCurrentLyrics}
                      onClick={() =>
                        fetchLyricsFromOnline(currentTrack).then((lrc) => {
                          if (lrc) persistLyrics(currentTrack, lrc)
                        })
                      }
                      title="Search and fetch lyrics from LRCLIB"
                    >
                      <RefreshCw
                        size={13}
                        className={isFetchingCurrentLyrics ? 'animate-spin' : ''}
                      />
                      {isFetchingCurrentLyrics ? 'Fetching...' : 'Fetch Lyrics'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 10px', fontSize: 11 }}
                      onClick={() => setIsManualLyricsOpen(true)}
                      title="Manually search or paste lyrics"
                    >
                      <Search size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div
              ref={lyricsContainerRef}
              className="lyrics-scroll"
              style={{ scrollBehavior, textAlign: lyricAlignment }}
            >
              {parsedLyrics.length > 0 ? (
                parsedLyrics.map((line, i) => {
                  const isActive = i === activeLyricIndex
                  const isPast = i < activeLyricIndex
                  const anim = getLyricAnim(isActive, isPast)
                  const animClass = `lyric-line lyric-anim-${lyricAnimation}${anim.className ? ` ${anim.className}` : ''}`
                  return (
                    <div
                      key={i}
                      className={animClass}
                      data-active={isActive}
                      style={{
                        fontSize: lyricFontSize,
                        padding: `${lyricFontSize * lyricLineGap}px 0`,
                        textTransform: lyricUppercase ? 'uppercase' : 'none',
                        ...anim.style
                      }}
                      onClick={() => {
                        const t = line.time
                        seek(t)
                      }}
                    >
                      {line.text || '• • •'}
                    </div>
                  )
                })
              ) : (
                <div
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 16,
                    marginTop: 100,
                    textAlign: 'center'
                  }}
                >
                  <Mic2
                    size={42}
                    style={{ opacity: 0.3, margin: '0 auto 16px', color: 'var(--accent)' }}
                  />
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      marginBottom: 8,
                      color: 'var(--text-primary)'
                    }}
                  >
                    No synchronized lyrics available
                  </div>
                  <p style={{ fontSize: 13, maxWidth: 420, margin: '0 auto 20px', opacity: 0.8 }}>
                    {currentTrack
                      ? 'Click below to search and download synchronized LRC lyrics for this song.'
                      : 'Select a song to display lyrics.'}
                  </p>
                  {currentTrack && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                      }}
                    >
                      <button
                        className="btn btn-primary"
                        disabled={isFetchingCurrentLyrics}
                        onClick={() =>
                          fetchLyricsFromOnline(currentTrack).then((lrc) => {
                            if (lrc) persistLyrics(currentTrack, lrc)
                          })
                        }
                      >
                        <RefreshCw
                          size={14}
                          className={isFetchingCurrentLyrics ? 'animate-spin' : ''}
                        />
                        {isFetchingCurrentLyrics ? 'Searching...' : 'Search & Fetch Online'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setIsManualLyricsOpen(true)}>
                        <Search size={14} /> Search Manually
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {view === 'settings' && (
          <div key="settings" className="view-fade" style={{ maxWidth: 740 }}>
            <p className="eyebrow">Lyrics Display & Typography</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Alignment</div>
                  <div className="settings-row-desc">Text alignment for lyrics display.</div>
                </div>
                <div className="seg">
                  <button
                    data-active={lyricAlignment === 'left'}
                    onClick={() => setLyricAlignment('left')}
                  >
                    <AlignLeft size={13} /> Left
                  </button>
                  <button
                    data-active={lyricAlignment === 'center'}
                    onClick={() => setLyricAlignment('center')}
                  >
                    <AlignCenter size={13} /> Center
                  </button>
                  <button
                    data-active={lyricAlignment === 'right'}
                    onClick={() => setLyricAlignment('right')}
                  >
                    <AlignRight size={13} /> Right
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Animation Style</div>
                  <div className="settings-row-desc">How the active lyric line animates.</div>
                </div>
                <div className="seg">
                  {LYRIC_ANIM_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      data-active={lyricAnimation === opt.id}
                      onClick={() => setLyricAnimation(opt.id)}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Font Size</div>
                  <div className="settings-row-desc">
                    Base font size of lyrics ({lyricFontSize}px).
                  </div>
                </div>
                <input
                  type="range"
                  min="18"
                  max="56"
                  step="2"
                  value={lyricFontSize}
                  onChange={(e) => setLyricFontSize(Number(e.target.value))}
                  style={{ width: 140 }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Active Line Scale</div>
                  <div className="settings-row-desc">
                    Enlargement factor ({lyricActiveScale.toFixed(2)}×).
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1.25"
                  step="0.02"
                  value={lyricActiveScale}
                  onChange={(e) => setLyricActiveScale(Number(e.target.value))}
                  style={{ width: 140 }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Line Gap Spacing</div>
                  <div className="settings-row-desc">
                    Vertical spacing ({lyricLineGap.toFixed(2)}×).
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={lyricLineGap}
                  onChange={(e) => setLyricLineGap(Number(e.target.value))}
                  style={{ width: 140 }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Inactive Line Blur</div>
                  <div className="settings-row-desc">
                    Blur intensity for past/upcoming lines ({lyricInactiveBlur}px).
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={lyricInactiveBlur}
                  onChange={(e) => setLyricInactiveBlur(Number(e.target.value))}
                  style={{ width: 140 }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Inactive Line Dimming</div>
                  <div className="settings-row-desc">
                    Opacity level for inactive lines ({Math.round(lyricDimLevel * 100)}%).
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={lyricDimLevel}
                  onChange={(e) => setLyricDimLevel(Number(e.target.value))}
                  style={{ width: 140 }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Uppercase Typography</div>
                  <div className="settings-row-desc">Transform all lyrics text to uppercase.</div>
                </div>
                <button className="switch-label" onClick={() => setLyricUppercase((v) => !v)}>
                  <span className="switch-track" data-active={lyricUppercase}>
                    <span className="switch-knob" />
                  </span>
                  {lyricUppercase ? 'Uppercase' : 'Normal'}
                </button>
              </div>
              {/* Live preview */}
              <div style={{ marginTop: 16 }}>
                <label className="lbl-caps">Live Lyrics Preview</label>
                <div
                  className="lyrics-preview-box"
                  style={{
                    textAlign: lyricAlignment,
                    textTransform: lyricUppercase ? 'uppercase' : 'none'
                  }}
                >
                  {[
                    {
                      text: 'I found a love for me',
                      scale: 0.96,
                      blur: lyricInactiveBlur * 0.7,
                      opacity: lyricDimLevel * 0.7,
                      weight: 800
                    },
                    {
                      text: 'Darling, just dive right in and follow my lead',
                      scale: lyricActiveScale,
                      blur: 0,
                      opacity: 1,
                      weight: 900
                    },
                    {
                      text: 'Well, I found a girl, beautiful and sweet',
                      scale: 0.96,
                      blur: lyricInactiveBlur,
                      opacity: lyricDimLevel,
                      weight: 800
                    }
                  ].map((l, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: lyricFontSize,
                        padding: `${lyricFontSize * lyricLineGap * 0.5}px 0`,
                        color: i === 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                        filter: `blur(${l.blur}px)`,
                        opacity: l.opacity,
                        transform: `scale(${l.scale})`,
                        transformOrigin:
                          lyricAlignment === 'left'
                            ? 'left center'
                            : lyricAlignment === 'right'
                              ? 'right center'
                              : 'center',
                        fontWeight: l.weight
                      }}
                    >
                      {l.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="eyebrow">Equalizer</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">10-Band Graphic Equalizer</div>
                  <div className="settings-row-desc">
                    Current preset:{' '}
                    {EQ_PRESETS.find((p) => p.id === currentEQPreset)?.name || 'Custom'}. Shortcut:
                    E
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => setIsEqOpen(true)}>
                  <Sliders size={14} /> Open Full EQ
                </button>
              </div>

              {/* Preset chips */}
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Presets</div>
                  <div className="settings-row-desc">Quick styles for your music.</div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 6,
                    maxWidth: 360
                  }}
                >
                  {EQ_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className="pl-opt-chip"
                      data-active={currentEQPreset === preset.id}
                      onClick={() => applyEQPreset(preset.id)}
                      style={{ fontSize: 11, padding: '5px 8px' }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preamp + Balance */}
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Preamp</div>
                  <div className="settings-row-desc">
                    Master gain before the EQ (
                    {eqPreamp > 0 ? `+${eqPreamp.toFixed(1)}` : eqPreamp.toFixed(1)} dB).
                  </div>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="0.5"
                  value={eqPreamp}
                  onChange={(e) => setPreampGain(Number(e.target.value))}
                  style={{ width: 140 }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Balance</div>
                  <div className="settings-row-desc">
                    Stereo balance (
                    {balance < 0
                      ? `L ${Math.round(-balance * 100)}%`
                      : balance > 0
                        ? `R ${Math.round(balance * 100)}%`
                        : 'Center'}
                    ).
                  </div>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  style={{ width: 140 }}
                />
              </div>

              {/* 10-band mini sliders */}
              <div style={{ marginTop: 8 }}>
                <label className="lbl-caps" style={{ marginBottom: 10 }}>
                  Bands
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: 6,
                    background: 'rgba(128,128,128,0.05)',
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid rgba(128,128,128,0.1)',
                    minWidth: 0
                  }}
                >
                  {eqBands.map((band, idx) => (
                    <div
                      key={band.freq}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          color: 'var(--text-secondary)',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {band.gain > 0 ? `+${band.gain.toFixed(0)}` : band.gain.toFixed(0)}
                      </span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={band.gain}
                        onChange={(e) => setEQBandGain(idx, Number(e.target.value))}
                        style={{
                          writingMode: 'vertical-lr',
                          direction: 'rtl',
                          height: 80,
                          width: '100%',
                          cursor: 'pointer',
                          accentColor: 'var(--accent)'
                        }}
                      />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {band.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="eyebrow">Visualizer</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Audio Visualizer Style</div>
                  <div className="settings-row-desc">
                    The real-time visualizer shown in the player bar and fullscreen view.
                  </div>
                </div>
                <div className="seg">
                  <button
                    data-active={visualizerMode === 'bars'}
                    onClick={() => setVisualizerMode('bars')}
                  >
                    Bars
                  </button>
                  <button
                    data-active={visualizerMode === 'wave'}
                    onClick={() => setVisualizerMode('wave')}
                  >
                    Wave
                  </button>
                  <button
                    data-active={visualizerMode === 'radial'}
                    onClick={() => setVisualizerMode('radial')}
                  >
                    Radial
                  </button>
                  <button
                    data-active={visualizerMode === 'off'}
                    onClick={() => setVisualizerMode('off')}
                  >
                    Off
                  </button>
                </div>
              </div>
            </div>

            <p className="eyebrow">Fluid Animated Background</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Fluid Blurred Cover Ambient</div>
                  <div className="settings-row-desc">
                    Harmonized fluid aurora backdrop from current album art.
                  </div>
                </div>
                <button className="switch-label" onClick={() => setFluidBgEnabled((v) => !v)}>
                  <span className="switch-track" data-active={fluidBgEnabled}>
                    <span className="switch-knob" />
                  </span>
                  {fluidBgEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              {fluidBgEnabled && (
                <>
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Blur Radius</div>
                      <div className="settings-row-desc">Softness ({fluidBgBlur}px).</div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="48"
                      step="5"
                      value={fluidBgBlur}
                      onChange={(e) => setFluidBgBlur(Number(e.target.value))}
                      style={{ width: 140 }}
                    />
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Opacity</div>
                      <div className="settings-row-desc">
                        Intensity ({Math.round(fluidBgOpacity * 100)}%).
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.7"
                      step="0.05"
                      value={fluidBgOpacity}
                      onChange={(e) => setFluidBgOpacity(Number(e.target.value))}
                      style={{ width: 140 }}
                    />
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Motion Speed</div>
                      <div className="settings-row-desc">Speed of fluid swirling.</div>
                    </div>
                    <div className="seg">
                      <button
                        data-active={fluidBgSpeed === 'calm'}
                        onClick={() => setFluidBgSpeed('calm')}
                      >
                        Calm
                      </button>
                      <button
                        data-active={fluidBgSpeed === 'smooth'}
                        onClick={() => setFluidBgSpeed('smooth')}
                      >
                        Smooth
                      </button>
                      <button
                        data-active={fluidBgSpeed === 'dynamic'}
                        onClick={() => setFluidBgSpeed('dynamic')}
                      >
                        Dynamic
                      </button>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div className="settings-row-text">
                      <div className="settings-row-title">Color Saturation</div>
                      <div className="settings-row-desc">Vibrancy ({fluidBgSaturation}%).</div>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="200"
                      step="10"
                      value={fluidBgSaturation}
                      onChange={(e) => setFluidBgSaturation(Number(e.target.value))}
                      style={{ width: 140 }}
                    />
                  </div>
                </>
              )}
            </div>

            <p className="eyebrow">Integrations</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Discord Rich Presence</div>
                  <div className="settings-row-desc">
                    Show what you&apos;re listening to in your Discord profile.
                  </div>
                </div>
                <button className="switch-label" onClick={() => setDiscordEnabled((v) => !v)}>
                  <span className="switch-track" data-active={discordEnabled}>
                    <span className="switch-knob" />
                  </span>
                  {discordEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              {discordEnabled && (
                <div className="settings-row">
                  <div className="settings-row-text">
                    <div className="settings-row-desc">
                      Requires the <strong>Discord app</strong> to be running and a valid
                      <em> Discord Application ID</em> configured in the source before launch.
                    </div>
                  </div>
                </div>
              )}

              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Updates</div>
                  <div className="settings-row-desc">
                    omus checks for new GitHub releases automatically at launch.
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => window.api?.checkForUpdates?.()}
                  style={{ fontSize: 12, padding: '8px 14px' }}
                >
                  Check for Updates
                </button>
              </div>
            </div>

            <p className="eyebrow">Appearance & Customization</p>
            <div className="settings-section">
              <label className="lbl-caps" style={{ fontSize: 12, marginBottom: 12 }}>
                Theme Presets
              </label>
              <div className="theme-grid">
                {PRESET_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    className="theme-card"
                    onClick={() => setCurrentTheme(theme)}
                    style={{
                      background: theme.cardBg,
                      borderColor:
                        currentTheme.id === theme.id ? theme.accent : 'rgba(128,128,128,0.16)',
                      borderWidth: currentTheme.id === theme.id ? 2 : 1
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>
                      {theme.name}
                    </div>
                    <div className="theme-dots">
                      <div className="theme-dot" style={{ background: theme.bg }} />
                      <div className="theme-dot" style={{ background: theme.sidebarBg }} />
                      <div className="theme-dot" style={{ background: theme.accent }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12
                }}
              >
                <label className="lbl-caps" style={{ fontSize: 12, marginBottom: 0 }}>
                  Animation Presets
                </label>
                <button
                  className="switch-label"
                  onClick={() => setAnimId(animOff ? 'modern' : 'off')}
                >
                  <span className="switch-track" data-active={!animOff}>
                    <span className="switch-knob" />
                  </span>
                  {animOff ? 'Animations off' : 'On'}
                </button>
              </div>
              <div className="anim-grid">
                {PRESET_ANIMATIONS.filter((a) => a.id !== 'off').map((anim) => (
                  <button
                    key={anim.id}
                    className="opt-card"
                    data-active={currentAnim.id === anim.id}
                    onClick={() => setAnimId(anim.id)}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{anim.name}</div>
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.75 }}>{anim.tagline}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <label className="lbl-caps" style={{ fontSize: 12, marginBottom: 12 }}>
                App Font
              </label>
              <div className="font-grid">
                {PRESET_FONTS.map((font) => (
                  <button
                    key={font.name}
                    className="opt-card"
                    data-active={currentFont === font.name}
                    onClick={() => setCurrentFont(font.name)}
                    style={{
                      fontFamily: `"${font.family}", sans-serif`,
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <label className="lbl-caps" style={{ fontSize: 12, marginBottom: 4 }}>
                Custom CSS Overrides
              </label>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 12
                }}
              >
                Inject custom styles to alter UI components live.
              </span>
              <textarea
                className="field"
                style={{ height: 160, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                value={customCssInput}
                onChange={(e) => {
                  setCustomCssInput(e.target.value)
                  setCurrentTheme((prev) => ({ ...prev, customCss: e.target.value }))
                }}
                placeholder="/* Add custom styles here */&#10;.spotify-player { border-top: 1px solid var(--accent); }"
              />
            </div>

            <p className="eyebrow">Playback</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Shuffle</div>
                  <div className="settings-row-desc">Play the queue in random order.</div>
                </div>
                <button className="switch-label" onClick={() => setShuffleOn((v) => !v)}>
                  <span className="switch-track" data-active={shuffleOn}>
                    <span className="switch-knob" />
                  </span>
                </button>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Repeat</div>
                  <div className="settings-row-desc">Off, repeat queue, or repeat one track.</div>
                </div>
                <div className="seg">
                  <button data-active={repeatMode === 'off'} onClick={() => setRepeatMode('off')}>
                    Off
                  </button>
                  <button data-active={repeatMode === 'all'} onClick={() => setRepeatMode('all')}>
                    <Repeat size={13} />
                  </button>
                  <button data-active={repeatMode === 'one'} onClick={() => setRepeatMode('one')}>
                    <Repeat1 size={13} />
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Resume on launch</div>
                  <div className="settings-row-desc">
                    Cue your last-played track when you reopen omus.
                  </div>
                </div>
                <button className="switch-label" onClick={() => setResumePlayback((v) => !v)}>
                  <span className="switch-track" data-active={resumePlayback}>
                    <span className="switch-knob" />
                  </span>
                </button>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Auto-fetch lyrics</div>
                  <div className="settings-row-desc">
                    Automatically search LRCLIB whenever a track has no lyrics.
                  </div>
                </div>
                <button className="switch-label" onClick={() => setAutoFetchLyrics((v) => !v)}>
                  <span className="switch-track" data-active={autoFetchLyrics}>
                    <span className="switch-knob" />
                  </span>
                </button>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Song Transitions</div>
                  <div className="settings-row-desc">
                    Fade between tracks when one song ends and the next begins.
                  </div>
                </div>
                <button
                  className="switch-label"
                  onClick={() => setSongTransitionEnabled((v) => !v)}
                >
                  <span className="switch-track" data-active={songTransitionEnabled}>
                    <span className="switch-knob" />
                  </span>
                </button>
              </div>
              {songTransitionEnabled && (
                <div className="settings-row">
                  <div className="settings-row-text">
                    <div className="settings-row-title">Transition Duration</div>
                    <div className="settings-row-desc">
                      Fade length ({songTransitionDuration}s).
                    </div>
                  </div>
                  <div className="seg">
                    {[1, 2, 3, 4, 5].map((d) => (
                      <button
                        key={d}
                        data-active={songTransitionDuration === d}
                        onClick={() => setSongTransitionDuration(d)}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Playback Speed</div>
                  <div className="settings-row-desc">
                    Adjust audio playback rate ({playbackRateDisplay}×).
                  </div>
                </div>
                <div className="seg">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((r) => (
                    <button
                      key={r}
                      data-active={playbackRateDisplay === r}
                      onClick={() => {
                        setPlaybackRateDisplay(r)
                        handlePlaybackRateChange(r)
                      }}
                    >
                      {r}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="eyebrow">Library</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Default view</div>
                  <div className="settings-row-desc">Layout the library opens in.</div>
                </div>
                <div className="seg">
                  <button
                    data-active={libraryLayout === 'table'}
                    onClick={() => setLibraryLayout('table')}
                  >
                    <LayoutList size={13} /> List
                  </button>
                  <button
                    data-active={libraryLayout === 'grid'}
                    onClick={() => setLibraryLayout('grid')}
                  >
                    <LayoutGrid size={13} /> Grid
                  </button>
                  <button
                    data-active={libraryLayout === 'group'}
                    onClick={() => setLibraryLayout('group')}
                  >
                    <Rows3 size={13} /> Albums
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Row density</div>
                  <div className="settings-row-desc">Compact fits more tracks on screen.</div>
                </div>
                <div className="seg">
                  <button
                    data-active={libraryDensity === 'comfortable'}
                    onClick={() => setLibraryDensity('comfortable')}
                  >
                    <Rows2 size={13} />
                  </button>
                  <button
                    data-active={libraryDensity === 'compact'}
                    onClick={() => setLibraryDensity('compact')}
                  >
                    <Rows3 size={13} />
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Confirm before deleting</div>
                  <div className="settings-row-desc">Ask before removing tracks or playlists.</div>
                </div>
                <button className="switch-label" onClick={() => setConfirmBeforeDelete((v) => !v)}>
                  <span className="switch-track" data-active={confirmBeforeDelete}>
                    <span className="switch-knob" />
                  </span>
                </button>
              </div>
            </div>

            <p className="eyebrow">Keyboard Shortcuts</p>
            <div className="settings-section">
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}
              >
                {[
                  ['Space', 'Play / Pause'],
                  ['L', 'Toggle Lyrics'],
                  ['← / →', 'Seek ±5 Seconds'],
                  ['Shift + ← / →', 'Prev / Next Track'],
                  ['Q', 'Toggle Queue'],
                  ['M', 'Toggle Mute'],
                  ['F', 'Fullscreen Now Playing'],
                  ['E', 'Equalizer'],
                  ['Esc', 'Close Overlays']
                ].map(([key, label]) => (
                  <div key={key}>
                    <kbd
                      style={{
                        background: 'var(--card-bg)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid rgba(128,128,128,0.3)',
                        fontFamily: 'ui-monospace, monospace'
                      }}
                    >
                      {key}
                    </kbd>{' '}
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section" style={{ border: 'none' }}>
              <button
                className="btn-ghost"
                onClick={handleResetSettings}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <RotateCcw size={14} /> Reset to defaults
              </button>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM PLAYER BAR */}
      <footer className="spotify-player">
        {/* Left: Track info */}
        <div className="sp-left">
          {currentTrack ? (
            <>
              <div
                className="sp-cover-wrap"
                onClick={() => setShowCoverModal(true)}
                title="Click to view full cover art"
              >
                {currentTrack.cover ? (
                  <img src={currentTrack.cover} alt="" />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Music size={22} opacity={0.4} />
                  </div>
                )}
                <div className="sp-cover-hover-icon">
                  <Maximize2 size={16} />
                </div>
              </div>
              <div className="sp-info">
                <div className="sp-title" title={currentTrack.title}>
                  {currentTrack.title}
                </div>
                <div
                  className="sp-artist"
                  title={currentTrack.artist || 'Unknown Artist'}
                  onClick={() => {
                    if (currentTrack.artist) {
                      setSearchQuery(currentTrack.artist)
                      setView('library')
                    }
                  }}
                  style={{ cursor: currentTrack.artist ? 'pointer' : 'default' }}
                >
                  {currentTrack.artist || 'Unknown Artist'}
                </div>
              </div>
              <div className="sp-actions-left">
                <button
                  className={`sp-heart-btn ${isCurrentLiked ? 'liked' : ''}`}
                  onClick={() => toggleLikeTrack(currentTrack.id)}
                  title={isCurrentLiked ? 'Liked' : 'Like'}
                >
                  <Heart size={16} fill={isCurrentLiked ? 'var(--accent)' : 'none'} />
                </button>
                {isPlaying && (
                  <div className="eq" title="Playing" style={{ marginLeft: 4 }}>
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                {isLoading && <div className="sp-loading-dot" />}
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Music size={18} opacity={0.5} />
              <span>No track selected</span>
            </div>
          )}
        </div>

        {/* Center: Controls + Scrubber */}
        <div className="sp-center">
          <div className="sp-controls">
            <button
              className="sp-btn-icon"
              data-active={shuffleOn}
              onClick={() => setShuffleOn((v) => !v)}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button className="sp-btn-icon" onClick={handlePrev} title="Previous Track (Shift+←)">
              <SkipBack size={20} />
            </button>
            <button
              className="sp-play-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
              )}
            </button>
            <button className="sp-btn-icon" onClick={handleNext} title="Next Track (Shift+→)">
              <SkipForward size={20} />
            </button>
            <button
              className="sp-btn-icon"
              data-active={repeatMode !== 'off'}
              onClick={() =>
                setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'))
              }
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          <div className="sp-timeline">
            <span className="sp-time">{formatTime(currentTime)}</span>
            <div
              ref={progressBarRef}
              className="sp-scrub-track"
              onClick={handleSeekAt}
              onMouseMove={handleProgressMouseMove}
              onMouseLeave={handleProgressMouseLeave}
            >
              <div className="sp-scrub-bg">
                <div className="sp-scrub-fill" style={{ width: `${progress * 100}%` }} />
                <div className="sp-scrub-thumb" style={{ left: `${progress * 100}%` }} />
              </div>
              {hoverSeekPercent !== null && hoverSeekSecs !== null && (
                <div className="sp-scrub-tooltip" style={{ left: `${hoverSeekPercent * 100}%` }}>
                  {formatTime(hoverSeekSecs)}
                </div>
              )}
            </div>
            <span className="sp-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Actions + Volume */}
        <div className="sp-right">
          {/* Mini Visualizer */}
          {visualizerMode !== 'off' && (
            <AudioVisualizer
              analyserNode={analyserNode}
              isPlaying={isPlaying}
              mode={visualizerMode}
              accentColor="var(--accent)"
              width={52}
              height={28}
              barCount={10}
            />
          )}

          <button
            className="sp-btn-lyrics"
            data-active={view === 'lyrics'}
            onClick={toggleLyricsView}
            title="Lyrics (L)"
          >
            <Mic2 size={15} />
            <span className="lbl">Lyrics</span>
          </button>
          <button
            className="sp-btn-icon"
            data-active={view === 'queue'}
            onClick={() => setView((v) => (v === 'queue' ? previousView : 'queue'))}
            title="Queue (Q)"
          >
            <ListOrdered size={18} />
          </button>
          <button
            className="sp-btn-icon"
            onClick={() => setIsEqOpen((v) => !v)}
            title="Equalizer (E)"
            data-active={isEqOpen || currentEQPreset !== 'flat'}
          >
            <Sliders size={17} />
          </button>
          <button
            className="sp-btn-icon"
            data-active={fluidBgEnabled}
            onClick={() => setFluidBgEnabled((v) => !v)}
            title={fluidBgEnabled ? 'Disable Fluid Background' : 'Enable Fluid Background'}
          >
            <Sparkles size={17} />
          </button>
          <button
            className="sp-btn-icon"
            onClick={() => setIsSleepTimerOpen(true)}
            title={
              sleepTimer.active
                ? `Sleep timer: ${Math.floor(sleepTimer.remainingSeconds / 60)}:${(sleepTimer.remainingSeconds % 60).toString().padStart(2, '0')}`
                : 'Sleep Timer'
            }
            data-active={sleepTimer.active}
          >
            <Moon size={17} />
          </button>
          <div className="sp-vol-group">
            <button
              className="sp-btn-icon"
              onClick={toggleMute}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              style={{ padding: 4 }}
            >
              {isMuted || sliderVal === 0 ? (
                <VolumeX size={18} />
              ) : sliderVal < 0.5 ? (
                <Volume1 size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="sp-vol-slider"
              value={isMuted ? 0 : sliderVal}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              title={`Volume: ${Math.round((isMuted ? 0 : sliderVal) * 100)}%`}
            />
          </div>
          <button
            className="sp-btn-icon"
            onClick={() => setIsFullscreenCover((v) => !v)}
            title="Fullscreen Now Playing (F)"
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </footer>

      {/* FULLSCREEN NOW PLAYING */}
      {isFullscreenCover && currentTrack && (
        <div className="fullscreen-visualizer">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}></div>
            <button
              className="icon-btn"
              onClick={() => setIsFullscreenCover(false)}
              title="Close (F)"
            >
              <Minimize2 size={19} />
            </button>
          </div>

          <div
            className={`fullscreen-body${parsedLyrics.length === 0 ? ' fullscreen-body-nolyrics' : ''}`}
          >
            <div className="fullscreen-cover-side">
              <div
                key={currentTrack.id}
                className="fullscreen-cover-wrap now-playing-enter"
                style={
                  parsedLyrics.length === 0
                    ? { maxWidth: 'min(72vh, 68vw)', margin: '0 auto 28px' }
                    : undefined
                }
              >
                {currentTrack.cover ? (
                  <img src={currentTrack.cover} alt="" />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Music size={100} opacity={0.3} />
                  </div>
                )}
              </div>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  textAlign: 'center',
                  margin: '0 0 6px',
                  letterSpacing: '-0.5px'
                }}
              >
                {currentTrack.title}
              </h2>
              <p
                style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}
              >
                {currentTrack.artist || 'Unknown Artist'}
              </p>
              {/* Fullscreen visualizer */}
              {visualizerMode !== 'off' && (
                <div style={{ marginTop: 16, width: '100%', maxWidth: 420 }}>
                  <AudioVisualizer
                    analyserNode={analyserNode}
                    isPlaying={isPlaying}
                    mode={visualizerMode}
                    accentColor="var(--accent)"
                    width={420}
                    height={60}
                    barCount={40}
                  />
                </div>
              )}
            </div>

            {/* Synced Lyrics side */}
            {parsedLyrics.length > 0 && (
              <div
                ref={fullscreenLyricsRef}
                className="fullscreen-lyrics-scroll"
                style={{ textAlign: lyricAlignment, scrollBehavior }}
              >
                {parsedLyrics.map((line, i) => {
                  const isActive = i === activeLyricIndex
                  const isPast = i < activeLyricIndex
                  const anim = getLyricAnim(isActive, isPast)
                  const animClass = `lyric-anim-${lyricAnimation}${anim.className ? ` ${anim.className}` : ''}`
                  return (
                    <div
                      key={i}
                      className={animClass}
                      data-active={isActive}
                      style={{
                        fontSize: isActive ? lyricFontSize * 1.25 : lyricFontSize * 0.95,
                        fontWeight: 900,
                        padding: `${lyricFontSize * lyricLineGap * 0.9}px 0`,
                        cursor: 'pointer',
                        textTransform: lyricUppercase ? 'uppercase' : 'none',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        ...anim.style
                      }}
                      onClick={() => seek(line.time)}
                    >
                      {line.text || '• • •'}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Fullscreen Controls Bar */}
          <div className="fullscreen-controls-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                className={`sp-heart-btn ${isCurrentLiked ? 'liked' : ''}`}
                onClick={() => toggleLikeTrack(currentTrack.id)}
                title="Like Track"
              >
                <Heart size={18} fill={isCurrentLiked ? 'var(--accent)' : 'none'} />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                maxWidth: 640
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 6 }}>
                <button
                  className="sp-btn-icon"
                  data-active={shuffleOn}
                  onClick={() => setShuffleOn((v) => !v)}
                  title="Shuffle"
                >
                  <Shuffle size={16} />
                </button>
                <button className="sp-btn-icon" onClick={handlePrev} title="Previous">
                  <SkipBack size={20} />
                </button>
                <button className="sp-play-btn" onClick={togglePlay} title="Play/Pause">
                  {isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
                  )}
                </button>
                <button className="sp-btn-icon" onClick={handleNext} title="Next">
                  <SkipForward size={20} />
                </button>
                <button
                  className="sp-btn-icon"
                  data-active={repeatMode !== 'off'}
                  onClick={() =>
                    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'))
                  }
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
              </div>
              <div className="sp-timeline" style={{ width: '100%' }}>
                <span className="sp-time">{formatTime(currentTime)}</span>
                <div
                  ref={fullscreenProgressRef}
                  className="sp-scrub-track"
                  onClick={(e) => handleSeekAt(e, fullscreenProgressRef)}
                >
                  <div className="sp-scrub-bg">
                    <div className="sp-scrub-fill" style={{ width: `${progress * 100}%` }} />
                    <div className="sp-scrub-thumb" style={{ left: `${progress * 100}%` }} />
                  </div>
                </div>
                <span className="sp-time">{formatTime(duration)}</span>
              </div>
            </div>
            <div className="sp-vol-group">
              <button className="sp-btn-icon" onClick={toggleMute} title="Mute/Unmute">
                {isMuted || sliderVal === 0 ? (
                  <VolumeX size={18} />
                ) : sliderVal < 0.5 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                className="sp-vol-slider"
                value={isMuted ? 0 : sliderVal}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* FULL-RES COVER ART MODAL */}
      {showCoverModal && currentTrack?.cover && (
        <div className="modal-overlay" onClick={() => setShowCoverModal(false)}>
          <div
            style={{
              position: 'relative',
              maxWidth: 'min(500px, 85vw)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
              animation: 'fadeInSlide 0.25s cubic-bezier(0.16,1,0.3,1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentTrack.cover}
              alt=""
              style={{ width: '100%', display: 'block', height: 'auto' }}
            />
            <button
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setShowCoverModal(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* UPLOAD / IMPORT MODAL */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                Add Tracks
                {isParsing
                  ? ' — scanning…'
                  : pendingUploads.length > 0
                    ? ` (${pendingUploads.length} in queue)`
                    : ''}
              </h3>
              <button className="btn-plain" onClick={() => setIsUploadModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ gridColumn: '1 / -1', padding: 20, overflowY: 'auto' }}>
                <div
                  style={{
                    border: `2px dashed ${isDragOver ? 'var(--accent)' : 'rgba(128,128,128,0.35)'}`,
                    borderRadius: 12,
                    padding: '26px 20px',
                    textAlign: 'center',
                    marginBottom: pendingUploads.length > 0 ? 20 : 0,
                    background: isDragOver ? 'rgba(128,128,128,0.12)' : 'transparent',
                    transition: 'border-color .2s, background .2s'
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 14 }}>
                    {isDragOver ? 'Drop to add songs' : 'Drop audio files or a folder here'}
                  </p>
                  <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    MP3 · FLAC · WAV · M4A · OGG · AAC · AIFF
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleFileSelect}
                      disabled={isParsing}
                    >
                      <Plus size={14} /> Add Songs
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={handleFolderSelect}
                      disabled={isParsing}
                    >
                      <FolderPlus size={14} /> Add Folder
                    </button>
                  </div>
                  {isParsing && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                      Parsing audio metadata…
                    </div>
                  )}
                </div>

                {pendingUploads.length > 0 && (
                  <>
                    <div
                      className="modal-list"
                      style={{
                        border: '1px solid rgba(128,128,128,0.1)',
                        borderRadius: 10,
                        marginBottom: 16,
                        maxHeight: 180,
                        overflowY: 'auto',
                        padding: 8
                      }}
                    >
                      {pendingUploads.map((t, i) => (
                        <div
                          key={i}
                          className="modal-list-item"
                          data-active={editingIndex === i}
                          onClick={() => setEditingIndex(i)}
                        >
                          <span
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {t.title || t.filename}
                          </span>
                          <button
                            className="btn-plain"
                            style={{ padding: 2 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              removePendingTrack(i)
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div
                          style={{
                            width: 120,
                            height: 120,
                            background: 'var(--card-bg)',
                            borderRadius: 10,
                            overflow: 'hidden'
                          }}
                        >
                          {pendingUploads[editingIndex]?.cover ? (
                            <img
                              src={pendingUploads[editingIndex].cover}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              alt=""
                            />
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                height: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: 11
                              }}
                            >
                              NO ART
                            </div>
                          )}
                        </div>
                        <button
                          className="btn-ghost"
                          style={{ padding: '6px 10px', fontSize: 10 }}
                          onClick={handleSelectCover}
                        >
                          CHANGE ART
                        </button>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="lbl-caps">Title</label>
                        <input
                          className="field"
                          style={{ marginBottom: 12 }}
                          value={pendingUploads[editingIndex]?.title || ''}
                          onChange={(e) =>
                            updatePendingTrack(editingIndex, 'title', e.target.value)
                          }
                        />
                        <label className="lbl-caps">Artist</label>
                        <input
                          className="field"
                          style={{ marginBottom: 12 }}
                          value={pendingUploads[editingIndex]?.artist || ''}
                          onChange={(e) =>
                            updatePendingTrack(editingIndex, 'artist', e.target.value)
                          }
                        />
                        <label className="lbl-caps">Album</label>
                        <input
                          className="field"
                          value={pendingUploads[editingIndex]?.album || ''}
                          onChange={(e) =>
                            updatePendingTrack(editingIndex, 'album', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {lyricStatus}
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        disabled={isFetchingLyrics}
                        onClick={() => fetchLyricsApi(pendingUploads[editingIndex])}
                      >
                        {isFetchingLyrics ? 'Fetching...' : 'Fetch Metadata & Lyrics'}
                      </button>
                    </div>
                    <textarea
                      className="field"
                      style={{
                        height: 120,
                        resize: 'none',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 11
                      }}
                      value={pendingUploads[editingIndex]?.lyrics || ''}
                      onChange={(e) => updatePendingTrack(editingIndex, 'lyrics', e.target.value)}
                      placeholder="[00:00.00] Synced LRC lyrics..."
                    />
                  </>
                )}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-plain" onClick={() => setIsUploadModalOpen(false)}>
                {pendingUploads.length > 0 ? 'Cancel' : 'Close'}
              </button>
              {pendingUploads.length > 0 && (
                <button className="btn btn-primary" onClick={handleSaveUploads}>
                  <Check size={14} /> Upload {pendingUploads.length} track
                  {pendingUploads.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD TRACKS TO PLAYLIST MODAL */}
      {isAddTracksOpen && selectedPlaylist && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                Add tracks to &ldquo;{selectedPlaylist.name}&rdquo;
              </h3>
              <button className="btn-plain" onClick={() => setIsAddTracksOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 16, borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
              <div className="search-pill" style={{ maxWidth: '100%' }}>
                <Search size={15} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search your library..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                />
              </div>
            </div>
            <div style={{ overflowY: 'auto', padding: 10, maxHeight: 420 }}>
              {filteredAddCandidates.length === 0 ? (
                <div className="pl-empty" style={{ border: 'none', padding: 30 }}>
                  No matching songs from your library.
                </div>
              ) : (
                filteredAddCandidates.map((track) => {
                  const on = addSelection.has(track.id)
                  return (
                    <div
                      key={track.id}
                      className="add-grid"
                      data-active={on}
                      onClick={() => toggleAddSelection(track.id)}
                    >
                      <div className={`add-check ${on ? 'on' : ''}`}>
                        {on && <Check size={12} />}
                      </div>
                      <div className="t-title">
                        <div className="art-thumb">
                          {track.cover && <img src={track.cover} alt="" />}
                        </div>
                        <span>{track.title}</span>
                      </div>
                      <div className="t-sub">{track.artist || '—'}</div>
                      <div className="t-sub">{track.album || '—'}</div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="modal-foot">
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 'auto' }}>
                {addSelection.size} selected
              </span>
              <button className="btn-plain" onClick={() => setIsAddTracksOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={addSelection.size === 0}
                onClick={handleConfirmAddTracks}
              >
                Add {addSelection.size > 0 ? `(${addSelection.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EQUALIZER MODAL */}
      <EqualizerModal
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        eqBands={eqBands}
        eqPreamp={eqPreamp}
        currentPreset={currentEQPreset}
        onBandChange={setEQBandGain}
        onPreampChange={setPreampGain}
        onPresetSelect={(presetId) => {
          applyEQPreset(presetId)
          addToast(
            `EQ preset: ${EQ_PRESETS.find((p) => p.id === presetId)?.name}`,
            undefined,
            'info'
          )
        }}
      />

      {/* SLEEP TIMER MODAL */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        sleepTimer={sleepTimer}
        onStartTimer={(mins, mode, fade) => {
          startSleepTimer(mins, mode, fade)
          addToast(
            `Sleep timer started`,
            mode === 'end_of_track' ? 'Stops at end of track' : `Stops in ${mins} minutes`,
            'info'
          )
        }}
        onCancelTimer={cancelSleepTimer}
      />

      {/* TAG EDITOR MODAL */}
      <TagEditorModal
        track={tagEditorTrack}
        isOpen={!!tagEditorTrack}
        onClose={() => setTagEditorTrack(null)}
        onSave={handleSaveTagEdit}
        onRevealInExplorer={(fp) => window.api?.revealInExplorer && window.api.revealInExplorer(fp)}
      />

      {/* MANUAL LYRICS MODAL */}
      <ManualLyricsModal
        track={currentTrack}
        isOpen={isManualLyricsOpen}
        onClose={() => setIsManualLyricsOpen(false)}
        onApplyLyrics={(lrc) => {
          if (currentTrack) persistLyrics(currentTrack, lrc)
          addToast('Lyrics applied', undefined, 'success')
        }}
      />

      {/* ABOUT OMUS MODAL */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        openExternal={(url) => window.api?.openExternal && window.api.openExternal(url)}
      />

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
