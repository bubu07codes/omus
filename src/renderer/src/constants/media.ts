// File extensions treated as music videos (kept in sync with src/main/index.ts).
// Tracks with these extensions render a picture-synced <video> in the fullscreen
// now-playing view instead of just the static cover art.
export const VIDEO_EXTS = new Set([
  '.mp4',
  '.m4v',
  '.webm',
  '.mkv',
  '.mov',
  '.avi',
  '.flv',
  '.wmv',
  '.ogv',
  '.mpg',
  '.mpeg',
  '.3gp',
  '.ts',
  '.m2ts'
])

export function getFileExt(filepath: string): string {
  const i = filepath.lastIndexOf('.')
  return i >= 0 ? filepath.slice(i).toLowerCase() : ''
}

export function isVideoFile(filepath: string): boolean {
  return VIDEO_EXTS.has(getFileExt(filepath))
}
