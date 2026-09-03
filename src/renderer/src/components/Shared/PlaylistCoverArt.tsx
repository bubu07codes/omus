import { Music } from 'lucide-react'
import { Playlist } from '../../types'

export function PlaylistCoverArt({
  covers,
  coverType = 'auto',
  coverImage,
  coverGradient,
  fallbackGradient,
  hero = false
}: {
  covers: string[]
  coverType?: Playlist['cover_type']
  coverImage?: string | null
  coverGradient?: [string, string] | null
  fallbackGradient: [string, string]
  hero?: boolean
}) {
  const base = hero ? 'pl-hero-cover' : 'pl-card-cover'

  if (coverType === 'image' && coverImage) {
    return (
      <div className={`${base} image`}>
        <img src={coverImage} alt="" />
      </div>
    )
  }

  const gradPair = coverType === 'gradient' && coverGradient ? coverGradient : fallbackGradient

  if (coverType === 'gradient' || covers.length === 0) {
    return (
      <div
        className={`${base} gradient`}
        style={{ background: `linear-gradient(135deg, ${gradPair[0]}, ${gradPair[1]})` }}
      >
        <Music size={hero ? 54 : 32} className="note" />
      </div>
    )
  }

  const cells = [0, 1, 2, 3].map((i) => covers[i % covers.length])
  return (
    <div className={`${base} collage`}>
      {cells.map((c, i) => (
        <img key={i} src={c} alt="" />
      ))}
    </div>
  )
}
