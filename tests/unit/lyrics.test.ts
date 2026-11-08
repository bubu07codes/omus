import { describe, it, expect } from 'vitest'
import {
  parseLrc,
  parseWordTags,
  splitLyricWords,
  getLineWordTokens,
  getActiveWordState
} from '../../src/renderer/src/hooks/useLyrics'

// Enhanced (A2) LRC: every word carries its own <mm:ss.xx> tag.
const ENHANCED = [
  '[ti:Test Song]',
  '[ar:Somebody]',
  '[00:10.00]<00:10.00>Hel<00:10.40>lo <00:10.90>world',
  '[00:12.00]<00:12.00>Bye'
].join('\n')

describe('parseLrc — line level', () => {
  it('parses tags into sorted, offset-free lines', () => {
    const lines = parseLrc('[00:12.00]First\n[00:05.50]Second')
    expect(lines.map((l) => [l.time, l.text])).toEqual([
      [5.5, 'Second'],
      [12, 'First']
    ])
    expect(lines.every((l) => l.words === undefined)).toBe(true)
  })

  it('skips ID tags and applies the [offset:] tag', () => {
    const lines = parseLrc('[ti:Song]\n[ar:Artist]\n[offset:-500]\n[00:10.00]Hi')
    expect(lines).toHaveLength(1)
    expect(lines[0].time).toBeCloseTo(9.5)
  })

  it('lets the user offset override the file offset tag', () => {
    const [line] = parseLrc('[offset:-500]\n[00:10.00]Hi', 1000)
    expect(line.time).toBeCloseTo(11)
  })

  it('expands multiple line tags on one line', () => {
    const lines = parseLrc('[00:01.00][00:02.00]Chorus')
    expect(lines.map((l) => l.time)).toEqual([1, 2])
    expect(lines.map((l) => l.text)).toEqual(['Chorus', 'Chorus'])
  })

  it('falls back to plain text spread 4s apart', () => {
    const lines = parseLrc('one\ntwo\n\nthree')
    expect(lines.map((l) => l.time)).toEqual([0, 4, 8])
    expect(lines.map((l) => l.text)).toEqual(['one', 'two', 'three'])
  })

  it('returns nothing for empty input', () => {
    expect(parseLrc('')).toEqual([])
    expect(parseLrc('   \n  ')).toEqual([])
  })
})

describe('parseLrc — word level (enhanced LRC)', () => {
  it('extracts word timings and rebuilds the line text', () => {
    const lines = parseLrc(ENHANCED)
    expect(lines).toHaveLength(2)
    expect(lines[0].text).toBe('Hello world')
    expect(lines[0].words?.map((w) => [w.time, w.text])).toEqual([
      [10, 'Hel'],
      [10.4, 'lo '],
      [10.9, 'world']
    ])
    expect(lines[1].words?.map((w) => w.text)).toEqual(['Bye'])
  })

  it('applies the offset to word times as well', () => {
    const [line] = parseLrc('[00:10.00]<00:10.00>Hi', -250)
    expect(line.time).toBeCloseTo(9.75)
    expect(line.words?.[0].time).toBeCloseTo(9.75)
  })

  it('derives the line time from the first word tag when the line has none', () => {
    const [line] = parseLrc('<00:03.00>Word<00:03.50>s')
    expect(line.time).toBeCloseTo(3)
    expect(line.text).toBe('Words')
    expect(line.words).toHaveLength(2)
  })

  it('keeps every character when the word tags are stripped', () => {
    const [line] = parseLrc(
      '[00:01.00]<00:01.00>Hel<00:01.30>lo   <00:01.60>there <00:01.90>friend'
    )
    expect(line.words).toHaveLength(4)
    expect(line.words?.map((w) => w.text).join('')).toBe('Hello   there friend')
    expect(line.text).toBe('Hello   there friend')
  })

  it('tags the same words onto every time tag of a line', () => {
    const lines = parseLrc('[00:10.00][00:20.00]<00:10.00>Hi')
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => l.words?.length)).toEqual([1, 1])
  })

  it('ignores word tags without any text', () => {
    expect(parseLrc('<00:01.00><00:02.00>')).toEqual([])
  })

  it('sets line end times from the next line (fallback tail on the last)', () => {
    const lines = parseLrc(ENHANCED)
    expect(lines[0].endTime).toBeCloseTo(12)
    expect(lines[1].endTime).toBeGreaterThan(lines[1].time)
  })

  it('merges whitespace-only segments into the previous word', () => {
    const words = parseWordTags('<00:01.00>a<00:01.50> <00:02.00>b', 0, 1)
    expect(words?.map((w) => w.text)).toEqual(['a ', 'b'])
    expect(parseWordTags('no tags here', 0, null)).toBeNull()
  })
})

