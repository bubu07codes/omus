// .ocfg — the omus configuration file format.
//
// File layout:  [ "OMUSCFG1" magic ][ gzip( settings.json payload ) ]
//
// - The magic header makes the file self-identifying, so an import can be
//   validated before it clobbers the user's settings.
// - gzip keeps the file tiny (settings JSON is extremely repetitive).
// - decodeOcfg() also accepts headerless gzip and even plain JSON payloads,
//   so hand-edited or older exports stay readable.
// Deliberately dependency-free (only node zlib) so it can be unit-tested
// outside Electron, like src/main/db.ts and src/main/updater.ts.
import { gzipSync, gunzipSync } from 'zlib'

export const OCFG_MAGIC = 'OMUSCFG1'

/** A settings bag — same shape as the file stored at <userData>/settings.json. */
export type OcfgSettings = Record<string, unknown>

function parseSettingsJson(body: Buffer): OcfgSettings | null {
  try {
    const parsed: unknown = JSON.parse(body.toString('utf-8'))
    // Only a plain object counts as settings — arrays/primitives are garbage.
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as OcfgSettings
    }
    return null
  } catch {
    return null
  }
}

/** Compress a settings object into the .ocfg container. */
export function encodeOcfg(settings: OcfgSettings): Buffer {
  const json = Buffer.from(JSON.stringify(settings, null, 2), 'utf-8')
  return Buffer.concat([Buffer.from(OCFG_MAGIC, 'utf-8'), gzipSync(json)])
}

/**
 * Decode a .ocfg file (or a compatible fallback) back into a settings object.
 * Returns null when the buffer is not a readable omus config.
 */
export function decodeOcfg(buf: Buffer): OcfgSettings | null {
  // 1) Proper omus file: magic header followed by a gzip payload. A valid
  //    header with a corrupt body is an invalid file — do not fall through.
  if (
    buf.length > OCFG_MAGIC.length &&
    buf.subarray(0, OCFG_MAGIC.length).toString('utf-8') === OCFG_MAGIC
  ) {
    try {
      return parseSettingsJson(gunzipSync(buf.subarray(OCFG_MAGIC.length)))
    } catch {
      return null
    }
  }

  // 2) Headerless gzip.
  try {
    const fromGzip = parseSettingsJson(gunzipSync(buf))
    if (fromGzip) return fromGzip
  } catch {
    /* not gzip — try plain JSON */
  }

  // 3) Plain JSON text.
  return parseSettingsJson(buf)
}
