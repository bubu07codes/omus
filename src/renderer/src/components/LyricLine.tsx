import { memo } from 'react'
import type { CSSProperties } from 'react'
import { LyricLine as LyricLineData, LyricAnimationType } from '../types'

// Per-line style for the chosen lyric animation mode.
// Compositor-friendly only (transform/opacity) + cheap color/text-shadow; never
// animates filter blur during the transition.
function getLyricAnim(
  isActive: boolean,
  isPast: boolean,
  lyricAnimation: LyricAnimationType,
  lyricAlignment: 'left' | 'center' | 'right',
  lyricInactiveBlur: number,
  lyricDimLevel: number,
  lyricActiveScale: number
): { className: string; style: CSSProperties } {
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
  const base: CSSProperties = {
    opacity: dim,
    color,
    filter: `blur(${blurPx}px)`,
    transformOrigin: origin
  }
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
          textShadow: isActive ? '0 0 3px var(--accent), 0 0 3px var(--accent)' : 'none',
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

interface LyricLineProps {
  line: LyricLineData
  isActive: boolean
  isPast: boolean
  lyricAnimation: LyricAnimationType
  lyricAlignment: 'left' | 'center' | 'right'
  lyricFontSize: number
  lyricLineGap: number
  lyricInactiveBlur: number
  lyricDimLevel: number
  lyricActiveScale: number
  lyricUppercase: boolean
  variant: 'normal' | 'fullscreen'
  onSeek: (time: number) => void
}

/**
 * Memoized lyric line. Props are stable between audio ticks, so only the one or
 * two lines whose active/past state actually changed re-render — this avoids
 * re-running setValueForStyles for every line on each 250ms timeupdate.
 */
export const LyricLine = memo(function LyricLine({
  line,
  isActive,
  isPast,
  lyricAnimation,
  lyricAlignment,
  lyricFontSize,
  lyricLineGap,
  lyricInactiveBlur,
  lyricDimLevel,
  lyricActiveScale,
  lyricUppercase,
  variant,
  onSeek
}: LyricLineProps) {
  const anim = getLyricAnim(
    isActive,
    isPast,
    lyricAnimation,
    lyricAlignment,
    lyricInactiveBlur,
    lyricDimLevel,
    lyricActiveScale
  )
  const animClass = `lyric-line lyric-anim-${lyricAnimation}${anim.className ? ` ${anim.className}` : ''}`
  const isFullscreen = variant === 'fullscreen'

  return (
    <div
      className={animClass}
      data-active={isActive}
      style={{
        // Constant font-size in fullscreen: resizing the active line reflows the
        // whole panel on every line change and makes it visibly "jump".
        fontSize: isFullscreen ? lyricFontSize * 1.1 : lyricFontSize,
        fontWeight: isFullscreen ? 900 : undefined,
        padding: `${lyricFontSize * lyricLineGap * (isFullscreen ? 0.9 : 1)}px 0`,
        cursor: isFullscreen ? 'pointer' : undefined,
        textTransform: lyricUppercase ? 'uppercase' : 'none',
        ...(isFullscreen
          ? { overflowWrap: 'anywhere', wordBreak: 'break-word' }
          : {}),
        ...anim.style
      }}
      onClick={() => onSeek(line.time)}
    >
      {line.text || '• • •'}
    </div>
  )
})