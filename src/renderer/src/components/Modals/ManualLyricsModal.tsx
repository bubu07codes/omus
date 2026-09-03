import { useState } from 'react'
import { X, Search, Check, RefreshCw } from 'lucide-react'
import { Track } from '../../types'

interface ManualLyricsModalProps {
  track: Track | null
  isOpen: boolean
  onClose: () => void
  onApplyLyrics: (lyrics: string) => void
}

interface SearchResult {
  id: number
  name: string
  trackName: string
  artistName: string
  albumName: string
  duration: number
  syncedLyrics?: string
  plainLyrics?: string
}

export function ManualLyricsModal({
  track,
  isOpen,
  onClose,
  onApplyLyrics
}: ManualLyricsModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [customLrc, setCustomLrc] = useState('')
  const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search')

  if (!isOpen || !track) return null

  const handleSearch = async () => {
    const q = query.trim() || `${track.artist} ${track.title}`.trim()
    if (!q) return

    setIsSearching(true)
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { 'Lrclib-Client': 'omus v1.0.0' } })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setResults(data)
        }
      }
    } catch {
      // Ignore search error
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectResult = (r: SearchResult) => {
    const lrc = r.syncedLyrics || r.plainLyrics || ''
    if (lrc) {
      onApplyLyrics(lrc)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>
            Lyrics Studio — {track.title}
          </h3>
          <button className="btn-plain" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
          <div className="seg">
            <button data-active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
              <Search size={13} /> Search LRCLIB
            </button>
            <button data-active={activeTab === 'paste'} onClick={() => setActiveTab('paste')}>
              Paste Custom LRC
            </button>
          </div>
        </div>

        <div style={{ padding: 24, maxHeight: 440, overflowY: 'auto' }}>
          {activeTab === 'search' ? (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div className="search-pill" style={{ flex: 1, maxWidth: 'none' }}>
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder={`Search (e.g. "${track.artist} ${track.title}")`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button className="btn btn-primary" disabled={isSearching} onClick={handleSearch}>
                  {isSearching ? <RefreshCw size={14} className="animate-spin" /> : 'Search'}
                </button>
              </div>

              {results.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.map((r) => (
                    <div
                      key={r.id}
                      className="pl-track"
                      style={{ padding: '10px 14px', borderRadius: 10 }}
                      onClick={() => handleSelectResult(r)}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{r.trackName || r.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {r.artistName} {r.albumName ? `• ${r.albumName}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: r.syncedLyrics
                              ? 'rgba(34,197,94,0.15)'
                              : 'rgba(128,128,128,0.15)',
                            color: r.syncedLyrics ? '#22c55e' : 'var(--text-secondary)'
                          }}
                        >
                          {r.syncedLyrics ? 'Synced LRC' : 'Plain Text'}
                        </span>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pl-empty" style={{ border: 'none', padding: 20 }}>
                  {isSearching ? 'Searching...' : 'Type artist or title above and click Search.'}
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="lbl-caps" style={{ marginBottom: 6 }}>
                Paste raw LRC or text lyrics
              </label>
              <textarea
                className="field"
                style={{
                  height: 220,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  resize: 'vertical'
                }}
                placeholder="[00:00.00] Synced LRC lyrics..."
                value={customLrc}
                onChange={(e) => setCustomLrc(e.target.value)}
              />
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                disabled={!customLrc.trim()}
                onClick={() => {
                  onApplyLyrics(customLrc)
                  onClose()
                }}
              >
                <Check size={14} /> Apply Custom Lyrics
              </button>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-plain" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
