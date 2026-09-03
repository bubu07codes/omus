export const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; width: 100%; }
  ::-webkit-scrollbar { width: 7px; height: 7px; }
  ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.22); border-radius: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }

  @keyframes fadeInSlide {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes artFade {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes fluidMorph1 {
    0%   { transform: translate(-10%,-15%) rotate(0deg)   scale(1.15); }
    33%  { transform: translate(15%, 10%) rotate(120deg)  scale(1.35); }
    66%  { transform: translate(-5%, 20%) rotate(240deg)  scale(1.05); }
    100% { transform: translate(-10%,-15%) rotate(360deg) scale(1.15); }
  }
  @keyframes fluidMorph2 {
    0%   { transform: translate(10%, 15%) rotate(0deg)    scale(1.2); }
    33%  { transform: translate(-20%,-10%) rotate(-120deg) scale(0.95); }
    66%  { transform: translate(15%,-20%) rotate(-240deg)  scale(1.4); }
    100% { transform: translate(10%, 15%) rotate(-360deg)  scale(1.2); }
  }
  @keyframes fluidMorph3 {
    0%   { transform: translate(-15%, 10%) scale(1.1); opacity: 0.7; }
    50%  { transform: translate(10%,-15%)  scale(1.35); opacity: 1; }
    100% { transform: translate(-15%, 10%) scale(1.1); opacity: 0.7; }
  }
  @keyframes eqPulse { 0%,100% { height: 25%; } 50% { height: 100%; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes loadingPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

  .animate-spin { animation: spin 0.9s linear infinite; }
  .animate-pulse { animation: loadingPulse 1.4s ease-in-out infinite; }

  .view-fade { animation: fadeInSlide 0.28s cubic-bezier(0.16,1,0.3,1); }
  .row-in    { animation: rowIn 0.24s cubic-bezier(0.16,1,0.3,1) both; }
  .art-fade  { animation: artFade 0.3s  cubic-bezier(0.16,1,0.3,1); }

  .app-shell {
    display: flex; height: 100vh; width: 100vw;
    padding-top: var(--titlebar-h, 0px);
    background: var(--bg); color: var(--text-primary);
    font-family: var(--font); overflow: hidden; position: relative;
  }

  /* Fluid Ambient Orbs */
  .fluid-bg-container {
    position: fixed; inset: -20%; pointer-events: none;
    z-index: 0; overflow: hidden; transition: opacity 0.8s ease;
  }
  .fluid-orb { position: absolute; border-radius: 50%; background-size: cover; background-position: center; will-change: transform, opacity; }
  .fluid-orb.orb-1 { top: 5%; left: 5%; width: 75vw; height: 75vw; }
  .fluid-orb.orb-2 { bottom: 5%; right: 5%; width: 80vw; height: 80vw; }
  .fluid-orb.orb-3 { top: 25%; left: 30%; width: 65vw; height: 65vw; }
  .fluid-scrim { position: fixed; inset: 0; pointer-events: none; z-index: 1; transition: background 0.4s ease; }

  /* Left Rail */
  .rail {
    width: 84px; flex-shrink: 0; background: var(--sidebar-bg);
    border-right: 1px solid rgba(128,128,128,0.14);
    display: flex; flex-direction: column; align-items: center;
    padding: 22px 0 110px; gap: 6px; z-index: 20; position: relative;
    backdrop-filter: blur(16px);
  }
  .rail-logo { width: max-content; height: max-content; background: transparent; margin-bottom: 16px; transition: transform 0.8s cubic-bezier(0.34,1.56,0.64,1); cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .rail-logo:hover { transform: scale(1.06) rotate(-3deg); }
  .rail-logo img { width: 20px; height: 20px; display: block; }
  .rail-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .rail-btn { width: 60px; height: 58px; border-radius: 14px; background: transparent; border: none;
    color: var(--text-secondary); cursor: pointer; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px; transition: var(--transition);
    font-family: var(--font); position: relative; }
  .rail-btn:hover { color: var(--text-primary); background: rgba(128,128,128,0.12); }
  .rail-btn[data-active="true"] { background: var(--card-bg); color: var(--text-primary); }
  .rail-btn[data-active="true"] svg { color: var(--accent); transform: scale(1.1); }
  .rail-btn .lbl { font-size: 11px; font-weight: 800; letter-spacing: 0.4px; }
  .rail-actions { display: flex; flex-direction: column; gap: 8px; padding: 0 12px; width: 100%; }
  .rail-fab { width: 100%; height: 40px; border-radius: 12px; border: none; cursor: pointer; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition); }
  .rail-fab.primary { background: var(--accent); color: var(--bg); }
  .rail-fab.primary:hover { filter: brightness(1.12); }
  .rail-fab.ghost { background: var(--card-bg); color: var(--text-primary); border: 1px solid rgba(128,128,128,0.18); }
  .rail-fab.ghost:hover { background: rgba(128,128,128,0.1); }

  /* Main content */
  .content {
    flex: 1; overflow-y: auto; padding: 36px 44px 130px;
    min-width: 0; position: relative; z-index: 10;
    animation: fadeInSlide 0.22s ease-out;
  }
  .content-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 26px; flex-wrap: wrap; }
  .eyebrow { font-size: 12px; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.3px; margin: 0 0 20px; }

  /* Search pill */
  .search-pill { display: flex; align-items: center; gap: 10px; background: var(--card-bg);
    border: 1px solid rgba(128,128,128,0.16); border-radius: 999px; padding: 10px 16px;
    max-width: 380px; flex: 1; min-width: 200px; transition: var(--transition); backdrop-filter: blur(10px); }
  .search-pill:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(128,128,128,0.15); }
  .search-pill input { flex: 1; background: transparent; border: none; outline: none;
    color: var(--text-primary); font-size: 13px; font-family: var(--font); margin: 0; padding: 0; }
  .search-pill input::placeholder { color: var(--text-secondary); opacity: 0.7; }
  .search-pill svg { color: var(--text-secondary); flex-shrink: 0; }
  .search-pill svg:hover { color: var(--text-primary); }

  /* Segmented control */
  .seg { display: flex; gap: 2px; background: var(--card-bg); padding: 4px; border-radius: 10px; border: 1px solid rgba(128,128,128,0.16); backdrop-filter: blur(10px); }
  .seg button { background: transparent; border: none; color: var(--text-secondary); padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font); transition: var(--transition); display: flex; align-items: center; gap: 6px; }
  .seg button[data-active="true"] { background: var(--accent); color: var(--bg); }

  /* Track Table */
  .track-table { width: 100%; border-collapse: collapse; }
  .track-head-row { display: grid; grid-template-columns: 32px 2.2fr 1.4fr 1.4fr 70px 150px 32px 32px; padding: 0 14px 10px; color: var(--text-secondary); font-size: 10px; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid rgba(128,128,128,0.12); }
  .track-row { display: grid; grid-template-columns: 32px 2.2fr 1.4fr 1.4fr 70px 150px 32px 32px; align-items: center; padding: 9px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; transition: var(--transition); margin-bottom: 2px; }
  .track-row:hover { background: rgba(128,128,128,0.08); }
  .track-row[data-active="true"] { background: var(--card-bg); box-shadow: inset 3px 0 0 var(--accent), 0 0 0 1px rgba(128,128,128,0.18); }
  .track-row .idx { color: var(--text-secondary); font-size: 11px; font-variant-numeric: tabular-nums; }
  .art-thumb { width: 34px; height: 34px; border-radius: 8px; overflow: hidden; background: rgba(128,128,128,0.14); flex-shrink: 0; }
  .art-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .t-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 10px; }
  .t-sub { color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
  .t-time { color: var(--text-secondary); font-size: 11px; font-variant-numeric: tabular-nums; }
  .row-action { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; opacity: 0; transition: var(--transition); display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 6px; }
  .track-row:hover .row-action { opacity: 1; }
  .row-action:hover { background: rgba(128,128,128,0.14); color: var(--text-primary); }

  [data-density="compact"] .track-row { padding: 4px 14px; font-size: 12px; }
  [data-density="compact"] .art-thumb { width: 26px; height: 26px; }
  [data-density="compact"] .t-sub { font-size: 11px; }

  /* Grid cards */
  .track-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 18px; }
  .track-card { cursor: pointer; background: var(--card-bg); padding: 12px; border-radius: 14px; border: 1px solid rgba(128,128,128,0.12); position: relative; transition: var(--transition); backdrop-filter: blur(10px); overflow: hidden; }
  .track-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 10px 25px -10px rgba(0,0,0,0.5); }
  .track-card:active { transform: scale(0.98); }
  .track-card .art { width: 100%; aspect-ratio: 1/1; background: rgba(128,128,128,0.14); border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
  .track-card .art img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-x { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.55); color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; opacity: 0; transition: var(--transition); display: flex; align-items: center; justify-content: center; }
  .track-card:hover .card-x { opacity: 1; }

  /* Buttons */
  .btn, .btn-primary, .btn-ghost, .btn-plain, .icon-btn, .switch-label, .rail-btn { font-family: var(--font); }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .btn { border: none; cursor: pointer; border-radius: 10px; font-weight: 700; font-size: 12px; font-family: var(--font); transition: var(--transition); display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  .btn:hover { filter: brightness(1.12); }
  .btn:active { transform: translateY(1px); }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; filter: none; transform: none; }
  .btn-primary { background: var(--accent); color: var(--bg); padding: 10px 20px; font-weight: 700; }
  .btn-primary:hover { filter: brightness(1.12); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-ghost { background: var(--card-bg); color: var(--text-primary); border: 1px solid rgba(128,128,128,0.18); padding: 10px 20px; }
  .btn-ghost:hover { background: rgba(128,128,128,0.12); border-color: var(--accent); }
  .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-plain { background: transparent; color: var(--text-secondary); padding: 6px 8px; }
  .btn-plain:hover { color: var(--text-primary); }
  .icon-btn { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-primary); cursor: pointer; transition: var(--transition); padding: 0; }
  .icon-btn:hover { background: rgba(128,128,128,0.14); transform: scale(1.05); }
  .icon-btn:active { transform: scale(0.92); }
  .icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .icon-btn.sm { width: 34px; height: 34px; color: var(--text-secondary); position: relative; }
  .icon-btn.sm:hover { color: var(--text-primary); background: rgba(128,128,128,0.12); }
  .icon-btn.sm[data-active="true"] { color: var(--accent); background: rgba(128,128,128,0.14); }
  .icon-btn.sm[data-active="true"]::after { content:''; position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }

  /* Form elements */
  .field { background: var(--card-bg); border: 1px solid rgba(128,128,128,0.18); color: var(--text-primary); padding: 10px 13px; border-radius: 10px; width: 100%; outline: none; font-size: 13px; font-family: var(--font); transition: var(--transition); }
  .field:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(128,128,128,0.15); outline: none; }
  .field:disabled { opacity: 0.5; cursor: not-allowed; }
  .lbl-caps { font-size: 10px; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.6px; display: block; margin-bottom: 6px; }

  /* Toggles */
  .switch-track { width: 36px; height: 20px; border-radius: 999px; position: relative; flex-shrink: 0; transition: var(--transition); background: rgba(128,128,128,0.3); }
  .switch-track[data-active='true'] { background: var(--accent); }
  .switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: var(--transition); }
  .switch-track[data-active='true'] .switch-knob { left: 18px; }
  .switch-label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; background: transparent; border: none; padding: 6px 0; color: var(--text-secondary); font-size: 11px; font-weight: 700; font-family: var(--font); transition: var(--transition); }
  .switch-label:hover { color: var(--text-primary); }

  /* EQ animation bars */
  .eq { display: flex; align-items: flex-end; gap: 2px; height: 14px; width: 14px; flex-shrink: 0; }
  .eq span { width: 3px; background: var(--accent); border-radius: 1px; animation: eqPulse 0.9s ease-in-out infinite; }
  .eq span:nth-child(1) { animation-delay: 0s; }
  .eq span:nth-child(2) { animation-delay: 0.2s; }
  .eq span:nth-child(3) { animation-delay: 0.4s; }

  /* Settings */
  .settings-section { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid rgba(128,128,128,0.1); }
  .settings-section:last-child { border-bottom: none; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; }
  .settings-row-text { min-width: 0; }
  .settings-row-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .settings-row-desc { font-size: 11px; color: var(--text-secondary); }

  /* Theme & anim cards */
  .theme-grid, .anim-grid, .font-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .theme-card { padding: 16px; border-radius: 14px; cursor: pointer; text-align: left; border: 1px solid rgba(128,128,128,0.16); font-family: var(--font); transition: var(--transition); backdrop-filter: blur(10px); }
  .theme-card:hover { transform: translateY(-2px); }
  .theme-dots { display: flex; gap: 6px; margin-top: 10px; }
  .theme-dot { width: 15px; height: 15px; border-radius: 50%; }
  .opt-card { padding: 13px 14px; border-radius: 12px; cursor: pointer; text-align: left; border: 1px solid rgba(128,128,128,0.16); background: transparent; color: var(--text-secondary); font-family: var(--font); transition: var(--transition); font-size: 13px; }
  .opt-card:hover { border-color: var(--accent); color: var(--text-primary); }
  .opt-card:active { transform: scale(0.98); }
  .opt-card[data-active="true"] { background: var(--card-bg); border-color: var(--accent); color: var(--text-primary); }

  /* Bottom player bar */
  .spotify-player {
    position: fixed; bottom: 0; left: 0; right: 0; height: 92px;
    background: var(--sidebar-bg); backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border-top: 1px solid rgba(128,128,128,0.16);
    display: grid; grid-template-columns: 300px 1fr 300px;
    align-items: center; padding: 0 24px; z-index: 100; user-select: none;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.35); transition: background 0.3s ease;
  }
  .sp-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .sp-cover-wrap { position: relative; width: 56px; height: 56px; border-radius: 8px; overflow: hidden;
    background: var(--card-bg); flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    cursor: pointer; border: 1px solid rgba(128,128,128,0.14); }
  .sp-cover-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
  .sp-cover-wrap:hover img { transform: scale(1.08); }
  .sp-cover-hover-icon { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; color: #fff; }
  .sp-cover-wrap:hover .sp-cover-hover-icon { opacity: 1; }
  .sp-info { display: flex; flex-direction: column; min-width: 0; gap: 2px; }
  .sp-title { font-size: 13.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); letter-spacing: -0.2px; }
  .sp-artist { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sp-actions-left { display: flex; align-items: center; gap: 6px; margin-left: 4px; }
  .sp-heart-btn { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .sp-heart-btn:hover { color: var(--accent); transform: scale(1.15); }
  .sp-heart-btn.liked { color: var(--accent); filter: drop-shadow(0 0 6px var(--accent)); }
  .sp-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; max-width: 600px; width: 100%; margin: 0 auto; }
  .sp-controls { display: flex; align-items: center; gap: 16px; }
  .sp-btn-icon { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 7px; border-radius: 50%; position: relative; transition: var(--transition); }
  .sp-btn-icon:hover { color: var(--text-primary); transform: scale(1.08); }
  .sp-btn-icon[data-active="true"] { color: var(--accent); }
  .sp-btn-icon[data-active="true"]::after { content:''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
  .sp-play-btn { width: 42px; height: 42px; border-radius: 50%; background: var(--accent); color: var(--bg); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 4px 14px rgba(0,0,0,0.25); padding: 0; }
  .sp-play-btn:hover { transform: scale(1.1); filter: brightness(1.12); }
  .sp-play-btn:active { transform: scale(0.95); }
  .sp-play-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .sp-timeline { display: flex; align-items: center; gap: 10px; width: 100%; }
  .sp-time { font-size: 11px; font-weight: 700; color: var(--text-secondary); font-variant-numeric: tabular-nums; min-width: 36px; text-align: center; }
  .sp-scrub-track { position: relative; flex: 1; height: 14px; display: flex; align-items: center; cursor: pointer; }
  .sp-scrub-bg { width: 100%; height: 4px; border-radius: 4px; background: rgba(128,128,128,0.24); position: relative; overflow: visible; transition: height 0.15s ease; }
  .sp-scrub-track:hover .sp-scrub-bg { height: 6px; }
  .sp-scrub-fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--accent); border-radius: 4px; transition: width 0.08s linear; }
  .sp-scrub-thumb { position: absolute; top: 50%; transform: translate(-50%,-50%) scale(0); width: 12px; height: 12px; border-radius: 50%; background: var(--text-primary); box-shadow: 0 2px 6px rgba(0,0,0,0.4); transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
  .sp-scrub-track:hover .sp-scrub-thumb { transform: translate(-50%,-50%) scale(1); }
  .sp-scrub-tooltip { position: absolute; bottom: 22px; transform: translateX(-50%); background: var(--card-bg); border: 1px solid rgba(128,128,128,0.24); color: var(--text-primary); padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 800; font-variant-numeric: tabular-nums; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
  .sp-right { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
  .sp-btn-lyrics { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.18); color: var(--text-secondary); font-size: 11px; font-weight: 800; cursor: pointer; font-family: var(--font); transition: var(--transition); }
  .sp-btn-lyrics:hover { color: var(--text-primary); border-color: var(--accent); transform: translateY(-1px); }
  .sp-btn-lyrics[data-active="true"] { background: var(--accent); color: var(--bg); border-color: var(--accent); }
  .sp-vol-group { display: flex; align-items: center; gap: 8px; margin-left: 6px; }
  .sp-vol-slider { width: 90px; height: 4px; border-radius: 2px; appearance: none; -webkit-appearance: none; background: rgba(128,128,128,0.24); outline: none; cursor: pointer; }
  .sp-vol-slider::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--text-primary); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.4); transition: transform 0.15s ease; }
  .sp-vol-slider:hover::-webkit-slider-thumb { transform: scale(1.2); background: var(--accent); }

  /* Loading indicator in player bar */
  .sp-loading-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: loadingPulse 0.8s ease-in-out infinite; }

  /* Playlists */
  .pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 18px; }
  .pl-card { cursor: pointer; background: var(--card-bg); padding: 14px 14px 12px; border-radius: 14px; border: 1px solid rgba(128,128,128,0.12); transition: var(--transition); position: relative; backdrop-filter: blur(10px); overflow: hidden; }
  .pl-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 10px 25px -10px rgba(0,0,0,0.5); }
  .pl-card:active { transform: scale(0.98); }
  .pl-card-cover { width: 100%; aspect-ratio: 1/1; border-radius: 10px; overflow: hidden; margin-bottom: 12px; position: relative; background: rgba(128,128,128,0.14); }
  .pl-card-cover.gradient { display: flex; align-items: center; justify-content: center; }
  .pl-card-cover svg.note { color: rgba(255,255,255,0.55); }
  .pl-hero-cover svg.note { color: rgba(255,255,255,0.7); }
  .pl-card .pl-name { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pl-card .pl-count { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
  .pl-card-x { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.55); color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; opacity: 0; transition: var(--transition); display: flex; align-items: center; justify-content: center; }
  .pl-card:hover .pl-card-x { opacity: 1; }
  .pl-hero { display: flex; gap: 26px; align-items: flex-end; margin-bottom: 26px; flex-wrap: wrap; }
  .pl-hero-cover { width: 200px; height: 200px; max-width: 100%; border-radius: 12px; overflow: hidden; flex-shrink: 0; box-shadow: 0 18px 40px rgba(0,0,0,0.45); position: relative; }
  .pl-hero-cover.collage { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
  .pl-hero-cover.collage img { width: 100%; height: 100%; object-fit: cover; }
  .pl-hero-cover.gradient { display: flex; align-items: center; justify-content: center; }
  .pl-hero-type { font-size: 12px; font-weight: 700; color: var(--text-secondary); letter-spacing: 1px; text-transform: uppercase; }
  .pl-hero-title { font-size: clamp(24px, 4vw, 38px); font-weight: 900; letter-spacing: -0.5px; line-height: 1.05; margin: 6px 0 10px; overflow-wrap: anywhere; }
  .pl-hero-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
  .pl-hero-actions { display: flex; align-items: center; gap: 12px; margin: 18px 0 8px; }
  .pl-hero-title-row { display: flex; align-items: center; gap: 8px; }
  .pl-hero-title-btn { background: transparent; border: none; color: var(--text-secondary); padding: 6px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; opacity: 0.55; transition: var(--transition); }
  .pl-hero-title-btn:hover { color: var(--text-primary); opacity: 1; }
  .pl-hero-title-input { font-size: clamp(20px, 3.2vw, 30px); font-weight: 900; letter-spacing: -0.5px; background: rgba(128,128,128,0.1); border: 1px solid var(--accent); border-radius: 8px; color: var(--text-primary); padding: 2px 10px; outline: none; font-family: var(--font); }
  .pl-card-cover.image img, .pl-hero-cover.image img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pl-card-cover.collage { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; }
  .pl-card-cover.collage img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pl-options-wrap { position: relative; }
  .pl-options-backdrop { position: fixed; inset: 0; z-index: 55; }
  .pl-options-menu { position: absolute; right: 0; top: calc(100% + 8px); width: 288px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.18); border-radius: 14px; padding: 8px; box-shadow: 0 18px 40px rgba(0,0,0,0.5); z-index: 60; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); max-height: 70vh; overflow-y: auto; }
  .pl-opt-label { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 8px 4px; }
  .pl-opt-row { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; color: var(--text-primary); font-family: var(--font); font-size: 13px; padding: 8px; border-radius: 8px; cursor: pointer; text-align: left; }
  .pl-opt-row:hover { background: rgba(128,128,128,0.1); }
  .pl-opt-row.danger { color: #f87171; }
  .pl-opt-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 8px 8px; }
  .pl-opt-chip { background: transparent; border: 1px solid rgba(128,128,128,0.2); color: var(--text-secondary); font-size: 11px; font-family: var(--font); padding: 4px 9px; border-radius: 999px; cursor: pointer; }
  .pl-opt-chip[data-active='true'] { border-color: var(--accent); color: var(--text-primary); background: rgba(128,128,128,0.08); }
  .pl-gradient-sw { width: 26px; height: 26px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; padding: 0; }
  .pl-gradient-sw[data-active='true'] { border-color: var(--accent); transform: scale(1.08); }
  .pl-opt-divider { height: 1px; background: rgba(128,128,128,0.14); margin: 6px 4px; }
  .play-lg { width: 52px; height: 52px; border-radius: 50%; border: none; background: var(--accent); color: var(--bg); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
  .play-lg:hover { transform: scale(1.08); }
  .pl-empty { padding: 38px; text-align: center; color: var(--text-secondary); border: 1px dashed rgba(128,128,128,0.22); border-radius: 14px; font-size: 13px; }
  .pl-track-head { display: grid; grid-template-columns: 26px 2.2fr 1.4fr 1.4fr 70px 32px; padding: 0 14px 10px; color: var(--text-secondary); font-size: 10px; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid rgba(128,128,128,0.12); }
  .pl-track-row { display: grid; grid-template-columns: 26px 2.2fr 1.4fr 1.4fr 70px 32px; align-items: center; padding: 9px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; transition: var(--transition); }
  .pl-track-row:hover { background: rgba(128,128,128,0.08); }
  .pl-track-row[data-active="true"] { background: var(--card-bg); }
  .pl-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }

  /* Add-to-playlist modal */
  .add-grid { display: grid; grid-template-columns: 26px 2.2fr 1.4fr 1.4fr; gap: 12px; align-items: center; padding: 9px 12px; border-radius: 10px; cursor: pointer; font-size: 13px; transition: var(--transition); }
  .add-grid:hover { background: rgba(128,128,128,0.08); }
  .add-grid[data-active="true"] { background: var(--card-bg); }
  .add-check { width: 18px; height: 18px; border-radius: 6px; border: 2px solid rgba(128,128,128,0.4); background: transparent; display: flex; align-items: center; justify-content: center; color: var(--bg); flex-shrink: 0; transition: var(--transition); }
  .add-check.on { background: var(--accent); border-color: var(--accent); }

  /* Queue */
  .queue-card { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 12px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.1); margin-bottom: 8px; transition: var(--transition); backdrop-filter: blur(10px); }
  .queue-card:hover { border-color: rgba(128,128,128,0.25); }
  .queue-card[data-active="true"] { border-color: var(--accent); box-shadow: inset 3px 0 0 var(--accent); }
  .queue-actions { display: flex; align-items: center; gap: 6px; }
  .queue-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
  .queue-btn:hover { background: rgba(128,128,128,0.12); color: var(--text-primary); }
  .queue-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Lyrics */
  .lyrics-container-view { height: 100%; display: flex; flex-direction: column; position: relative; z-index: 10; }
  .lyrics-header-clean { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; margin-bottom: 12px; border-bottom: 1px solid rgba(128,128,128,0.14); flex-wrap: wrap; gap: 12px; }
  .lyrics-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 30px 20px 48vh; scrollbar-gutter: stable; mask-image: linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%); }
  /* Lyrics animation modes */
  /* Compositor-friendly only (transform/opacity) + cheap text-shadow/color.
     NEVER transition filter: blur() — it re-rasterizes the whole line per
     frame and causes the stutter. */
  .lyric-line {
    font-weight: 800; line-height: 1.25; cursor: pointer;
    transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    overflow-wrap: anywhere;
  }
  /* GPU-promote only the active line (keeps memory low while one layer exists). */
  .lyric-line[data-active="true"],
  .lyric-anim-scale[data-active="true"],
  .lyric-anim-slide[data-active="true"],
  .lyric-anim-glow[data-active="true"],
  .lyric-anim-fade[data-active="true"],
  .lyric-anim-wave[data-active="true"] {
    will-change: transform, opacity;
  }
  .lyric-wave { animation: lyricWave 1.5s ease-in-out infinite; }
  @keyframes lyricWave {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .lyrics-offset-badge { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px; background: rgba(128,128,128,0.14); color: var(--text-secondary); cursor: default; }

  /* Modals */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.72); backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 32px; animation: fadeIn 0.15s ease; }
  .modal { width: 100%; max-width: 920px; background: var(--bg); border: 1px solid rgba(128,128,128,0.16); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; max-height: 88vh; animation: fadeInSlide 0.2s cubic-bezier(0.16,1,0.3,1); box-shadow: 0 20px 60px rgba(0,0,0,0.7); position: relative; z-index: 1001; }
  .modal-head { padding: 20px 24px; border-bottom: 1px solid rgba(128,128,128,0.1); display: flex; justify-content: space-between; align-items: center; }
  .modal-body { display: grid; grid-template-columns: 260px 1fr; flex: 1; overflow: hidden; }
  .modal-list { border-right: 1px solid rgba(128,128,128,0.1); overflow-y: auto; padding: 10px; }
  .modal-list-item { padding: 10px; border-radius: 8px; cursor: pointer; margin-bottom: 3px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; transition: var(--transition); }
  .modal-list-item[data-active="true"] { background: var(--card-bg); font-weight: 700; }
  .modal-edit { padding: 24px; overflow-y: auto; }
  .modal-foot { padding: 16px 24px; border-top: 1px solid rgba(128,128,128,0.1); display: flex; justify-content: flex-end; gap: 12px; }

  /* Fullscreen */
  .fullscreen-visualizer { position: fixed; inset: 0; z-index: 999; background: var(--bg); display: flex; flex-direction: column; padding: 36px 48px 24px; animation: fadeInSlide 0.3s cubic-bezier(0.16,1,0.3,1); overflow: hidden; }
  .fullscreen-body { display: grid; grid-template-columns: 1fr 1.2fr; grid-template-rows: minmax(0, 1fr); gap: 56px; flex: 1; align-items: center; min-height: 0; }
  .fullscreen-body-nolyrics { grid-template-columns: 1fr; justify-items: center; gap: 0; }
  .fullscreen-body-nolyrics .fullscreen-cover-side { max-height: none; }
  .fullscreen-cover-side { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; max-height: 72vh; }
  .fullscreen-cover-wrap { width: 100%; max-width: 520px; aspect-ratio: 1/1; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 70px rgba(0,0,0,0.6); background: var(--card-bg); border: 1px solid rgba(128,128,128,0.2); margin-bottom: 24px; position: relative; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
  .fullscreen-cover-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* Nice ease-in when switching to a new track in fullscreen */
  @keyframes nowPlayingEnter {
    from { opacity: 0; transform: scale(0.86) rotate(-1.2deg); }
    to { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .now-playing-enter { animation: nowPlayingEnter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .fullscreen-lyrics-scroll { height: 100%; min-width: 0; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 100px 24px 48vh 0; scrollbar-gutter: stable; mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); }
  .fullscreen-controls-bar { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(128,128,128,0.14); gap: 20px; }
  .lyrics-preview-box { background: var(--card-bg); border: 1px solid rgba(128,128,128,0.18); border-radius: 14px; padding: 24px; margin-top: 16px; overflow: hidden; position: relative; }
  .pl-track { padding: 10px 12px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.1); border-radius: 12px; margin-bottom: 7px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
  .pl-track-info { display: flex; align-items: center; gap: 12px; }

  /* Media query for smaller screens */
  @media (max-width: 860px) {
    .spotify-player { grid-template-columns: 200px 1fr 180px; padding: 0 16px; }
    .sp-btn-lyrics .lbl { display: none; }
    .fullscreen-body { grid-template-columns: 1fr; gap: 24px; }
    .fullscreen-cover-wrap { max-width: 240px; margin-bottom: 12px; }
  }
  @media (max-width: 680px) {
    .rail { width: 60px; }
    .rail-btn { width: 46px; }
    .rail-btn .lbl { display: none; }
    .content { padding: 20px 16px 120px; }
    .spotify-player { grid-template-columns: 140px 1fr 90px; padding: 0 12px; }
    .sp-vol-slider { display: none; }
  }

  /* Custom frameless window title bar */
  .title-bar {
    position: fixed; top: 0; left: 0; right: 0; height: var(--titlebar-h, 0px);
    z-index: 100000; display: flex; align-items: center; justify-content: space-between;
    background: color-mix(in srgb, var(--sidebar-bg) 45%, transparent);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border-bottom: 1px solid rgba(128,128,128,0.14);
    -webkit-app-region: drag; user-select: none; flex-shrink: 0; overflow: hidden;
  }
  .title-bar-logo {
    display: flex; align-items: center; gap: 6px; height: 100%;
    min-width: 0; padding: 0 14px 0 10px;
    background: transparent; border: none; color: inherit; font: inherit;
    cursor: pointer; outline: none; -webkit-app-region: no-drag;
    transition: background 0.12s ease, transform 0.12s ease;
  }
  .title-bar-logo:hover { background: rgba(128,128,128,0.12); }
  .title-bar-logo:active { transform: scale(0.98); }
  .title-bar-logo img { height: 20px; width: auto; display: block; flex-shrink: 0; }
  .title-bar-logo span { font-size: 16px; font-weight: 800; color: var(--text-primary); font-family: var(--font); }
  .title-bar-controls { display: flex; align-items: stretch; height: 100%; -webkit-app-region: no-drag; }
  .title-bar-btn {
    width: 46px; height: 100%; display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; color: var(--text-secondary);
    font-family: var(--font); transition: background 0.12s ease, color 0.12s ease; outline: none;
  }
  .title-bar-btn:hover { background: rgba(128,128,128,0.16); color: var(--text-primary); }
  .title-bar-close:hover { background: #e81123; color: #fff; }
`
