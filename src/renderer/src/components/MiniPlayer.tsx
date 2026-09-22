import React, { useEffect, useRef, useState } from 'react'
import { NiceSlider, volumeToSliderPos, sliderPosToVolume } from './NiceSlider'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Volume2,
  VolumeX,
  Music,
  GripHorizontal
} from 'lucide-react'
import type { Track } from '../types'

interface MiniPlayerProps {
  track: Track | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  onTogglePlay: () => void
  onPrev: () => void
  onNext: () => void
  onSeek: (time: number) => void
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onRestore: () => void
  onClose: () => void
}

/**
 * Always-on-top corner widget shown when the app is docked into mini-player mode.
 * The window keeps a fixed size; at rest only the album cover is visible. Moving
 * the mouse over the widget slides a glassy playback panel in over its bottom and
 * it hides again once the mouse leaves — track info, a click-drag scrubber,
 * transport buttons, a side-revealed volume slider, restore and close.
 *
 * Dragging is handled by a slim drag strip at the top of the widget
 * (`-webkit-app-region: drag`); the rest of the surface stays hoverable.
 */
export function MiniPlayer({
  track,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleMute,
  onVolumeChange,
  onRestore,
  onClose: _onClose
}: MiniPlayerProps): React.ReactElement {
  const scrubRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState(false)
  const [volOpen, setVolOpen] = useState(false)
  const scrubbingRef = useRef(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending hide timer on unmount.
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  const handleEnter = (): void => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setHovered(true)
  }

  const handleLeave = (): void => {
    // Small delay so moving between controls or brushing the edge doesn't flicker.
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      setHovered(false)
      setVolOpen(false)
    }, 120)
  }

  const seekFromClientX = (clientX: number): void => {
    const el = scrubRef.current
    if (!el || duration <= 0) return
    const rect = el.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek(pct * duration)
  }

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0
  const formatTime = (secs: number): string => {
    if (Number.isNaN(secs) || secs < 0) return '0:00'
    return `${Math.floor(secs / 60)}:${Math.floor(secs % 60)
      .toString()
      .padStart(2, '0')}`
  }

  return (
    <div
      className={`mini-player${hovered ? ' show' : ''}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Cover art */}
      <div className="mini-cover" aria-hidden="true">
        {track?.cover ? (
          <img src={track.cover} alt="" draggable={false} />
        ) : (
          <div className="mini-no-cover">
            <Music size={46} opacity={0.5} />
          </div>
        )}
      </div>

      {/* Idle indicators (visible without hover) */}
      {isPlaying && !isLoading && (
        <div className="mini-eq" title="Playing" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {isLoading && <div className="mini-loading-dot" title="Loading…" />}

      <div className="mini-grip" title="Drag to move" aria-hidden="true">
        <GripHorizontal size={15} />
      </div>
      <div className="mini-panel">
        <div className="mini-panel-info">
          <div className="mini-title" title={track?.title || ''}>
            {track?.title || 'Nothing playing'}
          </div>
          <div className="mini-artist" title={track?.artist || ''}>
            {track?.artist || 'Unknown Artist'}
          </div>
        </div>

        <div
          ref={scrubRef}
          className="mini-scrub"
          onPointerDown={(e) => {
            e.preventDefault()
            scrubbingRef.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            seekFromClientX(e.clientX)
          }}
          onPointerMove={(e) => {
            if (scrubbingRef.current) seekFromClientX(e.clientX)
          }}
          onPointerUp={() => {
            scrubbingRef.current = false
          }}
          onPointerCancel={() => {
            scrubbingRef.current = false
          }}
          title="Seek"
        >
          <div className="mini-scrub-fill" style={{ transform: `scaleX(${progress})` }} />
          <div className="mini-scrub-ball" style={{ left: `${progress * 100}%` }} />
        </div>

        <div className="mini-times">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mini-transport">
          <button
            type="button"
            className="mini-btn"
            onClick={onPrev}
            title="Previous (Shift+←)"
            aria-label="Previous"
          >
            <SkipBack size={17} />
          </button>
          <button
            type="button"
            className="mini-btn mini-play"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>
          <button
            type="button"
            className="mini-btn"
            onClick={onNext}
            title="Next (Shift+→)"
            aria-label="Next"
          >
            <SkipForward size={17} />
          </button>
        </div>

        <div className="mini-actions">
          <div
            className="mini-volwrap"
            onMouseEnter={() => setVolOpen(true)}
            onMouseLeave={() => setVolOpen(false)}
          >
            <button
              type="button"
              className="mini-btn"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <div
              className={`mini-volslider${volOpen ? ' open' : ''}`}
              onMouseEnter={() => setVolOpen(true)}
              onMouseLeave={() => setVolOpen(false)}
            >
              <NiceSlider
                min={0}
                max={1}
                step={0.01}
                value={volumeToSliderPos(isMuted ? 0 : volume)}
                onChange={(p) => onVolumeChange(sliderPosToVolume(p))}
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                ariaLabel="Volume"
              />
            </div>
          </div>

          <div className="mini-actions-right">
            <button
              type="button"
              className="mini-btn"
              onClick={onRestore}
              title="Restore full window"
              aria-label="Restore full window"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
