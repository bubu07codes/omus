import { X, Star, Music, Zap, Globe, Sparkles, Text } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
  openExternal?: (url: string) => void
}

const GITHUB_URL = 'https://github.com/bubu07codes/omus'

export function AboutModal({ isOpen, onClose, openExternal }: AboutModalProps) {
  if (!isOpen) return null

  const go = (url: string) => {
    if (openExternal) openExternal(url)
    else window.open(url, '_blank')
  }

  const [appVersion, setAppVersion] = useState('')
  useEffect(() => {
    window.api
      ?.getAppVersion?.()
      .then(setAppVersion)
      .catch(() => {})
  }, [])

  const [logoClicks, setLogoClicks] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  const handleLogoClick = () => {
    if (isSpinning) return
    const nextClicks = logoClicks + 1
    if (nextClicks >= 4) {
      setIsSpinning(true)
      setLogoClicks(0)
    } else {
      setLogoClicks(nextClicks)
    }
  }

  return (
    <div className="about-overlay" onClick={onClose}>
      <style>{`
        .about-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(14px) saturate(120%);
          -webkit-backdrop-filter: blur(14px) saturate(120%);
          animation: aboutFadeIn 0.2s ease;
        }
        @keyframes aboutFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .about-card {
          position: relative;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 20px;
          padding: 32px;
          background: color-mix(in srgb, var(--card-bg, #18181b) 87%, transparent);
          border: 1px solid color-mix(in srgb, var(--text-primary, #fff) 14%, transparent);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(24px) saturate(1.3);
          -webkit-backdrop-filter: blur(24px) saturate(1.3);
          text-align: center;
          animation: aboutCardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes aboutCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }

        .about-close {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.06);
          border: none;
          color: var(--text-primary, #f4f4f5);
          transition: background 0.15s ease, transform 0.15s ease;
          z-index: 5;
        }
        .about-close:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: scale(1.05);
        }

        .about-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .about-logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 30px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .about-logo-wrapper:active {
          transform: scale(0.95);
        }

        .about-logo-wrapper.spinning {
          animation: logoSpin 2s ease infinite;
        }

        @keyframes logoSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .about-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
        }

        .about-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--text-secondary, #a1a1aa);
          margin: 12px 0 24px;
        }
        .about-desc strong {
          color: var(--text-primary, #f4f4f5);
          font-weight: 600;
        }

        .about-feats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 24px;
          text-align: left;
        }
        .about-feat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--text-primary, #f4f4f5);
        }
        .about-feat svg {
          color: var(--accent, #6366f1);
          flex-shrink: 0;
        }

        .about-github {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          justify-content: center;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--bg, #09090b);
          background: var(--accent, #6366f1);
          border: none;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .about-github:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .about-meta {
          margin-top: 20px;
          font-size: 11.5px;
          color: var(--text-secondary, #a1a1aa);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>

      <div className="about-card" onClick={(e) => e.stopPropagation()}>
        <button className="about-close" onClick={onClose} title="Close">
          <X size={16} />
        </button>

        <div className="about-header">
          <div
            className={`about-logo-wrapper ${isSpinning ? 'spinning' : ''}`}
            onClick={handleLogoClick}
          >
            <img
              src="./app.svg"
              alt="omus logo"
              className="about-logo-img"
              draggable={false}
              onError={(e) => {
                const parent = e.currentTarget.parentElement
                if (parent) parent.style.display = 'none'
              }}
            />
          </div>
        </div>

        <p className="about-desc">
          <strong>omus</strong> is a local desktop music player. Built natively with modern web
          technologies, it blends zero-latency playback with a rich feature set, completely
          open-source and free of bloat.
        </p>

        <div className="about-feats">
          <div className="about-feat">
            <Sparkles size={15} /> Audio Visualizer
          </div>
          <div className="about-feat">
            <Zap size={15} /> Instant Seeking
          </div>
          <div className="about-feat">
            <Music size={15} /> 10-Band EQ
          </div>
          <div className="about-feat">
            <Text size={15} /> Synced Lyrics
          </div>
          <div className="about-feat">
            <Star size={15} /> Dynamic Themes
          </div>
          <div className="about-feat">
            <Globe size={15} /> Open Source
          </div>
        </div>

        <button className="about-github" onClick={() => go(GITHUB_URL)}>
          <Globe size={16} /> View Source on GitHub
        </button>

        <div className="about-meta">
          <span>Powered by Electron, React, and TypeScript</span>
          <span>Open Source Software</span>
        </div>

        <span
          style={{
            display: 'block',
            marginTop: 14,
            fontSize: 12,
            color: 'var(--text-secondary)'
          }}
        >
          {appVersion ? `omus v${appVersion}` : ''}
        </span>
      </div>
    </div>
  )
}