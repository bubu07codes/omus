import { useState } from 'react'
import { X, Moon, Clock } from 'lucide-react'
import { SleepTimerState } from '../../types'

interface SleepTimerModalProps {
  isOpen: boolean
  onClose: () => void
  sleepTimer: SleepTimerState
  onStartTimer: (minutes: number, mode?: 'duration' | 'end_of_track', fadeVolume?: boolean) => void
  onCancelTimer: () => void
}

export function SleepTimerModal({
  isOpen,
  onClose,
  sleepTimer,
  onStartTimer,
  onCancelTimer
}: SleepTimerModalProps) {
  const [customMinutes, setCustomMinutes] = useState<string>('30')
  const [fadeVolume, setFadeVolume] = useState<boolean>(true)

  if (!isOpen) return null

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Moon size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Sleep Timer</h3>
          </div>
          <button className="btn-plain" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px 24px' }}>
          {sleepTimer.active ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(128,128,128,0.08)',
                borderRadius: 14,
                marginBottom: 20
              }}
            >
              <Clock size={32} color="var(--accent)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Playback will stop in
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                {sleepTimer.mode === 'end_of_track'
                  ? 'End of Song'
                  : formatRemaining(sleepTimer.remainingSeconds)}
              </div>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 16, fontSize: 11 }}
                onClick={() => {
                  onCancelTimer()
                  onClose()
                }}
              >
                Cancel Sleep Timer
              </button>
            </div>
          ) : (
            <>
              <label className="lbl-caps" style={{ marginBottom: 10 }}>
                Quick Presets
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginBottom: 20
                }}
              >
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    className="btn btn-ghost"
                    style={{ padding: '10px 8px' }}
                    onClick={() => {
                      onStartTimer(mins, 'duration', fadeVolume)
                      onClose()
                    }}
                  >
                    {mins} mins
                  </button>
                ))}
                <button
                  className="btn btn-ghost"
                  style={{ padding: '10px 8px' }}
                  onClick={() => {
                    onStartTimer(0, 'end_of_track', fadeVolume)
                    onClose()
                  }}
                >
                  End of track
                </button>
              </div>

              <label className="lbl-caps" style={{ marginBottom: 6 }}>
                Custom Duration (Minutes)
              </label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input
                  type="number"
                  min="1"
                  max="360"
                  className="field"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Minutes..."
                />
                <button
                  className="btn btn-primary"
                  disabled={!parseInt(customMinutes, 10)}
                  onClick={() => {
                    const mins = parseInt(customMinutes, 10)
                    if (mins > 0) {
                      onStartTimer(mins, 'duration', fadeVolume)
                      onClose()
                    }
                  }}
                >
                  Start
                </button>
              </div>

              <div className="settings-row" style={{ padding: '6px 0', border: 'none' }}>
                <div className="settings-row-text">
                  <div className="settings-row-title">Gentle Fade-Out</div>
                  <div className="settings-row-desc">Fade volume smoothly before stopping.</div>
                </div>
                <button className="switch-label" onClick={() => setFadeVolume((v) => !v)}>
                  <span className="switch-track" data-active={fadeVolume}>
                    <span className="switch-knob" />
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-plain" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
