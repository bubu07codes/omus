import React from 'react'
import { Home, Library, ListMusic, Mic2 } from 'lucide-react'
import { GoogleFontPreset, Theme, AnimationPreset } from '../types'

export const PRESET_FONTS: GoogleFontPreset[] = [
  { name: 'Original', family: 'Plus Jakarta Sans' },
  { name: 'Techno', family: 'Space Grotesk' }
]

export const PRESET_THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'Dark',
    bg: '#000000',
    sidebarBg: '#050505',
    cardBg: '#121212',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    accent: '#ffffff'
  },
  {
    id: 'amber',
    name: 'Amber',
    bg: '#120d06',
    sidebarBg: '#0a0703',
    cardBg: '#1f170b',
    textPrimary: '#fffbeb',
    textSecondary: '#d97706',
    accent: '#f59e0b'
  },
  {
    id: 'crimson',
    name: 'Red',
    bg: '#120606',
    sidebarBg: '#080202',
    cardBg: '#210c0d',
    textPrimary: '#fef2f2',
    textSecondary: '#f87171',
    accent: '#ef4444'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#0b0f19',
    sidebarBg: '#070a12',
    cardBg: '#111827',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#38bdf8'
  },
  {
    id: 'nord',
    name: 'Nord',
    bg: '#181c24',
    sidebarBg: '#12151c',
    cardBg: '#212732',
    textPrimary: '#eceff4',
    textSecondary: '#9aa5b9',
    accent: '#88c0d0'
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    bg: '#141617',
    sidebarBg: '#0e1011',
    cardBg: '#1d2021',
    textPrimary: '#fbf1c7',
    textSecondary: '#a89984',
    accent: '#fe8019'
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: '#0a100d',
    sidebarBg: '#060a08',
    cardBg: '#131f19',
    textPrimary: '#f0fdf4',
    textSecondary: '#86efac',
    accent: '#10b981'
  },
  {
    id: 'cyberpunk',
    name: 'Cyber',
    bg: '#090d16',
    sidebarBg: '#04060a',
    cardBg: '#111a2e',
    textPrimary: '#f43f5e',
    textSecondary: '#38bdf8',
    accent: '#f43f5e'
  },
  {
    id: 'dracula',
    name: 'Dracula',
    bg: '#12131c',
    sidebarBg: '#0b0c12',
    cardBg: '#181926',
    textPrimary: '#f8f8f2',
    textSecondary: '#9093b0',
    accent: '#bd93f9'
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    bg: '#090812',
    sidebarBg: '#05040a',
    cardBg: '#120f24',
    textPrimary: '#f5f3ff',
    textSecondary: '#9a8cb4',
    accent: '#ff007f'
  },
  {
    id: 'monochrome',
    name: 'Concrete',
    bg: '#18181b',
    sidebarBg: '#09090b',
    cardBg: '#27272a',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    accent: '#e4e4e7'
  },
  {
    id: 'paper',
    name: 'Light',
    bg: '#f4f4f0',
    sidebarBg: '#eaeaea',
    cardBg: '#ffffff',
    textPrimary: '#1c1917',
    textSecondary: '#78716c',
    accent: '#2563eb'
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
    tagline: 'No motion',
    uiTransition: 'none',
    scrollBehavior: 'auto',
    globalCss: `
    [data-anim="off"] *, [data-anim="off"] *::before, [data-anim="off"] *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
  `
  },
  {
    id: 'subtle',
    name: 'Subtle',
    tagline: 'Minimal feedback',
    uiTransition: 'all 0.12s ease-out',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="subtle"] ${BTN_ANIM_SEL}:hover { filter: brightness(1.05); }
    [data-anim="subtle"] ${BTN_ANIM_SEL}:active { filter: brightness(0.97); }
  `
  },
  {
    id: 'modern',
    name: 'Snappy',
    tagline: 'Fast and tight',
    uiTransition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="modern"] ${BTN_ANIM_SEL}:hover { filter: brightness(1.08); transform: translateY(-1px); }
    [data-anim="modern"] ${BTN_ANIM_SEL}:active { filter: brightness(0.95); transform: translateY(0); }
  `
  },
  {
    id: 'smooth',
    name: 'Smooth',
    tagline: 'Fluid and balanced',
    uiTransition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="smooth"] ${BTN_ANIM_SEL}:hover { filter: brightness(1.07); transform: translateY(-1px); }
    [data-anim="smooth"] ${BTN_ANIM_SEL}:active { filter: brightness(0.97); transform: translateY(0); }
  `
  },
  {
    id: 'playful',
    name: 'Spring',
    tagline: 'Bouncy overshoot',
    uiTransition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="playful"] ${BTN_ANIM_SEL}:hover { transform: translateY(-2px) scale(1.02); }
    [data-anim="playful"] ${BTN_ANIM_SEL}:active { transform: scale(0.96) translateY(1px); }
    [data-anim="playful"] .track-row:hover { transform: scale(1.004); }
    [data-anim="playful"] .track-card:hover, [data-anim="playful"] .pl-card:hover { transform: translateY(-3px) scale(1.01); }
  `
  },
  {
    id: 'glow',
    name: 'Glow',
    tagline: 'Accent light on hover',
    uiTransition: 'all 0.2s ease',
    scrollBehavior: 'smooth',
    globalCss: `
    [data-anim="glow"] ${BTN_ANIM_SEL}:hover { box-shadow: 0 0 12px var(--accent-alpha, rgba(255,255,255,0.15)); transform: translateY(-1px); }
    [data-anim="glow"] .track-row[data-active="true"] { box-shadow: inset 2px 0 0 var(--accent); }
  `
  }
]

export const NAV_ITEMS: {
  id: 'home' | 'library' | 'playlists' | 'queue' | 'lyrics'
  label: string
  IconComp: React.ComponentType<{ size?: number | string }>
}[] = [
  { id: 'home', label: 'Home', IconComp: Home },
  { id: 'library', label: 'Library', IconComp: Library },
  { id: 'playlists', label: 'Playlists', IconComp: ListMusic },
  { id: 'lyrics', label: 'Lyrics', IconComp: Mic2 }
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
