import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  X,
  Music,
  Mic2,
  Disc3,
  ListMusic,
  ArrowRight
} from 'lucide-react'
import { Track, Playlist } from '../types'

// Album grouping key separator, must match the one used in App.tsx
// (groupKeyOf / homeAlbums): `${artist}│${album}`.
const ALBUM_SEP = '\u2502'

export type SearchItemType = 'track' | 'artist' | 'album' | 'playlist'

interface SearchItem {
  type: SearchItemType
  id: string
  title: string
  sub: string
  cover?: string
  track?: Track
  artistName?: string
  albumKey?: string
  playlist?: Playlist
}

interface SearchSection {
  label: string
  items: SearchItem[]
}

export interface GlobalSearchProps {
  tracks: Track[]
  playlists: Playlist[]
  onPlayTrack: (t: Track) => void
  onOpenAlbum: (key: string) => void
  onOpenArtist: (name: string) => void
  onOpenPlaylist: (id: string) => void
  onSearchLibrary: (q: string) => void
}

export function GlobalSearch({
  tracks,
  playlists,
  onPlayTrack,
  onOpenAlbum,
  onOpenArtist,
  onOpenPlaylist,
  onSearchLibrary
}: GlobalSearchProps): React.ReactElement {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sections = useMemo<SearchSection[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: SearchSection[] = []

    // Tracks
    const trackHits = tracks.filter((t) =>
      `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q)
    )
    if (trackHits.length > 0) {
      out.push({
        label: 'Tracks',
        items: trackHits.slice(0, 6).map((t) => ({
          type: 'track',
          id: t.id,
          title: t.title,
          sub: [t.artist, t.album].filter((s) => s).join(' · ') || 'Unknown Artist',
          cover: t.cover || undefined,
          track: t
        }))
      })
    }

    // Artists (unique)
    const artistMap = new Map<string, { name: string; count: number; cover?: string }>()
    for (const t of tracks) {
      const name = t.artist || 'Unknown Artist'
      const entry = artistMap.get(name)
      if (entry) {
        entry.count++
        if (!entry.cover && t.cover) entry.cover = t.cover
      } else {
        artistMap.set(name, { name, count: 1, cover: t.cover || undefined })
      }
    }
    const artistHits = [...artistMap.values()].filter((a) =>
      a.name.toLowerCase().includes(q)
    )
    if (artistHits.length > 0) {
      out.push({
        label: 'Artists',
        items: artistHits.slice(0, 5).map((a) => ({
          type: 'artist',
          id: `artist:${a.name}`,
          title: a.name,
          sub: `${a.count} ${a.count === 1 ? 'track' : 'tracks'}`,
          cover: a.cover,
          artistName: a.name
        }))
      })
    }
    // Albums (unique by artist│album)
    const albumMap = new Map<
      string,
      { key: string; artist: string; album: string; count: number; cover?: string }
    >()
    for (const t of tracks) {
      const artist = t.artist || 'Unknown Artist'
      const album = t.album || 'Unknown Album'
      const key = `${artist}${ALBUM_SEP}${album}`
      const entry = albumMap.get(key)
      if (entry) {
        entry.count++
        if (!entry.cover && t.cover) entry.cover = t.cover
      } else {
        albumMap.set(key, {
          key,
          artist,
          album,
          count: 1,
          cover: t.cover || undefined
        })
      }
    }
    const albumHits = [...albumMap.values()].filter((a) =>
      `${a.album} ${a.artist}`.toLowerCase().includes(q)
    )
    if (albumHits.length > 0) {
      out.push({
        label: 'Albums',
        items: albumHits.slice(0, 5).map((a) => ({
          type: 'album',
          id: `album:${a.key}`,
          title: a.album,
          sub: `${a.artist} · ${a.count} ${a.count === 1 ? 'track' : 'tracks'}`,
          cover: a.cover,
          albumKey: a.key
        }))
      })
    }

    // Playlists
    const playlistHits = playlists.filter((p) => p.name.toLowerCase().includes(q))
    if (playlistHits.length > 0) {
      out.push({
        label: 'Playlists',
        items: playlistHits.slice(0, 5).map((p) => ({
          type: 'playlist',
          id: p.id,
          title: p.name,
          sub: 'Playlist',
          playlist: p
        }))
      })
    }

    return out
  }, [query, tracks, playlists])
const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections])

  // Focus global search with Ctrl+K / Cmd+K
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    }
    document.addEventListener('keydown', onGlobalKey)
    return () => document.removeEventListener('keydown', onGlobalKey)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const onDocDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  const runSearchLibrary = (): void => {
    const q = query.trim()
    if (!q) return
    onSearchLibrary(q)
    setQuery('')
    setOpen(false)
  }

  const selectItem = (item: SearchItem): void => {
    if (item.type === 'track' && item.track) onPlayTrack(item.track)
    else if (item.type === 'artist' && item.artistName) onOpenArtist(item.artistName)
    else if (item.type === 'album' && item.albumKey) onOpenAlbum(item.albumKey)
    else if (item.type === 'playlist' && item.playlist) onOpenPlaylist(item.playlist.id)
    setQuery('')
    setOpen(false)
  }

  const handleInputKey = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (flatItems.length > 0) setActiveIdx((i) => (i + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (flatItems.length > 0)
        setActiveIdx((i) => (i - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems[activeIdx]) {
        selectItem(flatItems[activeIdx])
      } else {
        runSearchLibrary()
      }
    }
  }

  const Thumb = ({ item }: { item: SearchItem }): React.ReactElement => {
    if (item.cover) {
      return (
        <span className="gs-thumb">
          <img src={item.cover} alt="" />
        </span>
      )
    }
    return (
      <span className="gs-thumb">
        {item.type === 'track' && <Music size={16} />}
        {item.type === 'artist' && <Mic2 size={16} />}
        {item.type === 'album' && <Disc3 size={16} />}
        {item.type === 'playlist' && <ListMusic size={16} />}
      </span>
    )
  }

  const visible = open && query.trim().length > 0

  return (
    <div className="gs-root" ref={rootRef}>
      <div className="gs-input" data-active={visible}>
        <Search size={14} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tracks, artists, albums, playlists…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIdx(0)
            setOpen(true)
          }}
          onKeyDown={handleInputKey}
        />
        {query ? (
          <button
            type="button"
            className="gs-clear"
            title="Clear search"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          >
            <X size={12} />
          </button>
        ) : (
          <span className="gs-kbd">Ctrl K</span>
        )}
      </div>

      {visible && (
        <div className="gs-dropdown">
          {sections.map((section) => (
            <div key={section.label} className="gs-group">
              <div className="gs-label">{section.label}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="gs-item"
                  data-active={flatItems.indexOf(item) === activeIdx}
                  onMouseEnter={() => setActiveIdx(flatItems.indexOf(item))}
                  onClick={() => selectItem(item)}
                >
                  <Thumb item={item} />
                  <span className="gs-item-main">
                    <span className="gs-item-title">{item.title}</span>
                    <span className="gs-item-sub">{item.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
          {flatItems.length === 0 && (
            <div className="gs-empty">No matches for “{query}”</div>
          )}
          <button type="button" className="gs-footer" onClick={runSearchLibrary}>
            <Search size={12} />
            Search library for “{query.trim()}”
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}