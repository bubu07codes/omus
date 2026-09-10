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
    position: fixed; inset: -10%; pointer-events: none;
    z-index: 0; overflow: hidden; transition: opacity 0.8s ease;
  }
  .fluid-orb { position: absolute; border-radius: 50%; background-size: cover; background-position: center; will-change: transform, opacity; }
  .fluid-orb.orb-1 { top: 5%; left: 5%; width: 55vw; height: 55vw; }
  .fluid-orb.orb-2 { bottom: 5%; right: 5%; width: 58vw; height: 58vw; }
  .fluid-orb.orb-3 { top: 25%; left: 30%; width: 48vw; height: 48vw; }
  .fluid-scrim { position: fixed; inset: 0; pointer-events: none; z-index: 1; transition: background 0.4s ease; }

  /* Fluid background — extra ambient modes built from the album art.
     Each piece is a deformed, heavily-blurred crop of the cover (the container
     applies the blur), so they read as soft organic backdrops instead of flat
     color stripes. Without cover art they fall back to theme gradients. */
  .fb-waves { position: absolute; inset: -20%; overflow: hidden; }
  .fb-wave {
    position: absolute; width: 260%; height: 44%; border-radius: 50%; left: -80%;
    background-size: cover; background-position: center;
    will-change: transform;
  }
  .fb-wave-1 {
    top: -6%;
    background-image: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0.5;
    animation: fbWaveDrift 20s ease-in-out infinite alternate;
  }
  .fb-wave-2 {
    top: 10%;
    background-image: linear-gradient(90deg, transparent, var(--sidebar-bg), transparent);
    opacity: 0.45;
    animation: fbWaveDrift 26s ease-in-out infinite alternate;
    animation-delay: -7s;
  }
  .fb-wave-3 {
    top: 26%;
    background-image: linear-gradient(90deg, transparent, var(--text-primary), transparent);
    opacity: 0.4;
    animation: fbWaveDrift 32s ease-in-out infinite alternate;
    animation-delay: -14s;
  }
  .fb-wave-4 {
    top: 42%;
    background-image: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0.35;
    animation: fbWaveDrift 38s ease-in-out infinite alternate;
    animation-delay: -21s;
  }
  @keyframes fbWaveDrift {
    from { transform: translate3d(-10%, -2%, 0) rotate(-4deg) scaleY(0.96); }
    to   { transform: translate3d(10%, 3%, 0) rotate(4deg) scaleY(1.06); }
  }
  .fb-prism { position: absolute; inset: -30%; }
  .fb-prism-piece {
    position: absolute; border-radius: 46%;
    background-size: cover; background-position: center;
    will-change: transform;
  }
  .fb-prism-1 {
    width: 92%; height: 92%; top: -30%; left: 6%;
    background-image: linear-gradient(135deg, transparent, var(--accent), transparent);
    opacity: 0.5;
    animation: fbPrismSpin ease-in-out infinite alternate;
    animation-duration: 22s;
  }
  .fb-prism-2 {
    width: 78%; height: 78%; bottom: -30%; right: -2%;
    background-image: linear-gradient(135deg, transparent, var(--sidebar-bg), transparent);
    opacity: 0.55;
    animation: fbPrismSpin ease-in-out infinite alternate;
    animation-duration: 30s;
    animation-delay: -8s;
  }
  .fb-prism-3 {
    width: 60%; height: 60%; top: 24%; left: 28%;
    background-image: linear-gradient(135deg, transparent, var(--text-primary), transparent);
    opacity: 0.4;
    animation: fbPrismSpin ease-in-out infinite alternate;
    animation-duration: 38s;
    animation-delay: -14s;
  }
  @keyframes fbPrismSpin {
    from { transform: rotate(-8deg) scale(0.9); }
    to   { transform: rotate(8deg) scale(1.1); }
  }
  .fb-nebula { position: absolute; inset: -30%; }
  .fb-blob {
    position: absolute; border-radius: 50%;
    background-size: cover; background-position: center;
    animation: fbNebulaSwirl 18s ease-in-out infinite alternate;
    will-change: transform;
  }
  .fb-blob-1 {
    width: 90%; height: 90%; top: -35%; left: 0%;
    background-image: radial-gradient(circle, var(--accent) 0%, rgba(0,0,0,0) 70%);
    opacity: 0.55;
    animation-duration: 16s;
  }
  .fb-blob-2 {
    width: 78%; height: 78%; bottom: -35%; right: -5%;
    background-image: radial-gradient(circle, var(--sidebar-bg) 0%, rgba(0,0,0,0) 66%);
    opacity: 0.6;
    animation-duration: 22s;
    animation-delay: -8s;
  }
  .fb-blob-3 {
    width: 60%; height: 60%; top: 28%; left: 30%;
    background-image: radial-gradient(circle, var(--text-primary) 0%, rgba(0,0,0,0) 58%);
    opacity: 0.45;
    animation-duration: 28s;
    animation-delay: -14s;
  }
  @keyframes fbNebulaSwirl {
    from { transform: scale(0.85) translate3d(-4%, 3%, 0) rotate(-6deg); }
    to   { transform: scale(1.18) translate3d(4%, -3%, 0) rotate(6deg); }
}
  /* Left Rail */
  .rail {
    flex-shrink: 0; background: var(--sidebar-bg);
    border-right: 1px solid rgba(128,128,128,0.14);
    display: flex; flex-direction: column; align-items: center;
    padding: 14px 0 110px; gap: 6px; z-index: 20; position: relative;
    transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  .rail.rail-resizing { transition: none; }
  .rail-collapse-btn {
    width: 28px; height: 28px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: none; border-radius: 999px; cursor: pointer;
    background: transparent; color: var(--text-secondary);
    transition: var(--transition); font-family: var(--font);
    margin: 0 auto 10px;
  }
  .rail-collapse-btn:hover { background: rgba(128,128,128,0.14); color: var(--text-primary); }
  .rail-resizer {
    position: absolute; top: 0; right: -5px; bottom: 0;
    width: 12px; cursor: ew-resize; z-index: 30; touch-action: none;
  }
  .rail-resizer::after {
    content: ''; position: absolute; top: 0; bottom: 0; left: 5px;
    width: 2px; background: transparent; transition: background 0.15s ease;
    border-radius: 2px;
  }
  .rail-resizer:hover::after,
  .rail.rail-resizing .rail-resizer::after {
    background: var(--accent); opacity: 0.55;
  }
  /* Collapsed: slim icon-only rail */
  .rail.rail-collapsed { align-items: center; }
  .rail.rail-collapsed .rail-btn { width: 48px; }
  .rail.rail-collapsed .rail-btn .lbl { display: none; }
  .rail.rail-collapsed .rail-actions { padding: 0 10px; }
  /* Expanded wide mode (width >= 140px): labels inline, full-width rows */
  .rail.rail-wide { align-items: stretch; padding: 12px 12px 110px; }
  .rail.rail-wide .rail-collapse-btn { align-self: flex-start; margin: 0 0 10px 2px; }
  .rail.rail-wide .rail-nav { width: 100%; }
  .rail.rail-wide .rail-btn {
    width: 100%; height: 46px; flex-direction: row; justify-content: flex-start;
    gap: 10px; padding: 0 12px; border-radius: 11px;
  }
  .rail.rail-wide .rail-btn .lbl {
    font-size: 12.5px; font-weight: 700; letter-spacing: 0.2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .rail.rail-wide .rail-actions { padding: 0; }
  .rail.rail-wide .rail-fab { justify-content: center; }
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
  .rail-btn .lbl { font-size: 11.5px; font-weight: 800; letter-spacing: 0.4px; }
  .rail-actions { display: flex; flex-direction: column; gap: 8px; padding: 0 12px; width: 100%; }
  .rail-fab { width: 100%; height: 40px; border-radius: 12px; border: none; cursor: pointer; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition); }
  .rail-fab.primary { background: var(--accent); color: var(--bg); }
  .rail-fab.primary:hover { filter: brightness(1.12); }
  .rail-fab.ghost { background: var(--card-bg); color: var(--text-primary); border: 1px solid rgba(128,128,128,0.18); }
  .rail-fab.ghost:hover { background: rgba(128,128,128,0.1); }

  /* Main content */
  .content {
    flex: 1; overflow-y: auto; overflow-anchor: none; padding: 36px 44px 130px;
    min-width: 0; position: relative; z-index: 10;
    animation: fadeInSlide 0.22s ease-out;
    -webkit-font-smoothing: antialiased; text-rendering: auto;
  }
  .content > .view-fade {
    max-width: 1500px;
    margin: 0 auto;
  }
  .content-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 26px; flex-wrap: wrap; }
  .eyebrow { font-size: 12px; font-weight: 800; color: var(--text-secondary); letter-spacing: 0.8px; margin: 0 0 20px; text-transform: uppercase; }

  /* Search pill */
  .search-pill { display: flex; align-items: center; gap: 10px; background: var(--card-bg);
    border: 1px solid rgba(128,128,128,0.16); border-radius: 999px; padding: 10px 16px;
    max-width: 380px; flex: 1; min-width: 200px; transition: var(--transition); }
  .search-pill:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(128,128,128,0.15); }
  .search-pill input { flex: 1; background: transparent; border: none; outline: none;
    color: var(--text-primary); font-size: 13.5px; font-family: var(--font); margin: 0; padding: 0; }
  .search-pill input::placeholder { color: var(--text-secondary); opacity: 0.75; }
  .search-pill svg { color: var(--text-secondary); flex-shrink: 0; }
  .search-pill svg:hover { color: var(--text-primary); }

  /* Segmented control */
  .seg { display: flex; gap: 2px; background: var(--card-bg); padding: 4px; border-radius: 10px; border: 1px solid rgba(128,128,128,0.16); }
  .seg button { background: transparent; border: none; color: var(--text-secondary); padding: 7px 14px; border-radius: 7px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: var(--font); transition: var(--transition); display: flex; align-items: center; gap: 6px; }
  .seg button[data-active="true"] { background: var(--accent); color: var(--bg); }

  /* Track Table */
  .track-table { width: 100%; border-collapse: collapse; }
  .track-head-row { display: grid; grid-template-columns: 32px 2.2fr 1.4fr 1.4fr 70px 150px 32px 32px; padding: 0 14px 10px; color: var(--text-secondary); font-size: 12px; font-weight: 800; letter-spacing: 0.6px; border-bottom: 1px solid rgba(128,128,128,0.12); text-transform: uppercase; }
  .track-row { display: grid; grid-template-columns: 32px 2.2fr 1.4fr 1.4fr 70px 150px 32px 32px; align-items: center; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-size: 13.5px; transition: var(--transition); margin-bottom: 2px; }
  .track-row:hover { background: rgba(128,128,128,0.08); }
  .track-row[data-active="true"] { background: var(--card-bg); box-shadow: inset 3px 0 0 var(--accent), 0 0 0 1px rgba(128,128,128,0.18); }
  .track-row .idx { color: var(--text-secondary); font-size: 12px; font-variant-numeric: tabular-nums; font-weight: 700; }
  .art-thumb { width: 36px; height: 36px; border-radius: 8px; overflow: hidden; background: rgba(128,128,128,0.14); flex-shrink: 0; }
  .art-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* Album covers are always displayed square (1:1) across the whole app —
     object-fit: cover simply crops non-square source art. Music-video frames
     are the intentional exception: they are <video> elements that keep their
     own aspect ratio (object-fit: contain), so this rule never touches them. */
  .art-thumb img, .track-card .art img, .sp-cover-wrap img,
  .pl-card-cover img, .pl-hero-cover img, .fullscreen-cover-wrap img,
  .tile-hero-art img, .tile-row-art img, .tile-most-art img,
  .tile-album-art img, .tile-artist-avatar img, .tile-pl-mosaic img,
  .home-detail-art img, .gs-thumb img { aspect-ratio: 1/1; }
  .t-title { font-weight: 700; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 10px; }
  .t-sub { color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12.5px; font-weight: 500; }
  .t-time { color: var(--text-secondary); font-size: 12px; font-variant-numeric: tabular-nums; font-weight: 600; }
  .row-action { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; opacity: 0; transition: var(--transition); display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 6px; }
  .track-row:hover .row-action { opacity: 1; }
  .row-action:hover { background: rgba(128,128,128,0.14); color: var(--text-primary); }

  /* Grouped library view — albums as rich, reorderable cards.
   Drag-over + dragging states use CSS classes so the per-event drag handler
   doesn't rebuild inline style objects for every row. */
  .library-groups { display: flex; flex-direction: column; gap: 14px; }
  .library-group {
    background: color-mix(in srgb, var(--card-bg) 90%, transparent);
    border: 1px solid rgba(128,128,128,0.12);
    border-radius: 14px;
    overflow: hidden;
  }
  .library-group-head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    cursor: pointer;
    background: transparent;
    border-bottom: 1px solid rgba(128,128,128,0.1);
    transition: background 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
  }
  .library-group-head:hover {
    background: rgba(128,128,128,0.06);
  }
  .library-group-head[data-over="true"] { background: var(--card-bg); border-color: var(--accent); }
  .library-group-head[data-dragging="true"] { opacity: 0.5; }
  .library-group[data-collapsed="true"] .library-group-body { display: none; }

  /* Album cover thumbnail (click to play the album) */
  .lg-art {
    position: relative;
    width: 58px;
    height: 58px;
    border-radius: 9px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lg-art img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease; }
  .lg-art:hover img { transform: scale(1.06); }
  .lg-art-ph {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background: var(--card-bg);
  }
  .lg-playing {
    position: absolute;
    top: 3px;
    right: 3px;
    background: rgba(0, 0, 0, 0.75);
    border-radius: 5px;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }
  .lg-play-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.16s ease;
    z-index: 3;
  }
  .lg-art:hover .lg-play-overlay { opacity: 1; }

  /* Album meta */
  .lg-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .lg-title {
    font-weight: 800;
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lg-sub {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
  }

  /* Add-all-to-playlist + collapse + drag controls */
  .lg-add-pl {
    font-size: 11px;
    padding: 4px 8px;
    height: 28px;
    border-radius: 8px;
    color: var(--text-primary);
    background: rgba(128, 128, 128, 0.07);
    border: 1px solid rgba(128, 128, 128, 0.12);
    flex-shrink: 0;
  }
  .lg-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }
  .lg-btn:hover { background: rgba(128, 128, 128, 0.12); color: var(--text-primary); }
  .lg-btn:active { transform: scale(0.9); }
  .lg-grip {
    color: var(--text-secondary);
    cursor: grab;
    flex-shrink: 0;
    opacity: 0.65;
    transition: opacity 0.16s ease;
  }
  .lg-grip:hover { opacity: 1; }

  /* Expanded rows panel */
  .library-group-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px 6px;
  }
  .library-group-row {
    display: grid;
    grid-template-columns: 28px 1fr 90px;
    align-items: center;
    padding: 7px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    background: transparent;
    border: 1px solid transparent;
    transition: background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
  }
  .library-group-row[data-over="true"] { background: var(--card-bg); border-color: var(--accent); }
  .library-group-row[data-dragging="true"] { opacity: 0.5; }

  [data-density="compact"] .track-row { padding: 5px 14px; font-size: 12.5px; }
  [data-density="compact"] .art-thumb { width: 28px; height: 28px; }
  [data-density="compact"] .t-sub { font-size: 11.5px; }

  /* Grid cards */
  .track-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 18px; }
  .track-card { cursor: pointer; background: var(--card-bg); padding: 12px; border-radius: 14px; border: 1px solid rgba(128,128,128,0.12); position: relative; transition: var(--transition); overflow: hidden; }
  .track-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 10px 25px -10px rgba(0,0,0,0.5); }
  .track-card:active { transform: scale(0.98); }
  .track-card .art { width: 100%; aspect-ratio: 1/1; background: rgba(128,128,128,0.14); border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
  .track-card .art img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-x { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.55); color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; opacity: 0; transition: var(--transition); display: flex; align-items: center; justify-content: center; }
  .track-card:hover .card-x { opacity: 1; }

  /* Buttons */
  .btn, .btn-primary, .btn-ghost, .btn-plain, .icon-btn, .switch-label, .rail-btn { font-family: var(--font); }
  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--card-bg), 0 0 0 4px var(--accent);
  }
  .btn {
    border: none;
    cursor: pointer;
    border-radius: 10px;
    font-weight: 700;
    font-size: 12px;
    font-family: var(--font);
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    user-select: none;
    line-height: 1;
    white-space: nowrap;
  }
  .btn:hover { filter: brightness(1.1); }
  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; filter: none; transform: none; }

  .btn-primary {
    background: var(--accent);
    color: var(--bg);
    padding: 10px 20px;
    font-weight: 700;
  }
  .btn-primary:hover { filter: brightness(1.12); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-ghost {
    background: var(--card-bg);
    color: var(--text-primary);
    border: 1px solid rgba(128,128,128,0.18);
    padding: 10px 20px;
  }
  .btn-ghost:hover {
    background: rgba(128,128,128,0.12);
    border-color: var(--accent);
  }
  .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-plain {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: var(--transition);
  }
  .btn-plain:hover { color: var(--text-primary); background: rgba(128,128,128,0.1); }
  .btn-plain:active { transform: scale(0.97); }
  .btn-plain:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-sm { padding: 6px 14px; font-size: 11.5px; border-radius: 8px; }
  .btn-xs { padding: 4px 10px; font-size: 11px; border-radius: 6px; }
  .btn-pill { border-radius: 999px; }

  .btn-accent-glow {
    box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .btn-accent-glow:hover {
    box-shadow: 0 6px 22px color-mix(in srgb, var(--accent) 45%, transparent);
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition);
    padding: 0;
    flex-shrink: 0;
  }
  .icon-btn:hover { background: rgba(128,128,128,0.14); transform: scale(1.06); }
  .icon-btn:active { transform: scale(0.92); }
  .icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .icon-btn.sm { width: 34px; height: 34px; color: var(--text-secondary); position: relative; }
  .icon-btn.sm:hover { color: var(--text-primary); background: rgba(128,128,128,0.12); }
  .icon-btn.sm[data-active="true"] { color: var(--accent); background: rgba(128,128,128,0.14); }
  .icon-btn.sm[data-active="true"]::after { content:''; position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
  .icon-btn.xs { width: 28px; height: 28px; }

  /* Immunity guards against generic button animations that would distort delicate controls */
  .title-bar-btn, .title-bar-close, .seg button, .switch-label, .pl-opt-row, .row-action, .queue-btn {
    transform: none !important;
    filter: none !important;
    box-shadow: none !important;
  }

  /* Form elements */
  .field { background: var(--card-bg); border: 1px solid rgba(128,128,128,0.18); color: var(--text-primary); padding: 10px 13px; border-radius: 10px; width: 100%; outline: none; font-size: 13px; font-family: var(--font); transition: var(--transition); }
  .field:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(128,128,128,0.15); outline: none; }
  .field:disabled { opacity: 0.5; cursor: not-allowed; }
  .lbl-caps { font-size: 12px; color: var(--text-secondary); font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; display: block; margin-bottom: 6px; }

  /* Toggles */
.switch-track { width: 37px; height: 20px; border-radius: 999px; position: relative; flex-shrink: 0; transition: var(--transition); background: rgba(128,128,128,0.3); }
.switch-track[data-active='true'] { background: var(--accent); }

.switch-knob { 
  position: absolute; 
  top: 2px; 
  left: 2px; 
  width: 16px; 
  height: 16px; 
  border-radius: 50%; 
  background: #fff; 
  transition: var(--transition); 
}

/* Turn the knob dark when active so it contrasts against a white accent */
.switch-track[data-active='true'] .switch-knob { 
  left: 18px; 
  background: var(--bg-main, #000); 
}

.switch-label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; background: transparent; border: none; padding: 6px 0; color: var(--text-secondary); font-size: 12px; font-weight: 700; font-family: var(--font); transition: var(--transition); }
.switch-label:hover { color: var(--text-primary); }

  /* EQ range sliders - horizontal & vertical (styled tracks and thumbs) */
  .eq-range,
  .eq-range-vert {
    appearance: none;
    -webkit-appearance: none;
    background: rgba(128,128,128,0.22);
    border-radius: 999px;
    outline: none;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .eq-range { height: 4px; }
  .eq-range-vert {
    writing-mode: vertical-lr;
    direction: rtl;
    width: 4px;
  }
  .eq-range:hover,
  .eq-range-vert:hover { background: rgba(128,128,128,0.34); }
  .eq-range::-webkit-slider-thumb,
  .eq-range-vert::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-primary);
    cursor: pointer;
    box-shadow: 0 1px 6px rgba(0,0,0,0.5);
    transition: transform 0.15s ease, background 0.15s ease;
  }
  .eq-range:hover::-webkit-slider-thumb,
  .eq-range-vert:hover::-webkit-slider-thumb {
    transform: scale(1.25);
    background: var(--accent);
  }
  .eq-range:active::-webkit-slider-thumb,
  .eq-range-vert:active::-webkit-slider-thumb { transform: scale(1.35); }
  .eq-range:disabled,
  .eq-range-vert:disabled { opacity: 0.45; cursor: not-allowed; }

  /* EQ band grid (settings + modal) */
  .eq-bands-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 8px;
    background: rgba(128,128,128,0.05);
    padding: 14px;
    border-radius: 14px;
    border: 1px solid rgba(128,128,128,0.1);
    min-width: 0;
  }
  .eq-band-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .eq-band-val {
    font-size: 10px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .eq-band-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
    white-space: nowrap;
  }
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
  .settings-row-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; color: var(--text-primary); }
  .settings-row-desc { font-size: 13px; line-height: 1.45; color: var(--text-secondary); }

  /* Settings sidebar categories */
  .settings-layout { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 24px; align-items: start; max-width: 980px; margin: 0 auto; }
  .settings-page-title { font-size: 26px; font-weight: 900; letter-spacing: -0.4px; margin: 0 0 18px; }
  .settings-nav { position: sticky; top: 12px; display: flex; flex-direction: column; gap: 2px; padding: 8px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.14); border-radius: 14px; }
  .settings-nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; border-radius: 9px; border: none; background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 700; font-family: var(--font); cursor: pointer; text-align: left; transition: var(--transition); }
  .settings-nav-btn:hover { color: var(--text-primary); background: rgba(128,128,128,0.1); }
  .settings-nav-btn[data-active="true"] { color: var(--accent); background: rgba(128,128,128,0.12); }
  .settings-nav-btn svg { flex-shrink: 0; }
  .settings-content { min-width: 0; }
  .settings-cat { scroll-margin-top: 12px; }
  @media (max-width: 900px) {
    .settings-layout { grid-template-columns: 1fr; }
    .settings-nav { position: static; flex-direction: row; overflow-x: auto; gap: 4px; }
    .settings-nav-btn { width: auto; white-space: nowrap; }
  }

  /* Theme & anim cards */
  .theme-grid, .anim-grid, .font-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .theme-card { padding: 16px; border-radius: 14px; cursor: pointer; text-align: left; border: 1px solid rgba(128,128,128,0.16); font-family: var(--font); transition: var(--transition); }
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
    background: var(--sidebar-bg);
    border-top: 1px solid rgba(128,128,128,0.16);
    display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center; padding: 0 24px; z-index: 100; user-select: none;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.35); transition: background 0.3s ease;
  }
  .sp-left { display: flex; align-items: center; gap: 14px; min-width: 0; justify-self: start; }
  .sp-cover-wrap { position: relative; width: 56px; height: 56px; border-radius: 8px; overflow: hidden;
    background: var(--card-bg); flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    cursor: pointer; border: 1px solid rgba(128,128,128,0.14); }
  .sp-cover-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
  .sp-cover-wrap:hover img { transform: scale(1.08); }
  .sp-cover-hover-icon { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; color: #fff; }
  .sp-cover-wrap:hover .sp-cover-hover-icon { opacity: 1; }
  .sp-info { display: flex; flex-direction: column; min-width: 0; gap: 3px; }
  .sp-title { font-size: 14.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); letter-spacing: -0.2px; }
  .sp-video-badge { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 20px; height: 20px; border-radius: 6px; background: rgba(128,128,128,0.18); color: var(--text-secondary); }
  .sp-artist { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sp-actions-left { display: flex; align-items: center; gap: 6px; margin-left: 4px; }
  .sp-heart-btn { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .sp-heart-btn:hover { color: var(--accent); transform: scale(1.15); }
  .sp-heart-btn.liked { color: var(--accent); filter: drop-shadow(0 0 6px var(--accent)); }
  .sp-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: clamp(320px, 34vw, 600px); max-width: 600px; padding: 0 16px; }
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
  .sp-time { font-size: 12px; font-weight: 700; color: var(--text-secondary); font-variant-numeric: tabular-nums; min-width: 38px; text-align: center; }
  .sp-scrub-track { position: relative; flex: 1; height: 14px; display: flex; align-items: center; cursor: pointer; }
  .sp-scrub-bg { width: 100%; height: 4px; border-radius: 4px; background: rgba(128,128,128,0.24); position: relative; overflow: visible; transition: height 0.15s ease; }
  .sp-scrub-track:hover .sp-scrub-bg { height: 6px; }
  .sp-scrub-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: var(--accent); border-radius: 4px; transform: scaleX(0); transform-origin: left center; will-change: transform; transition: transform 0.08s linear; }
  .sp-scrub-thumb-rail { position: absolute; inset: 0; pointer-events: none; transform: translateX(0); will-change: transform; }
  .sp-scrub-thumb { position: absolute; left: 0; top: 50%; transform: translate(-50%,-50%) scale(0); width: 12px; height: 12px; border-radius: 50%; background: var(--text-primary); box-shadow: 0 2px 6px rgba(0,0,0,0.4); transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
  .sp-scrub-track:hover .sp-scrub-thumb { transform: translate(-50%,-50%) scale(1); }
  .sp-scrub-tooltip { position: absolute; bottom: 22px; transform: translateX(-50%); background: var(--card-bg); border: 1px solid rgba(128,128,128,0.24); color: var(--text-primary); padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
  .sp-right { display: flex; align-items: center; justify-content: flex-end; gap: 8px; justify-self: end; }
  .sp-btn-lyrics { display: flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 999px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.18); color: var(--text-secondary); font-size: 12px; font-weight: 800; cursor: pointer; font-family: var(--font); transition: var(--transition); }
  .sp-btn-lyrics:hover { color: var(--text-primary); border-color: var(--accent); transform: translateY(-1px); }
  .sp-btn-lyrics[data-active="true"] { background: var(--accent); color: var(--bg); border-color: var(--accent); }
  .sp-vol-group { display: flex; align-items: center; gap: 8px; margin-left: 6px; position: relative; }
  .sp-vol-slider { width: 90px; height: 4px; border-radius: 2px; appearance: none; -webkit-appearance: none; background: rgba(128,128,128,0.24); outline: none; cursor: pointer; }
  .sp-vol-slider::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--text-primary); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.4); transition: transform 0.15s ease; }
  .sp-vol-slider:hover::-webkit-slider-thumb { transform: scale(1.2); background: var(--accent); }

  /* Loading indicator in player bar */
  .sp-loading-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: loadingPulse 0.8s ease-in-out infinite; }

  /* Playlists */
  .pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 18px; }
  .pl-card { cursor: pointer; background: var(--card-bg); padding: 14px 14px 12px; border-radius: 14px; border: 1px solid rgba(128,128,128,0.12); transition: var(--transition); position: relative; overflow: hidden; }
  .pl-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 10px 25px -10px rgba(0,0,0,0.5); }
  .pl-card:active { transform: scale(0.98); }
  .pl-card-cover { width: 100%; aspect-ratio: 1/1; border-radius: 10px; overflow: hidden; margin-bottom: 12px; position: relative; background: rgba(128,128,128,0.14); }
  .pl-card-cover.gradient { display: flex; align-items: center; justify-content: center; }
  .pl-card-cover svg.note { color: rgba(255,255,255,0.55); }
  .pl-hero-cover svg.note { color: rgba(255,255,255,0.7); }
  .pl-card .pl-name { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pl-card .pl-count { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
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
  .pl-opt-label { font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 8px 4px; }
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
  .pl-track-head { display: grid; grid-template-columns: 26px 2.2fr 1.4fr 1.4fr 70px 32px; padding: 0 14px 10px; color: var(--text-secondary); font-size: 12px; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid rgba(128,128,128,0.12); }
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
  .queue-card { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 12px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.1); margin-bottom: 8px; transition: var(--transition); }
  .queue-card:hover { border-color: rgba(128,128,128,0.25); }
  .queue-card[data-active="true"] { border-color: var(--accent); box-shadow: inset 3px 0 0 var(--accent); }
  .queue-actions { display: flex; align-items: center; gap: 6px; }
  .queue-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
  .queue-btn:hover { background: rgba(128,128,128,0.12); color: var(--text-primary); }
  .queue-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Lyrics */
  .lyrics-container-view { height: 100%; display: flex; flex-direction: column; position: relative; z-index: 10; }
  .lyrics-header-clean { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; margin-bottom: 12px; border-bottom: 1px solid rgba(128,128,128,0.14); flex-wrap: wrap; gap: 12px; }
  /* The viewport clips + fades the lyrics; the inner .lyrics-track is what
     actually glides (GPU transform) so line changes are buttery smooth and the
     first/last lines always stay fully visible (dynamic padding keeps them out
     of the fade mask). */
  .lyrics-scroll { flex: 1; overflow: hidden; overflow-x: hidden; padding: 0 20px; position: relative; mask-image: linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%); }
  .lyrics-track { position: relative; will-change: transform; transition: transform 0.75s cubic-bezier(0.22, 1, 0.36, 1); }
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
  .lyrics-offset-badge { font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 999px; background: rgba(128,128,128,0.14); color: var(--text-secondary); cursor: default; }
  .lyrics-options-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 2px 8px 10px; }
  .lyrics-options-row .lyrics-offset-badge { min-width: 70px; text-align: center; }

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
  /* Auto-hiding "chrome" (top close bar, visualizer, bottom playback controls)
     in the fullscreen view. Hidden at rest so only the cover + info + lyrics
     remain; any cursor movement slides the chrome back in for a few seconds.
     Expects a fullscreen-visualizer.fs-ui-visible class toggle on the container. */
  .fullscreen-visualizer .fs-chrome { opacity: 0; pointer-events: none; transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1); will-change: opacity, transform; }
  .fullscreen-visualizer .fs-chrome-top { transform: translateY(-52px); }
  .fullscreen-visualizer .fs-chrome-bottom { transform: translateY(52px); }
  .fullscreen-visualizer .fs-chrome-fade { transform: none; }
  .fullscreen-visualizer.fs-ui-visible .fs-chrome { opacity: 1; transform: none; pointer-events: auto; }
  .fullscreen-cover-side { display: flex; flex-direction: column; align-items: center; justify-content: center; justify-content: safe center; height: 100%; max-height: 72vh; }
  /* The cover stays a rigid 1:1 square (flex-shrink: 0 — flex boxes would
     otherwise shrink only the height and squash the art). In Full (not
     Minimalistic) mode on a small window there simply isn't room for the artwork
     column, so the cover is hidden entirely and only the track info + lyrics
     remain — see the media query below. "safe center" is a fallback: in any
     overflowing edge case the column top-aligns so the cover is never cut off. */
  .fullscreen-cover-wrap { width: 100%; max-width: 520px; flex-shrink: 0; aspect-ratio: 1/1; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 70px rgba(0,0,0,0.6); background: var(--card-bg); border: 1px solid rgba(128,128,128,0.2); margin-bottom: 24px; position: relative; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
  .fullscreen-cover-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* Small window: Full mode hides the album art (no room next to the lyrics).
     Minimalistic mode is untouched — there the cover IS the view. */
  @media (max-height: 700px), (max-width: 880px) {
    .fullscreen-visualizer:not(.fs-cover-only) .fullscreen-cover-wrap { display: none; }
  }
  /* Music-video frame in fullscreen. The <video> is a muted, picture-only
     mirror of the audio engine, so it threads volume/EQ/visualizer through the
     existing pipeline. object-fit keeps the frame letterboxed (never distorted)
     and the height cap stops it eating into the lyrics / controls. */
  .fullscreen-video-wrap { width: 100%; max-width: 760px; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 70px rgba(0,0,0,0.6); background: #000; border: 1px solid rgba(128,128,128,0.25); margin-bottom: 24px; display: flex; align-items: center; justify-content: center; }
  .fullscreen-video-wrap video { width: 100%; height: auto; max-height: 56vh; object-fit: contain; display: block; cursor: pointer; }
  /* Fullscreen mode variants — Cover Only enlarges the artwork; Ambience lets
     the fluid background show through behind the view. */
  .fullscreen-visualizer.fs-ambience { background: var(--bg); }
  /* Keep the ambient layer behind the artwork/chrome: the direct layout children
     get their own stacking layer above the z-0 orb container. */
  .fullscreen-visualizer > .fullscreen-body,
  .fullscreen-visualizer > .fs-chrome,
  .fullscreen-visualizer > .fullscreen-controls-bar { position: relative; z-index: 1; }
  .fullscreen-visualizer.fs-cover-only .fullscreen-cover-side { max-height: none; }
  .fullscreen-visualizer.fs-cover-only .fullscreen-cover-wrap { max-width: min(76vh, 84vw); }
  .fullscreen-visualizer.fs-cover-only .fullscreen-video-wrap { max-width: 900px; }
  .fullscreen-visualizer.fs-cover-only .fullscreen-video-wrap video { max-height: 72vh; }
  /* Nice ease-in when switching to a new track in fullscreen */
  @keyframes nowPlayingEnter {
    from { opacity: 0; transform: scale(0.86) rotate(-1.2deg); }
    to { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .now-playing-enter { animation: nowPlayingEnter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .fullscreen-lyrics-scroll { height: 100%; min-width: 0; min-height: 0; max-height: 100%; align-self: stretch; justify-self: stretch; overflow: hidden; overflow-x: hidden; padding: 0 24px 0 0; scrollbar-gutter: stable; overscroll-behavior: contain; mask-image: linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%); }
  .fullscreen-lyrics-empty { color: var(--text-secondary); opacity: 0.85; font-size: 17px; line-height: 1.5; max-width: 420px; min-height: 240px; height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; margin: 0 auto; }
  .fullscreen-controls-bar { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(128,128,128,0.14); gap: 20px; }
  .lyrics-preview-box { background: var(--card-bg); border: 1px solid rgba(128,128,128,0.18); border-radius: 14px; padding: 24px; margin-top: 16px; overflow: hidden; position: relative; }
  .pl-track { padding: 10px 12px; background: var(--card-bg); border: 1px solid rgba(128,128,128,0.1); border-radius: 12px; margin-bottom: 7px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
  .pl-track-info { display: flex; align-items: center; gap: 12px; }

  /* Home — Clean Music-First Layout */
  .home-view { padding-bottom: 36px; }
  .home-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
  }
  .home-header-left { min-width: 0; }
  .home-greeting {
    font-size: clamp(24px, 3.2vw, 36px);
    font-weight: 900;
    letter-spacing: -0.8px;
    line-height: 1.1;
    background: linear-gradient(180deg, var(--text-primary) 0%, color-mix(in srgb, var(--text-primary) 82%, var(--text-secondary)) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .home-subtitle {
    font-size: 12.5px;
    color: var(--text-secondary);
    margin-top: 4px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .home-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Bento Grid Layout */
  .home-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 20px;
    max-width: 1500px;
    margin: 0 auto;
  }

  /* Home Section Base — premium cards with subtle borders */
  .home-tile {
    background: color-mix(in srgb, var(--card-bg) 92%, transparent);
    border: 1px solid rgba(128,128,128,0.14);
    border-radius: 18px;
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
    height: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-shadow: 0 6px 20px -6px rgba(0,0,0,0.22);
    transition:
      border-color 0.22s ease,
      box-shadow 0.22s ease,
      transform 0.22s cubic-bezier(0.16,1,0.3,1);
  }
  .home-tile::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    pointer-events: none;
  }
  .home-tile:hover {
    border-color: color-mix(in srgb, var(--accent) 26%, rgba(128,128,128,0.24));
    box-shadow: 0 12px 32px -8px rgba(0,0,0,0.32);
    transform: translateY(-2px);
  }

  /* Desktop 6-column assignments: Every row pairs to exactly 6 */
  .tile-hero {
    grid-column: span 4;
    grid-row: span 2;
    flex-direction: row;
    align-items: center;
    gap: 26px;
    /* The hero stays the one featured panel on Home. */
    background: color-mix(in srgb, var(--card-bg) 88%, transparent);
    border: 1px solid rgba(128,128,128,0.14);
    border-radius: 18px;
    padding: 22px 26px;
    box-shadow: 0 14px 38px -8px rgba(0,0,0,0.45);
  }
  .tile-hero:hover {
    border-color: color-mix(in srgb, var(--accent) 22%, rgba(128,128,128,0.24));
    transform: none;
  }
  .tile-stats { grid-column: span 2; grid-row: span 1; }
  .tile-quick-mix { grid-column: span 2; grid-row: span 1; }
  .tile-recent { grid-column: span 3; }
  .tile-new { grid-column: span 3; }
  .tile-most { grid-column: span 3; }
  .tile-albums { grid-column: span 3; }
  .tile-artists { grid-column: span 3; }
  .tile-pl { grid-column: span 3; }

  /* Section Header */
  .tile-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  .tile-head svg { color: var(--text-secondary); flex-shrink: 0; }
  .tile-head h3 {
    font-size: 15.5px;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: var(--text-primary);
  }
  .tile-head .home-see-all { margin-left: auto; }

  /* Hero Spotlight — artwork focus with a very subtle blurred album-art backdrop */
  .tile-hero-art-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .tile-hero-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(26px) saturate(120%);
    transform: scale(1.12);
    opacity: 0.1;
    pointer-events: none;
  }
  .tile-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }
  .tile-hero-art {
    width: 168px;
    height: 168px;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    z-index: 1;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tile-hero-art img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 0.3s ease;
  }
  .tile-hero:hover .tile-hero-art { transform: scale(1.02); }
  .tile-hero-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }
  .tile-hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
  }
  .tile-hero-info h2 {
    font-size: clamp(19px, 2vw, 27px);
    font-weight: 900;
    letter-spacing: -0.6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.15;
  }
  .tile-hero-info p {
    font-size: 13.5px;
    color: var(--text-secondary);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 6px;
  }
  .tile-hero-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 18px;
    flex-wrap: wrap;
  }

  /* Library Stats — quiet stat items with a pill hover */
  .tile-stats-head {
    font-size: 12px;
    font-weight: 800;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tile-stats-list {
    display: flex;
    align-items: baseline;
    gap: 14px;
    flex-wrap: wrap;
    flex: 1;
  }
  .tile-stat {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    background: none;
    border: none;
    padding: 4px 10px;
    margin: -4px -10px;
    border-radius: 9px;
    cursor: pointer;
    font-family: var(--font);
    transition:
      background 0.18s ease,
      color 0.18s ease,
      transform 0.18s cubic-bezier(0.16,1,0.3,1);
  }
  .tile-stat b {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.2px;
    line-height: 1;
    color: var(--text-primary);
  }
  .tile-stat span {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .tile-stat:hover { background: rgba(128,128,128,0.09); transform: translateY(-1px); }
  .tile-stat:hover b { color: var(--accent); }
  .tile-stat:active { transform: translateY(0) scale(0.98); }

  /* Liked Songs Shortcut — one quiet row + chips, no nested containers */
  .tile-quick-mix {
    justify-content: flex-start;
    gap: 10px;
  }
  .quick-mix-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    min-width: 0;
  }
  .quick-mix-row:active { transform: scale(0.98); }
  .quick-mix-icon { flex-shrink: 0; color: var(--accent); }
  .quick-mix-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .quick-mix-title {
    font-weight: 800;
    font-size: 13.5px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .quick-mix-sub {
    font-size: 11.5px;
    color: var(--text-secondary);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .quick-actions-row {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .quick-chip {
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(128,128,128,0.08);
    border: 1px solid rgba(128,128,128,0.14);
    color: var(--text-primary);
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition:
      background 0.16s ease,
      color 0.16s ease,
      border-color 0.16s ease,
      transform 0.16s cubic-bezier(0.16,1,0.3,1),
      box-shadow 0.16s ease;
    font-family: var(--font);
  }
  .quick-chip:hover {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--accent) 45%, transparent);
  }
  .quick-chip:active { transform: scale(0.96); }

  /* Section Track Lists */
  .tile-list {
    display: flex; flex-direction: column; gap: 4px; flex: 1;
    min-height: 0;
  }
  .tile-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.18s ease;
    min-width: 0;
  }
  .tile-row:hover { background: rgba(128,128,128,0.09); }
  .tile-row:hover .tile-row-title { color: var(--text-primary); }
  .tile-row[data-active="true"] {
    background: color-mix(in srgb, var(--accent) 10%, rgba(128,128,128,0.06));
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .tile-row-art {
    width: 40px;
    height: 40px;
    border-radius: 9px;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    position: relative;
  }
  .tile-row-art img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s ease; }
  .tile-row:hover .tile-row-art img { transform: scale(1.07); }
  .tile-row-playing-icon {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tile-row-idx { width: 20px; font-size: 12px; color: var(--text-secondary); text-align: center; flex-shrink: 0; font-weight: 700; }
  .tile-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .tile-row-title { font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
  .tile-row[data-active="true"] .tile-row-title { color: var(--accent); }
  .tile-row-sub { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; font-weight: 600; }
  .tile-row-time { font-size: 12px; color: var(--text-secondary); flex-shrink: 0; font-variant-numeric: tabular-nums; }

  /* Heavy Rotation Grid — artwork focused cells */
  .tile-most-grid,
  .tile-albums-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    flex: 1;
    align-content: start;
  }
  .tile-most-cell {
    min-width: 0;
    cursor: pointer;
    border-radius: 12px;
    padding: 8px;
    background: rgba(128,128,128,0.04);
    border: 1px solid rgba(128,128,128,0.08);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      transform 0.18s cubic-bezier(0.16,1,0.3,1);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tile-most-cell:hover {
    background: rgba(128,128,128,0.09);
    border-color: color-mix(in srgb, var(--accent) 24%, rgba(128,128,128,0.18));
    transform: translateY(-2px);
  }
  .tile-most-art {
    position: relative;
    aspect-ratio: 1/1;
    width: 100%;
    border-radius: 9px;
    overflow: hidden;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tile-most-art img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s ease; }
  .tile-most-cell:hover .tile-most-art img,
  .tile-album:hover .tile-album-art img,
  .tile-row:hover .tile-pl-mosaic img { transform: scale(1.05); }
  .tile-most-rank {
    position: absolute;
    top: 6px;
    left: 6px;
    background: rgba(0,0,0,0.72);
    color: #fff;
    font-size: 11px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 999px;
    backdrop-filter: blur(4px);
  }
  .tile-most-rank.rank-1 { background: #eab308; color: #000; }
  .tile-most-rank.rank-2 { background: #94a3b8; color: #000; }
  .tile-most-rank.rank-3 { background: #b45309; color: #fff; }
  .tile-most-count {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: rgba(0,0,0,0.72);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    backdrop-filter: blur(4px);
  }
  .tile-most-title {
    display: block;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
  }

  /* Albums Grid — same visual language as Heavy Rotation */
  .tile-albums-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    flex: 1;
    align-content: start;
  }
  .tile-album {
    min-width: 0;
    cursor: pointer;
    border-radius: 12px;
    padding: 8px;
    background: rgba(128,128,128,0.04);
    border: 1px solid rgba(128,128,128,0.08);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      transform 0.18s cubic-bezier(0.16,1,0.3,1);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tile-album:hover {
    background: rgba(128,128,128,0.09);
    border-color: color-mix(in srgb, var(--accent) 24%, rgba(128,128,128,0.18));
    transform: translateY(-2px);
  }
  .tile-album-art {
    position: relative;
    aspect-ratio: 1/1;
    width: 100%;
    border-radius: 9px;
    overflow: hidden;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tile-album-art img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease; }
  .tile-album-name {
    display: block;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
  }
  .tile-album-sub {
    display: block;
    font-size: 11px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
  }

  /* Top Artists */
  .tile-artists-row { display: flex; gap: 10px; flex: 1; align-items: stretch; flex-wrap: wrap; }
  .tile-artist {
    flex: 1 1 90px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    background: rgba(128,128,128,0.04);
    border: 1px solid rgba(128,128,128,0.08);
    border-radius: 12px;
    padding: 10px 4px;
    gap: 6px;
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      transform 0.18s cubic-bezier(0.16,1,0.3,1);
  }
  .tile-artist:hover {
    background: rgba(128,128,128,0.09);
    border-color: color-mix(in srgb, var(--accent) 24%, rgba(128,128,128,0.18));
    transform: translateY(-2px);
  }
  .tile-artist-avatar {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
  }
  .tile-artist-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .tile-artist-rank {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 19px;
    height: 19px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--bg);
    font-size: 10px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--bg);
  }
  .tile-artist-name {
    font-size: 11.5px;
    font-weight: 700;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
  }
  .tile-artist-count {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 600;
  }

  /* Playlists Tile */
  .tile-pl-mosaic {
    width: 42px;
    height: 42px;
    border-radius: 9px;
    overflow: hidden;
    flex-shrink: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 1px;
    background: var(--bg);
  }
  .tile-pl-mosaic img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease; }

  /* In-Home Album/Artist Details */
  .home-detail { animation: fadeInSlide 0.25s ease; }
  .home-detail-hero { display: flex; align-items: center; gap: 26px; margin-bottom: 24px; flex-wrap: wrap; }
  .home-detail-art { width: 176px; height: 176px; border-radius: 16px; overflow: hidden; flex-shrink: 0; box-shadow: 0 20px 44px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; background: var(--bg); }
  .home-detail-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .home-detail-info { flex: 1; min-width: 0; }
  .home-detail-type { font-size: 12px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
  .home-detail-title { font-size: clamp(26px, 4vw, 40px); font-weight: 900; letter-spacing: -0.8px; line-height: 1.05; overflow-wrap: anywhere; }
  .home-detail-sub { font-size: 13px; color: var(--text-secondary); font-weight: 600; margin: 6px 0 0; }
  .home-detail-actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
  .home-detail-hint { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
  .home-detail-list { display: flex; flex-direction: column; gap: 2px; }
  .home-detail-album { margin-bottom: 22px; }
  .home-detail-album-head { margin-bottom: 8px; }
  .home-detail-album-name { font-size: 15px; font-weight: 800; letter-spacing: -0.2px; }
  .home-detail-album-count { font-size: 11px; color: var(--text-secondary); }

  /* Responsive Bento Breakpoints */
  @media (min-width: 1200px) and (max-width: 1400px) {
    .tile-hero-art { width: 152px; height: 152px; }
    .tile-most-cell, .tile-album { padding: 9px; }
  }

  /* Very large windows: the content/home-grid are already capped at 1500px, so
     keep the hero + inner tile artwork comfortably sized instead of ballooning. */
  @media (min-width: 1500px) {
    .tile-hero-art { width: 180px; height: 180px; }
    .tile-most-cell, .tile-album { padding: 10px; }
  }

  /* Medium screens (861px - 1199px): 4-column balanced bento grid */
  @media (max-width: 1199px) and (min-width: 861px) {
    .home-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }
    .tile-hero {
      grid-column: span 4;
      grid-row: span 1;
      gap: 22px;
    }
    .tile-hero-art { width: 140px; height: 140px; }
    .tile-stats { grid-column: span 2; }
    .tile-quick-mix { grid-column: span 2; }
    .tile-recent { grid-column: span 2; }
    .tile-new { grid-column: span 2; }
    .tile-most { grid-column: span 2; }
    .tile-albums { grid-column: span 2; }
    .tile-artists { grid-column: span 2; }
    .tile-pl { grid-column: span 2; }
  }

  /* Narrow (680px - 860px): 2-column, comfortable card rows */
  @media (max-width: 860px) and (min-width: 681px) {
    .home-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .tile-hero {
      grid-column: span 2;
      flex-direction: row-reverse;
      gap: 14px;
    }
    .tile-hero-art { width: 92px; height: 92px; }
    .tile-stats, .tile-quick-mix, .tile-recent, .tile-new,
    .tile-most, .tile-albums, .tile-artists, .tile-pl {
      grid-column: span 1;
    }
  }

  /* Compact windows (<= 1400px): make the bottom player bar fit comfortably.
     The big "Lyrics" pill collapses to a plain round icon button (the same
     treatment as its transport neighbors) and the least-essential right-side
     extras — mini visualizer, fluid background, sleep timer — drop out via
     [data-compact-hide] so the bar never overflows into the scrubber. The
     transport cluster stays perfectly centered at every width because the two
     outer grid tracks are equal (minmax(0,1fr) and the middle track is
     content-sized. The wide volume slider collapses to a vertical popover that
     appears on hover above the mute icon. */
  @media (max-width: 1400px) {
    .spotify-player { padding: 0 14px; }
    .sp-btn-lyrics { width: 32px; height: 32px; padding: 0; border-radius: 50%; justify-content: center; gap: 0; }
    .sp-btn-lyrics .lbl { display: none; }
    .sp-vol-group .sp-vol-slider {
      position: absolute; left: 50%; bottom: calc(100% + 12px);
      transform: translateX(-50%);
      width: 4px; height: 90px;
      background: rgba(128,128,128,0.24);
      padding: 18px 6px;
      border-radius: 6px;
      writing-mode: vertical-lr; direction: rtl;
      appearance: none; -webkit-appearance: none;
      opacity: 0; pointer-events: none;
      transition: opacity 0.16s ease;
    }
    .sp-vol-group:hover .sp-vol-slider {
      opacity: 1;
      pointer-events: auto;
    }
    /* Bridge so the popover doesn't vanish while moving the cursor toward it. */
    .sp-vol-group::after {
      content: ''; position: absolute; bottom: 100%; left: 50%;
      transform: translateX(-50%); width: 100%; height: 12px;
    }
    [data-compact-hide] { display: none !important; }
    .content { padding: 30px 28px 132px; }
  }

  /* Tablet / Compact screens (<= 1300px): Reflows cleanly into mobile-friendly layout */
  @media (max-width: 1300px) {
    .home-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }
    .tile-hero, .tile-stats, .tile-quick-mix, .tile-recent, .tile-new,
    .tile-most, .tile-albums, .tile-artists, .tile-pl {
      grid-column: span 1 !important;
      grid-row: auto !important;
    }
    .tile-hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .tile-hero-art { width: 128px; height: 128px; }
    .tile-stats-list { gap: 10px; }
    .tile-most-grid, .tile-albums-grid { gap: 8px; }
    .spotify-player { padding: 0 10px; }
    .sp-actions-left { display: none; }
    .sp-title { font-size: 13px; }
    .sp-btn-lyrics .lbl { display: none; }
    .content { padding: 20px 16px 132px; }
    .fullscreen-body { grid-template-columns: 1fr; gap: 24px; }
    .fullscreen-cover-wrap { max-width: 240px; margin-bottom: 12px; }
    .fullscreen-video-wrap { max-width: 320px; margin-bottom: 12px; }
  }

  @media (max-width: 680px) {
    .rail, .rail.rail-collapsed { width: 60px !important; }
    .rail-btn { width: 46px; }
    .rail-btn .lbl { display: none; }
    .content { padding: 16px 14px 120px; }
    .home-header { margin-bottom: 16px; }
    .spotify-player { padding: 0 12px; }
    .sp-center { width: clamp(260px, 46vw, 600px); }
    .sp-vol-slider { display: none; }
  }

  /* Custom frameless window title bar */
  .title-bar {
    position: fixed; top: 0; left: 0; right: 0; height: var(--titlebar-h, 0px);
    z-index: 100000; display: flex; align-items: center;
    justify-content: space-between;
    background: color-mix(in srgb, var(--sidebar-bg) 96%, transparent);
    border-bottom: 1px solid rgba(128,128,128,0.14);
    -webkit-app-region: drag; user-select: none; flex-shrink: 0;
  }
  .title-bar-center {
    flex: 1; min-width: 0; height: 100%;
    display: flex; align-items: center; justify-content: center;
    padding: 0 12px; -webkit-app-region: drag;
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

  /* Global Search (title-bar center) */
  .gs-root { position: relative; width: min(440px, 42vw); min-width: 200px; -webkit-app-region: no-drag; }
  .gs-input {
    display: flex; align-items: center; gap: 8px;
    height: 30px; padding: 0 10px;
    background: rgba(128,128,128,0.08);
    border: 1px solid rgba(128,128,128,0.14);
    border-radius: 9px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  .gs-input:focus-within,
  .gs-input[data-active="true"] {
    border-color: var(--accent);
    background: rgba(128,128,128,0.12);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent);
  }
  .gs-input svg { color: var(--text-secondary); flex-shrink: 0; }
  .gs-input input {
    flex: 1; min-width: 0; background: transparent; border: none; outline: none;
    color: var(--text-primary); font-size: 12.5px; font-family: var(--font); padding: 0;
  }
  .gs-input input::placeholder { color: var(--text-secondary); opacity: 0.75; }
  .gs-kbd {
    font-size: 10px; font-weight: 700; color: var(--text-secondary);
    border: 1px solid rgba(128,128,128,0.28); border-radius: 5px;
    padding: 1px 5px; font-family: inherit; white-space: nowrap; flex-shrink: 0;
  }
  .gs-clear {
    display: flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; flex-shrink: 0;
    border: none; border-radius: 50%; cursor: pointer; padding: 0;
    background: rgba(128,128,128,0.15); color: var(--text-secondary);
    transition: var(--transition);
  }
  .gs-clear:hover { background: rgba(128,128,128,0.3); color: var(--text-primary); }
  .gs-dropdown {
    position: absolute; top: calc(100% + 10px); left: 50%;
    width: min(500px, 92vw);
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--card-bg) 98%, transparent);
    border: 1px solid rgba(128,128,128,0.16);
    border-radius: 14px;
    box-shadow: 0 20px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(128,128,128,0.05);
    padding: 8px; z-index: 100001;
    overflow-y: auto; max-height: min(520px, 68vh);
    overscroll-behavior: contain;
    animation: gsDropIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);
    scrollbar-width: thin;
  }
  .gs-dropdown::-webkit-scrollbar { width: 8px; }
  .gs-dropdown::-webkit-scrollbar-thumb {
    background: rgba(128,128,128,0.25); border-radius: 8px;
    border: 2px solid transparent; background-clip: padding-box;
  }
  .gs-dropdown::-webkit-scrollbar-thumb:hover { background-color: rgba(128,128,128,0.45); }
  @keyframes gsDropIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.99); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  .gs-group + .gs-group { margin-top: 6px; }
  .gs-label {
    font-size: 10px; font-weight: 800; letter-spacing: 1px;
    text-transform: uppercase; color: var(--text-secondary);
    padding: 7px 12px 5px;
  }
  .gs-item {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 8px 12px; border-radius: 10px; cursor: pointer;
    border: none; background: transparent; color: inherit; text-align: left;
    font-family: var(--font);
    transition: background 0.1s ease, box-shadow 0.1s ease;
  }
  .gs-item:hover,
  .gs-item[data-active="true"] { background: rgba(128,128,128,0.1); }
  .gs-item[data-active="true"] { box-shadow: inset 2px 0 0 var(--accent); }
  .gs-thumb {
    width: 36px; height: 36px; border-radius: 9px; overflow: hidden;
    flex-shrink: 0; background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary);
  }
  .gs-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .gs-item-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.gs-item-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gs-item-sub {
  font-size: 11.5px;
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
  .gs-empty {
    padding: 18px 12px; text-align: center; font-size: 12.5px; color: var(--text-secondary);
  }
  .gs-footer {
    display: flex; align-items: center; gap: 8px; width: 100%;
    margin-top: 3px; padding: 9px 12px; cursor: pointer;
    border: none; background: transparent; border-radius: 10px;
    color: var(--accent); font-size: 11.5px; font-weight: 700; font-family: var(--font);
    transition: background 0.1s ease;
  }
  .gs-footer:hover { background: rgba(128,128,128,0.08); }
  .gs-footer svg { flex-shrink: 0; }
`
