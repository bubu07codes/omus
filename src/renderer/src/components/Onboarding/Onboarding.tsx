import React, { useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  ListMusic,
  Maximize2,
  Mic2,
  MonitorPlay,
  Music,
  Palette,
  Sliders,
  Sparkles,
  X
} from 'lucide-react'
import { PRESET_THEMES } from '../../constants/presets'
import { Theme } from '../../types'

interface OnboardingProps {
  currentThemeId: string
  onThemeChange: (theme: Theme) => void
  uiScale: number
  onScaleChange: (value: number) => void
  onComplete: () => void
}

const SCALE_OPTIONS = [0.8, 1, 1.25, 1.5]

const FEATURES: {
  Icon: React.ComponentType<{ size?: number | string }>
  title: string
  desc: string
}[] = [
  {
    Icon: FolderPlus,
    title: 'Easy import',
    desc: 'Point to any folder of audio or video. Your files stay untouched.'
  },
  {
    Icon: Mic2,
    title: 'Live lyrics',
    desc: 'Sing along with karaoke-style lyrics automatically fetched for your tracks.'
  },
  {
    Icon: Sliders,
    title: '10-band EQ',
    desc: 'Tune your sound with high-grade presets and custom balance controls.'
  },
  {
    Icon: Sparkles,
    title: 'Audio visualizer',
    desc: 'Dynamic reactive bars, waves, and ambient backgrounds that pulse to the track.'
  },
  {
    Icon: ListMusic,
    title: 'Playlists',
    desc: 'Drag to reorder, make custom lists, or load standard .m3u files.'
  },
  {
    Icon: MonitorPlay,
    title: 'Immersive view',
    desc: 'Press F for a clean fullscreen layout built for album art and lyrics.'
  }
]

const STEPS = ['Welcome', 'Offline First', 'Features', 'Theme', 'Text Size', 'Ready']

