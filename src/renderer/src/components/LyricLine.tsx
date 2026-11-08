import { memo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { LyricLine as LyricLineData, LyricAnimationType, LyricWordSyncMode } from '../types'
import { getLineWordTokens, LyricWordState } from '../hooks/useLyrics'

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
  // The active line gets `filter: none` (not `blur(0px)`): a no-op filter still
  // forces the whole line onto a re-rastered render surface, which makes the
  // per-word repaints shimmer/flicker. `none` keeps the active line on the
  // normal paint path and is cheaper too.
  const base: CSSProperties = {
    opacity: dim,
    color,
    filter: isActive ? 'none' : `blur(${blurPx}px)`,
    transformOrigin: origin
  }
  const smooth = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease, color 0.55s ease'

  switch (lyricAnimation) {
    case 'slide':
      return {
        className: '',
        style: {
          ...base,
          transform: isActive ? 'translateX(0)' : isPast ? 'translateX(18px)' : 'translateX(-14px)',
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
          filter: isActive ? 'none' : `blur(${blurPx * 0.3}px)`,
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

// Wrap text inside (brackets) in a smaller, quieter span so backing vocals /
// ad-libs are less distracting. When `small` is off the plain text is returned
// unchanged (no extra spans, no render cost).
function renderBracketedText(text: string, small: boolean): ReactNode {
  if (!small) return text
  const parts = text.split(/\(([^)]*)\)/g)
  // parts: [before1, bracket1, after1, before2, bracket2, after2, ...]
  // odd indices are the captured bracket contents (without parens).
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={`br-${i}`} className="lyric-bracket">
        {`(${part})`}
      </span>
    ) : (
      <span key={`tx-${i}`}>{part}</span>
    )
  )
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
  lyricBracketsSmall: boolean
  variant: 'normal' | 'fullscreen'
  /** Word-by-word (karaoke) mode — `off` renders the line as one plain block. */
  wordSyncMode: LyricWordSyncMode
  /** Word state of the ACTIVE line (null for every other line — keeps memo stable). */
  wordState: LyricWordState | null
  onSeek: (time: number) => void
}

type WordVisualState = 'sung' | 'active' | 'upcoming'

/**
 * Memoized lyric line. Props are stable between audio ticks, so only the one or
 * two lines whose active/past state actually changed re-render — this avoids
 * re-running setValueForStyles for every line on each 250ms timeupdate. In
 * word-by-word mode only the active line re-renders per tick (its `wordState`
 * changes), which is exactly what the karaoke highlight needs.
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
  lyricBracketsSmall,
  variant,
  wordSyncMode,
  wordState,
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

  // Word tokens: real word timings when the LRC has them, or evenly spread
  // words in "Estimate" mode — otherwise null and the line renders plain.
  const tokens =
    wordSyncMode === 'off' ? null : getLineWordTokens(line, wordSyncMode === 'interpolate')

  let content: ReactNode = renderBracketedText(line.text || '• • •', lyricBracketsSmall)
  if (tokens) {
    content = (
      <span className="lyric-words">
        {tokens.map((token, i) => {
          // Whitespace between words: render verbatim, never highlighted.
          if (token.index < 0) return renderBracketedText(token.text, lyricBracketsSmall)

          const state: WordVisualState = isPast
            ? 'sung'
            : isActive && wordState
              ? token.index < wordState.index
                ? 'sung'
                : token.index === wordState.index
                  ? 'active'
                  : 'upcoming'
              : 'upcoming'

          return (
            <span
              key={i}
              className="lyric-word"
              data-state={state}
              // Progress through the word being sung. It only drives a
              // TRANSFORM on the ::after pill (never the text itself), so the
              // browser animates a cheap box instead of re-rasterising glyphs —
              // that is what keeps the karaoke fill free of flicker.
              style={
                state === 'active'
                  ? ({
                      '--lyric-word-progress': (
                        0.35 +
                        0.65 * Math.min(1, Math.max(0, wordState?.progress ?? 0))
                      ).toFixed(3)
                    } as CSSProperties)
                  : undefined
              }
              onClick={(e) => {
                // Word-level seek (stop the line-level handler from overriding it).
                e.stopPropagation()
                onSeek(token.time)
              }}
            >
              {token.text}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <div
      className={animClass}
      data-active={isActive}
      data-word-sync={tokens ? 'true' : undefined}
      style={{
        // Constant font-size in fullscreen: resizing the active line reflows the
        // whole panel on every line change and makes it visibly "jump".
        fontSize: isFullscreen ? lyricFontSize * 1.1 : lyricFontSize,
        fontWeight: isFullscreen ? 900 : undefined,
        padding: `${lyricFontSize * lyricLineGap * (isFullscreen ? 0.9 : 1)}px 0`,
        cursor: isFullscreen ? 'pointer' : undefined,
        textTransform: lyricUppercase ? 'uppercase' : 'none',
        ...(isFullscreen ? { overflowWrap: 'anywhere', wordBreak: 'break-word' } : {}),
        ...anim.style
      }}
      onClick={() => onSeek(line.time)}
    >
      {content}
    </div>
  )
})
