import { useState, useMemo, useCallback } from 'react'
import { LyricLine, LyricWord, Track } from '../types'

// ---------------------------------------------------------------------------
// LRC parsing (the exported helpers are pure → unit-tested in tests/unit/lyrics.test.ts)
// ---------------------------------------------------------------------------

/** Line-level tag: `[mm:ss]`, `[mm:ss.xx]` or `[mm:ss.xxx]`. */
const LINE_TAG_SOURCE = '\\[(\\d{1,2}):(\\d{1,2}(?:\\.\\d{1,3})?)\\]'
/** Word-level tag used by enhanced (A2) LRC: `<mm:ss.xx>word`. */
const WORD_TAG_SOURCE = '<(\\d{1,2}):(\\d{1,2}(?:\\.\\d{1,3})?)>'
/** Non-global probe for "does this line carry a word tag at all?". */
const WORD_TAG_RE = new RegExp(WORD_TAG_SOURCE)
/** `[ti: …] [ar: …] …` metadata tags that must never become lyric lines. */
const ID_TAG_RE = /^\[(ti|ar|al|by|offset|length|re|ve):/i

/** Line length (seconds) assumed for the last line / a line without a successor. */
const LINE_TAIL_FALLBACK = 4
/** How long (seconds) the final word of a line keeps filling at most. */
const WORD_TAIL_MAX = 2.5

// --- Estimated (karaoke) word timing -------------------------------------
// Plain line-synced lyrics (LRCLIB & friends) have no word timings, so the
// words of a line are given a plausible shape instead of an even split:
// a base time + one step per syllable, plus the pause a trailing comma/stop
// implies. That shape is then scaled onto the line's REAL span (gap to the
// next line) and clamped, so fast lines compress and long instrumental gaps
// don't leave a word crawling across the screen.
/** Base sung time of any word (seconds). */
const WORD_BASE_SECONDS = 0.18
/** Extra time per syllable (≈ 3 syllables/second of singing). */
const SYLLABLE_SECONDS = 0.34
/** Pause (seconds) after a trailing , ; : — – */
const SOFT_PAUSE_SECONDS = 0.22
/** Pause (seconds) after a trailing . ! ? … */
const HARD_PAUSE_SECONDS = 0.5
/** Floor for a single estimated word, so nothing flashes past. */
const MIN_WORD_SECONDS = 0.3
/** Never stretch one line's estimate beyond this (long instrumental breaks). */
const MAX_ESTIMATED_SPAN = 12
/** Minimum time the words of a line should be spread over, even for a tiny line. */
const MIN_ESTIMATED_SPAN = 1.2
/** Default target seconds allocated per estimated word. */
const ESTIMATE_WORD_STEP = 0.55
/** Lines rarely butt right up against the next one — end the estimate a bit early. */
const ESTIMATE_TAIL_TRIM = 0.94

/**
 * One renderable piece of a word-synced line. Words keep their original text
 * (including trailing spaces) so joining every token reproduces the line
 * byte-for-byte; `index` is -1 for filler whitespace, which is rendered as-is
 * and never highlighted.
 */
export interface LyricWordToken {
  text: string
  index: number
  time: number
  endTime: number
}

/** Which word of a line is currently being sung, plus how far into it we are. */
export interface LyricWordState {
  /** Index of the active word, or -1 before the first word starts. */
  index: number
  /** 0…1 progress through the active word (drives the karaoke fill). */
  progress: number
}

/** `mm:ss[.xxx]` tag groups → absolute seconds (no offset applied). */
function tagToSeconds(minutes: string, seconds: string): number {
  return parseInt(minutes, 10) * 60 + parseFloat(seconds)
}

/**
 * Split a line into word tokens while preserving the whitespace between them,
 * so `splitLyricWords(text).join('') === text`.
 */
export function splitLyricWords(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token !== '')
}

/**
 * Parse inline `<mm:ss.xx>` word tags. Returns `null` when the line has none
 * (=> plain line-synced lyrics). `lineStart` is the line's own time tag (when
 * present) and is used for any text that appears before the first word tag.
 */