describe('splitLyricWords', () => {
  it('keeps the original text when joined back together', () => {
    for (const text of ['Hello world', 'a  b\tc', 'single', '  padded  ']) {
      expect(splitLyricWords(text).join('')).toBe(text)
    }
  })
})

describe('getLineWordTokens', () => {
  it('returns null for plain lines unless estimation is enabled', () => {
    const line = { time: 10, text: 'one two', endTime: 12 }
    expect(getLineWordTokens(line)).toBeNull()

    const tokens = getLineWordTokens(line, true)
    expect(tokens?.filter((t) => t.index >= 0).map((t) => t.text)).toEqual(['one', 'two'])
    expect(tokens?.map((t) => t.text).join('')).toBe('one two')
  })

  it('spreads estimated words over a span capped by the word count', () => {
    // 3 words over a 30s gap → span = max(1.2, 3 × 0.55) = 1.65s
    const tokens = getLineWordTokens({ time: 10, text: 'a b c', endTime: 40 }, true)!
    const words = tokens.filter((t) => t.index >= 0)
    expect(words.map((t) => t.time)).toEqual([10, 10.55, 11.1])
    expect(words[2].endTime).toBeCloseTo(11.65)
  })

  it('uses real word timings and caps the tail of the final word', () => {
    const tokens = getLineWordTokens({
      time: 0,
      text: 'Hel lo',
      endTime: 30,
      words: [
        { time: 0, text: 'Hel' },
        { time: 0.5, text: 'lo' }
      ]
    })!
    expect(tokens[0].endTime).toBeCloseTo(0.5)
    expect(tokens[1].endTime).toBeCloseTo(3) // word start + WORD_TAIL_MAX (2.5s)
  })
})

describe('getActiveWordState', () => {
  const lines = parseLrc(`${ENHANCED}\n[00:14.00]Instrumental`)

  it('reports -1 before the first word starts', () => {
    expect(getActiveWordState(lines, 0, 9.5)).toEqual({ index: -1, progress: 0 })
  })

  it('tracks the active word and how far into it we are', () => {
    const first = getActiveWordState(lines, 0, 10.2)!
    expect(first.index).toBe(0)
    expect(first.progress).toBeCloseTo(0.5)

    const second = getActiveWordState(lines, 0, 10.4)!
    expect(second.index).toBe(1)
    expect(second.progress).toBeCloseTo(0)

    const last = getActiveWordState(lines, 0, 12.5)!
    expect(last.index).toBe(2)
    expect(last.progress).toBeCloseTo(1) // clamped at the line end
  })

  it('tracks the single word of a one-word line', () => {
    const state = getActiveWordState(lines, 1, 12.5)!
    expect(state.index).toBe(0)
    expect(state.progress).toBeCloseTo(0.25)
  })

  it('returns null for lines without word data', () => {
    expect(getActiveWordState(lines, 2, 14.5)).toBeNull()
    expect(getActiveWordState(lines, 99, 14.5)).toBeNull()
  })

  it('estimates word states for plain lines when allowed', () => {
    // "Instrumental" = 1 word → span = max(1.2, 0.55) = 1.2s from 14s
    const state = getActiveWordState(lines, 2, 14.6, true)!
    expect(state.index).toBe(0)
    expect(state.progress).toBeCloseTo(0.5)
    expect(getActiveWordState(lines, 2, 15, true)?.progress).toBeCloseTo(0.833, 3)
  })
})
