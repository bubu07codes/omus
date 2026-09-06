import React from 'react'

export function LoadingScreen(): React.ReactElement {
  return (
    <div className="load-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');

        .load-screen {
          position: fixed; inset: 0; z-index: 10000;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
          background: #080808; color: #fff; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          user-select: none;
          -webkit-app-region: drag;
        }

        .load-logo {
          display: flex; align-items: center; gap: 10px;
          -webkit-app-region: no-drag;
        }

        .load-name {
          font-size: 28px; font-weight: 800; letter-spacing: -0.8px;
          background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .load-bar {
          width: 200px; height: 3px; border-radius: 99px; overflow: hidden;
          background: rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .load-bar-fill {
          position: absolute; top: 0; bottom: 0; left: 0; width: 45%;
          border-radius: 99px;
          background: linear-gradient(90deg, transparent, var(--accent, #fff), transparent);
          animation: loadSlide 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        .load-hint {
          font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.35); text-transform: uppercase;
        }

        @keyframes loadPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        @keyframes loadSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(230%); }
        }
      `}</style>

      <div className="load-logo">
        <span className="load-name">omus</span>
      </div>
      <div className="load-bar">
        <div className="load-bar-fill" />
      </div>
      <span className="load-hint">Loading library</span>
    </div>
  )
}