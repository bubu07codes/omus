import RPC from 'discord-rpc'

/**
 * IMPORTANT
 * -----
 * Discord Rich Presence requires an Application ID from the Discord Developer
 * Portal (https://discord.com/developers/applications). Create an application,
 * then paste its ID below. Without a real ID, login is attempted but will fail
 * silently (the app keeps working; nothing is shown in Discord!!!!!!).
 */
const DISCORD_CLIENT_ID = '1545091876670013622'

export interface DiscordActivity {
  title: string
  artist: string
  album: string
  isPlaying: boolean
  /** Epoch seconds when playback of this track began (for the "elapsed" timer). */
  startTimestamp?: number
}

let client: RPC.Client | null = null
let ready = false
let retryTimer: NodeJS.Timeout | null = null
let lastActivity: DiscordActivity | null = null
let destroyed = false

function connect(): void {
  // No client id configured yet → nothing to connect to.
  if (destroyed || !DISCORD_CLIENT_ID) return
  if (client || ready) return

  console.log('[discord-rpc] connecting…')
  try {
    client = new RPC.Client({ transport: 'ipc' })

    client.on('ready', () => {
      ready = true
      console.log('[discord-rpc] connected')
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      // Re-apply the latest state as soon as we connect (e.g. app opened first).
      if (lastActivity) syncActivity(lastActivity)
    })

    client.on('disconnected', () => {
      ready = false
      cleanupClient()
      scheduleReconnect()
    })

    client.login({ clientId: DISCORD_CLIENT_ID }).catch((err) => {
      console.error('[discord-rpc] login failed, will retry:', err)
      ready = false
      cleanupClient()
      scheduleReconnect()
    })
  } catch (err) {
    console.error('[discord-rpc] connect error, will retry:', err)
    ready = false
    cleanupClient()
    scheduleReconnect()
  }
}

function syncActivity(activity: DiscordActivity): void {
  if (!client || !ready) return
  try {
    client.setActivity({
      details: activity.title || 'Nothing playing',
      state: activity.artist
        ? `${activity.artist}${activity.album ? ` — ${activity.album}` : ''}`
        : undefined,
      startTimestamp: activity.isPlaying ? activity.startTimestamp : undefined,
      instance: false
    })
  } catch {
    /* non-fatal */
  }
}

function scheduleReconnect(): void {
  if (destroyed || retryTimer) return
  retryTimer = setTimeout(() => {
    retryTimer = null
    connect()
  }, 15000)
}

function cleanupClient(): void {
  if (client) {
    try {
      client.destroy()
    } catch {
      /* non-fatal */
    }
    client = null
  }
}

export function updateDiscordPresence(activity: DiscordActivity): void {
  lastActivity = activity
  connect()
  syncActivity(activity)
}

export function clearDiscordPresence(): void {
  lastActivity = null
  if (client && ready) {
    try {
      client.clearActivity()
    } catch {
      /* non-fatal */
    }
  }
}

export function destroyDiscordRPC(): void {
  destroyed = true
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  clearDiscordPresence()
  cleanupClient()
}
