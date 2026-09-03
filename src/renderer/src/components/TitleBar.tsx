import React, { useEffect, useState } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'

const IS_WINDOWS = typeof window !== 'undefined' && window.api?.platform === 'win32'

export interface TitleBarProps {
  onAbout?: () => void
}

export function TitleBar({ onAbout }: TitleBarProps): React.ReactElement {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!IS_WINDOWS) return

    let disposed = false
    window.api.isWindowMaximized().then((m) => {
      if (!disposed) setMaximized(m)
    })
    const unsubscribe = window.api.onWindowMaximizeChange((m) => setMaximized(m))
    return () => {
      disposed = true
      unsubscribe()
    }
  }, [])

  const toggleMaximize = async (): Promise<void> => {
    if (!IS_WINDOWS) return
    const m = await window.api.windowToggleMaximize()
    setMaximized(m)
  }

  return (
    <header
      className="title-bar"
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement
        if (
          IS_WINDOWS &&
          !target.closest('.title-bar-controls') &&
          !target.closest('.title-bar-logo')
        ) {
          void toggleMaximize()
        }
      }}
    >
      <div
        className="title-bar-logo"
        onClick={() => onAbout?.()}
        title="About Omus"
        role="button"
        tabIndex={0}
        data-no-drag="true"
      >
        <img
          src="/logo.svg"
          alt="omus"
          draggable={false}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fb = e.currentTarget.nextElementSibling as HTMLElement
            if (fb) fb.style.display = 'block'
          }}
        />
        <span style={{ display: 'none', fontWeight: 800, fontSize: 18 }}>omus</span>
      </div>

      {IS_WINDOWS && (
        <div className="title-bar-controls" data-no-drag="true">
          <button
            type="button"
            className="title-bar-btn"
            onClick={() => window.api.windowMinimize()}
            aria-label="Minimize"
            title="Minimize"
          >
            <Minus size={13} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="title-bar-btn"
            onClick={() => void toggleMaximize()}
            aria-label={maximized ? 'Restore down' : 'Maximize'}
            title={maximized ? 'Restore down' : 'Maximize'}
          >
            {maximized ? (
              <Copy size={12} strokeWidth={2.2} />
            ) : (
              <Square size={11} strokeWidth={2.2} />
            )}
          </button>
          <button
            type="button"
            className="title-bar-btn title-bar-close"
            onClick={() => window.api.windowClose()}
            aria-label="Close"
            title="Close"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </header>
  )
}
