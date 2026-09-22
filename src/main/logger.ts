import { mkdirSync, appendFileSync } from 'fs'
import path from 'path'

/**
 * Minimal file-based logger for the Electron main process.
 *
 * Writes plain-text lines to `<userData>/logs/app.log` using SYNCHRONOUS
 * filesystem calls on purpose: errors that happen right before a crash must
 * be flushed to disk immediately — a pending async write would be lost when
 * the process dies.
 */

let logFile: string = ''
let ready = false

export function initLogger(userDataPath: string): void {
  try {
    const logDir = path.join(userDataPath, 'logs')
    mkdirSync(logDir, { recursive: true })
    logFile = path.join(logDir, 'app.log')
    ready = true
  } catch {
    // Unwritable userData — logging is best-effort and must never break startup.
  }
}

function writeLine(level: string, message: string): void {
  if (!ready) return
  try {
    const line = `[${new Date().toISOString()}] [${level}] ${message}\n`
    appendFileSync(logFile, line, 'utf-8')
  } catch {
    /* logging must never take the app down */
  }
}

export function logInfo(message: string): void {
  writeLine('INFO', message)
}

export function logError(context: string, err: unknown): void {
  const detail =
    err instanceof Error ? `${err.message}${err.stack ? `\n${err.stack}` : ''}` : String(err)
  writeLine('ERROR', `${context}\n${detail}`)
}
