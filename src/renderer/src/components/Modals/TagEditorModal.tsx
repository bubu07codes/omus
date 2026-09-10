import { useState } from 'react'
import { X, FolderOpen, ImagePlus, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Track } from '../../types'

interface TagEditorModalProps {
  track: Track | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTrack: Track) => Promise<void>
  onRevealInExplorer?: (filepath: string) => void
}

export function TagEditorModal({
  track,
  isOpen,
  onClose,
  onSave,
  onRevealInExplorer
}: TagEditorModalProps) {
  const [title, setTitle] = useState(track?.title || '')
  const [artist, setArtist] = useState(track?.artist || '')
  const [album, setAlbum] = useState(track?.album || '')
  const [cover, setCover] = useState(track?.cover || '')
  const [lyrics, setLyrics] = useState(track?.lyrics || '')
  const [isSaving, setIsSaving] = useState(false)
  const [prevTrackId, setPrevTrackId] = useState<string | null>(null)
  const [isLyricsExpanded, setIsLyricsExpanded] = useState(false)

  if (track && track.id !== prevTrackId) {
    setPrevTrackId(track.id)
    setTitle(track.title || '')
    setArtist(track.artist || '')
    setAlbum(track.album || '')
    setCover(track.cover || '')
    setLyrics(track.lyrics || '')
    setIsLyricsExpanded(false)
  }

  if (!isOpen || !track) return null

  const handleSelectCover = async () => {
    if (window.api?.selectCover) {
      const b64 = await window.api.selectCover()
      if (b64) setCover(b64)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated: Track = {
        ...track,
        title: title.trim() || track.title,
        artist: artist.trim(),
        album: album.trim(),
        cover,
        lyrics
      }
      await onSave(updated)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Edit Track</h3>
          <button className="btn-plain" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--card-bg)',
                  border: '1px solid rgba(128,128,128,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>No Cover</span>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '6px 12px' }}
                onClick={handleSelectCover}
              >
                <ImagePlus size={13} /> Change Art
              </button>
              {cover && (
                <button
                  className="btn-plain"
                  style={{ fontSize: 10, color: '#f87171', padding: '2px 6px' }}
                  onClick={() => setCover('')}
                >
                  Remove Cover
                </button>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label className="lbl-caps">Title</label>
              <input
                className="field"
                style={{ marginBottom: 12 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <label className="lbl-caps">Artist</label>
              <input
                className="field"
                style={{ marginBottom: 12 }}
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />

              <label className="lbl-caps">Album</label>
              <input className="field" value={album} onChange={(e) => setAlbum(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <button
              className="btn-plain"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 0',
                cursor: 'pointer'
              }}
              onClick={() => setIsLyricsExpanded((prev) => !prev)}
            >
              <span className="lbl-caps" style={{ margin: 0 }}>
                Lyrics {lyrics.trim() ? '(Added)' : ''}
              </span>
              {isLyricsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isLyricsExpanded && (
              <textarea
                className="field"
                style={{
                  height: 120,
                  marginTop: 8,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  resize: 'vertical'
                }}
                placeholder="[00:12.34] Lyrics line here..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
              />
            )}
          </div>

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 400
              }}
              title={track.filepath}
            >
              Path: {track.filepath}
            </span>
            {onRevealInExplorer && (
              <button
                className="btn-plain"
                style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => onRevealInExplorer(track.filepath)}
              >
                <FolderOpen size={13} /> Show in Explorer
              </button>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-plain" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={isSaving} onClick={handleSave}>
            <Check size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}