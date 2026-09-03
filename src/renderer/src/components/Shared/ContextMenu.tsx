import React from 'react'

export interface ContextMenuOption {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onClick: () => void
}

export function ContextMenu({
  x,
  y,
  options,
  onClose
}: {
  x: number
  y: number
  options: ContextMenuOption[]
  onClose: () => void
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1050 }} onClick={onClose} />
      <div
        style={{
          position: 'fixed',
          left: Math.min(x, window.innerWidth - 200),
          top: Math.min(y, window.innerHeight - options.length * 38 - 16),
          zIndex: 1060,
          background: 'var(--card-bg)',
          border: '1px solid rgba(128,128,128,0.22)',
          borderRadius: 12,
          padding: 6,
          minWidth: 190,
          boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          animation: 'fadeInSlide 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {options.map((opt, i) => (
          <button
            key={i}
            className="pl-opt-row"
            style={{ color: opt.danger ? '#f87171' : 'var(--text-primary)', width: '100%' }}
            onClick={() => {
              opt.onClick()
              onClose()
            }}
          >
            {opt.icon && (
              <span style={{ display: 'flex', alignItems: 'center', width: 18 }}>{opt.icon}</span>
            )}
            {opt.label}
          </button>
        ))}
      </div>
    </>
  )
}
