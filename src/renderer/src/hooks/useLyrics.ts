import { useState, useMemo, useCallback } from 'react'
import { LyricLine, Track } from '../types'

export function useLyrics() {
  const [rawLyrics, setRawLyrics] = useState<string>('')
  const [offsetMs, setOffsetMs] = useState<number>(0)
  const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(false)
  const [lyricStatus, setLyricStatus] = useState<string>('Ready')

  // Parse LRC into sorted LyricLine array
  const parsedLyrics = useMemo<LyricLine[]>(() => {
    if (!rawLyrics || !rawLyrics.trim()) return []

    const lines = rawLyrics.split(/\r?\n/)
    const timeTagRegex = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g
    const parsed: LyricLine[] = []
    let hasTimeTags = false

    // Apply an [offset:] tag from the file unless the user has manually
    // calibrated an offset (offsetMs !== 0) on top of it.
    const offsetTagMatch = rawLyrics.match(/^\s*\[offset:\s*([+-]?\d+)\s*\]\s*$/im)
    const appliedOffsetMs = offsetTagMatch ? parseInt(offsetTagMatch[1], 10) : 0
    const timeOffsetMs = offsetMs === 0 ? appliedOffsetMs : offsetMs

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Ignore ID tags like [ar: Artist], [ti: Title], etc.
      if (/^\[(ti|ar|al|by|offset|length|re|ve):/i.test(trimmed)) {
        continue
      }

      const matches = Array.from(trimmed.matchAll(timeTagRegex))
      if (matches.length > 0) {
        hasTimeTags = true
        const text = trimmed.replace(timeTagRegex, '').trim()
        for (const match of matches) {
          const minutes = parseInt(match[1], 10)
          const seconds = parseFloat(match[2])
          const time = minutes * 60 + seconds + timeOffsetMs / 1000
          parsed.push({ time: Math.max(0, time), text: text || '• • •' })
        }
      }
    }

    if (hasTimeTags) {
      return parsed.sort((a, b) => a.time - b.time)
    }

    // Fallback for plain text lyrics: spread across artificial indices
    return lines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        time: idx * 4,
        text
      }))
  }, [rawLyrics, offsetMs])

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
    offsetMs,
    adjustOffset,
    resetOffset,
    getActiveLyricIndex,
    fetchLyricsFromOnline,
    isFetchingLyrics,
    lyricStatus
  }
}
