import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { initDatabaseSchema } from '../../src/main/db'

function columnNames(db: Database.Database, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name)
}

describe('initDatabaseSchema', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
  })

  afterEach(() => {
    db.close()
  })

  it('creates the full schema on a fresh database', () => {
    initDatabaseSchema(db)
    expect(columnNames(db, 'tracks')).toEqual(
      expect.arrayContaining([
        'id',
        'filename',
        'filepath',
        'title',
        'artist',
        'album',
        'duration',
        'cover',
        'lyrics',
        'lyrics_offset',
        'added_at'
      ])
    )
    expect(columnNames(db, 'playlists')).toEqual(
      expect.arrayContaining(['id', 'name', 'created_at', 'cover_type', 'cover_image', 'cover_gradient'])
    )
    expect(columnNames(db, 'playlist_tracks')).toEqual(
      expect.arrayContaining(['playlist_id', 'track_id', 'added_at'])
    )
  })

  it('is idempotent (safe to run twice)', () => {
    initDatabaseSchema(db)
    initDatabaseSchema(db)
    expect(columnNames(db, 'tracks')).toHaveLength(11)
    expect(db.prepare('SELECT count(*) FROM tracks').get()).toEqual({ 'count(*)': 0 })
  })

  it('migrates legacy databases that are missing newer columns', () => {
    // Simulates a database created before lyrics_offset / cover_* existed.
    db.exec(`
      CREATE TABLE tracks (
        id TEXT PRIMARY KEY, filename TEXT, filepath TEXT, title TEXT,
        artist TEXT, album TEXT, duration REAL, cover TEXT, lyrics TEXT, added_at INTEGER
      );
      CREATE TABLE playlists (id TEXT PRIMARY KEY, name TEXT, created_at INTEGER);
      CREATE TABLE playlist_tracks (
        playlist_id TEXT, track_id TEXT, added_at INTEGER, PRIMARY KEY (playlist_id, track_id)
      );
    `)
    initDatabaseSchema(db)
    expect(columnNames(db, 'tracks')).toContain('lyrics_offset')
    expect(columnNames(db, 'playlists')).toEqual(
      expect.arrayContaining(['cover_type', 'cover_image', 'cover_gradient'])
    )
  })
})

describe('database CRUD', () => {
  let db: Database.Database

  function insertTrack(id: string, title = 'Song'): void {
    db.prepare(`
      INSERT OR REPLACE INTO tracks
        (id, filename, filepath, title, artist, album, duration, cover, lyrics, lyrics_offset, added_at)
      VALUES (@id, @filename, @filepath, @title, @artist, @album, @duration, @cover, @lyrics, @lyrics_offset, @added_at)
    `).run({
      id,
      filename: id.split(/[\\/]/).pop() || id,
      filepath: id,
      title,
      artist: 'Artist',
      album: 'Album',
      duration: 120.5,
      cover: '',
      lyrics: '',
      lyrics_offset: 0,
      added_at: Date.now()
    })
  }

  beforeEach(() => {
    db = new Database(':memory:')
    initDatabaseSchema(db)
  })

  afterEach(() => {
    db.close()
  })

  it('inserts, reads, updates and deletes a track', () => {
    insertTrack('/audio/song.mp3')

    expect(db.prepare('SELECT * FROM tracks').all()).toHaveLength(1)
    expect(db.prepare('SELECT title FROM tracks WHERE id = ?').get('/audio/song.mp3')).toEqual({
      title: 'Song'
    })

    db.prepare('UPDATE tracks SET title = ? WHERE id = ?').run('Renamed', '/audio/song.mp3')
    expect(db.prepare('SELECT title FROM tracks WHERE id = ?').get('/audio/song.mp3')).toEqual({
      title: 'Renamed'
    })

    db.prepare('DELETE FROM tracks WHERE id = ?').run('/audio/song.mp3')
    expect(db.prepare('SELECT * FROM tracks').all()).toEqual([])
  })

  it('keeps playlist associations consistent', () => {
    db.prepare('INSERT INTO playlists (id, name, created_at, cover_type) VALUES (?, ?, ?, ?)').run(
      'pl_1',
      'Smoke',
      Date.now(),
      'auto'
    )
    insertTrack('/audio/a.mp3', 'A')

    db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id, added_at) VALUES (?, ?, ?)').run(
      'pl_1',
      '/audio/a.mp3',
      1
    )

    const rows = db
      .prepare(`
        SELECT t.title FROM tracks t
        JOIN playlist_tracks pt ON t.id = pt.track_id
        WHERE pt.playlist_id = ? ORDER BY pt.added_at ASC
      `)
      .all('pl_1')
    expect(rows).toEqual([{ title: 'A' }])

    db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(
      'pl_1',
      '/audio/a.mp3'
    )
    expect(
      db.prepare('SELECT title FROM tracks t JOIN playlist_tracks pt ON t.id = pt.track_id').all()
    ).toEqual([])
  })
})