export function parseWordTags(
  content: string,
  timeOffset: number,
  lineStart: number | null
): LyricWord[] | null {
  const regex = new RegExp(WORD_TAG_SOURCE, 'g')
  const words: LyricWord[] = []
  let lastIndex = 0
  let pendingTime: number | null = null
  let match: RegExpExecArray | null

  const pushWord = (text: string, time: number): void => {
    if (!text) return
    if (!text.trim()) {
      // Whitespace-only segment: keep it glued to the previous word so the
      // rebuilt line stays identical to the source.
      if (words.length > 0) words[words.length - 1].text += text
      return
    }
    words.push({ time: Math.max(0, time), text })
  }

  while ((match = regex.exec(content)) !== null) {
    const time = tagToSeconds(match[1], match[2]) + timeOffset
    const segment = content.slice(lastIndex, match.index)

    if (pendingTime === null) {
      // Text (if any) in front of the first word tag belongs to the line start.
      if (segment.trim()) pushWord(segment, lineStart ?? time)
    } else {
      pushWord(segment, pendingTime)
    }

    pendingTime = time
    lastIndex = regex.lastIndex
  }

  if (pendingTime === null) return null // no word tags at all
  pushWord(content.slice(lastIndex), pendingTime)
  return words.length > 0 ? words : null
}

/**
 * Parse raw LRC into a sorted `LyricLine[]`. Supports:
 *  - multiple `[mm:ss.xx]` line tags on one line,
 *  - `[offset:±ms]` (overridden by the user's manual `offsetMs`),
 *  - enhanced (A2) LRC word tags `<mm:ss.xx>word`,
 *  - a plain-text fallback (lines spread 4s apart).
 */
export function parseLrc(raw: string, offsetMs = 0): LyricLine[] {
  if (!raw || !raw.trim()) return []

  const lines = raw.split(/\r?\n/)
  const parsed: LyricLine[] = []
  let hasTimeTags = false

  // Apply an [offset:] tag from the file unless the user has manually
  // calibrated an offset (offsetMs !== 0) on top of it.
  const offsetTagMatch = raw.match(/^\s*\[offset:\s*([+-]?\d+)\s*\]\s*$/im)
  const appliedOffsetMs = offsetTagMatch ? parseInt(offsetTagMatch[1], 10) : 0
  const timeOffset = (offsetMs === 0 ? appliedOffsetMs : offsetMs) / 1000

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Ignore ID tags like [ar: Artist], [ti: Title], etc.
    if (ID_TAG_RE.test(trimmed)) continue

    const matches = Array.from(trimmed.matchAll(new RegExp(LINE_TAG_SOURCE, 'g')))
    const content = trimmed.replace(new RegExp(LINE_TAG_SOURCE, 'g'), '').trim()
    const lineStart =
      matches.length > 0 ? tagToSeconds(matches[0][1], matches[0][2]) + timeOffset : null
    const words = parseWordTags(content, timeOffset, lineStart)

    // A line with neither `[..]` nor `<..>` tags is not synced at all.
    if (matches.length === 0 && !words) {
      // Word tags without any text still prove the file is word-timed — dropping
      // such a line beats falling back to raw text (which would show the tags).
      if (WORD_TAG_RE.test(trimmed)) hasTimeTags = true
      continue
    }
    hasTimeTags = true

    const text = words
      ? words
          .map((w) => w.text)
          .join('')
          .trim()
      : content
    // Tags present but no words (e.g. `<..><..>`): fall back to the line text.
    const lineWords = words && text ? words : undefined

    // Enhanced LRC without a line tag: the first word tag starts the line.
    const times =
      matches.length > 0
        ? matches.map((m) => tagToSeconds(m[1], m[2]) + timeOffset)
        : [lineWords![0].time]

    for (const time of times) {
      parsed.push({
        time: Math.max(0, time),
        text: text || '• • •',
        ...(lineWords ? { words: lineWords } : {})
      })
    }
  }

  if (hasTimeTags) {
    parsed.sort((a, b) => a.time - b.time)
    // Line end times: the next line's start when it moves forward in time,
    // otherwise a short fallback tail (last line, duplicate timestamps, …).
    for (let i = 0; i < parsed.length; i++) {
      const next = parsed[i + 1]
      parsed[i].endTime =
        next && next.time > parsed[i].time + 0.25 ? next.time : parsed[i].time + LINE_TAIL_FALLBACK
    }
    return parsed
  }

  // Fallback for plain text lyrics: spread across artificial indices
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text, idx) => ({
      time: idx * 4,
      text
    }))
}

