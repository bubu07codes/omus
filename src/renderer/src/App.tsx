import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useTransition,
  useDeferredValue
} from 'react'
import {
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
  Clock3,
  Sparkles,
  Heart,
  Maximize2,
  Minimize2,
  MonitorPlay,
  RefreshCw,
  Pencil,
  EllipsisVertical,
  Download,
  ImagePlus,
  ArrowDownAZ,
  Sliders,
  Moon,
  Upload,
  GripVertical,
  Video,
  Flame,
  TrendingUp,
  ListMusic,
  Settings2,
  Library,
  Palette,
  Plug,
  Keyboard,
  Code2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronUp,
  ChevronDown,
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
import { isVideoFile } from './constants/media'
import { PlaylistCoverArt } from './components/Shared/PlaylistCoverArt'
import { TrackContextMenu, TrackMenuHandlers } from './components/Shared/TrackContextMenu'
import {
  LibraryTableRow,
  LibraryCardRow,
  LibraryGroupRow,
  QueueCard
} from './components/TrackRows'
import { LyricLine } from './components/LyricLine'
import { TitleBar } from './components/TitleBar'
import { GlobalSearch } from './components/GlobalSearch'
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
  fluidBgMode?: 'aurora' | 'waves' | 'prism' | 'nebula'
  fullscreenMode?: 'normal' | 'cover'
  fullscreenAmbience?: boolean
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
  playCounts?: Record<string, number>
  recentlyPlayed?: string[]
  railCollapsed?: boolean
  railWidth?: number
  globalSearchEnabled?: boolean
  uiScale?: number
}

// Categories shown in the Settings sidebar. Order matches the on-page flow.
const SETTINGS_CATS: {
  id: string
  label: string
  Icon: React.ComponentType<{ size?: number | string }>
}[] = [
  { id: 'lyrics', label: 'Lyrics', Icon: Mic2 },
  { id: 'audio', label: 'Sound & Vision', Icon: Sliders },
  { id: 'fullscreen', label: 'Fullscreen', Icon: MonitorPlay },
  { id: 'ambience', label: 'Ambience', Icon: Sparkles },
  { id: 'integrations', label: 'Integrations', Icon: Plug },
  { id: 'appearance', label: 'Appearance', Icon: Palette },
  { id: 'playback', label: 'Playback', Icon: Play },
  { id: 'library', label: 'Library', Icon: Library },
  { id: 'shortcuts', label: 'Shortcuts', Icon: Keyboard },
  { id: 'advanced', label: 'Advanced', Icon: Code2 }
]

