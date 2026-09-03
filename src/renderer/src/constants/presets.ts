import React from 'react'
import { Library, ListMusic, ListOrdered, Mic2, Settings } from 'lucide-react'
import { GoogleFontPreset, Theme, AnimationPreset } from '../types'

export const PRESET_FONTS: GoogleFontPreset[] = [
  { name: 'Original', family: 'Plus Jakarta Sans' },
  { name: 'Techno', family: 'Space Grotesk' }
]

export const PRESET_THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'OLED Dark',
    bg: '#080808',
    sidebarBg: '#000000',
    cardBg: '#111111',
    textPrimary: '#ffffff',
    textSecondary: '#888888',
    accent: '#ffffff'
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    bg: '#0a0d14',
    sidebarBg: '#05070a',
    cardBg: '#121724',
    textPrimary: '#e6edf3',
    textSecondary: '#52607a',
    accent: '#38bdf8'
  },
  {
    id: 'nord',
    name: 'Nord Frost',
    bg: '#2e3440',
    sidebarBg: '#242933',
    cardBg: '#3b4252',
    textPrimary: '#eceff4',
    textSecondary: '#7b88a1',
    accent: '#88c0d0'
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    bg: '#002b36',
    sidebarBg: '#00202a',
    cardBg: '#073642',
    textPrimary: '#eee8d5',
    textSecondary: '#586e75',
    accent: '#b58900'
  },
  {
    id: 'dracula',
    name: 'Dracula',
    bg: '#282a36',
    sidebarBg: '#21222c',
    cardBg: '#343746',
    textPrimary: '#f8f8f2',
    textSecondary: '#6272a4',
    accent: '#bd93f9'
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    bg: '#282828',
    sidebarBg: '#1d2021',
    cardBg: '#3c3836',
    textPrimary: '#ebdbb2',
    textSecondary: '#928374',
    accent: '#d79921'
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: '#0f1a12',
    sidebarBg: '#0a120b',
    cardBg: '#16251a',
    textPrimary: '#e2efe4',
    textSecondary: '#5c6f62',
    accent: '#22c55e'
  },
  {
    id: 'rosepine',
    name: 'Rose Pine',
    bg: '#191724',
    sidebarBg: '#121016',
    cardBg: '#26233a',
    textPrimary: '#e0def4',
    textSecondary: '#908caa',
    accent: '#eb6bc9'
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    bg: '#0b1e2d',
    sidebarBg: '#071420',
    cardBg: '#122a3d',
    textPrimary: '#e2f0fa',
    textSecondary: '#45647c',
    accent: '#22d3ee'
  },
  {
    id: 'paper',
    name: 'Paper Light',
    bg: '#f6f5f1',
    sidebarBg: '#ffffff',
    cardBg: '#ededeb',
    textPrimary: '#1b1b1b',
    textSecondary: '#6e6e6e',
    accent: '#111111'
  }
]

export const PRESET_ANIMATIONS: AnimationPreset[] = [
  {
    id: 'off',
    name: 'Off',
    tagline: 'Disable all animations & transitions',
    uiTransition: 'none',
    scrollBehavior: 'auto',
    globalCss: `
    [data-anim="off"] *, [data-anim="off"] *::before, [data-anim="off"] *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
  `
  },
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Clean, fast and understated',
    uiTransition: 'all 0.16s ease',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="modern"] button:hover { filter: brightness(1.08); transform: translateY(-1px); }
    [data-anim="modern"] button:active { filter: brightness(0.95); transform: translateY(0); }
  `
  },
  {
    id: 'playful',
    name: 'Playful',
    tagline: 'Bouncy, springy and fun',
    uiTransition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="playful"] button:hover { transform: translateY(-3px) scale(1.05); }
    [data-anim="playful"] button:active { transform: scale(0.9) translateY(1px); }
    [data-anim="playful"] .track-row:hover { transform: scale(1.01); }
  `
  },
  {
    id: 'subtle',
    name: 'Subtle',
    tagline: 'Light and barely-there motion',
    uiTransition: 'all 0.12s ease-out',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="subtle"] button:hover { filter: brightness(1.05); }
    [data-anim="subtle"] button:active { filter: brightness(0.97); }
  `
  },
  {
    id: 'smooth',
    name: 'Smooth',
    tagline: 'Gentle, even and fluid easing',
    uiTransition: 'all 0.3s ease',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="smooth"] button:hover { filter: brightness(1.07); transform: translateY(-1px); }
    [data-anim="smooth"] button:active { filter: brightness(0.97); transform: translateY(0); }
  `
  },
  {
    id: 'elastic',
    name: 'Elastic',
    tagline: 'Springy overshoot that settles fast',
    uiTransition: 'all 0.45s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="elastic"] button:hover { transform: translateY(-2px) scale(1.04); }
    [data-anim="elastic"] button:active { transform: scale(0.92) translateY(1px); }
  `
  },
  {
    id: 'snap',
    name: 'Snap',
    tagline: 'Instant response, near-zero delay',
    uiTransition: 'all 0.09s cubic-bezier(0.2, 0, 0, 1)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="snap"] button:active { filter: brightness(0.9); }
  `
  },
  {
    id: 'glow',
    name: 'Glow Pulse',
    tagline: 'Theme glow animations on hover',
    uiTransition: 'all 0.25s ease',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="glow"] button:hover { box-shadow: 0 0 12px var(--accent); transform: translateY(-1px); }
    [data-anim="glow"] .track-row[data-active="true"] { box-shadow: inset 0 0 10px var(--accent); }
  `
  }
]

export const NAV_ITEMS: {
  id: 'library' | 'playlists' | 'queue' | 'lyrics' | 'settings'
  label: string
  IconComp: React.ComponentType<{ size?: number | string }>
}[] = [
  { id: 'library', label: 'Library', IconComp: Library },
  { id: 'playlists', label: 'Playlists', IconComp: ListMusic },
  { id: 'queue', label: 'Queue', IconComp: ListOrdered },
  { id: 'lyrics', label: 'Lyrics', IconComp: Mic2 },
  { id: 'settings', label: 'Settings', IconComp: Settings }
]

export const PL_PALETTES: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#8e9eab', '#eef2f3']
]

export const playlistGradient = (id: string): [string, string] => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PL_PALETTES[h % PL_PALETTES.length]
}

export const parseGradient = (raw?: string | null): [string, string] | null => {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (Array.isArray(p) && p.length >= 2) return [String(p[0]), String(p[1])]
  } catch {
    /* empty */
  }
  return null
}