/**
 * Rough syllable count of a word (vowel-group heuristic) — good enough to give
 * "beautiful" three times the singing time of "I", which is what makes the
 * estimated karaoke timing read naturally. 0 for punctuation/emoji-only tokens.
 */
export function estimateSyllables(text: string): number {
  const word = text.toLowerCase().replace(/[^a-zà-ÿ0-9']/g, '')
  if (!word) return 0
  const groups = word.match(/[aeiouyàâäáãåèêëéíîïóôöõúûüœæ]+/g)
  if (!groups) return 1 // "Shh", "Mmm", "rhythm" → at least one beat
  // A silent trailing "e" ("there", "make") doesn't add a syllable.
  const silentE = groups.length > 1 && /[^aeiou]e$/.test(word) ? 1 : 0
  return Math.max(1, groups.length - silentE)
}

/** Estimated sung time (seconds) of one word, including a trailing pause. */
export function estimateWordDuration(text: string): number {
  const syllables = estimateSyllables(text)
  const trimmed = text.trim()
  const base =
    syllables > 0
      ? WORD_BASE_SECONDS + syllables * SYLLABLE_SECONDS
      : WORD_BASE_SECONDS + Math.min(8, trimmed.length || 1) * 0.05 // "♪", "—", …
  const pause = /[.!?…]$/.test(trimmed)
    ? HARD_PAUSE_SECONDS
    : /[,;:—–-]$/.test(trimmed)
      ? SOFT_PAUSE_SECONDS
      : 0
  return Math.max(MIN_WORD_SECONDS, base + pause)
}

/**
 * Renderable tokens for a word-synced line, or `null` when the line should be
 * rendered as one plain block:
 *  - real word timings (`line.words`) are always used when present,
 *  - otherwise the words are given estimated timings — only when
 *    `allowEstimate` is set (the "Estimate" word-sync mode).
 */
export function getLineWordTokens(line: LyricLine, allowEstimate = false): LyricWordToken[] | null {
  const words = line.words
  if (words && words.length > 0) {
    return words.map((word, i) => {
      const next = words[i + 1]
      const tail = Math.min(line.endTime ?? word.time + WORD_TAIL_MAX, word.time + WORD_TAIL_MAX)
      const endTime = next ? next.time : tail
      return {
        text: word.text,
        index: i,
        time: word.time,
        endTime: Math.max(word.time + 0.05, endTime)
      }
    })
  }

  if (!allowEstimate || !line.text.trim()) return null
  const tokens = splitLyricWords(line.text)
  const singable = tokens.filter((t) => t.trim().length > 0)
  if (singable.length === 0) return null

  const lineGap = Math.max(
    0.4,
    ((line.endTime ?? line.time + LINE_TAIL_FALLBACK) - line.time) * ESTIMATE_TAIL_TRIM
  )
  const span = Math.max(
    MIN_ESTIMATED_SPAN,
    Math.min(lineGap, MAX_ESTIMATED_SPAN, singable.length * ESTIMATE_WORD_STEP)
  )
  const wordDuration = span / singable.length

  const out: LyricWordToken[] = []
  const cursor = line.time
  let wordIndex = 0
  for (const text of tokens) {
    if (!text.trim()) {
      // Whitespace between words: filler, never highlighted.
      out.push({ text, index: -1, time: cursor, endTime: cursor })
      continue
    }
    const t = Math.round((line.time + wordIndex * wordDuration) * 1000) / 1000
    const endT = Math.round((line.time + (wordIndex + 1) * wordDuration) * 1000) / 1000
    out.push({ text, index: wordIndex, time: t, endTime: endT })
    wordIndex += 1
  }
  return out
}

/**
 * Which word of `lines[lineIndex]` is being sung at `currentTime`
 * (+ how far into it we are). `null` when the line has no word-sync data.
 */
export function getActiveWordState(
  lines: LyricLine[],
  lineIndex: number,
  currentTime: number,
  allowEstimate = false
): LyricWordState | null {
  const line = lines[lineIndex]
  if (!line) return null

  const tokens = getLineWordTokens(line, allowEstimate)
  if (!tokens) return null

  let active = -1
  for (const token of tokens) {
    if (token.index < 0) continue
    if (currentTime >= token.time) active = token.index
    else break
  }
  if (active < 0) return { index: -1, progress: 0 }

  const token = tokens.find((t) => t.index === active)
  if (!token) return { index: -1, progress: 0 }

  const span = token.endTime - token.time
  const progress = span > 0 ? Math.min(1, Math.max(0, (currentTime - token.time) / span)) : 1
  return { index: active, progress }
}

export function useLyrics() {
  const [rawLyrics, setRawLyrics] = useState<string>('')
  const [offsetMs, setOffsetMs] = useState<number>(0)
  const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(false)
  const [lyricStatus, setLyricStatus] = useState<string>('Ready')

  // Parse LRC into sorted LyricLine array (word tags included)
  const parsedLyrics = useMemo<LyricLine[]>(
    () => parseLrc(rawLyrics, offsetMs),
    [rawLyrics, offsetMs]
  )

  // True when the loaded lyrics actually carry word-level timings.
  const hasWordTimings = useMemo(
    () => parsedLyrics.some((line) => (line.words?.length ?? 0) > 0),
    [parsedLyrics]
  )

  const getActiveLyricIndex = useCallback(
    (currentTime: number): number => {
      if (parsedLyrics.length === 0) return -1
      let activeIdx = -1
      for (let i = 0; i < parsedLyrics.length; i++) {
        if (currentTime >= parsedLyrics[i].time) {
          activeIdx = i
        } else {
          break
        }
      }
      return activeIdx
    },
    [parsedLyrics]
  )

  /** Word-by-word state for one line (null when the line has no word data). */
  const getWordState = useCallback(
    (lineIndex: number, currentTime: number, allowEstimate: boolean): LyricWordState | null =>
      getActiveWordState(parsedLyrics, lineIndex, currentTime, allowEstimate),
    [parsedLyrics]
  )

  const fetchLyricsFromOnline = useCallback(async (track: Track): Promise<string | null> => {
    const cleanTitle = track.title.trim()
    const cleanArtist = track.artist.trim()
    if (!cleanTitle && !cleanArtist) {
      setLyricStatus('Title or Artist required')
      return null
    }

    setIsFetchingLyrics(true)
    setLyricStatus('Searching LRCLIB...')

    try {
      // 1. Try exact match
      const url = new URL('https://lrclib.net/api/get')
      url.searchParams.append('track_name', cleanTitle)
      url.searchParams.append('artist_name', cleanArtist)
      if (track.album) url.searchParams.append('album_name', track.album.trim())
      if (track.duration > 0)
        url.searchParams.append('duration', Math.round(track.duration).toString())

      const res = await fetch(url.toString(), {
        headers: { 'Lrclib-Client': 'omus v1.0.0 (https://github.com/omus-music)' }
      })

      if (res.ok) {
        const data = await res.json()
        const fetched = data.syncedLyrics || data.plainLyrics || ''
        if (fetched) {
          setRawLyrics(fetched)
          setLyricStatus('Lyrics Synced')
          setIsFetchingLyrics(false)
          return fetched
        }
      }

      // 2. Fallback search query
      const searchQuery = `${cleanArtist} ${cleanTitle}`.trim()
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`
      const searchRes = await fetch(searchUrl, {
        headers: { 'Lrclib-Client': 'omus v1.0.0' }
      })

      if (searchRes.ok) {
        const results = await searchRes.json()
        if (Array.isArray(results) && results.length > 0) {
          const bestMatch =
            results.find((r) => r.syncedLyrics) || results.find((r) => r.plainLyrics) || results[0]
          const fetched = bestMatch.syncedLyrics || bestMatch.plainLyrics || ''
          if (fetched) {
            setRawLyrics(fetched)
            setLyricStatus('Lyrics Found')
            setIsFetchingLyrics(false)
            return fetched
          }
        }
      }

      setLyricStatus('No lyrics found')
    } catch {
      setLyricStatus('Search failed')
    }

    setIsFetchingLyrics(false)
    return null
  }, [])

  const adjustOffset = useCallback((deltaMs: number) => {
    setOffsetMs((prev) => prev + deltaMs)
  }, [])

  const resetOffset = useCallback(() => {
    setOffsetMs(0)
  }, [])

  return {
    rawLyrics,
    setRawLyrics,
    parsedLyrics,
    hasWordTimings,
    offsetMs,
    setOffsetMs,
    adjustOffset,
    resetOffset,
    getActiveLyricIndex,
    getWordState,
    fetchLyricsFromOnline,
    isFetchingLyrics,
    lyricStatus
  }
}
