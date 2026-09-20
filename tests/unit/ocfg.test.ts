import { describe, it, expect } from 'vitest'
import { gzipSync } from 'zlib'
import { decodeOcfg, encodeOcfg, OCFG_MAGIC } from '../../src/main/ocfg'

describe('.ocfg codec', () => {
  // Repetitive enough that gzip must shrink it well below the raw JSON size.
  const settings = {
    themeId: 'nord',
    eqBands: [0, 1, -2, 3, -4, 5, -6, 7, -8, 9],
    fluidBgMode: 'aurora',
    playCounts: Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [`C:\\music\\album ${i}\\song title ${i}.flac`, i * 3])
    )
  }

  it('round-trips settings through encode → decode', () => {
    expect(decodeOcfg(encodeOcfg(settings))).toEqual(settings)
  })

  it('starts with the omus magic header and stays tiny', () => {
    const buf = encodeOcfg(settings)
    expect(buf.subarray(0, OCFG_MAGIC.length).toString('utf-8')).toBe(OCFG_MAGIC)
    const raw = Buffer.from(JSON.stringify(settings), 'utf-8')
    expect(buf.length).toBeLessThan(raw.length)
  })

  it('accepts headerless gzip payloads', () => {
    const gz = gzipSync(Buffer.from(JSON.stringify(settings), 'utf-8'))
    expect(decodeOcfg(gz)).toEqual(settings)
  })

  it('accepts plain JSON payloads (hand-edited files)', () => {
    const json = Buffer.from(JSON.stringify(settings), 'utf-8')
    expect(decodeOcfg(json)).toEqual(settings)
  })

  it('rejects garbage, arrays, empty buffers and corrupt bodies', () => {
    expect(decodeOcfg(Buffer.from('this is not omus data', 'utf-8'))).toBeNull()
    expect(decodeOcfg(Buffer.from('[1,2,3]', 'utf-8'))).toBeNull()
    expect(decodeOcfg(Buffer.alloc(0))).toBeNull()
    const corrupt = Buffer.concat([Buffer.from(OCFG_MAGIC, 'utf-8'), Buffer.from('junk', 'utf-8')])
    expect(decodeOcfg(corrupt)).toBeNull()
  })
})
