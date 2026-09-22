import React from 'react'

/* Perceptual volume curve. The audio engine applies a cubic gain curve
 * (gain = v³), which makes quiet ranges feel cramped on a linear slider.
 * Mapping the thumb position through these inverses makes perceived
 * loudness track the thumb ~linearly (amplitude ≈ p^1.67 ≈ ear-linear),
 * so 50% genuinely sounds half as loud as 100%. */
export const VOLUME_POS_CURVE = 1.8
export const volumeToSliderPos = (v: number): number => Math.pow(Math.max(0, Math.min(1, v)), VOLUME_POS_CURVE)
export const sliderPosToVolume = (p: number): number => Math.pow(Math.max(0, Math.min(1, p)), 1 / VOLUME_POS_CURVE)

interface NiceSliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  className?: string
  style?: React.CSSProperties
  title?: string
  ariaLabel?: string
}

/** Custom-styled range slider. Sets `--fill` so GLOBAL_CSS can paint the
 *  accent-filled track up to the thumb (no default browser look). */
export function NiceSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
  style,
  title,
  ariaLabel
}: NiceSliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`nice-range${className ? ` ${className}` : ''}`}
      style={{ ['--fill' as string]: `${pct}%`, ...(style || {}) } as React.CSSProperties}
      title={title}
      aria-label={ariaLabel}
    />
  )
}