import { useRef, useState, useEffect, useCallback } from 'react'
import { Track, EQBand, EQPreset, SleepTimerState } from '../types'

export const EQ_FREQUENCIES: { freq: number; label: string; type: BiquadFilterType }[] = [
  { freq: 32, label: '32Hz', type: 'lowshelf' },
  { freq: 64, label: '64Hz', type: 'peaking' },
  { freq: 125, label: '125Hz', type: 'peaking' },
  { freq: 250, label: '250Hz', type: 'peaking' },
  { freq: 500, label: '500Hz', type: 'peaking' },
  { freq: 1000, label: '1kHz', type: 'peaking' },
  { freq: 2000, label: '2kHz', type: 'peaking' },
  { freq: 4000, label: '4kHz', type: 'peaking' },
  { freq: 8000, label: '8kHz', type: 'peaking' },
  { freq: 16000, label: '16kHz', type: 'highshelf' }
]

export const EQ_PRESETS: EQPreset[] = [
  { id: 'flat', name: 'Flat', preamp: 0, gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass_boost', name: 'Bass Boost', preamp: -1.5, gains: [7, 6, 4, 2, 0, 0, 0, 0, 1, 2] },
  { id: 'treble_boost', name: 'Treble Boost', preamp: -1.5, gains: [0, 0, 0, 0, 0, 2, 4, 6, 7, 8] },
  { id: 'rock', name: 'Rock', preamp: -1.0, gains: [4.5, 3.5, 2, 0, -1, 0.5, 2.5, 4, 5, 5.5] },
  { id: 'pop', name: 'Pop', preamp: -1.0, gains: [-1, 1, 3, 4, 4, 3, 1, 0, 2, 3] },
  { id: 'electronic', name: 'Electronic', preamp: -2.0, gains: [6, 5, 2, 0, -2, 1, 3, 4, 5.5, 6] },
  { id: 'hiphop', name: 'Hip Hop', preamp: -2.0, gains: [7, 5.5, 3, 1, -1, -0.5, 1.5, 2, 3.5, 4] },
  {
    id: 'acoustic',
    name: 'Acoustic',
    preamp: -0.5,
    gains: [3, 2, 1, 1.5, 2, 2.5, 3.5, 4, 3.5, 2.5]
  },
  { id: 'vocal', name: 'Vocal Boost', preamp: -1.0, gains: [-2, -1, 0, 2, 4.5, 5, 4, 2, 0.5, -1] },
  { id: 'classical', name: 'Classical', preamp: 0, gains: [4, 3, 2, 1.5, -1, -1, 0, 2, 3.5, 4] },
  { id: 'jazz', name: 'Jazz', preamp: -0.5, gains: [3, 2.5, 1, 1.5, -1, 1, 2, 3, 3.5, 4] },
  { id: 'metal', name: 'Metal', preamp: -1.5, gains: [4, 3, 1, 0, -1, -1, 1, 3, 4.5, 5] },
  { id: 'rnb', name: 'R&B', preamp: -0.5, gains: [4, 3, 2, 1, -1, 1.5, 3, 3.5, 3, 2] },
  {
    id: 'lounge',
    name: 'Lounge',
    preamp: 0,
    gains: [-2, -1.5, 0, 1.5, 2.5, 2, 1.5, 0.5, -0.5, -1]
  },
  { id: 'edm', name: 'EDM', preamp: -1.5, gains: [5, 4.5, 2.5, 0.5, -1, 0.5, 2, 3, 4, 5] },
  { id: 'speech', name: 'Speech', preamp: -0.5, gains: [-1, 0, 1, 2.5, 4, 4, 3.5, 2.5, 1.5, 0] }
]

export function useAudioEngine(
  onTrackEnded: () => void,
  onPrevTrack?: () => void,
  onNextTrack?: () => void
) {
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const preampNodeRef = useRef<GainNode | null>(null)
  const eqFiltersRef = useRef<BiquadFilterNode[]>([])
  const pannerNodeRef = useRef<StereoPannerNode | null>(null)
  const balanceRef = useRef<number>(0)

  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [volume, setVolume] = useState<number>(0.8)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [prevVolume, setPrevVolume] = useState<number>(0.8)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  // 10-band Graphic EQ state
  const [currentEQPreset, setCurrentEQPreset] = useState<string>('flat')
  const [eqPreamp, setEqPreamp] = useState<number>(0)
  const [eqBands, setEqBands] = useState<EQBand[]>(EQ_FREQUENCIES.map((f) => ({ ...f, gain: 0 })))
  // Stereo balance (-1 = full left, +1 = full right, 0 = center)
  const [balance, setBalanceState] = useState<number>(0)

  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    active: false,
    remainingSeconds: 0,
    targetMinutes: 0,
    mode: 'duration',
    fadeVolume: true
  })
  const sleepTimerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Song-to-song transition (gentle fade-out at the tail, fade-in on the next track)
  const transitionRef = useRef<{ enabled: boolean; durationSec: number }>({
    enabled: false,
    durationSec: 2
  })

  const setSongTransition = useCallback((enabled: boolean, durationSec: number) => {
    transitionRef.current = { enabled, durationSec: Math.max(0, Math.min(6, durationSec)) }
  }, [])

  const calculateGain = (slider: number) => (slider <= 0 ? 0 : Math.pow(slider, 3))

  // Initialize Web Audio graph
  const initAudioGraph = useCallback(() => {
    if (audioCtxRef.current) return

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const audioEl = new Audio()
    audioEl.crossOrigin = 'anonymous'
    audioEl.preload = 'auto'

    const source = ctx.createMediaElementSource(audioEl)
    const preamp = ctx.createGain()
    preamp.gain.value = 1.0

    // Build 10 BiquadFilterNodes
    const filters: BiquadFilterNode[] = EQ_FREQUENCIES.map(({ freq, type }) => {
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.gain.value = 0
      f.Q.value = 1.4
      return f
    })

    // Connect filter chain
    let lastNode: AudioNode = source
    lastNode.connect(preamp)
    lastNode = preamp

    for (const filter of filters) {
      lastNode.connect(filter)
      lastNode = filter
    }

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    lastNode.connect(analyser)

    const masterGain = ctx.createGain()
    masterGain.gain.value = calculateGain(volume)
    const panner = ctx.createStereoPanner()
    panner.pan.value = balanceRef.current
    analyser.connect(panner)
    panner.connect(masterGain)
    masterGain.connect(ctx.destination)

    audioElRef.current = audioEl
    audioCtxRef.current = ctx
    sourceNodeRef.current = source
    preampNodeRef.current = preamp
    eqFiltersRef.current = filters
    pannerNodeRef.current = panner
    setAnalyserNode(analyser)
    gainNodeRef.current = masterGain

    // Audio Element Event Listeners
    audioEl.addEventListener('play', () => setIsPlaying(true))
    audioEl.addEventListener('pause', () => setIsPlaying(false))
    audioEl.addEventListener('ended', () => {
      setIsPlaying(false)
      onTrackEnded()
    })
    audioEl.addEventListener('timeupdate', () => {
      setCurrentTime(audioEl.currentTime)
      // Fade-out the tail of the current track when a song transition is enabled,
      // so the end of the song eases out before the next one fades in.
      const t = transitionRef.current
      if (
        t.enabled &&
        t.durationSec > 0 &&
        !audioEl.paused &&
        audioEl.duration &&
        audioEl.duration > 0 &&
        audioEl.currentTime > 0
      ) {
        const remaining = audioEl.duration - audioEl.currentTime
        if (remaining > 0 && remaining <= t.durationSec) {
          const g = gainNodeRef.current
          const ctx = audioCtxRef.current
          if (g && ctx) {
            const now = ctx.currentTime
            g.gain.cancelScheduledValues(now)
            g.gain.setValueAtTime(g.gain.value, now)
            g.gain.linearRampToValueAtTime(0, now + remaining)
          }
        }
      }
    })
    audioEl.addEventListener('durationchange', () => {
      if (audioEl.duration && !isNaN(audioEl.duration)) {
        setDuration(audioEl.duration)
      }
    })
    audioEl.addEventListener('waiting', () => setIsLoading(true))
    audioEl.addEventListener('canplay', () => setIsLoading(false))
    audioEl.addEventListener('error', () => {
      setIsLoading(false)
      setIsPlaying(false)
      setAudioError('Failed to decode or play audio file.')
    })
  }, [volume, onTrackEnded])

  // Play a track with streaming URL
  const playTrack = useCallback(
    async (track: Track, startTime = 0) => {
      initAudioGraph()
      const audioEl = audioElRef.current
      const ctx = audioCtxRef.current
      if (!audioEl || !ctx) return

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      setAudioError(null)
      setIsLoading(true)

      const streamUrl = window.api?.getMediaUrl
        ? window.api.getMediaUrl(track.filepath)
        : track.filepath

      // If this file is already the loaded, ready source and hasn't ended,
      // don't reassign src or seek to 0 — that would make the currently-playing
      // track jump back to the start (the "replays from start" bug) whenever
      // this was re-invoked for the same track on some incidental state change.
      const alreadyLoadedThis =
        audioEl.src === streamUrl && audioEl.readyState >= 1 && !audioEl.ended

      if (!alreadyLoadedThis) {
        audioEl.src = streamUrl
        audioEl.currentTime = startTime
      }
      audioEl.playbackRate = playbackRate

      try {
        await audioEl.play()
        setIsPlaying(true)
      } catch {
        // Autoplay may need user gesture
      } finally {
        setIsLoading(false)
      }

      // Fade-in the start of the track if a song transition is enabled.
      const t = transitionRef.current
      if (t.enabled && t.durationSec > 0 && gainNodeRef.current && audioCtxRef.current) {
        const g = gainNodeRef.current
        const c = audioCtxRef.current
        const now = c.currentTime
        g.gain.cancelScheduledValues(now)
        g.gain.setValueAtTime(0, now)
        g.gain.linearRampToValueAtTime(calculateGain(volume), now + Math.min(t.durationSec, 4))
      }

      // Sync OS MediaSession (guarded — an invalid artwork URL or missing
      // MediaMetadata must never take down the whole player).
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist || 'Unknown Artist',
            album: track.album || '',
            artwork: track.cover ? [{ src: track.cover, sizes: '512x512', type: 'image/png' }] : []
          })
        } catch {
          /* non-fatal */
        }
      }
    },
    [initAudioGraph, playbackRate, volume]
  )

  const togglePlay = useCallback(async () => {
    initAudioGraph()
    const audioEl = audioElRef.current
    const ctx = audioCtxRef.current
    if (!audioEl || !ctx) return

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    if (audioEl.paused) {
      audioEl.play().catch(() => {})
    } else {
      audioEl.pause()
    }
  }, [initAudioGraph])

  // Load a track's source and seek (without auto-playing). Used to restore
  // "current track" + resume position on startup without an autoplay gesture.
  const cue = useCallback(
    (track: Track, startTime = 0): Promise<void> => {
      initAudioGraph()
      const audioEl = audioElRef.current
      const ctx = audioCtxRef.current
      if (!audioEl || !ctx) return Promise.resolve()

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      setAudioError(null)
      const streamUrl = window.api?.getMediaUrl
        ? window.api.getMediaUrl(track.filepath)
        : track.filepath
      audioEl.src = streamUrl
      audioEl.playbackRate = playbackRate

      return new Promise<void>((resolve) => {
        const onMeta = () => {
          if (startTime > 0 && audioEl.duration && !isNaN(audioEl.duration)) {
            audioEl.currentTime = Math.min(startTime, audioEl.duration)
          }
          audioEl.pause()
          resolve()
        }
        if (audioEl.readyState >= 1) onMeta()
        else audioEl.addEventListener('loadedmetadata', onMeta, { once: true })
      })
    },
    [initAudioGraph, playbackRate]
  )

  const seek = useCallback((timeSecs: number) => {
    const audioEl = audioElRef.current
    if (!audioEl) return
    const target = Math.max(0, Math.min(audioEl.duration || 0, timeSecs))
    audioEl.currentTime = target
    setCurrentTime(target)
  }, [])

  const seekRelative = useCallback((deltaSecs: number) => {
    const audioEl = audioElRef.current
    if (!audioEl) return
    const target = Math.max(0, Math.min(audioEl.duration || 0, audioEl.currentTime + deltaSecs))
    audioEl.currentTime = target
    setCurrentTime(target)
  }, [])

  const handleVolumeChange = useCallback(
    (v: number) => {
      setVolume(v)
      if (v > 0 && isMuted) setIsMuted(false)
      const actual = calculateGain(v)
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(actual, audioCtxRef.current.currentTime)
      }
    },
    [isMuted]
  )

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false)
      handleVolumeChange(prevVolume > 0 ? prevVolume : 0.8)
    } else {
      setPrevVolume(volume)
      setIsMuted(true)
      handleVolumeChange(0)
    }
  }, [isMuted, prevVolume, volume, handleVolumeChange])

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate)
    if (audioElRef.current) {
      audioElRef.current.playbackRate = rate
    }
  }, [])

  // Equalizer controls
  const setEQBandGain = useCallback((index: number, gain: number) => {
    setEqBands((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], gain }
      return next
    })
    setCurrentEQPreset('custom')
    if (eqFiltersRef.current[index] && audioCtxRef.current) {
      eqFiltersRef.current[index].gain.setValueAtTime(gain, audioCtxRef.current.currentTime)
    }
  }, [])

  const setPreampGain = useCallback((preampDb: number) => {
    setEqPreamp(preampDb)
    setCurrentEQPreset('custom')
    if (preampNodeRef.current && audioCtxRef.current) {
      const linear = Math.pow(10, preampDb / 20)
      preampNodeRef.current.gain.setValueAtTime(linear, audioCtxRef.current.currentTime)
    }
  }, [])

  const applyEQPreset = useCallback((presetId: string) => {
    const preset = EQ_PRESETS.find((p) => p.id === presetId) || EQ_PRESETS[0]
    setCurrentEQPreset(preset.id)
    setEqPreamp(preset.preamp)

    if (preampNodeRef.current && audioCtxRef.current) {
      const linear = Math.pow(10, preset.preamp / 20)
      preampNodeRef.current.gain.setValueAtTime(linear, audioCtxRef.current.currentTime)
    }

    setEqBands((prev) =>
      prev.map((band, idx) => {
        const gain = preset.gains[idx] ?? 0
        if (eqFiltersRef.current[idx] && audioCtxRef.current) {
          eqFiltersRef.current[idx].gain.setValueAtTime(gain, audioCtxRef.current.currentTime)
        }
        return { ...band, gain }
      })
    )
  }, [])

  // Stereo balance control.
  const setBalance = useCallback((value: number) => {
    const val = Math.max(-1, Math.min(1, value))
    balanceRef.current = val
    setBalanceState(val)
    if (pannerNodeRef.current && audioCtxRef.current) {
      pannerNodeRef.current.pan.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.02)
    }
  }, [])

  // Sleep Timer logic
  const startSleepTimer = useCallback(
    (minutes: number, mode: 'duration' | 'end_of_track' = 'duration', fadeVolume = true) => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current)

      if (mode === 'end_of_track') {
        setSleepTimer({
          active: true,
          remainingSeconds: 0,
          targetMinutes: 0,
          mode: 'end_of_track',
          fadeVolume
        })
        return
      }

      const totalSecs = minutes * 60
      setSleepTimer({
        active: true,
        remainingSeconds: totalSecs,
        targetMinutes: minutes,
        mode: 'duration',
        fadeVolume
      })

      sleepTimerIntervalRef.current = setInterval(() => {
        setSleepTimer((prev) => {
          if (!prev.active || prev.remainingSeconds <= 1) {
            if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current)
            if (audioElRef.current) audioElRef.current.pause()
            setIsPlaying(false)
            return { ...prev, active: false, remainingSeconds: 0 }
          }
          // Optional gradual fade in last 20 seconds
          if (
            prev.fadeVolume &&
            prev.remainingSeconds <= 20 &&
            gainNodeRef.current &&
            audioCtxRef.current
          ) {
            const fraction = prev.remainingSeconds / 20
            gainNodeRef.current.gain.setValueAtTime(
              calculateGain(volume * fraction),
              audioCtxRef.current.currentTime
            )
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 }
        })
      }, 1000)
    },
    [volume]
  )

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current)
    setSleepTimer((prev) => ({ ...prev, active: false, remainingSeconds: 0 }))
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        calculateGain(volume),
        audioCtxRef.current.currentTime
      )
    }
  }, [volume])

  // Setup Hardware & OS MediaSession Actions
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => togglePlay())
    navigator.mediaSession.setActionHandler('pause', () => togglePlay())
    navigator.mediaSession.setActionHandler('seekbackward', () => seekRelative(-10))
    navigator.mediaSession.setActionHandler('seekforward', () => seekRelative(10))
    if (onPrevTrack) navigator.mediaSession.setActionHandler('previoustrack', onPrevTrack)
    if (onNextTrack) navigator.mediaSession.setActionHandler('nexttrack', onNextTrack)
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') seek(details.seekTime)
    })
  }, [togglePlay, seekRelative, seek, onPrevTrack, onNextTrack])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current)
      if (audioElRef.current) {
        audioElRef.current.pause()
        audioElRef.current.src = ''
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
    }
  }, [])

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isLoading,
    audioError,
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
  }
}