const CSS = `
  .onb-root {
    position: fixed; inset: 0; z-index: 10050;
    display: flex; align-items: center; justify-content: center; padding: 32px;
    background: rgba(4,4,6,0.62);
    backdrop-filter: blur(20px) saturate(1.15);
    -webkit-app-region: no-drag;
    animation: onbFade .25s ease;
  }
  @keyframes onbFade { from { opacity: 0; } to { opacity: 1; } }

  .onb-card {
    width: min(880px, 100%); max-height: calc(100vh - 64px);
    display: flex; flex-direction: column; overflow: hidden;
    background: color-mix(in srgb, var(--bg) 94%, #000);
    border: 1px solid rgba(128,128,128,0.2);
    border-radius: 26px;
    box-shadow: 0 40px 120px rgba(0,0,0,0.65);
    animation: onbCardIn .35s cubic-bezier(.16,1,.3,1);
  }
  @keyframes onbCardIn { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: none; } }

  .onb-head { display: flex; align-items: center; gap: 18px; padding: 22px 26px 0; }
  .onb-progress { flex: 1; display: flex; gap: 6px; }
  .onb-prog-seg { flex: 1; height: 3px; border-radius: 99px; background: rgba(128,128,128,0.2); transition: background .3s ease; }
  .onb-prog-seg[data-active="true"] { background: var(--accent); }
  .onb-prog-seg[data-current="true"] { background: var(--accent); box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 60%, transparent); }

  .onb-skip {
    display: inline-flex; align-items: center; gap: 5px;
    background: transparent; border: none; cursor: pointer;
    color: var(--text-secondary); font-size: 12px; font-weight: 600;
    padding: 6px 8px; border-radius: 8px; transition: var(--transition);
  }
  .onb-skip:hover { color: var(--text-primary); background: rgba(128,128,128,0.1); }

  .onb-body { flex: 1; overflow-y: auto; padding: 20px 40px 12px; }
  .onb-step { min-height: 420px; animation: onbStepIn .32s cubic-bezier(.16,1,.3,1); }
  @keyframes onbStepIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }

  .onb-center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 420px; padding: 12px 0; }
  .onb-wide { min-height: 0; }

  .onb-logo {
    font-size: 34px; font-weight: 800; letter-spacing: -1px; margin-bottom: 14px;
    background: linear-gradient(180deg, var(--text-primary) 0%, color-mix(in srgb, var(--text-primary) 60%, transparent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .onb-title { margin: 0 0 10px; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .onb-sub { margin: 0 auto 26px; max-width: 540px; font-size: 14.5px; line-height: 1.65; color: var(--text-secondary); }

  .onb-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 14px; margin-bottom: 16px;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  }

  .onb-start { padding: 12px 26px; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; }

  .onb-steps { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 420px; text-align: left; }
  .onb-step-row { display: flex; gap: 14px; align-items: flex-start; }
  .onb-step-num {
    flex: none; width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; margin-top: 1px;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--accent); font-size: 12px; font-weight: 800;
  }
  .onb-step-row b { display: block; font-size: 14px; margin-bottom: 2px; }
  .onb-step-row div > div { font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; }

  .onb-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 760px; }
  .onb-feature {
    background: var(--card-bg); border: 1px solid rgba(128,128,128,0.14); border-radius: 14px;
    padding: 16px; text-align: left; display: flex; flex-direction: column; gap: 6px; transition: var(--transition);
  }
  .onb-feature:hover { transform: translateY(-2px); border-color: var(--accent); }
  .onb-feature svg { color: var(--accent); margin-bottom: 4px; }
  .onb-feature b { font-size: 13.5px; }
  .onb-feature span { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

  .onb-theme-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); max-width: 760px; width: 100%; }

  .onb-scale-options { display: flex; gap: 14px; justify-content: center; }
  .onb-scale-opt { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 22px 28px; }
  .onb-scale-opt b { font-size: 13px; }

  .onb-done-check {
    width: 60px; height: 60px; border-radius: 50%; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 34px color-mix(in srgb, var(--accent) 35%, transparent);
    animation: onbPop .45s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes onbPop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }

  .onb-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 26px 22px; border-top: 1px solid rgba(128,128,128,0.1); }
  .onb-foot-left, .onb-foot-right { display: flex; min-width: 96px; }
  .onb-foot-right { justify-content: flex-end; }
  .onb-dots { display: flex; gap: 7px; }
  .onb-dot {
    width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer; padding: 0;
    background: rgba(128,128,128,0.35); transition: var(--transition);
  }
  .onb-dot:hover { background: rgba(128,128,128,0.6); }
  .onb-dot.current { background: var(--accent); transform: scale(1.25); }

  @media (max-width: 640px) {
    .onb-feature-grid { grid-template-columns: 1fr 1fr; }
    .onb-body { padding: 16px 20px 8px; }
  }
`

