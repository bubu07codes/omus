import { memo } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import { Track, Playlist } from '../types'
import { Edit3, Trash2, Music, ChevronUp, ChevronDown, X } from 'lucide-react'

// Mirrors the app's formatTime helper for row-level display (stable module fn so
// rows can be memoized without re-creating closures every render).
const formatTime = (secs: number): string => {
  if (Number.isNaN(secs) || secs < 0) return '0:00'
  return `${Math.floor(secs / 60)}:${Math.floor(secs % 60)
    .toString()
    .padStart(2, '0')}`
}

interface RowCallbacks {
  onLoad: (index: number, list: Track[]) => void
  onContextMenu: (e: MouseEvent, track: Track, list: Track[], index: number) => void
  onDelete: (trackId: string, e?: MouseEvent) => void
}

interface LibraryTableRowProps extends RowCallbacks {
  track: Track
  index: number
  list: Track[]
  isActive: boolean
  isPlaying: boolean
  playlists: Playlist[]
  onTagEdit: (track: Track) => void
  onAddTrack: (trackId: string, e: ChangeEvent<HTMLSelectElement>) => void
}

// Library "List" (table) row — memoized so the 4×/sec audio-driven App
// re-renders skip the whole list (props stay referentially stable).
export const LibraryTableRow = memo(function LibraryTableRow({
  track,
  index,
  list,
  isActive,
  isPlaying,
  playlists,
  onLoad,
  onContextMenu,
  onTagEdit,
  onDelete,
  onAddTrack
}: LibraryTableRowProps) {
  return (
    <tr
      className="track-row"
      data-active={isActive}
      onClick={() => onLoad(index, list)}
      onContextMenu={(e) => onContextMenu(e, track, list, index)}
    >
      <td className="idx">
        {isActive && isPlaying ? (
          <div className="eq">
            <span />
            <span />
            <span />
          </div>
        ) : (
          index + 1
        )}
      </td>
      <td className="t-title">
        <div className="art-thumb">{track.cover && <img src={track.cover} alt="" />}</div>
        <span>{track.title}</span>
      </td>
      <td className="t-sub">{track.artist || 'Unknown Artist'}</td>
      <td className="t-sub">{track.album || '—'}</td>
      <td className="t-time">{formatTime(track.duration)}</td>
      <td onClick={(e) => e.stopPropagation()}>
        <select
          className="field"
          style={{ padding: '4px 8px', fontSize: 11, height: 28 }}
          defaultValue=""
          onChange={(e) => onAddTrack(track.id, e)}
        >
          <option value="" disabled>
            Add to playlist...
          </option>
          {playlists.map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <button
          className="row-action"
          title="Edit Tags"
          onClick={(e) => {
            e.stopPropagation()
            onTagEdit(track)
          }}
        >
          <Edit3 size={13} />
        </button>
      </td>
      <td>
        <button className="row-action" title="Delete track" onClick={(e) => onDelete(track.id, e)}>
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
})

interface LibraryCardRowProps extends RowCallbacks {
  track: Track
  index: number
  list: Track[]
}

// Library "Grid" card — memoized.
export const LibraryCardRow = memo(function LibraryCardRow({
  track,
  index,
  list,
  onLoad,
  onContextMenu,
  onDelete
}: LibraryCardRowProps) {
  return (
    <div
      className="track-card"
      onClick={() => onLoad(index, list)}
      onContextMenu={(e) => onContextMenu(e, track, list, index)}
    >
      <button className="card-x" title="Delete" onClick={(e) => onDelete(track.id, e)}>
        <Trash2 size={12} />
      </button>
      <div className="art">
        {track.cover ? (
          <img src={track.cover} alt="" />
        ) : (
          <div
            style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Music size={28} opacity={0.3} />
          </div>
        )}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 13,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {track.title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginTop: 2
        }}
      >
        {track.artist || 'Unknown Artist'}
      </div>
    </div>
  )
})

interface LibraryGroupRowProps {
  track: Track
  index: number
  groupIndex: number
  list: Track[]
  isActive: boolean
  isPlaying: boolean
  isOver: boolean
  isDragging: boolean
  onLoad: (index: number, list: Track[]) => void
  onContextMenu: (e: MouseEvent, track: Track, list: Track[], index: number) => void
  onDragStart: (trackId: string) => void
  onDragEnd: () => void
  onDragOver: (trackId: string) => void
  onDrop: (trackId: string) => void
}

// Library "Albums/Grouped" per-track row — memoized (drag state is passed in
// as props so identity stays stable between audio ticks).
export const LibraryGroupRow = memo(function LibraryGroupRow({
  track,
  index,
  groupIndex,
  list,
  isActive,
  isPlaying,
  isOver,
  isDragging,
  onLoad,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: LibraryGroupRowProps) {
  return (
    <div
      draggable
      className="library-group-row"
      data-over={isOver}
      data-dragging={isDragging}
      data-active={isActive}
      onDragStart={() => onDragStart(track.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(track.id)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(track.id)
      }}
      onClick={() => onLoad(index, list)}
      onContextMenu={(e) => onContextMenu(e, track, list, index)}
    >
      <span
        style={{
          color: isActive && isPlaying ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 11,
          fontWeight: 700
        }}
      >
        {isActive && isPlaying ? '♫' : groupIndex + 1}
      </span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: isActive ? 800 : 500
        }}
      >
        {track.title}
      </span>
      <span style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 11 }}>
        {formatTime(track.duration)}
      </span>
    </div>
  )
})
interface QueueCardProps {
  track: Track
  index: number
  isCurrent: boolean
  isLast: boolean
  onLoad: (index: number) => void
  onContextMenu: (e: MouseEvent, track: Track, index: number) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  onRemove: (index: number) => void
}

// Queue card in the "Queue" view — memoized.
export const QueueCard = memo(function QueueCard({
  track,
  index,
  isCurrent,
  isLast,
  onLoad,
  onContextMenu,
  onMove,
  onRemove
}: QueueCardProps) {
  return (
    <div
      className="queue-card"
      data-active={isCurrent}
      onClick={() => onLoad(index)}
      onContextMenu={(e) => onContextMenu(e, track, index)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 22 }}>
          {index + 1}
        </span>
        <div className="art-thumb">{track.cover && <img src={track.cover} alt="" />}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 13,
              color: isCurrent ? 'var(--accent)' : 'inherit',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {track.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {track.artist || 'Unknown Artist'}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', paddingRight: 10 }}>
          {formatTime(track.duration)}
        </div>
      </div>
      <div className="queue-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="queue-btn"
          disabled={index === 0}
          onClick={() => onMove(index, 'up')}
          title="Move Up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="queue-btn"
          disabled={isLast}
          onClick={() => onMove(index, 'down')}
          title="Move Down"
        >
          <ChevronDown size={14} />
        </button>
        <button className="queue-btn" onClick={() => onRemove(index)} title="Remove">
          <X size={14} />
        </button>
      </div>
    </div>
  )
})