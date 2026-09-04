import React from 'react'
import { Home, Library, ListMusic, ListOrdered, Mic2, Settings } from 'lucide-react'
import { GoogleFontPreset, Theme, AnimationPreset } from '../types'

export const PRESET_FONTS: GoogleFontPreset[] = [
  { name: 'Original', family: 'Plus Jakarta Sans' },
  { name: 'Inter', family: 'Inter' },
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
    textSecondary: '#a1a1aa',
    accent: '#ffffff'
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    bg: '#0a0d14',
    sidebarBg: '#05070a',
    cardBg: '#121724',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    accent: '#38bdf8'
  },
  {
    id: 'nord',
    name: 'Nord Frost',
    bg: '#2e3440',
    sidebarBg: '#242933',
    cardBg: '#3b4252',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    accent: '#88c0d0'
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    bg: '#002b36',
    sidebarBg: '#00202a',
    cardBg: '#073642',
    textPrimary: '#fdf6e3',
    textSecondary: '#93a1a1',
    accent: '#b58900'
  },
  {
    id: 'dracula',
    name: 'Dracula',
    bg: '#282a36',
    sidebarBg: '#21222c',
    cardBg: '#343746',
    textPrimary: '#f8f8f2',
    textSecondary: '#c0caf5',
    accent: '#bd93f9'
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    bg: '#282828',
    sidebarBg: '#1d2021',
    cardBg: '#3c3836',
    textPrimary: '#fbf1c7',
    textSecondary: '#d5c4a1',
    accent: '#d79921'
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: '#0f1a12',
    sidebarBg: '#0a120b',
    cardBg: '#16251a',
    textPrimary: '#f0fdf4',
    textSecondary: '#bbf7d0',
    accent: '#22c55e'
  },
  {
    id: 'rosepine',
    name: 'Rose Pine',
    bg: '#191724',
    sidebarBg: '#121016',
    cardBg: '#26233a',
    textPrimary: '#ffffff',
    textSecondary: '#c4a7e7',
    accent: '#eb6bc9'
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    bg: '#0b1e2d',
    sidebarBg: '#071420',
    cardBg: '#122a3d',
    textPrimary: '#f0f9ff',
    textSecondary: '#bae6fd',
    accent: '#22d3ee'
  },
  {
    id: 'paper',
    name: 'Paper Light',
    bg: '#f8f8f6',
    sidebarBg: '#ffffff',
    cardBg: '#ededeb',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    accent: '#0f172a'
  }
]

// Selector for interactive action buttons that can safely receive hover/active transforms without
// distorting delicate controls (titlebar, left rail, segmented tabs, player controls, switches, cards).
const BTN_ANIM_SEL =
  'button:not(.title-bar-btn):not(.rail-btn):not(.sp-btn-icon):not(.sp-play-btn):not(.sp-heart-btn):not(.seg button):not(.switch-label):not(.home-tile):not(.row-action):not(.queue-btn):not(.pl-opt-row):not(.no-anim)'

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
    [data-anim="modern"] ${BTN_ANIM_SEL}:hover { filter: brightness(1.08); transform: translateY(-1px); }
    [data-anim="modern"] ${BTN_ANIM_SEL}:active { filter: brightness(0.95); transform: translateY(0); }
  `
  },
  {
    id: 'playful',
    name: 'Playful',
    tagline: 'Bouncy, springy and fun',
    uiTransition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="playful"] ${BTN_ANIM_SEL}:hover { transform: translateY(-2px) scale(1.03); }
    [data-anim="playful"] ${BTN_ANIM_SEL}:active { transform: scale(0.94) translateY(1px); }
    [data-anim="playful"] .track-row:hover { transform: scale(1.008); }
    [data-anim="playful"] .track-card:hover, [data-anim="playful"] .pl-card:hover { transform: translateY(-4px) scale(1.02); }
  `
  },
  {
    id: 'subtle',
    name: 'Subtle',
    tagline: 'Light and slight motion',
    uiTransition: 'all 0.12s ease-out',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="subtle"] ${BTN_ANIM_SEL}:hover { filter: brightness(1.05); }
    [data-anim="subtle"] ${BTN_ANIM_SEL}:active { filter: brightness(0.97); }
  `
  },
  {
    id: 'smooth',
    name: 'Smooth',
    tagline: 'Gentle, even and fluid easing',
    uiTransition: 'all 0.3s ease',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="smooth"] ${BTN_ANIM_SEL}:hover { filter: brightness(1.07); transform: translateY(-1px); }
    [data-anim="smooth"] ${BTN_ANIM_SEL}:active { filter: brightness(0.97); transform: translateY(0); }
  `
  },
  {
    id: 'elastic',
    name: 'Elastic',
    tagline: 'Springy overshoot motion',
    uiTransition: 'all 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="elastic"] ${BTN_ANIM_SEL}:hover { transform: translateY(-2px) scale(1.03); }
    [data-anim="elastic"] ${BTN_ANIM_SEL}:active { transform: scale(0.94) translateY(1px); }
  `
  },
  {
    id: 'glow',
    name: 'Glow Pulse',
    tagline: 'Glow animations on hover',
    uiTransition: 'all 0.25s ease',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="glow"] ${BTN_ANIM_SEL}:hover { box-shadow: 0 0 10px var(--accent); transform: translateY(-1px); }
    [data-anim="glow"] .track-row[data-active="true"] { box-shadow: inset 0 0 10px var(--accent); }
  `
  }
]

export const NAV_ITEMS: {
  id: 'home' | 'library' | 'playlists' | 'queue' | 'lyrics' | 'settings'
  label: string
  IconComp: React.ComponentType<{ size?: number | string }>
}[] = [
  { id: 'home', label: 'Home', IconComp: Home },
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