export function Onboarding({
  currentThemeId,
  onThemeChange,
  uiScale,
  onScaleChange,
  onComplete
}: OnboardingProps): React.ReactElement {
  const [step, setStep] = useState(0)
  const totalSteps = STEPS.length

  const next = (): void => {
    if (step === totalSteps - 1) onComplete()
    else setStep((s) => s + 1)
  }
  const back = (): void => setStep((s) => Math.max(0, s - 1))

  return (
    <div className="onb-root" role="dialog" aria-modal="true" aria-label="Welcome to omus">
      <style>{CSS}</style>

      <div className="onb-card">
        <div className="onb-head">
          <div className="onb-progress">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className="onb-prog-seg"
                data-active={i <= step}
                data-current={i === step}
              />
            ))}
          </div>
          <button className="onb-skip" onClick={onComplete} title="Skip onboarding">
            Skip <X size={12} />
          </button>
        </div>

        <div className="onb-body">
          <div className="onb-step" key={step}>
            {step === 0 && (
              <div className="onb-center">
                <div className="onb-logo">omus</div>
                <h1 className="onb-title">Pure local audio</h1>
                <p className="onb-sub">
                  Play your music collection offline with live lyrics, custom EQ, and audio reactive visuals. No accounts, no ads, no cloud.
                </p>
                <button
                  className="btn btn-primary btn-pill btn-accent-glow onb-start"
                  onClick={next}
                >
                  Get Started <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="onb-center">
                <span className="onb-badge">
                  <FolderPlus size={18} />
                </span>
                <h1 className="onb-title">Your files stay where they are</h1>
                <p className="onb-sub">
                  omus reads tracks directly from your hard drive. Nothing is moved, modified, or copied.
                </p>
                <div className="onb-steps">
                  <div className="onb-step-row">
                    <span className="onb-step-num">1</span>
                    <div>
                      <b>Select a folder</b>
                      <div>Choose any local directory containing your audio files.</div>
                    </div>
                  </div>
                  <div className="onb-step-row">
                    <span className="onb-step-num">2</span>
                    <div>
                      <b>Automatic scan</b>
                      <div>Metadata, track tags, and cover art load instantly.</div>
                    </div>
                  </div>
                  <div className="onb-step-row">
                    <span className="onb-step-num">3</span>
                    <div>
                      <b>Ready offline</b>
                      <div>Listen anytime without needing an internet connection.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="onb-center">
                <span className="onb-badge">
                  <Sparkles size={18} />
                </span>
                <h1 className="onb-title">Everything you need</h1>
                <p className="onb-sub">Built for seamless listening without clutter.</p>
                <div className="onb-feature-grid">
                  {FEATURES.map(({ Icon, title, desc }) => (
                    <div key={title} className="onb-feature">
                      <Icon size={20} />
                      <b>{title}</b>
                      <span>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="onb-center onb-wide">
                <span className="onb-badge">
                  <Palette size={18} />
                </span>
                <h1 className="onb-title">Choose your theme</h1>
                <p className="onb-sub">
                  Select a look now or change it later in Settings.
                </p>
                <div className="theme-grid onb-theme-grid">
                  {PRESET_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      className="theme-card"
                      onClick={() => onThemeChange(theme)}
                      style={{
                        background: theme.cardBg,
                        borderColor:
                          currentThemeId === theme.id ? theme.accent : 'rgba(128,128,128,0.16)',
                        borderWidth: currentThemeId === theme.id ? 2 : 1
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>
                        {theme.name}
                      </div>
                      <div className="theme-dots">
                        <div className="theme-dot" style={{ background: theme.bg }} />
                        <div className="theme-dot" style={{ background: theme.sidebarBg }} />
                        <div className="theme-dot" style={{ background: theme.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="onb-center">
                <span className="onb-badge">
                  <Maximize2 size={18} />
                </span>
                <h1 className="onb-title">Interface size</h1>
                <p className="onb-sub">
                  Adjust interface scale for your screen. You can also zoom anytime using <b>Ctrl + Scroll</b>.
                </p>
                <div className="onb-scale-options">
                  {SCALE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      className="opt-card onb-scale-opt"
                      data-active={Math.abs(uiScale - s) < 0.011}
                      onClick={() => onScaleChange(s)}
                    >
                      <span style={{ fontSize: Math.max(14, 16 * s) }}>Aa</span>
                      <b>{Math.round(s * 100)}%</b>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="onb-center">
                <div className="onb-done-check">
                  <Check size={28} strokeWidth={3} />
                </div>
                <h1 className="onb-title">Ready to play</h1>
                <p className="onb-sub">
                  Select a music folder to begin populating your library.
                </p>
                <button
                  className="btn btn-primary btn-pill btn-accent-glow onb-start"
                  onClick={onComplete}
                >
                  Start Listening <Music size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="onb-foot">
          <div className="onb-dots">
           
          </div>
          <div className="onb-foot-right">
            {step > 0 && step < totalSteps - 1 ? (
              <button className="btn btn-primary btn-pill" onClick={next}>
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}