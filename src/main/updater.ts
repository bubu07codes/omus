import { app, dialog, type BrowserWindow } from 'electron'
import { autoUpdater, type ProgressInfo } from 'electron-updater'

const OWNER = 'bubu07codes'
const REPO = 'omus'
const STATUS_CHANNEL = 'update-status'

export interface UpdateStatusPayload {
  stage: 'checking' | 'found' | 'downloading' | 'downloaded' | 'notavailable' | 'error'
  message: string
  percent?: number
  version?: string
}

export function parseVersion(v: string): number[] {
  return v
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
}

export function isNewer(current: number[], latest: number[]): boolean {
  const len = Math.max(current.length, latest.length)
  for (let i = 0; i < len; i++) {
    const a = current[i] || 0
    const b = latest[i] || 0
    if (b > a) return true
    if (b < a) return false
  }
  return false
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function sendStatus(win: BrowserWindow | null, status: UpdateStatusPayload): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send(STATUS_CHANNEL, status)
  }
}

/**
 * Downloads the pending update and applies it. `quitAndInstall` closes every
 * app window, silently runs the NSIS installer and relaunches the new version
 * — the whole "download → install → close → reopen" chore is automatic.
 */
async function downloadAndInstall(win: BrowserWindow | null, version: string): Promise<void> {
  sendStatus(win, { stage: 'found', message: `Preparing v${version}…`, version })

  let lastSentPercent = -2
  const onProgress = (info: ProgressInfo) => {
    const percent = Math.max(0, Math.min(100, Math.round(info.percent)))
    // Throttle to ≥2% steps so we don't spam renderer IPC for every chunk.
    if (Math.abs(percent - lastSentPercent) >= 2 || percent === 100) {
      lastSentPercent = percent
      sendStatus(win, {
        stage: 'downloading',
        message: `Downloading v${version}… ${percent}%`,
        percent,
        version
      })
    }
  }

  autoUpdater.on('download-progress', onProgress)
  try {
    await autoUpdater.downloadUpdate()
    sendStatus(win, {
      stage: 'downloaded',
      message: `v${version} downloaded — installing…`,
      version
    })
    // Silent install; start the freshly installed version afterwards.
    autoUpdater.quitAndInstall(true, true)
  } finally {
    autoUpdater.off('download-progress', onProgress)
  }
}

export async function checkForUpdates(win: BrowserWindow | null, manual = false): Promise<void> {
  try {
    // electron-updater only exists inside the installed (packaged) app; in a
    // development build there is nothing to install on top of.
    if (!app.isPackaged) {
      if (manual && win) {
        await dialog.showMessageBox(win, {
          type: 'info',
          title: 'Check for Updates',
          message: 'Auto-update only works in the installed app',
          detail: `This is a development build (v${app.getVersion()}).\n\nDownload the latest installer from\nhttps://github.com/${OWNER}/${REPO}/releases/latest`
        })
      }
      return
    }

    if (manual && win) {
      sendStatus(win, { stage: 'checking', message: 'Connecting to GitHub…' })
      await delay(600)
      sendStatus(win, { stage: 'checking', message: 'Fetching the latest release…' })
    }

    // Never download behind the user's back — always confirm, then call
    // downloadAndInstall() ourselves.
    autoUpdater.autoDownload = false

    const result = await autoUpdater.checkForUpdates()

    if (!result || !result.isUpdateAvailable) {
      if (manual && win) {
        await dialog.showMessageBox(win, {
          type: 'info',
          title: 'Check for Updates',
          message: "You're up to date",
          detail: `You are running v${app.getVersion()}, which is the latest release for omus.`
        })
      } else {
        sendStatus(win, { stage: 'notavailable', message: "You're up to date." })
      }
      return
    }

    const newVersion = result.updateInfo.version.replace(/^v/i, '')
    const options: Electron.MessageBoxOptions = {
      type: 'info',
      title: 'Update Available',
      message: `A new version of omus is available (v${newVersion})`,
      detail: `You are running v${app.getVersion()}.\n\nDownload, install and restart omus now? The app will close itself and reopen on the new version.`,
      buttons: ['Download & Install', 'Later'],
      defaultId: 0,
      cancelId: 1
    }
    const { response } = win
      ? await dialog.showMessageBox(win, options)
      : await dialog.showMessageBox(options)

    if (response !== 0) {
      sendStatus(win, { stage: 'notavailable', message: 'Update postponed.' })
      return
    }

    await downloadAndInstall(win, newVersion)
  } catch (err) {
    // Best effort — a flaky GitHub connection must never take the app down.
    if (manual && win) {
      sendStatus(win, { stage: 'error', message: 'Update failed.' })
      await dialog.showMessageBox(win, {
        type: 'error',
        title: 'Update Failed',
        message: "Couldn't update omus",
        detail: `${String(err)}\n\nYou can grab the latest installer manually from\nhttps://github.com/${OWNER}/${REPO}/releases/latest`
      })
    }
  }
}