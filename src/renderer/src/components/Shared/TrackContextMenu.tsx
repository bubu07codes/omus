import React from 'react'
import { Play, ListPlus, ListOrdered, Edit3, FolderOpen, Trash2, X } from 'lucide-react'
import { Track } from '../../types'
import { ContextMenu, ContextMenuOption } from './ContextMenu'

/**
 * Handlers for every track action the context menu can trigger. Each view only
 * has to pass the same handlers plus its own `onPlay` (the play-now behaviour
 * differs per view/source list) — the option list itself is built here so no
 * view ever hardcodes menu items.
 */
export interface TrackMenuHandlers {
  onPlayNext: (track: Track) => void
  onAddToQueue: (track: Track) => void
  onEditTags: (track: Track) => void
  onRevealInExplorer: (track: Track) => void
  onRemoveFromPlaylist?: (track: Track) => void
  onDeleteFromLibrary: (track: Track) => void
}

/**
 * The shared right-click menu for a single track. Rendered once at the root
 * (using the generic <ContextMenu />) whenever a track row anywhere opens it.
 * `fromPlaylist` swaps "Remove from Playlist" for "Delete from Library".
 */
export function TrackContextMenu({
  x,
  y,
  track,
  fromPlaylist = false,
  onPlay,
  handlers,
  onClose
}: {
  x: number
  y: number
  track: Track
  fromPlaylist?: boolean
  onPlay: () => void
  handlers: TrackMenuHandlers
  onClose: () => void
}): React.ReactElement {
  const options: ContextMenuOption[] = [
    { label: 'Play Now', icon: <Play size={14} />, onClick: onPlay },
    {
      label: 'Play Next',
      icon: <ListPlus size={14} />,
      onClick: () => handlers.onPlayNext(track)
    },
    {
      label: 'Add to Queue',
      icon: <ListOrdered size={14} />,
      onClick: () => handlers.onAddToQueue(track)
    },
    {
      label: 'Edit Tags',
      icon: <Edit3 size={14} />,
      onClick: () => handlers.onEditTags(track)
    },
    {
      label: 'Show in Explorer',
      icon: <FolderOpen size={14} />,
      onClick: () => handlers.onRevealInExplorer(track)
    }
  ]

  if (fromPlaylist && handlers.onRemoveFromPlaylist) {
    options.push({
      label: 'Remove from Playlist',
      icon: <X size={14} />,
      danger: true,
      onClick: () => handlers.onRemoveFromPlaylist!(track)
    })
  } else {
    options.push({
      label: 'Delete from Library',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => handlers.onDeleteFromLibrary(track)
    })
  }

  return <ContextMenu x={x} y={y} options={options} onClose={onClose} />
}
