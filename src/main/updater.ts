import { app, dialog, shell, net, type BrowserWindow } from 'electron'

const OWNER = 'bubu07codes'
const REPO = 'omus'
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`

interface GitHubRelease {
  tag_name?: string
  name?: string
  body?: string
  html_url?: string
  draft?: boolean
  prerelease?: boolean
}

function parseVersion(v: string): number[] {
  return v
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
}

function isNewer(current: number[], latest: number[]): boolean {
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

export async function checkForUpdates(win: BrowserWindow | null, manual = false): Promise<void> {
  try {
    if (manual && win) {
      win.webContents.send('update-status', { stage: 'connecting', message: 'Connecting to GitHub servers...' })
      await delay(600)

      win.webContents.send('update-status', { stage: 'fetching', message: 'Fetching latest release details...' })
    }

    const startTime = Date.now()
    const res = await net.fetch(API_URL, {
      headers: {
        'User-Agent': 'omus-updater',
        Accept: 'application/vnd.github+json'
      }
    })

    if (manual && win) {
      const elapsed = Date.now() - startTime
      if (elapsed < 800) await delay(800 - elapsed)

      win.webContents.send('update-status', { stage: 'comparing', message: 'Analyzing version metadata...' })
      await delay(700)
    }

    if (!res.ok) throw new Error(`GitHub API responded with HTTP ${res.status}`)

    const release = (await res.json()) as GitHubRelease

    if (manual && win) {
      win.webContents.send('update-status', { stage: 'done', message: 'Check complete.' })
      await delay(300)
    }

    if (!release.tag_name || release.draft || release.prerelease) {
      if (manual && win) {
        await dialog.showMessageBox(win, {
          type: 'info',
          title: 'Check for Updates',
          message: 'No update available.',
          detail: 'The latest GitHub release is a draft or pre-release.'
        })
      }
      return
    }

    const current = parseVersion(app.getVersion())
    const latest = parseVersion(release.tag_name)

    if (!isNewer(current, latest)) {
      if (manual && win) {
        await dialog.showMessageBox(win, {
          type: 'info',
          title: 'Check for Updates',
          message: "You're up to date",
          detail: `You are running v${app.getVersion()}, which is the latest release for omus.`
        })
      }
      return
    }

    const options: Electron.MessageBoxOptions = {
      type: 'info',
      title: 'Update Available',
      message: `A new version of omus is available (${release.name || release.tag_name})`,
      detail: `You are running v${app.getVersion()}.\n\n${(release.body || '').slice(0, 1500)}`,
      buttons: ['Get Update', 'Later'],
      defaultId: 0,
      cancelId: 1
    }
    const { response } = win
      ? await dialog.showMessageBox(win, options)
      : await dialog.showMessageBox(options)

    if (response === 0) {
      await shell.openExternal(
        release.html_url || `https://github.com/${OWNER}/${REPO}/releases/latest`
      )
    }
  } catch (err) {
    if (manual && win) {
      win.webContents.send('update-status', { stage: 'error', message: 'Failed to check for updates.' })
      await dialog.showMessageBox(win, {
        type: 'error',
        title: 'Check for Updates',
        message: "Couldn't check for updates",
        detail: String(err)
      })
    }
  }
}