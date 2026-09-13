import Database from 'better-sqlite3'

/**
 * Creates the SQLite tables and applies lightweight migrations to bring
 * existing databases up to the current schema. Safe to call on both fresh
 * and old databases (every statement is idempotent).
 *
 * Extracted from `index.ts` so it can be unit-tested against an in-memory
 * database without booting the whole Electron app.
 */
export function initDatabaseSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      filename TEXT,
      filepath TEXT,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration REAL,
      cover TEXT,
      lyrics TEXT,
      lyrics_offset INTEGER DEFAULT 0,
      added_at INTEGER,
      cover_path TEXT
    );
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at INTEGER,
      cover_type TEXT,
      cover_image TEXT,
      cover_gradient TEXT
    );
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT,
      track_id TEXT,
      added_at INTEGER,
      PRIMARY KEY (playlist_id, track_id)
    );
  `)

  // Migrations for existing databases
  const trCols = db.prepare(`PRAGMA table_info(tracks)`).all() as { name: string }[]
  const trColNames = new Set(trCols.map((c) => c.name))
  if (!trColNames.has('lyrics_offset'))
    db.exec(`ALTER TABLE tracks ADD COLUMN lyrics_offset INTEGER DEFAULT 0`)
  if (!trColNames.has('cover_path')) db.exec(`ALTER TABLE tracks ADD COLUMN cover_path TEXT`)
  const plCols = db.prepare(`PRAGMA table_info(playlists)`).all() as { name: string }[]
  const plColNames = new Set(plCols.map((c) => c.name))
  if (!plColNames.has('cover_type')) db.exec(`ALTER TABLE playlists ADD COLUMN cover_type TEXT`)
  if (!plColNames.has('cover_image')) db.exec(`ALTER TABLE playlists ADD COLUMN cover_image TEXT`)
  if (!plColNames.has('cover_gradient'))
    db.exec(`ALTER TABLE playlists ADD COLUMN cover_gradient TEXT`)
}