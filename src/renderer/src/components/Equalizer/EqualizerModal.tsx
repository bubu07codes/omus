import { X, RotateCcw, Sliders } from 'lucide-react'
import { EQBand } from '../../types'
import { EQ_PRESETS } from '../../hooks/useAudioEngine'

interface EqualizerModalProps {
  isOpen: boolean
  onClose: () => void
  eqBands: EQBand[]
  eqPreamp: number
  currentPreset: string
  onBandChange: (index: number, gain: number) => void
  onPreampChange: (gain: number) => void
  onPresetSelect: (presetId: string) => void
}

export function EqualizerModal({
  isOpen,
  onClose,
  eqBands,
  eqPreamp,
  currentPreset,
  onBandChange,
  onPreampChange,
  onPresetSelect
}: EqualizerModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 740, padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head" style={{ borderBottom: '1px solid rgba(128,128,128,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sliders size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>10-Band Graphic Equalizer</h3>
          </div>
          <button className="btn-plain" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Preset selector */}
          <div style={{ marginBottom: 24 }}>
            <label className="lbl-caps" style={{ marginBottom: 10 }}>
              Equalizer Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EQ_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className="pl-opt-chip"
                  data-active={currentPreset === preset.id}
                  onClick={() => onPresetSelect(preset.id)}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* EQ Sliders Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 28,
              background: 'rgba(128,128,128,0.06)',
              padding: '24px 20px',
              borderRadius: 16,
              border: '1px solid rgba(128,128,128,0.12)'
            }}
          >
            {/* Preamp Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                borderRight: '1px solid rgba(128,128,128,0.15)',
                paddingRight: 20
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>PREAMP</span>
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {eqPreamp > 0 ? `+${eqPreamp.toFixed(1)}` : eqPreamp.toFixed(1)} dB
              </span>
              <div
                style={{
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="0.5"
                  value={eqPreamp}
                  onChange={(e) => onPreampChange(Number(e.target.value))}
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    height: 140,
                    cursor: 'pointer',
                    accentColor: 'var(--accent)'
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Master</span>
            </div>

            {/* 10 Frequencies */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
              {eqBands.map((band, idx) => (
                <div
                  key={band.freq}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {band.gain > 0 ? `+${band.gain.toFixed(1)}` : band.gain.toFixed(1)}
                  </span>
                  <div
                    style={{
                      height: 160,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={band.gain}
                      onChange={(e) => onBandChange(idx, Number(e.target.value))}
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        height: 140,
                        cursor: 'pointer',
                        accentColor: 'var(--accent)'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {band.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn-ghost"
            onClick={() => onPresetSelect('flat')}
            style={{ fontSize: 11, padding: '6px 12px' }}
          >
            <RotateCcw size={13} /> Reset to Flat
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