function FluidBackgroundLayer({
  cover,
  opacity,
  blur,
  saturation,
  duration,
  softScrim,
  mode = 'aurora'
}: {
  cover?: string | null
  opacity: number
  blur: number
  saturation: number
  duration: string
  softScrim?: boolean
  mode?: 'aurora' | 'waves' | 'prism' | 'nebula'
}) {
  const blurPx = Math.min(blur, 48)
  const satPct = Math.min(saturation, 200)
  const filter = `blur(${blurPx}px) saturate(${satPct}%)`
  // The aurora orbs are huge and come with cover art, so they get a gentler
  // container opacity. The pure-theme modes (waves/prism/nebula) look too
  // faint at that level, so give them a visible bump.
  const fillOpacity = mode === 'aurora' ? opacity : Math.min(1, opacity * 1.4)
  // Motion speed (seconds per full animation cycle) parsed from the speed setting.
  const speedSecs = parseFloat(duration) || 22

  // Album-art based pieces: each mode renders deformed, heavily-blurred crops
  // of the cover art. When there's no cover we fall back to the class-level
  // gradient backgrounds defined in CSS.
  const artBg = cover
    ? {
        backgroundImage: `url(${cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : undefined

  // Same cover, different crop focus per piece so the layers don't stack
  // identically — keeps the backdrop organic once blurred.
  const artAt = (pos: string) => (cover ? { ...artBg, backgroundPosition: pos } : undefined)

  const renderLayers = () => {
    if (mode === 'waves') {
      return (
        <div className="fb-waves">
          <div
            className="fb-wave fb-wave-1"
            style={{ ...artAt('center 40%'), animationDuration: `${Math.round(speedSecs * 0.9 * 10) / 10}s` }}
          />
          <div
            className="fb-wave fb-wave-2"
            style={{ ...artAt('20% 55%'), animationDuration: `${Math.round(speedSecs * 1.2 * 10) / 10}s` }}
          />
          <div
            className="fb-wave fb-wave-3"
      style={{ ...artAt('75% 45%'), animationDuration: `${Math.round(speedSecs * 1.5 * 10) / 10}s` }}
          />
          <div
            className="fb-wave fb-wave-4"
            style={{ ...artAt('50% 70%'), animationDuration: `${Math.round(speedSecs * 1.8 * 10) / 10}s` }}
          />
        </div>
      )
    }
    if (mode === 'prism') {
      return (
        <div className="fb-prism">
          <div
            className="fb-prism-piece fb-prism-1"
            style={{ ...artAt('30% 45%'), animationDuration: `${Math.round(speedSecs * 0.9 * 10) / 10}s` }}
          />
          <div
            className="fb-prism-piece fb-prism-2"
            style={{ ...artAt('65% 60%'), animationDuration: `${Math.round(speedSecs * 1.2 * 10) / 10}s` }}
          />
          <div
            className="fb-prism-piece fb-prism-3"
            style={{ ...artAt('45% 35%'), animationDuration: `${Math.round(speedSecs * 1.5 * 10) / 10}s` }}
          />
        </div>
      )
    }
    if (mode === 'nebula') {
      return (
        <div className="fb-nebula">
          <div
            className="fb-blob fb-blob-1"
            style={{ ...artAt('30% 45%'), animationDuration: `${Math.round(speedSecs * 0.9 * 10) / 10}s` }}
          />
          <div
            className="fb-blob fb-blob-2"
            style={{ ...artAt('65% 60%'), animationDuration: `${Math.round(speedSecs * 1.2 * 10) / 10}s` }}
          />
          <div
            className="fb-blob fb-blob-3"
            style={{ ...artAt('45% 35%'), animationDuration: `${Math.round(speedSecs * 1.5 * 10) / 10}s` }}
          />
        </div>
      )
    }
    // Aurora — the classic morphing cover-art orbs (default).
    if (cover) {
      return (
        <>
          <div
            className="fluid-orb orb-1"
            style={{
              backgroundImage: `url(${cover})`,
              animation: `fluidMorph1 ${duration} ease-in-out infinite`
            }}
          />
          <div
            className="fluid-orb orb-2"
            style={{
              background: `radial-gradient(circle, var(--accent) 0%, var(--card-bg) 70%, transparent 100%)`,
              animation: `fluidMorph2 ${parseFloat(duration) * 1.2}s ease-in-out infinite reverse`
            }}
          />
          <div
            className="fluid-orb orb-3"
            style={{
              background: `radial-gradient(circle, var(--sidebar-bg) 0%, var(--accent) 60%, transparent 100%)`,
              animation: `fluidMorph3 ${parseFloat(duration) * 0.8}s ease-in-out infinite`
            }}
          />
        </>
      )
    }
    return (
      <>
        <div
          className="fluid-orb orb-1"
          style={{
            background: `radial-gradient(circle, var(--accent) 0%, var(--card-bg) 70%, transparent 100%)`,
            animation: `fluidMorph1 ${duration} ease-in-out infinite`
          }}
        />
        <div
          className="fluid-orb orb-2"
          style={{
            background: `radial-gradient(circle, var(--sidebar-bg) 0%, var(--accent) 60%, transparent 100%)`,
            animation: `fluidMorph2 ${parseFloat(duration) * 1.2}s ease-in-out infinite reverse`
          }}
        />
      </>
    )
  }

  return (
    <>
      <div
        className="fluid-bg-container"
        style={{
          opacity: fillOpacity,
          filter,
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        {renderLayers()}
      </div>
      <div
        className="fluid-scrim"
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)`,
          opacity: softScrim ? 0.4 : 0.6
        }}
      />
    </>
  )
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
  const [view, setView] = useState<
    'home' | 'library' | 'playlists' | 'queue' | 'lyrics' | 'settings'
  >('home')
  const [previousView, setPreviousView] = useState<
    'home' | 'library' | 'playlists' | 'queue' | 'settings'
  >('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [libraryLayout, setLibraryLayout] = useState<'grid' | 'table' | 'group'>('table')
  const [libraryDensity, setLibraryDensity] = useState<'comfortable' | 'compact'>('comfortable')
  // Albums view: which album groups are collapsed (key → collapsed)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // ---- Sidebar (left rail) state: collapsible + resizable ----
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [railWidth, setRailWidth] = useState(84)
  const [railResizing, setRailResizing] = useState(false)

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

  // ---- Play history (lightweight, persisted via settings) ----
  // playCounts: how many times each track has been played → drives "Most played"
  // and "Top artists" on the Home screen. recentlyPlayed: a capped, most-recent-
  // first trail of track ids → the "Continue listening" hero and recently rail.
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({})
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([])
  // In-Home album / artist detail navigation (e.g. clicking an album tile on
  // the Home grid swaps the grid for this album's / artist's dedicated view).
  const [homeDetail, setHomeDetail] = useState<
    { kind: 'album'; key: string } | { kind: 'artist'; name: string } | null
  >(null)
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
  const [fluidBgMode, setFluidBgMode] = useState<'aurora' | 'waves' | 'prism' | 'nebula'>(
    'aurora'
  )

  // ---- Fullscreen preferences ----
  const [fullscreenMode, setFullscreenMode] = useState<'normal' | 'cover'>('normal')
  const [fullscreenAmbience, setFullscreenAmbience] = useState(false)

  // ---- Modals / Overlays ----
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [isFullscreenCover, setIsFullscreenCover] = useState(false)
  // Fullscreen "chrome" (top close bar, visualizer, bottom playback controls)
  // is hidden at rest — only the cover + info + lyrics idle on screen. Any
  // cursor movement wakes it, and it fades again after a few seconds of rest.
  const [fsUiVisible, setFsUiVisible] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEqOpen, setIsEqOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const [tagEditorTrack, setTagEditorTrack] = useState<Track | null>(null)
  const [isManualLyricsOpen, setIsManualLyricsOpen] = useState(false)
  const [lyricsOptionsOpen, setLyricsOptionsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [activeSettingsCat, setActiveSettingsCat] = useState('lyrics')

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
  const lyricsTrackRef = useRef<HTMLDivElement>(null)
  const fullscreenLyricsTrackRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // Latest active lyric line for effects that must read it without re-running
  // (e.g. the fullscreen ResizeObserver which re-centers on layout changes).
  const activeLyricIndexRef = useRef<number>(-1)
  // Timer that hides the fullscreen playback chrome after the cursor rests.
  const fsHideTimerRef = useRef<number | null>(null)

  // ---- Context menu ----
  // The shared track context menu (right-click on any track, in any view).
  // `onPlay` is captured per-view so "Play Now" always uses the correct source
  // list; everything else lives inside the reusable <TrackContextMenu />.
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    track: Track
    fromPlaylist?: boolean
    onPlay: () => void
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

  // Toggle for the global search bar shown in the window title bar.
  const [globalSearchEnabled, setGlobalSearchEnabled] = useState(true)

  // Overall UI scale (roughly 70% – 160%). Applied natively via Electron's
  // webFrame.setZoomFactor, so every unit scales together. Ranges are clamped.
  const [uiScale, setUiScale] = useState<number>(1.0)
  const clampUiScale = (v: number): number =>
    Math.min(1.6, Math.max(0.7, Math.round(v * 100) / 100))
  const changeUiScale = useCallback(
    (delta: number): void => setUiScale((prev) => clampUiScale(prev + delta)),
    []
  )

  const selectedFontPreset = PRESET_FONTS.find((f) => f.name === currentFont)
  const activeFontFamily = selectedFontPreset
    ? `"${selectedFontPreset.family}", sans-serif`
    : `"${currentFont}", sans-serif`
  const currentAnim = PRESET_ANIMATIONS.find((a) => a.id === animId) ?? PRESET_ANIMATIONS[1]
  const animOff = currentAnim.id === 'off'
  const uiTransition = currentAnim.uiTransition

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

  // ---- Toast ----
  const { toasts, addToast, removeToast } = useToast()
  // Deferred search + transitioned view switches: heavy UI updates happen in a
  // lower-priority transition instead of blocking paint inside the click handler.
  const [, startTransition] = useTransition()
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const navigateView = useCallback((v: Parameters<typeof setView>[0]) => {
    startTransition(() => setView(v))
  }, [])

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
    setOffsetMs,
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

  // Butter-smooth lyric centering. Instead of snapping scrollTop (which "chops"),
  // we translate an inner .lyrics-track with a CSS transform — the compositor
  // glides it at 60fps with zero layout cost. The track gets dynamic top/bottom
  // padding (~42% of the viewport height) so the first and last lines can always
  // be centered and never get pinned under the fade mask or clipped. Works for
  // both the in-app and the fullscreen lyric panels. `instant` skips the glide
  // (used when opening fullscreen / switching tracks / resizing).
  const scrollLyricToCenter = useCallback(
    (
      viewport: HTMLDivElement | null,
      track: HTMLDivElement | null,
      index: number,
      instant = false
    ): void => {
      if (!viewport || !track) return
      const el = track.children[index] as HTMLElement | undefined
      if (!el) return

      const padY = Math.round(viewport.clientHeight * 0.42)
      track.style.paddingTop = `${padY}px`
      track.style.paddingBottom = `${padY}px`

      const target = el.offsetTop - (viewport.clientHeight - el.clientHeight) / 2
      const max = Math.max(0, track.scrollHeight - viewport.clientHeight)
      const clamped = Math.max(0, Math.min(max, target))

      if (instant) {
        track.style.transition = 'none'
        track.style.transform = `translateY(${-clamped}px)`
        void track.offsetHeight // force reflow so the next move animates again
        track.style.transition = ''
      } else {
        track.style.transform = `translateY(${-clamped}px)`
      }
    },
    []
  )

  // ----- Navigation & Lyrics auto-scroll -----
  useEffect(() => {
    if (activeLyricIndex < 0) return
    if (view === 'lyrics') {
      scrollLyricToCenter(lyricsContainerRef.current, lyricsTrackRef.current, activeLyricIndex)
    }
    if (isFullscreenCover) {
      scrollLyricToCenter(
        fullscreenLyricsRef.current,
        fullscreenLyricsTrackRef.current,
        activeLyricIndex
      )
    }
  }, [activeLyricIndex, view, isFullscreenCover, scrollLyricToCenter])

  // Initial scroll when fullscreen opens — run ONLY on open/close, not on every
  // line change. (Including activeLyricIndex in deps here made this cancel the
  // smooth glide with an instant snap on each new line, which is why fullscreen
  // looked choppy while the normal view glided.) Read the live index via the ref
  // so the snap only happens once, when the panel mounts.
  useEffect(() => {
    if (isFullscreenCover && activeLyricIndexRef.current >= 0) {
      scrollLyricToCenter(
        fullscreenLyricsRef.current,
        fullscreenLyricsTrackRef.current,
        activeLyricIndexRef.current,
        true
      )
    }
  }, [isFullscreenCover, scrollLyricToCenter])

  // Reset the lyric panels to the top the instant a new track loads. Without
  // this the panel stays wherever the previous song left it while the first
  // line of the new song hasn't become active yet (instrumental intros, etc.).
  // Re-applies the centering padding so the first line can still center later.
  useEffect(() => {
    const pairs: [HTMLDivElement | null, HTMLDivElement | null][] = [
      [lyricsContainerRef.current, lyricsTrackRef.current],
      [fullscreenLyricsRef.current, fullscreenLyricsTrackRef.current]
    ]
    for (const [viewport, track] of pairs) {
      if (!viewport || !track) continue
      const padY = Math.round(viewport.clientHeight * 0.42)
      track.style.paddingTop = `${padY}px`
      track.style.paddingBottom = `${padY}px`
      track.style.transition = 'none'
      track.style.transform = 'translateY(0px)'
      void track.offsetHeight
      track.style.transition = ''
    }
  }, [currentTrack?.id])

  // Keep the ref in sync so resize-driven re-centering reads the live index.
  useEffect(() => {
    activeLyricIndexRef.current = activeLyricIndex
  }, [activeLyricIndex])

  // Never let a layout change (window/fullscreen resize, font load, lyric font
  // setting tweaks) leave the active line clipped under the fade masks or the
  // panel edges — re-center instantly whenever a mounted panel's box changes.
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const idx = activeLyricIndexRef.current
      if (idx < 0) return
      if (view === 'lyrics') {
        scrollLyricToCenter(lyricsContainerRef.current, lyricsTrackRef.current, idx, true)
      }
      if (isFullscreenCover) {
        scrollLyricToCenter(
          fullscreenLyricsRef.current,
          fullscreenLyricsTrackRef.current,
          idx,
          true
        )
      }
    })
    if (lyricsContainerRef.current) ro.observe(lyricsContainerRef.current)
    if (fullscreenLyricsRef.current) ro.observe(fullscreenLyricsRef.current)
    return () => ro.disconnect()
  }, [view, isFullscreenCover, scrollLyricToCenter])

  // ---- Fullscreen auto-hiding playback chrome ----
  const armFsHideTimer = (): void => {
    if (fsHideTimerRef.current) window.clearTimeout(fsHideTimerRef.current)
    fsHideTimerRef.current = window.setTimeout(() => setFsUiVisible(false), 3200)
  }

  // Wake the chrome on cursor movement: show it immediately and re-arm the hide
  // timer so it only disappears once the cursor stays still for a few seconds.
  const wakeFsControls = (): void => {
    setFsUiVisible(true)
    armFsHideTimer()
  }

  // Pause the hide-timer while the cursor hovers directly over the chrome bars.
  const holdFsControls = (): void => {
    if (fsHideTimerRef.current) {
      window.clearTimeout(fsHideTimerRef.current)
      fsHideTimerRef.current = null
    }
  }

  const releaseFsControls = (): void => {
    if (fsUiVisible) armFsHideTimer()
  }

  const clearFsHideTimer = (): void => {
    if (fsHideTimerRef.current) {
      window.clearTimeout(fsHideTimerRef.current)
      fsHideTimerRef.current = null
    }
  }

  // Opening / closing the fullscreen view resets its chrome so it always starts
  // hidden at rest and never leaks a pending hide-timer between sessions.
  const toggleFullscreen = (): void => {
    clearFsHideTimer()
    setFsUiVisible(false)
    setIsFullscreenCover((v) => !v)
  }

  const closeFullscreen = (): void => {
    clearFsHideTimer()
    setFsUiVisible(false)
    setIsFullscreenCover(false)
  }

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

  // Fetch lyrics for the current track and persist them (used by the lyrics
  // settings popover in the header of the lyrics view).
  const handleFetchCurrentLyrics = useCallback(() => {
    if (!currentTrack) return
    fetchLyricsFromOnline(currentTrack).then((lrc) => {
      if (lrc) persistLyrics(currentTrack, lrc)
    })
  }, [currentTrack, fetchLyricsFromOnline, persistLyrics])

  // ----- Per-track lyric offset persistence -----
  // The calibration offset is stored per track in the DB (tracks.lyrics_offset),
  // patched into the in-memory track lists, and restored when that track loads.
  const persistLyricOffset = useCallback((trackId: string, offsetMsValue: number) => {
    const safeOffset = Math.round(offsetMsValue) || 0
    const patch = (list: Track[]) =>
      list.map((t) => (t.id === trackId ? { ...t, lyrics_offset: safeOffset } : t))
    setLibrary(patch)
    setQueue(patch)
    setPlaylistTracks(patch)
    if (window.api?.updateTrackLyricOffset) window.api.updateTrackLyricOffset(trackId, safeOffset)
  }, [])

  // Adjust the live offset and immediately write the new value to the current
  // track's DB row + in-memory track objects. This runs in the click handler so
  // the value is saved before any subsequent track switch can happen, and it
  // closes over the fresh offsetMs/currentTrack from this render.
  const handleLyricOffset = (deltaMs: number): void => {
    const next = offsetMs + deltaMs
    setOffsetMs(next)
    if (currentTrack) persistLyricOffset(currentTrack.id, next)
  }

  const handleLyricOffsetReset = (): void => {
    setOffsetMs(0)
    if (currentTrack) persistLyricOffset(currentTrack.id, 0)
  }

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

  // Count every play and keep the recent trail. Called from the single choke
  // point that actually starts playback (loadAndPlayIndex), so manual plays,
  // skips, nexts and auto-advances all register — but startup resume does not.
  const recordPlay = useCallback((trackId: string): void => {
    setPlayCounts((prev) => ({ ...prev, [trackId]: (prev[trackId] || 0) + 1 }))
    setRecentlyPlayed((prev) => [trackId, ...prev.filter((id) => id !== trackId)].slice(0, 100))
  }, [])

  // ----- Load track at index -----
  const loadAndPlayIndex = useCallback(
    async (index: number, customQueue?: Track[]) => {
      const targetQueue = customQueue || queue
      if (index < 0 || index >= targetQueue.length) return
      if (customQueue) setQueue(customQueue)

      const track = targetQueue[index]
      setCurrentIndex(index)
      setRawLyrics(track.lyrics || '')
      setOffsetMs(track.lyrics_offset || 0)
      maybeAutoFetchLyrics(track)
      recordPlay(track.id)

      await playTrack(track)
    },
    [queue, playTrack, setRawLyrics, setOffsetMs, maybeAutoFetchLyrics, recordPlay]
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
      setOffsetMs(track.lyrics_offset || 0)
      maybeAutoFetchLyrics(track)

      // Load the source and seek into the live audio engine without
      // auto-playing (resumes later on user play gesture).
      await cue(track, offsetSecs)
    },
    [queue, setRawLyrics, setOffsetMs, cue, maybeAutoFetchLyrics]
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
            if (typeof saved.uiScale === 'number') setUiScale(saved.uiScale)
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
            if (saved.fluidBgMode) setFluidBgMode(saved.fluidBgMode)
            if (saved.fullscreenMode) setFullscreenMode(saved.fullscreenMode)

            if (typeof saved.fullscreenAmbience === 'boolean')
              setFullscreenAmbience(saved.fullscreenAmbience)
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
            if (saved.playCounts && typeof saved.playCounts === 'object')
              setPlayCounts((prev) => ({ ...prev, ...saved.playCounts }))
            if (Array.isArray(saved.recentlyPlayed))
              setRecentlyPlayed(
                saved.recentlyPlayed
                  .filter((id): id is string => typeof id === 'string')
                  .slice(0, 100)
              )
            if (typeof saved.railCollapsed === 'boolean')
              setRailCollapsed(saved.railCollapsed)
            if (typeof saved.railWidth === 'number') setRailWidth(saved.railWidth)
            if (typeof saved.globalSearchEnabled === 'boolean')
              setGlobalSearchEnabled(saved.globalSearchEnabled)

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
      navigateView(previousView || 'library')
    } else {
      setPreviousView(view as 'home' | 'library' | 'playlists' | 'queue' | 'settings')
      navigateView('lyrics')
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
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        navigateView(view === 'settings' ? previousView || 'library' : 'settings')
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        navigateView(view === 'queue' ? 'library' : 'queue')
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMute()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        if (fsHideTimerRef.current) {
          window.clearTimeout(fsHideTimerRef.current)
          fsHideTimerRef.current = null
        }
        setFsUiVisible(false)
        setIsFullscreenCover((v) => !v)
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setIsEqOpen((v) => !v)
      } else if (e.key === 'Escape') {
        if (isFullscreenCover) {
          if (fsHideTimerRef.current) {
            window.clearTimeout(fsHideTimerRef.current)
            fsHideTimerRef.current = null
          }
          setFsUiVisible(false)
          setIsFullscreenCover(false)
        }
        if (isEqOpen) setIsEqOpen(false)
        if (isSleepTimerOpen) setIsSleepTimerOpen(false)
        if (contextMenu) setContextMenu(null)
        if (lyricsOptionsOpen) setLyricsOptionsOpen(false)
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
    contextMenu,
    lyricsOptionsOpen
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
      fluidBgMode,
      fullscreenMode,
      fullscreenAmbience,
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
      lastPositionSecs: Math.floor(currentTime),
      playCounts,
      recentlyPlayed,
      railCollapsed,
      railWidth,
      globalSearchEnabled,
      uiScale
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
      fluidBgMode,
      fullscreenMode,
      fullscreenAmbience,
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
      currentTime,
      playCounts,
      recentlyPlayed,
      railCollapsed,
      railWidth,
      globalSearchEnabled,
      uiScale
    ]
  )

  const buildSettingsRef = useRef(buildSettings)
  useEffect(() => {
    buildSettingsRef.current = buildSettings
  })

  // Apply the UI scale to Electron's webFrame so the whole interface scales.
  useEffect(() => {
    if (window.api?.setZoomFactor) window.api.setZoomFactor(uiScale)
  }, [uiScale])

  // Ctrl + mouse wheel anywhere zooms the interface up/down and persists.
  useEffect(() => {
    const onWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const dy = (e as unknown as { deltaY?: number }).deltaY ?? 0
      changeUiScale(dy < 0 ? 0.05 : -0.05)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [changeUiScale])

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
    fluidBgMode,
    fullscreenMode,
    fullscreenAmbience,
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
    playCounts,
    recentlyPlayed,
    uiScale
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

  // ---- Music video mirror (fullscreen) ----
  // Music videos play through the regular audio engine (EQ, volume, visualizer
  // all keep working). The fullscreen <video> is therefore rendered *muted* and
  // acts as a picture-only mirror that stays frame-synced to the audio engine.
  const isVideoTrack = currentTrack ? isVideoFile(currentTrack.filepath) : false
  const videoSrc =
    isVideoTrack && currentTrack && window.api?.getMediaUrl
      ? window.api.getMediaUrl(currentTrack.filepath)
      : null

  useEffect(() => {
    if (!isFullscreenCover || !isVideoTrack || !videoSrc) return
    const video = videoRef.current
    if (!video) return

    // Snap to the audio engine's position the moment the picture is ready.
    const snapToAudio = (): void => {
      const audioT = currentTimeRef.current || 0
      const maxT =
        typeof video.duration === 'number' && isFinite(video.duration) ? video.duration : audioT
      try {
        video.currentTime = Math.max(0, Math.min(maxT, audioT))
      } catch {
        /* not seekable yet */
      }
    }

    if (video.readyState >= 1) snapToAudio()
    else video.addEventListener('loadedmetadata', snapToAudio, { once: true })

    // Periodic drift correction + play/pause mirroring. Only nudges the video
    // when it drifts more than a small amount so it never jitters frame-to-frame.
    const interval = setInterval(() => {
      if (!video) return
      if (isPlaying) {
        const p = video.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      } else {
        video.pause()
      }
      const audioT = currentTimeRef.current || 0
      try {
        if (Math.abs(video.currentTime - audioT) > 0.35) {
          const maxT =
            typeof video.duration === 'number' && isFinite(video.duration) ? video.duration : audioT
          video.currentTime = Math.max(0, Math.min(maxT, audioT))
        }
      } catch {
        /* ignore transient seek errors */
      }
    }, 350)

    return () => {
      clearInterval(interval)
      video.removeEventListener('loadedmetadata', snapToAudio)
      video.pause()
    }
  }, [isFullscreenCover, isVideoTrack, videoSrc, currentTrack, isPlaying])

  // Snap the picture instantly on seeks/scrubs, instead of waiting for the next
  // drift-correction tick (which would show a stale frame for up to 350ms)..
  useEffect(() => {
    if (!isFullscreenCover || !isVideoTrack) return
    const video = videoRef.current
    if (!video) return
    const audioT = currentTimeRef.current || 0
    try {
      if (Math.abs((video.currentTime || 0) - audioT) > 0.5) {
        const maxT =
          typeof video.duration === 'number' && isFinite(video.duration) ? video.duration : audioT
        video.currentTime = Math.max(0, Math.min(maxT, audioT))
      }
    } catch {
      /* not seekable yet */
    }
  }, [currentTime, isFullscreenCover, isVideoTrack])
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

  const refreshPlaylistCovers = useCallback(() => {
    window.api.getPlaylistCovers().then((m) => setPlaylistCovers(m || {}))
  }, [])

  // ---- Track deletion ----
  const handleDeleteTrack = useCallback(
    async (trackId: string, e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (confirmBeforeDelete && !window.confirm('Delete this track? This cannot be undone.'))
        return
      const success = await window.api.deleteTrack(trackId)
      if (success) {
        setLibrary((prev) => prev.filter((t) => t.id !== trackId))
        setQueue((prev) => prev.filter((t) => t.id !== trackId))
        setPlaylistTracks((prev) => prev.filter((t) => t.id !== trackId))
        refreshPlaylistCovers()
        addToast('Track deleted', undefined, 'info')
      }
    },
    [confirmBeforeDelete, refreshPlaylistCovers, addToast]
  )

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

  // ---- Global search (title-bar) actions ----
  const handleGlobalPlayTrack = useCallback(
    (t: Track) => {
      void loadAndPlayIndex(0, [t])
    },
    [loadAndPlayIndex]
  )

  const handleGlobalOpenAlbum = useCallback(
    (key: string) => {
      setHomeDetail({ kind: 'album', key })
      navigateView('home')
    },
    [navigateView]
  )

  const handleGlobalOpenArtist = useCallback(
    (name: string) => {
      setHomeDetail({ kind: 'artist', name })
      navigateView('home')
    },
    [navigateView]
  )

  const handleGlobalOpenPlaylist = useCallback(
    (id: string) => {
      void handleSelectPlaylist(id)
      navigateView('playlists')
    },
    [handleSelectPlaylist, navigateView]
  )

  const handleGlobalSearchLibrary = useCallback(
    (q: string) => {
      setSearchQuery(q)
      navigateView('library')
    },
    [navigateView]
  )

  // ---- Sidebar resize (drag the rail's right edge) ----
  const handleRailResizeStart = (e: React.PointerEvent): void => {
    e.preventDefault()
    setRailResizing(true)
    const startX = e.clientX
    const startW = railWidth
    const onMove = (ev: PointerEvent): void => {
      const w = Math.min(280, Math.max(72, startW + (ev.clientX - startX)))
      setRailWidth(w)
    }
    const onUp = (): void => {
      setRailResizing(false)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
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

  const handleAddTrackToPlaylist = useCallback(
    async (trackId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
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
    },
    [selectedPlaylistId, refreshPlaylistCovers, addToast]
  )

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

  const handleMoveQueueItem = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= queue.length) return
      const newQueue = [...queue]
      const [movedItem] = newQueue.splice(index, 1)
      newQueue.splice(targetIndex, 0, movedItem)
      setQueue(newQueue)
      if (currentIndex === index) setCurrentIndex(targetIndex)
      else if (currentIndex === targetIndex) setCurrentIndex(index)
    },
    [queue, currentIndex]
  )

  const handleRemoveFromQueue = useCallback(
    (index: number) => {
      const newQueue = queue.filter((_, i) => i !== index)
      setQueue(newQueue)
      if (currentIndex === index) {
        setCurrentIndex(null)
      } else if (currentIndex !== null && currentIndex > index) setCurrentIndex(currentIndex - 1)
    },
    [queue, currentIndex]
  )

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
  // Open the shared track context menu at the cursor for any track in any view.
  // Each view supplies its own `onPlay` closure (its source list + index), and
  // optionally `fromPlaylist` so the menu offers "Remove from Playlist".
  const openTrackMenu = useCallback(
    (
      e: React.MouseEvent,
      track: Track,
      onPlay: () => void,
      fromPlaylist = false
    ): void => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, track, onPlay, fromPlaylist })
    },
    []
  )

  // Stable row-level context-menu handlers (used by the memoized list rows).
  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, track: Track, list: Track[], index: number) => {
      openTrackMenu(e, track, () => loadAndPlayIndex(index, list))
    },
    [openTrackMenu, loadAndPlayIndex]
  )

  const handleQueueContextMenu = useCallback(
    (e: React.MouseEvent, track: Track, index: number) => {
      openTrackMenu(e, track, () => loadAndPlayIndex(index))
    },
    [openTrackMenu, loadAndPlayIndex]
  )

  // Used by the memoized grouped-library rows to end a drag cleanly.
  const handleDragRowEnd = useCallback(() => {
    setDragTrackId(null)
    setOverTrackId(null)
  }, [])

  // Handlers shared by every track context menu instance.
  const trackMenuHandlers: TrackMenuHandlers = {
    onPlayNext: (track) => {
      if (currentIndex !== null) {
        setQueue((prev) => {
          const next = [...prev]
          next.splice(currentIndex + 1, 0, track)
          return next
        })
      } else {
        setQueue((prev) => [track, ...prev])
        setCurrentIndex(0)
      }
      addToast('Playing next', track.title, 'info')
    },
    onAddToQueue: (track) => {
      setQueue((prev) => [...prev, track])
      addToast('Added to queue', track.title, 'info')
    },
    onEditTags: (track) => setTagEditorTrack(track),
    onRevealInExplorer: (track) =>
      window.api?.revealInExplorer && window.api.revealInExplorer(track.filepath),
    onRemoveFromPlaylist: selectedPlaylistId
      ? (track) => {
          void handleRemoveFromPlaylist(selectedPlaylistId, track.id)
        }
      : undefined,
    onDeleteFromLibrary: (track) => {
      void handleDeleteTrack(track.id)
    }
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
    setFluidBgMode('aurora')
    setFullscreenMode('normal')
    setFullscreenAmbience(false)
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
    setPlayCounts({})
    setRecentlyPlayed([])
    setRailCollapsed(false)
    setRailWidth(84)
    setGlobalSearchEnabled(true)
    setUiScale(1)
    addToast('Settings reset to defaults', undefined, 'info')
  }

  // ---- Settings sidebar navigation (categories) ----
  const handleSettingsCatClick = (id: string): void => {
    setActiveSettingsCat(id)
    const scrollEl = document.querySelector('main.content')
    const el = scrollEl?.querySelector(`#settings-${id}`) as HTMLElement | null
    if (el && scrollEl) scrollEl.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' })
  }

  // Scroll-spy: highlight the category currently in view while the settings page
  // scrolls. Sections sit inside the scrolling <main.content> (position:relative),
  // so offsetTop and scrollTop are comparable directly.
  useEffect(() => {
    if (view !== 'settings') return
    const scrollEl = document.querySelector('main.content')
    if (!scrollEl) return
    const onSettingsScroll = (): void => {
      let current = SETTINGS_CATS[0].id
      for (const cat of SETTINGS_CATS) {
        const el = scrollEl.querySelector(`#settings-${cat.id}`) as HTMLElement | null
        if (el && el.offsetTop <= scrollEl.scrollTop + 140) current = cat.id
      }
      setActiveSettingsCat(current)
    }
    scrollEl.addEventListener('scroll', onSettingsScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onSettingsScroll)
  }, [view])

  // ---- Filtered / sorted data ----
  const filteredLibrary = useMemo(
    () =>
      library.filter(
        (t) =>
          t.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
          t.album.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      ),
    [library, deferredSearchQuery]
  )

  // ---- Home screen aggregates ----
  const homeTrackById = useMemo(() => new Map(library.map((t) => [t.id, t])), [library])

  const homeRecentlyPlayed = useMemo(() => {
    const seen = new Set<string>()
    const out: Track[] = []
    for (const id of recentlyPlayed) {
      if (seen.has(id)) continue
      const t = homeTrackById.get(id)
      if (!t) continue
      seen.add(id)
      out.push(t)
    }
    return out.slice(0, 12)
  }, [recentlyPlayed, homeTrackById])

  const homeMostPlayed = useMemo(() => {
    const scored: { track: Track; count: number }[] = []
    for (const t of library) {
      const count = playCounts[t.id] || 0
      if (count > 0) scored.push({ track: t, count })
    }
    scored.sort((a, b) => b.count - a.count || (b.track.added_at || 0) - (a.track.added_at || 0))
    return scored.slice(0, 8)
  }, [library, playCounts])

  const homeRecentAdded = useMemo(
    () => [...library].sort((a, b) => (b.added_at || 0) - (a.added_at || 0)).slice(0, 10),
    [library]
  )

  const homeLikedTracks = useMemo(() => {
    const out: Track[] = []
    for (const id of likedTrackIds) {
      const t = homeTrackById.get(id)
      if (t) out.push(t)
    }
    return out
  }, [likedTrackIds, homeTrackById])

  // ---- Home album / artist aggregates (for the bento tiles + detail views) ----
  const homeAlbums = useMemo(() => {
    const map = new Map<
      string,
      { key: string; artist: string; album: string; tracks: Track[]; addedAt: number }
    >()
    for (const t of library) {
      const key = `${t.artist || 'Unknown Artist'}│${t.album || 'Unknown Album'}`
      let entry = map.get(key)
      if (!entry) {
        entry = {
          key,
          artist: t.artist || 'Unknown Artist',
          album: t.album || 'Unknown Album',
          tracks: [],
          addedAt: t.added_at || 0
        }
        map.set(key, entry)
      }
      entry.tracks.push(t)
      entry.addedAt = Math.max(entry.addedAt, t.added_at || 0)
    }
    return Array.from(map.values()).sort((a, b) => b.addedAt - a.addedAt)
  }, [library])

  const homeArtists = useMemo(() => {
    const map = new Map<string, { name: string; tracks: Track[]; covers: string[] }>()
    for (const t of library) {
      const name = t.artist || 'Unknown Artist'
      let entry = map.get(name)
      if (!entry) {
        entry = { name, tracks: [], covers: [] }
        map.set(name, entry)
      }
      entry.tracks.push(t)
      if (t.cover && !entry.covers.includes(t.cover)) entry.covers.push(t.cover)
    }
    return Array.from(map.values())
  }, [library])

  // Artists ranked for the Home tile: highest total plays first, then name.
  const homeArtistsRanked = useMemo(() => {
    const scored: { name: string; plays: number; covers: string[]; track: Track }[] = []
    for (const a of homeArtists) {
      const plays = a.tracks.reduce((sum, t) => sum + (playCounts[t.id] || 0), 0)
      scored.push({
        name: a.name,
        plays,
        covers: a.covers,
        track: a.tracks[0]
      })
    }
    return scored.sort((a, b) => b.plays - a.plays || a.name.localeCompare(b.name))
  }, [homeArtists, playCounts])

  // Currently viewed album / artist (from homeDetail) resolved against the data.
  const homeAlbumDetail =
    homeDetail?.kind === 'album' ? homeAlbums.find((a) => a.key === homeDetail.key) || null : null
  const homeArtistDetail =
    homeDetail?.kind === 'artist'
      ? homeArtists.find((a) => a.name === homeDetail.name) || null
      : null

  // Spotlight track for the "Continue listening" hero: the most recent play,
  // otherwise whatever is currently loaded, otherwise the newest addition.
  const homeHeroTrack = homeRecentlyPlayed[0] || currentTrack || homeRecentAdded[0] || null
  const homeHeroSource = homeHeroTrack
    ? [homeHeroTrack, ...homeRecentAdded.filter((t) => t.id !== homeHeroTrack.id)]
    : []

  // Greeting flips by time of day to keep Home feeling alive.
  const homeGreeting =
    new Date().getHours() < 5
      ? 'Up late'
      : new Date().getHours() < 12
        ? 'Good morning'
        : new Date().getHours() < 18
          ? 'Good afternoon'
          : 'Good evening'

  // Quick Action handlers for Home Screen
  const handleShuffleAll = useCallback(() => {
    if (library.length === 0) return
    const shuffled = [...library].sort(() => Math.random() - 0.5)
    void loadAndPlayIndex(0, shuffled)
  }, [library, loadAndPlayIndex])

  const handlePlayLikedAll = useCallback(() => {
    if (homeLikedTracks.length === 0) return
    void loadAndPlayIndex(0, homeLikedTracks)
  }, [homeLikedTracks, loadAndPlayIndex])

  const handlePlayRecentAdded = useCallback(() => {
    if (homeRecentAdded.length === 0) return
    void loadAndPlayIndex(0, homeRecentAdded)
  }, [homeRecentAdded, loadAndPlayIndex])

  const handlePlayMostPlayed = useCallback(() => {
    if (homeMostPlayed.length === 0) return
    void loadAndPlayIndex(
      0,
      homeMostPlayed.map((m) => m.track)
    )
  }, [homeMostPlayed, loadAndPlayIndex])

  // Library toolbar quick actions: play current search result, or shuffle it.
  const handlePlayAllLibrary = useCallback(() => {
    if (filteredLibrary.length === 0) return
    void loadAndPlayIndex(0, filteredLibrary)
  }, [filteredLibrary, loadAndPlayIndex])

  const handleShuffleLibrary = useCallback(() => {
    if (filteredLibrary.length === 0) return
    const shuffled = [...filteredLibrary].sort(() => Math.random() - 0.5)
    void loadAndPlayIndex(0, shuffled)
  }, [filteredLibrary, loadAndPlayIndex])

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
        t.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        t.album.toLowerCase().includes(deferredSearchQuery.toLowerCase())
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
  }, [orderedTracks, deferredSearchQuery])

  const handleGroupDrop = useCallback(
    (targetKey: string) => {
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
    },
    [dragGroupKey, libraryGroups]
  )

  const handleTrackDrop = useCallback(
    (targetId: string) => {
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
    },
    [dragTrackId, libraryGroups, customTrackOrder, orderedTracks]
  )

  const playGroup = (group: (typeof libraryGroups)[number]) => {
    const idx = orderedTracks.findIndex((t) => t.id === group.tracks[0]?.id)
    if (idx >= 0) loadAndPlayIndex(idx, orderedTracks)
  }

  // Albums view: collapse/expand a single album group.
  const toggleGroupCollapse = useCallback((key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Albums view: add every track of an album to a chosen playlist at once.
  const handleAddAlbumToPlaylist = useCallback(
    async (tracks: Track[], e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value
      if (!val || tracks.length === 0) return
      for (const t of tracks) {
        await window.api.addTrackToPlaylist(val, t.id)
      }
      if (selectedPlaylistId === val) {
        const plTracks = await window.api.getPlaylistTracks(val)
        setPlaylistTracks(plTracks)
      }
      refreshPlaylistCovers()
      e.target.value = ''
      addToast(
        `Added ${tracks.length} track${tracks.length === 1 ? '' : 's'} to playlist`,
        undefined,
        'success'
      )
    },
    [selectedPlaylistId, refreshPlaylistCovers, addToast]
  )

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

      {/* Custom frameless window title bar — hidden while the fullscreen now-playing
          view is open so only the cover, track info and lyrics take the screen. */}
      {!isFullscreenCover && (
        <TitleBar
          onAbout={() => setIsAboutOpen(true)}
          onSettings={() => navigateView('settings')}
          center={
            globalSearchEnabled ? (
              <GlobalSearch
                tracks={library}
                playlists={playlists}
                onPlayTrack={handleGlobalPlayTrack}
                onOpenAlbum={handleGlobalOpenAlbum}
                onOpenArtist={handleGlobalOpenArtist}
                onOpenPlaylist={handleGlobalOpenPlaylist}
                onSearchLibrary={handleGlobalSearchLibrary}
              />
            ) : undefined
          }
        />
      )}

      {/* Full-viewport load screen shown while data loads */}
      {isInitializing && <LoadingScreen />}

      {/* Track Context Menu — shared for every track in every view */}
      {contextMenu && (
        <TrackContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          fromPlaylist={contextMenu.fromPlaylist}
          onPlay={contextMenu.onPlay}
          handlers={trackMenuHandlers}
          onClose={() => setContextMenu(null)}
        />
      )}
      {fluidBgEnabled && (
        <FluidBackgroundLayer
          cover={currentTrack?.cover}
          opacity={currentTrack?.cover ? fluidBgOpacity * 0.4 : fluidBgOpacity}
          blur={fluidBgBlur}
          saturation={fluidBgSaturation}
          duration={fluidAnimDuration}
          mode={fluidBgMode}
        />
      )}

      {/* LEFT NAVIGATION RAIL — collapsible + resizable via the rail's
          right-edge handle / the chevron button on top. */}
      <nav
        className={
          'rail' +
          (railCollapsed ? ' rail-collapsed' : '') +
          (railWidth >= 140 && !railCollapsed ? ' rail-wide' : '') +
          (railResizing ? ' rail-resizing' : '')
        }
        style={{ width: railCollapsed ? 60 : railWidth }}
      >
        <button
          type="button"
          className="rail-collapse-btn"
          onClick={() => setRailCollapsed((v) => !v)}
          title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {railCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        <div className="rail-nav">
          {NAV_ITEMS.map(({ id, label, IconComp }) => (
            <button
              key={id}
              className="rail-btn"
              data-active={view === id}
              onClick={() => navigateView(id)}
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
        <div
          className="rail-resizer"
          onPointerDown={handleRailResizeStart}
          title="Resize sidebar"
        />
      </nav>

      {/* MAIN CONTENT */}
      <main
        className="content"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* HOME VIEW */}
        {view === 'home' && (
          <div key="home" className="view-fade home-view">
            {library.length === 0 ? (
              <div
                className="pl-empty"
                style={{
                  minHeight: '50vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  border: '1px dashed rgba(128,128,128,0.18)',
                  borderRadius: 20,
                  background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)'
                }}
              >
                <div style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
                  <h2
                    style={{
                      fontWeight: 900,
                      fontSize: 24,
                      marginBottom: 8,
                      letterSpacing: -0.5,
                      color: 'var(--text-primary)'
                    }}
                  >
                    Welcome to omus
                  </h2>
                  <p
                    style={{
                      fontSize: 15,
                      marginBottom: 24,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55
                    }}
                  >
                    <b>Stream offline music, simply.</b>
                    Import your audio tracks and folders to
                    get your personalized Home, lyrics sync, visualizers, and more.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      className="btn btn-primary btn-pill btn-accent-glow"
                      onClick={openImportTracks}
                    >
                      <Plus size={15} /> Add Tracks
                    </button>
                  </div>
                </div>
              </div>
            ) : homeDetail?.kind === 'album' && homeAlbumDetail ? (
              <div className="home-detail">
                <button
                  className="btn-plain home-back"
                  onClick={() => setHomeDetail(null)}
                  style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Back to Home
                </button>
                <div className="home-detail-hero">
                  <div className="home-detail-art">
                    {(() => {
                      const cover = homeAlbumDetail.tracks.find((t) => t.cover)?.cover
                      return cover ? <img src={cover} alt="" /> : <Music size={44} opacity={0.4} />
                    })()}
                  </div>
                  <div className="home-detail-info">
                    <div className="home-detail-type">ALBUM</div>
                    <h1 className="home-detail-title">{homeAlbumDetail.album}</h1>
                    <p className="home-detail-sub">
                      {homeAlbumDetail.artist} · {homeAlbumDetail.tracks.length}{' '}
                      {homeAlbumDetail.tracks.length === 1 ? 'track' : 'tracks'} ·{' '}
                      {formatTime(
                        homeAlbumDetail.tracks.reduce((s, t) => s + (t.duration || 0), 0)
                      )}
                    </p>
                    <div className="home-detail-actions">
                      <button
                        className="sp-play-btn"
                        title="Play album"
                        onClick={() => loadAndPlayIndex(0, homeAlbumDetail.tracks)}
                      >
                        <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
                      </button>
                      <span className="home-detail-hint">Play album</span>
                    </div>
                  </div>
                </div>
                <div className="home-detail-list">
                  {homeAlbumDetail.tracks.map((t, i) => (
                    <div
                      key={t.id}
                      className="tile-row"
                      onClick={() => loadAndPlayIndex(i, homeAlbumDetail.tracks)}
                      onContextMenu={(e) =>
                        openTrackMenu(e, t, () => loadAndPlayIndex(i, homeAlbumDetail.tracks))
                      }
                      title={`${t.title} — ${t.artist || 'Unknown Artist'}`}
                    >
                      <span className="tile-row-idx">{i + 1}</span>
                      <span className="tile-row-art">
                        {t.cover ? <img src={t.cover} alt="" /> : <Music size={16} opacity={0.4} />}
                      </span>
                      <span className="tile-row-main">
                        <span className="tile-row-title">{t.title}</span>
                        <span className="tile-row-sub">{t.artist || 'Unknown Artist'}</span>
                      </span>
                      <span className="tile-row-time">{formatTime(t.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : homeDetail?.kind === 'artist' && homeArtistDetail ? (
              <div className="home-detail">
                <button
                  className="btn-plain home-back"
                  onClick={() => setHomeDetail(null)}
                  style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Back to Home
                </button>
                <div className="home-detail-hero">
                  <div className="home-detail-art">
                    {homeArtistDetail.covers.length > 0 ? (
                      <img src={homeArtistDetail.covers[0]} alt="" />
                    ) : (
                      <Music size={44} opacity={0.4} />
                    )}
                  </div>
                  <div className="home-detail-info">
                    <div className="home-detail-type">ARTIST</div>
                    <h1 className="home-detail-title">{homeArtistDetail.name}</h1>
                    <p className="home-detail-sub">
                      {homeArtistDetail.tracks.length}{' '}
                      {homeArtistDetail.tracks.length === 1 ? 'track' : 'tracks'} ·{' '}
                      {new Set(homeArtistDetail.tracks.map((t) => t.album || 'Unknown Album')).size}{' '}
                      {new Set(homeArtistDetail.tracks.map((t) => t.album || 'Unknown Album'))
                        .size === 1
                        ? 'album'
                        : 'albums'}{' '}
                      ·{' '}
                      {formatTime(
                        homeArtistDetail.tracks.reduce((s, t) => s + (t.duration || 0), 0)
                      )}
                    </p>
                    <div className="home-detail-actions">
                      <button
                        className="sp-play-btn"
                        title="Play all"
                        onClick={() => loadAndPlayIndex(0, homeArtistDetail.tracks)}
                      >
                        <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
                      </button>
                      <span className="home-detail-hint">Play all</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const byAlbum = new Map<string, { album: string; tracks: Track[] }>()
                  for (const t of homeArtistDetail.tracks) {
                    const key = t.album || 'Unknown Album'
                    if (!byAlbum.has(key)) byAlbum.set(key, { album: key, tracks: [] })
                    byAlbum.get(key)!.tracks.push(t)
                  }
                  return Array.from(byAlbum.values()).map((alb) => (
                    <section key={alb.album} className="home-detail-album">
                      <div className="tile-head home-detail-album-head">
                        <span className="home-detail-album-name">{alb.album}</span>
                        <span className="home-detail-album-count">
                          {alb.tracks.length} {alb.tracks.length === 1 ? 'track' : 'tracks'}
                        </span>
                      </div>
                      <div className="home-detail-list">
                        {alb.tracks.map((t, i) => (
                          <div
                            key={t.id}
                            className="tile-row"
                            onClick={() => loadAndPlayIndex(i, alb.tracks)}
                            onContextMenu={(e) =>
                              openTrackMenu(e, t, () => loadAndPlayIndex(i, alb.tracks))
                            }
                            title={`${t.title} — ${t.artist || 'Unknown Artist'}`}
                          >
                            <span className="tile-row-idx">{i + 1}</span>
                            <span className="tile-row-art">
                              {t.cover ? (
                                <img src={t.cover} alt="" />
                              ) : (
                                <Music size={16} opacity={0.4} />
                              )}
                            </span>
                            <span className="tile-row-main">
                              <span className="tile-row-title">{t.title}</span>
                              <span className="tile-row-sub">{t.artist || 'Unknown Artist'}</span>
                            </span>
                            <span className="tile-row-time">{formatTime(t.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                })()}
              </div>
            ) : (
              <>
                <div className="home-header">
                  <div className="home-header-left">
                    <p className="eyebrow" style={{ marginBottom: 4 }}>
                      HOME
                    </p>
                    <h1 className="home-greeting">{homeGreeting}</h1>
                    <p className="home-subtitle">
                      <span>Your library, ready when you are.</span>
                    </p>
                  </div>
                  <div className="home-header-actions">
                    <button
                      className="btn btn-ghost btn-sm btn-pill"
                      onClick={handleShuffleAll}
                      title="Shuffle entire music library"
                    >
                      <Shuffle size={13} /> Shuffle All
                    </button>
                    {homeLikedTracks.length > 0 && (
                      <button
                        className="btn btn-ghost btn-sm btn-pill"
                        onClick={handlePlayLikedAll}
                        title="Play all liked tracks"
                      >
                        <Heart size={13} fill="var(--accent)" /> Liked Songs
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-sm btn-pill btn-accent-glow"
                      onClick={openImportTracks}
                      title="Add tracks or folders"
                    >
                      <Plus size={13} /> Add Tracks
                    </button>
                  </div>
                </div>

                <div className="home-grid">
                  {/* HERO SPOTLIGHT */}
                  {homeHeroTrack && (
                    <div
                      className="home-tile tile-hero"
                      onContextMenu={(e) =>
                        openTrackMenu(e, homeHeroTrack, () => {
                          if (currentTrack?.id === homeHeroTrack.id) togglePlay()
                          else loadAndPlayIndex(0, homeHeroSource)
                        })
                      }
                    >
                      {homeHeroTrack.cover && (
                        <div
                          className="tile-hero-bg"
                          style={{ backgroundImage: `url(${homeHeroTrack.cover})` }}
                        />
                      )}
                      <div className="tile-hero-art-wrap">
                        <div className="tile-hero-art">
                          {homeHeroTrack.cover ? (
                            <img src={homeHeroTrack.cover} alt="" />
                          ) : (
                            <Music size={44} opacity={0.35} />
                          )}
                        </div>
                      </div>
                      <div className="tile-hero-info">
                        <div className="tile-hero-tag">
                          {currentTrack?.id === homeHeroTrack.id && isPlaying
                            ? 'Now Playing'
                            : 'Continue Listening'}
                        </div>
                        <h2>{homeHeroTrack.title}</h2>
                        <p>
                          {homeHeroTrack.artist || 'Unknown Artist'}{' '}
                          {homeHeroTrack.album ? `· ${homeHeroTrack.album}` : ''}
                        </p>
                        <div className="tile-hero-actions">
                          <button
                            className="sp-play-btn"
                            title={
                              currentTrack?.id === homeHeroTrack.id && isPlaying ? 'Pause' : 'Play'
                            }
                            onClick={() => {
                              if (currentTrack?.id === homeHeroTrack.id) togglePlay()
                              else loadAndPlayIndex(0, homeHeroSource)
                            }}
                          >
                            {currentTrack?.id === homeHeroTrack.id && isPlaying ? (
                              <Pause size={20} fill="currentColor" />
                            ) : (
                              <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
                            )}
                          </button>
                          <button
                            className={`sp-heart-btn ${likedTrackIds.includes(homeHeroTrack.id) ? 'liked' : ''}`}
                            onClick={() => toggleLikeTrack(homeHeroTrack.id)}
                            title="Like Track"
                          >
                            <Heart
                              size={19}
                              fill={
                                likedTrackIds.includes(homeHeroTrack.id) ? 'var(--accent)' : 'none'
                              }
                            />
                          </button>
                          <button
                            className="sp-btn-icon"
                            onClick={advanceToNext}
                            title="Next track"
                          >
                            <SkipForward size={18} />
                          </button>
                          <button
                            className="sp-btn-icon"
                            onClick={toggleFullscreen}
                            title="Fullscreen Now Playing (F)"
                          >
                            <Maximize2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LIBRARY STATS — quiet stat strip */}
                  <section className="home-tile tile-stats">
                    <div className="tile-stats-head">
                      <span>Library Pulse</span>
                    </div>
                    <div className="tile-stats-list">
                      <button
                        className="tile-stat"
                        onClick={() => setView('library')}
                        title="View all tracks"
                      >
                        <b>{library.length}</b>
                        <span>Tracks</span>
                      </button>
                      <button
                        className="tile-stat"
                        onClick={() => {
                          setLibraryLayout('group')
                          setView('library')
                        }}
                        title="View artists & albums"
                      >
                        <b>{new Set(library.map((t) => t.artist)).size}</b>
                        <span>Artists</span>
                      </button>
                      <button
                        className="tile-stat"
                        onClick={() => setView('playlists')}
                        title="View playlists"
                      >
                        <b>{playlists.length}</b>
                        <span>Playlists</span>
                      </button>
                      <button
                        className="tile-stat"
                        onClick={() => {
                          if (homeLikedTracks.length > 0) handlePlayLikedAll()
                        }}
                        title={homeLikedTracks.length > 0 ? 'Play liked tracks' : 'No liked tracks'}
                      >
                        <b>{likedTrackIds.length}</b>
                        <span>Liked</span>
                      </button>
                    </div>
                  </section>

                  {/* LIKED SONGS — quick shortcut */}
                  <section className="home-tile tile-quick-mix">
                    <div
                      className="quick-mix-row"
                      onClick={handlePlayLikedAll}
                      title="Play all liked songs"
                    >
                      <Heart
                        size={17}
                        className="quick-mix-icon"
                        fill={homeLikedTracks.length > 0 ? 'var(--accent)' : 'none'}
                      />
                      <span className="quick-mix-info">
                        <span className="quick-mix-title">Liked Songs</span>
                        <span className="quick-mix-sub">
                          {homeLikedTracks.length}{' '}
                          {homeLikedTracks.length === 1 ? 'track' : 'tracks'} ·{' '}
                          {formatTime(homeLikedTracks.reduce((s, t) => s + (t.duration || 0), 0))}
                        </span>
                      </span>
                      <button
                        className="sp-play-btn"
                        style={{ width: 32, height: 32 }}
                        title="Play Liked Songs"
                      >
                        <Play size={14} fill="currentColor" style={{ marginLeft: 1 }} />
                      </button>
                    </div>

                    <div className="quick-actions-row">
                      <button
                        className="quick-chip"
                        onClick={handleShuffleAll}
                        title="Shuffle all library tracks"
                      >
                        <Shuffle size={12} /> Shuffle
                      </button>
                      <button
                        className="quick-chip"
                        onClick={handlePlayRecentAdded}
                        title="Play recent additions"
                      >
                        <Sparkles size={12} /> Fresh
                      </button>
                      {homeMostPlayed.length > 0 && (
                        <button
                          className="quick-chip"
                          onClick={handlePlayMostPlayed}
                          title="Play top tracks"
                        >
                          <Flame size={12} /> Top Hits
                        </button>
                      )}
                    </div>
                  </section>

                  {/* RECENTLY PLAYED */}
                  {homeRecentlyPlayed.length > 0 && (
                    <section className="home-tile tile-recent">
                      <div className="tile-head">
                        <Clock3 size={15} />
                        <h3>Recently played</h3>
                        <button
                          className="btn btn-ghost home-see-all btn-xs"
                          onClick={() => setView('queue')}
                          title="Open queue / history"
                        >
                          Queue
                        </button>
                      </div>
                      <div className="tile-list">
                        {homeRecentlyPlayed.slice(0, 4).map((t, i) => {
                          const isCurPlaying = currentTrack?.id === t.id && isPlaying
                          return (
                            <div
                              key={t.id}
                              className="tile-row"
                              data-active={currentTrack?.id === t.id}
                              onClick={() => loadAndPlayIndex(i, homeRecentlyPlayed)}
                              onContextMenu={(e) =>
                                openTrackMenu(e, t, () => loadAndPlayIndex(i, homeRecentlyPlayed))
                              }
                              title={`${t.title} — ${t.artist || 'Unknown Artist'}`}
                            >
                              <span className="tile-row-art">
                                {t.cover ? (
                                  <img src={t.cover} alt="" />
                                ) : (
                                  <Music size={16} opacity={0.4} />
                                )}
                                {isCurPlaying && (
                                  <div className="tile-row-playing-icon">
                                    <div className="eq">
                                      <span />
                                      <span />
                                      <span />
                                    </div>
                                  </div>
                                )}
                              </span>
                              <span className="tile-row-main">
                                <span className="tile-row-title">{t.title}</span>
                                <span className="tile-row-sub">{t.artist || 'Unknown Artist'}</span>
                              </span>
                              <span className="tile-row-time">{formatTime(t.duration)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* RECENTLY ADDED */}
                  <section className="home-tile tile-new">
                    <div className="tile-head">
                      <Sparkles size={15} />
                      <h3>Recently added</h3>
                      <button
                        className="btn btn-ghost home-see-all btn-xs"
                        onClick={() => setView('library')}
                        title="View all library tracks"
                      >
                        See all
                      </button>
                    </div>
                    <div className="tile-list">
                      {homeRecentAdded.slice(0, 4).map((t, idx) => {
                        const isCurPlaying = currentTrack?.id === t.id && isPlaying
                        return (
                          <div
                            key={t.id}
                            className="tile-row"
                            data-active={currentTrack?.id === t.id}
                            onClick={() => loadAndPlayIndex(idx, homeRecentAdded)}
                            onContextMenu={(e) =>
                              openTrackMenu(e, t, () => loadAndPlayIndex(idx, homeRecentAdded))
                            }
                            title={`${t.title} — ${t.artist || 'Unknown Artist'}`}
                          >
                            <span className="tile-row-art">
                              {t.cover ? (
                                <img src={t.cover} alt="" />
                              ) : (
                                <Music size={16} opacity={0.4} />
                              )}
                              {isCurPlaying && (
                                <div className="tile-row-playing-icon">
                                  <div className="eq">
                                    <span />
                                    <span />
                                    <span />
                                  </div>
                                </div>
                              )}
                            </span>
                            <span className="tile-row-main">
                              <span className="tile-row-title">{t.title}</span>
                              <span className="tile-row-sub">{t.artist || 'Unknown Artist'}</span>
                            </span>
                            <span className="tile-row-time">{formatTime(t.duration)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  {/* HEAVY ROTATION / MOST PLAYED */}
                  {homeMostPlayed.length > 0 && (
                    <section className="home-tile tile-most">
                      <div className="tile-head">
                        <TrendingUp size={15} />
                        <h3>Heavy rotation</h3>
                        <button
                          className="btn btn-ghost home-see-all btn-xs"
                          onClick={handlePlayMostPlayed}
                          title="Play all top tracks"
                        >
                          Play all
                        </button>
                      </div>
                      <div className="tile-most-grid">
                        {homeMostPlayed.slice(0, 6).map(({ track, count }, i) => (
                          <div
                            key={track.id}
                            className="tile-most-cell"
                            onClick={() =>
                              loadAndPlayIndex(
                                i,
                                homeMostPlayed.map((m) => m.track)
                              )
                            }
                            onContextMenu={(e) =>
                              openTrackMenu(e, track, () =>
                                loadAndPlayIndex(
                                  i,
                                  homeMostPlayed.map((m) => m.track)
                                )
                              )
                            }
                            title={`${track.title} — ${count} ${count === 1 ? 'play' : 'plays'}`}
                          >
                            <div className="tile-most-art">
                              {track.cover ? (
                                <img src={track.cover} alt="" />
                              ) : (
                                <Music size={24} opacity={0.3} />
                              )}
                              <span className={`tile-most-rank rank-${i + 1}`}>{i + 1}</span>
                              <span className="tile-most-count">
                                <Flame size={10} />
                                {count}
                              </span>
                            </div>
                            <span className="tile-most-title">{track.title}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* FEATURED ALBUMS */}
                  <section className="home-tile tile-albums">
                    <div className="tile-head">
                      <LayoutGrid size={15} />
                      <h3>Albums</h3>
                      <button
                        className="btn btn-ghost home-see-all btn-xs"
                        onClick={() => {
                          setLibraryLayout('group')
                          setView('library')
                        }}
                        title="View grouped by album"
                      >
                        See all
                      </button>
                    </div>
                    <div className="tile-albums-grid">
                      {homeAlbums.slice(0, 3).map((al) => (
                        <div
                          key={al.key}
                          className="tile-album"
                          onClick={() => setHomeDetail({ kind: 'album', key: al.key })}
                          title={`${al.album} — ${al.artist}`}
                        >
                          <span className="tile-album-art">
                            {al.tracks.find((t) => t.cover)?.cover ? (
                              <img src={al.tracks.find((t) => t.cover)!.cover} alt="" />
                            ) : (
                              <Music size={22} opacity={0.4} />
                            )}
                          </span>
                          <span className="tile-album-name">{al.album}</span>
                          <span className="tile-album-sub">
                            {al.artist} · {al.tracks.length}{' '}
                            {al.tracks.length === 1 ? 'track' : 'tracks'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* TOP ARTISTS */}
                  <section className="home-tile tile-artists">
                    <div className="tile-head">
                      <Flame size={15} />
                      <h3>Top Artists</h3>
                      <button
                        className="btn btn-ghost home-see-all btn-xs"
                        onClick={() => {
                          setLibraryLayout('group')
                          setView('library')
                        }}
                        title="View all artists"
                      >
                        See all
                      </button>
                    </div>
                    <div className="tile-artists-row">
                      {homeArtistsRanked.slice(0, 3).map((a, i) => (
                        <div
                          key={a.name}
                          className="tile-artist"
                          onClick={() => setHomeDetail({ kind: 'artist', name: a.name })}
                          title={`View ${a.name}`}
                        >
                          <span className="tile-artist-avatar">
                            {a.covers[0] ? (
                              <img src={a.covers[0]} alt="" />
                            ) : (
                              <Music size={18} opacity={0.4} />
                            )}
                            <span className="tile-artist-rank">{i + 1}</span>
                          </span>
                          <span className="tile-artist-name">{a.name}</span>
                          <span className="tile-artist-count">
                            {a.plays > 0
                              ? `${a.plays} ${a.plays === 1 ? 'play' : 'plays'}`
                              : `${homeArtists.find((x) => x.name === a.name)?.tracks.length || 0} tracks`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* PLAYLISTS */}
                  {playlists.length > 0 && (
                    <section className="home-tile tile-pl">
                      <div className="tile-head">
                        <ListMusic size={15} />
                        <h3>Playlists</h3>
                        <button
                          className="btn btn-ghost home-see-all btn-xs"
                          onClick={() => setView('playlists')}
                          title="View all playlists"
                        >
                          See all
                        </button>
                      </div>
                      <div className="tile-list">
                        {playlists.slice(0, 3).map((pl) => {
                          const grad = playlistGradient(pl.id)
                          const plCovers = playlistCovers[pl.id] || []
                          return (
                            <div
                              key={pl.id}
                              className="tile-row"
                              onClick={() => {
                                handleSelectPlaylist(pl.id)
                                setView('playlists')
                              }}
                              title={`Open ${pl.name}`}
                            >
                              <span
                                className="tile-pl-mosaic"
                                style={
                                  plCovers.length
                                    ? undefined
                                    : {
                                        background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`
                                      }
                                }
                              >
                                {plCovers.length ? (
                                  [0, 1, 2, 3].map((i) => (
                                    <img key={i} src={plCovers[i % plCovers.length]} alt="" />
                                  ))
                                ) : (
                                  <Music size={16} opacity={0.4} />
                                )}
                              </span>
                              <span className="tile-row-main">
                                <span className="tile-row-title">{pl.name}</span>
                                <span className="tile-row-sub">
                                  {plCovers.length} {plCovers.length === 1 ? 'track' : 'tracks'}
                                </span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        )}

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
                <button
                  className="btn btn-ghost btn-sm btn-pill"
                  onClick={handlePlayAllLibrary}
                  disabled={filteredLibrary.length === 0}
                  title="Play all tracks in this view"
                >
                  <Play size={13} fill="currentColor" style={{ marginLeft: 1 }} /> Play All
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-pill"
                  onClick={handleShuffleLibrary}
                  disabled={filteredLibrary.length === 0}
                  title="Shuffle all tracks in this view"
                >
                  <Shuffle size={13} /> Shuffle
                </button>
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
                  {filteredLibrary.map((track, idx) => (
                    <LibraryTableRow
                      key={track.id}
                      track={track}
                      index={idx}
                      list={filteredLibrary}
                      isActive={currentTrack?.id === track.id}
                      isPlaying={isPlaying}
                      playlists={playlists}
                      onLoad={loadAndPlayIndex}
                      onContextMenu={handleRowContextMenu}
                      onTagEdit={setTagEditorTrack}
                      onDelete={handleDeleteTrack}
                      onAddTrack={handleAddTrackToPlaylist}
                    />
                  ))}
                </tbody>
              </table>
            ) : libraryLayout === 'group' ? (
              <div className="library-groups">
                {libraryGroups.map((g) => {
                  const firstCover = g.tracks.find((t) => t.cover)?.cover
                  const isGPlaying = currentTrack
                    ? g.tracks.some((t) => t.id === currentTrack.id)
                    : false
                  const gTotalSecs = g.tracks.reduce((s, t) => s + (t.duration || 0), 0)
                  const collapsed = !!collapsedGroups[g.key]
                  return (
                    <div key={g.key} className="library-group" data-collapsed={collapsed}>
                      <div
                        className="library-group-head"
                        data-over={overGroupKey === g.key}
                        data-dragging={dragGroupKey === g.key}
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
                        onClick={() => toggleGroupCollapse(g.key)}
                        title={collapsed ? 'Expand album' : 'Collapse album'}
                      >
                        <div
                          className="lg-art"
                          onClick={(e) => {
                            e.stopPropagation()
                            playGroup(g)
                          }}
                          title="Play album"
                        >
                          {firstCover ? (
                            <img src={firstCover} alt="" />
                          ) : (
                            <div className="lg-art-ph">
                              <Music size={22} opacity={0.4} />
                            </div>
                          )}
                          {isGPlaying && (
                            <span className="lg-playing" title="Playing album">
                              <span className="eq">
                                <span />
                                <span />
                                <span />
                              </span>
                            </span>
                          )}
                          <span className="lg-play-overlay">
                            <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
                          </span>
                        </div>

                        <div className="lg-info">
                          <div className="lg-title">{g.album}</div>
                          <div className="lg-sub">
                            {g.artist} · {g.tracks.length}{' '}
                            {g.tracks.length === 1 ? 'track' : 'tracks'} ·{' '}
                            {formatTime(gTotalSecs)}
                          </div>
                        </div>

                        <button
                          className="lg-btn"
                          title={collapsed ? 'Expand album' : 'Collapse album'}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleGroupCollapse(g.key)
                          }}
                        >
                          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>

                        <GripVertical size={16} className="lg-grip" />
                      </div>
                    {!collapsed && (
                        <div className="library-group-body">
                          {g.tracks.map((track, i) => {
                            const ordIdx = orderedTracks.findIndex((t) => t.id === track.id)
                            return (
                              <LibraryGroupRow
                                key={track.id}
                                track={track}
                                groupIndex={i}
                                index={ordIdx}
                                list={orderedTracks}
                                isActive={currentTrack?.id === track.id}
                                isPlaying={isPlaying}
                                isOver={overTrackId === track.id}
                                isDragging={dragTrackId === track.id}
                                onLoad={loadAndPlayIndex}
                                onContextMenu={handleRowContextMenu}
                                onDragStart={setDragTrackId}
                                onDragEnd={handleDragRowEnd}
                                onDragOver={setOverTrackId}
                                onDrop={handleTrackDrop}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="track-grid">
                {filteredLibrary.map((track, idx) => (
                  <LibraryCardRow
                    key={track.id}
                    track={track}
                    index={idx}
                    list={filteredLibrary}
                    onLoad={loadAndPlayIndex}
                    onContextMenu={handleRowContextMenu}
                    onDelete={handleDeleteTrack}
                  />
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
                  Back to Playlists
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
                        onContextMenu={(e) =>
                          openTrackMenu(e, track, () => handlePlayPlaylistTrack(track.id), true)
                        }
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
                {queue.map((track, idx) => (
                  <QueueCard
                    key={`${track.id}-${idx}`}
                    track={track}
                    index={idx}
                    isCurrent={currentIndex === idx}
                    isLast={idx === queue.length - 1}
                    onLoad={loadAndPlayIndex}
                    onContextMenu={handleQueueContextMenu}
                    onMove={handleMoveQueueItem}
                    onRemove={handleRemoveFromQueue}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* LYRICS VIEW */}
        {view === 'lyrics' && (
          <div key="lyrics" className="lyrics-container-view view-fade">
            <div className="lyrics-header-clean">
              <div
                style={{ cursor: currentTrack ? 'context-menu' : 'default' }}
                onContextMenu={(e) =>
                  currentTrack && openTrackMenu(e, currentTrack, () => togglePlay())
                }
              >
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
                  {currentTrack ? currentTrack.title : 'Synchronized Lyrics'}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {currentTrack?.artist || 'Play a track to display synced lyrics'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {currentTrack && (
                  <div className="pl-options-wrap">
                    <button
                      className="btn btn-ghost"
                      onClick={() => setLyricsOptionsOpen((v) => !v)}
                      title="Lyrics settings — sync offset, fetch & search"
                      style={{ padding: '6px 10px' }}
                    >
                      <Settings2 size={14} />
                    </button>
                    {lyricsOptionsOpen && (
                      <>
                        <div
                          className="pl-options-backdrop"
                          onClick={() => setLyricsOptionsOpen(false)}
                        />
                        <div
                          className="pl-options-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Offset calibration */}
                          {parsedLyrics.length > 0 && (
                            <>
                              <div className="pl-opt-label">Sync offset</div>
                              <div className="lyrics-options-row">
                                <span className="lyrics-offset-badge" title="Current lyric offset">
                                  {offsetMs >= 0 ? `+${offsetMs}ms` : `${offsetMs}ms`}
                                </span>
                                <button
                                  className="btn-plain"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  onClick={() => handleLyricOffset(-500)}
                                  title="Shift lyrics back 0.5s"
                                >
                                  −0.5s
                                </button>
                                <button
                                  className="btn-plain"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  onClick={() => handleLyricOffset(500)}
                                  title="Shift lyrics forward 0.5s"
                                >
                                  +0.5s
                                </button>
                                {offsetMs !== 0 && (
                                  <button
                                    className="btn-plain"
                                    style={{ padding: '4px 8px', fontSize: 11 }}
                                    onClick={handleLyricOffsetReset}
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                          <div className="pl-opt-label">Lyrics</div>
                          <div
                            className="pl-opt-row"
                            onClick={handleFetchCurrentLyrics}
                            style={
                              isFetchingCurrentLyrics
                                ? { opacity: 0.6, cursor: 'wait' }
                                : undefined
                            }
                            title="Search and fetch lyrics from LRCLIB"
                          >
                            <RefreshCw
                              size={15}
                              className={isFetchingCurrentLyrics ? 'animate-spin' : ''}
                            />
                            {isFetchingCurrentLyrics ? 'Fetching...' : 'Fetch from LRCLIB'}
                          </div>
                          <div
                            className="pl-opt-row"
                            onClick={() => {
                              setIsManualLyricsOpen(true)
                              setLyricsOptionsOpen(false)
                            }}
                            title="Manually search or paste lyrics"
                          >
                            <Search size={15} /> Search / paste lyrics
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div
              ref={lyricsContainerRef}
              className="lyrics-scroll"
              style={{ textAlign: lyricAlignment }}
            >
              {parsedLyrics.length > 0 ? (
                <div ref={lyricsTrackRef} className="lyrics-track">
                {parsedLyrics.map((line, i) => (
                  <LyricLine
                    key={i}
                    line={line}
                    isActive={i === activeLyricIndex}
                    isPast={i < activeLyricIndex}
                    lyricAnimation={lyricAnimation}
                    lyricAlignment={lyricAlignment}
                    lyricFontSize={lyricFontSize}
                    lyricLineGap={lyricLineGap}
                    lyricInactiveBlur={lyricInactiveBlur}
                    lyricDimLevel={lyricDimLevel}
                    lyricActiveScale={lyricActiveScale}
                    lyricUppercase={lyricUppercase}
                    variant="normal"
                    onSeek={seek}
                  />
                ))}
                </div>
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
          <div key="settings" className="view-fade settings-layout">
            <aside className="settings-nav">
              {SETTINGS_CATS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className="settings-nav-btn"
                  data-active={activeSettingsCat === id}
                  onClick={() => handleSettingsCatClick(id)}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </aside>
            <div className="settings-content">
            <h2 className="settings-page-title">Settings</h2>
            <section id="settings-lyrics" className="settings-cat">
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
            </section>

            <section id="settings-audio" className="settings-cat">
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
                  className="eq-range"
                  style={{ width: 160 }}
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
                  className="eq-range"
                  style={{ width: 160 }}
                />
              </div>

              {/* 10-band mini sliders */}
              <div style={{ marginTop: 8 }}>
                <label className="lbl-caps" style={{ marginBottom: 10 }}>
                  Bands
                </label>
                <div
                  className="eq-bands-grid"
                  style={{ minWidth: 0 }}
                >
                  {eqBands.map((band, idx) => (
                    <div key={band.freq} className="eq-band-cell">
                      <span className="eq-band-val">
                        {band.gain > 0 ? `+${band.gain.toFixed(0)}` : band.gain.toFixed(0)}
                      </span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={band.gain}
                        onChange={(e) => setEQBandGain(idx, Number(e.target.value))}
                        className="eq-range-vert"
                        style={{ height: 76 }}
                      />
                      <span className="eq-band-label">{band.label}</span>
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
            </section>

            <section id="settings-fullscreen" className="settings-cat">
            <p className="eyebrow">Fullscreen</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Fullscreen Type</div>
                  <div className="settings-row-desc">
                    Full shows the cover, track info and lyrics. Minimalistic shows just the artwork/video.
                  </div>
                </div>
                <div className="seg">
                  <button data-active={fullscreenMode === 'normal'} onClick={() => setFullscreenMode('normal')}>
                    Full
                  </button>
                  <button data-active={fullscreenMode === 'cover'} onClick={() => setFullscreenMode('cover')}>
                    Minimalistic
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Ambient Background</div>
                  <div className="settings-row-desc">
                    Use ambience in the fullscreen view.

                  </div>
                </div>
                <button className="switch-label" onClick={() => setFullscreenAmbience((v) => !v)}>
                  <span className="switch-track" data-active={fullscreenAmbience}>
                    <span className="switch-knob" />
                  </span>
                  {fullscreenAmbience ? 'On' : 'Off'}
                </button>
              </div>
            </div>
            </section>

            <section id="settings-ambience" className="settings-cat">
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
                      <div className="settings-row-title">Ambient Mode</div>
                      <div className="settings-row-desc">
                        Backdrop style — aurora, drifting waves, prism or nebula.
                      </div>
                    </div>
                    <div className="seg">
                      <button
                        data-active={fluidBgMode === 'aurora'}
                        onClick={() => setFluidBgMode('aurora')}
                      >
                        Aurora
                      </button>
                      <button
                        data-active={fluidBgMode === 'waves'}
                        onClick={() => setFluidBgMode('waves')}
                      >
                        Waves
                      </button>
                      <button
                        data-active={fluidBgMode === 'prism'}
                        onClick={() => setFluidBgMode('prism')}
                      >
                        Prism
                      </button>
                      <button
                        data-active={fluidBgMode === 'nebula'}
                        onClick={() => setFluidBgMode('nebula')}
                      >
                        Nebula
                      </button>
                    </div>
                  </div>
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
            </section>

            <section id="settings-integrations" className="settings-cat">
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
            </section>

            <section id="settings-appearance" className="settings-cat">
            <p className="eyebrow">Appearance & Customization</p>
            <div className="settings-section">
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Global search</div>
                  <div className="settings-row-desc">
                    Show the global search bar (tracks, artists, albums, playlists) in the title
                    bar.
                  </div>
                </div>
                <button
                  className="switch-label"
                  onClick={() => setGlobalSearchEnabled((v) => !v)}
                >
                  <span className="switch-track" data-active={globalSearchEnabled}>
                    <span className="switch-knob" />
                  </span>
                </button>
              </div>
            </div>
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
                UI Scale
              </label>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 12
                }}
              >
                Resize the whole interface. You can also hold <b>Ctrl</b> and use the mouse wheel
                anywhere for quick zoom.
              </span>
              <div className="settings-row" style={{ paddingTop: 0 }}>
                <div className="settings-row-text">
                  <div className="settings-row-title">Interface scale</div>
                  <div className="settings-row-desc">70% – 160%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn-plain"
                    title="Zoom out"
                    style={{ width: 30, height: 30, borderRadius: 15, fontSize: 18, lineHeight: 1 }}
                    onClick={() => changeUiScale(-0.05)}
                  >
                    −
                  </button>
                  <span
                    style={{
                      minWidth: 48,
                      fontWeight: 800,
                      textAlign: 'center',
                      fontSize: 13
                    }}
                  >
                    {Math.round(uiScale * 100)}%
                  </span>
                  <button
                    className="btn-plain"
                    title="Zoom in"
                    style={{ width: 30, height: 30, borderRadius: 15, fontSize: 18, lineHeight: 1 }}
                    onClick={() => changeUiScale(0.05)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min="0.7"
                  max="1.6"
                  step="0.01"
                  className="sp-vol-slider"
                  style={{ width: 160 }}
                  value={uiScale}
                  onChange={(e) => setUiScale(clampUiScale(Number(e.target.value)))}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0.8, 1, 1.25, 1.5].map((preset) => (
                    <button
                      key={preset}
                      className="opt-card"
                      data-active={Math.abs(uiScale - preset) < 0.011}
                      onClick={() => setUiScale(preset)}
                      style={{ fontSize: 11, padding: '6px 10px' }}
                    >
                      {Math.round(preset * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </section>

            <section id="settings-playback" className="settings-cat">
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
            </section>

            <section id="settings-library" className="settings-cat">
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
            </section>

            <section id="settings-shortcuts" className="settings-cat">
            <p className="eyebrow">Keyboard Shortcuts</p>
            <div className="settings-section">
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}
              >
                                {[
                  ['Space', 'Play / Pause'],
                  ['L', 'Lyrics'],
                  ['← / →', 'Seek ±5 Seconds'],
                  ['Shift + ← / →', 'Prev / Next Track'],
                  ['Q', 'Queue'],
                  ['M', 'Mute'],
                  ['F', 'Fullscreen'],
                  ['E', 'Equalizer'],
                  ['S', 'Settings'],
                  ['Esc', 'Close Overlays'],
                  ['Ctrl + Scroll', 'Zoom UI'],
                  ['Ctrl + K', 'Global Search']
                ].map(([key, label]) => (
                  <div key={key}>
                    <kbd
                      style={{
                        background: 'var(--card-bg)',
                        padding: '2px 7px',
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
            </section>

            <section id="settings-advanced" className="settings-cat">
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
                Inject custom styles to alter UI components live. Only if you know what you are
                doing.
              </span>
              <textarea
                className="field"
                style={{ height: 160, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                value={customCssInput}
                onChange={(e) => {
                  setCustomCssInput(e.target.value)
                  setCurrentTheme((prev) => ({ ...prev, customCss: e.target.value }))
                }}
                placeholder="/* Add custom styles here */&#10;.cssname { border-top: 1px solid var(--accent); }"
              />
            </div>

            <div className="settings-section" style={{ border: 'none' }}>
              <button
                className="btn btn-ghost"
                onClick={handleResetSettings}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <RotateCcw size={14} /> Reset to defaults
              </button>
            </div>
            </section>
          </div>
        </div>
        )}
      </main>

      {/* BOTTOM PLAYER BAR */}
      <footer className="spotify-player">
        {/* Left: Track info */}
        <div
          className="sp-left"
          onContextMenu={(e) => currentTrack && openTrackMenu(e, currentTrack, () => togglePlay())}
        >
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {isVideoTrack && (
                    <span
                      className="sp-video-badge"
                      title="Music video — open fullscreen (F) to watch"
                    >
                      <Video size={12} />
                    </span>
                  )}
                  <div className="sp-title" title={currentTrack.title}>
                    {currentTrack.title}
                  </div>
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
                <div className="sp-scrub-fill" style={{ transform: `scaleX(${progress})` }} />
                <div
                  className="sp-scrub-thumb-rail"
                  style={{ transform: `translateX(${progress * 100}%)` }}
                >
                  <div className="sp-scrub-thumb" />
                </div>
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
          {/* Mini Visualizer — hidden on compact windows via [data-compact-hide]
              so the player bar's right side never overflows into the scrubber. */}
          {visualizerMode !== 'off' && (
            <div data-compact-hide>
              <AudioVisualizer
                analyserNode={analyserNode}
                isPlaying={isPlaying}
                mode={visualizerMode}
                accentColor="var(--accent)"
                width={52}
                height={28}
                barCount={10}
              />
            </div>
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
            onClick={() => navigateView(view === 'queue' ? previousView : 'queue')}
            title="Queue (Q)"
          >
            <ListMusic size={18} />
          </button>
          <button
            className="sp-btn-icon"
            data-active={fluidBgEnabled}
            data-compact-hide
            onClick={() => setFluidBgEnabled((v) => !v)}
            title={fluidBgEnabled ? 'Disable Fluid Background' : 'Enable Fluid Background'}
          >
            <Sparkles size={18} />
          </button>
          <button
            className="sp-btn-icon"
            onClick={() => setIsSleepTimerOpen(true)}
            data-compact-hide
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
            onClick={toggleFullscreen}
            title="Fullscreen Now Playing (F)"
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </footer>

      {/* FULLSCREEN NOW PLAYING */}
      {isFullscreenCover && currentTrack && (
        <div
          className={`fullscreen-visualizer${fsUiVisible ? ' fs-ui-visible' : ''}${fullscreenMode === 'cover' ? ' fs-cover-only' : ''}${fullscreenAmbience && fluidBgEnabled ? ' fs-ambience' : ''}`}
          onMouseMove={wakeFsControls}
        >
          {fullscreenAmbience && fluidBgEnabled && (
            <FluidBackgroundLayer
              cover={currentTrack.cover}
              opacity={currentTrack.cover ? fluidBgOpacity * 0.4 : fluidBgOpacity}
              blur={fluidBgBlur}
              saturation={fluidBgSaturation}
              duration={fluidAnimDuration}
              mode={fluidBgMode}
              softScrim
            />
          )}
          <div
            className="fs-chrome fs-chrome-top"
            onMouseEnter={holdFsControls}
            onMouseLeave={releaseFsControls}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}></div>
            <button className="icon-btn" onClick={closeFullscreen} title="Close (F)">
              <Minimize2 size={19} />
            </button>
          </div>

          <div
            className={
              fullscreenMode === 'cover'
                ? 'fullscreen-body fullscreen-body-nolyrics'
                : parsedLyrics.length > 0
                  ? 'fullscreen-body'
                  : 'fullscreen-body fullscreen-body-nolyrics'
            }
          >
            <div className="fullscreen-cover-side">
              {isVideoTrack ? (
                <div key={currentTrack.id} className="fullscreen-video-wrap now-playing-enter">
                  <video
                    ref={videoRef}
                    src={videoSrc || undefined}
                    muted
                    playsInline
                    preload="auto"
                    onClick={togglePlay}
                  />
                </div>
              ) : (
                <div key={currentTrack.id} className="fullscreen-cover-wrap now-playing-enter">
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
              )}
              {fullscreenMode === 'normal' && (
                <>
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
                <div
                  className="fs-chrome fs-chrome-fade"
                  style={{ marginTop: 16, width: '100%', maxWidth: 420 }}
                >
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
                </>
              )}
            </div>

            {/* Synced Lyrics side — only rendered in Normal fullscreen type (when the track has lyrics). */}
            {fullscreenMode === 'normal' && parsedLyrics.length > 0 && (
              <div
                ref={fullscreenLyricsRef}
                className="fullscreen-lyrics-scroll"
                style={{ textAlign: lyricAlignment }}
              >
                <div ref={fullscreenLyricsTrackRef} className="lyrics-track">
                {parsedLyrics.map((line, i) => (
                  <LyricLine
                    key={i}
                    line={line}
                    isActive={i === activeLyricIndex}
                    isPast={i < activeLyricIndex}
                    lyricAnimation={lyricAnimation}
                    lyricAlignment={lyricAlignment}
                    lyricFontSize={lyricFontSize}
                    lyricLineGap={lyricLineGap}
                    lyricInactiveBlur={lyricInactiveBlur}
                    lyricDimLevel={lyricDimLevel}
                    lyricActiveScale={lyricActiveScale}
                    lyricUppercase={lyricUppercase}
                    variant="fullscreen"
                    onSeek={seek}
                  />
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Controls Bar — part of the auto-hiding chrome: it slides
              in while the cursor is moving and fades away a few seconds after rest. */}
          <div
            className="fullscreen-controls-bar fs-chrome fs-chrome-bottom"
            onMouseEnter={holdFsControls}
            onMouseLeave={releaseFsControls}
          >
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
                    <div className="sp-scrub-fill" style={{ transform: `scaleX(${progress})` }} />
                    <div
                      className="sp-scrub-thumb-rail"
                      style={{ transform: `translateX(${progress * 100}%)` }}
                    >
                      <div className="sp-scrub-thumb" />
                    </div>
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
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
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
                          className="btn btn-ghost btn-sm"
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
                        className="btn btn-ghost btn-sm"
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
