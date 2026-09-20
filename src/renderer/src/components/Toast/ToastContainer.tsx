import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { ToastMessage } from '../../types'

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 104,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            background: 'color-mix(in srgb, var(--card-bg) 87%, transparent)',
            border: '1px solid color-mix(in srgb, var(--text-primary) 14%, transparent)',
            boxShadow:
              '0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 260,
            maxWidth: 380,
            backdropFilter: 'blur(20px)',
            animation: 'fadeInSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            color: 'var(--text-primary)'
          }}
        >
          {toast.type === 'success' && (
            <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />
          )}
          {toast.type === 'error' && (
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          )}
          {toast.type === 'info' && (
            <Info size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{toast.title}</div>
            {toast.message && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                {toast.message}
              </div>
            )}
          </div>

          <button
            className="btn-plain"
            onClick={() => onRemove(toast.id)}
            style={{ padding: 4, opacity: 0.7 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
