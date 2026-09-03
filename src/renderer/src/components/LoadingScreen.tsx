import React from 'react'

/**
 * Full-viewport loading overlay shown while the app hydrates its library,
 * playlists and settings on first mount.
 *
 * Self-contained (embedded <style>) so it also renders correctly even before
 * the rest of the app's styles are applied. Sits below the frameless
 * title bar so minimise / close / about still work during startup.
 */
export function LoadingScreen(): React.ReactElement {
  return (
    <div className="load-screen">
      <style>{`
        .load-screen {
          position: fixed; inset: 0; z-index: 10000;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px;
          background: #080808; color: #fff; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
          user-select: none;
        }
        .load-logo { display: flex; align-items: center; gap: 12px; }
        .load-dot {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--accent, #fff); box-shadow: 0 0 16px var(--accent, #fff);
          animation: loadPulse 1.1s ease-in-out infinite;
        }
        .load-name { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .load-bar {
          width: 180px; height: 3px; border-radius: 2px; overflow: hidden;
          background: rgba(255,255,255,0.12);
        }
        .load-bar-fill {
          width: 40%; height: 100%; border-radius: 2px;
          background: linear-gradient(90deg, transparent, var(--accent, #fff), transparent);
          animation: loadSlide 1.2s ease-in-out infinite;
        }
        .load-hint { font-size: 12px; letter-spacing: 0.4px; color: rgba(255,255,255,0.5); }
        @keyframes loadPulse { 0%,100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes loadSlide { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
      `}</style>

      <div className="load-logo">
        <span className="load-name">omus</span>
      </div>
      <div className="load-bar">
        <div className="load-bar-fill" />
      </div>
      <p className="load-hint">Loading your library...</p>
    </div>
  )
}
