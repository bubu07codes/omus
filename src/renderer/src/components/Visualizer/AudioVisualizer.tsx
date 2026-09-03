import { useEffect, useRef, useCallback } from 'react'
import { VisualizerMode } from '../../types'

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null
  isPlaying: boolean
  mode?: VisualizerMode
  accentColor?: string
  width?: number
  height?: number
  className?: string
  barCount?: number
}

export function AudioVisualizer({
  analyserNode,
  isPlaying,
  mode = 'bars',
  accentColor = '#ffffff',
  width = 160,
  height = 36,
  className = '',
  barCount = 24
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Canvas API (addColorStop / strokeStyle) requires an actual parsed color,
  // not a CSS variable reference like `var(--accent)`. Resolve it against the
  // live app-shell element so themes keep working, and fall back to a safe neutral.
  const resolveAccentColor = useCallback((raw: string): string => {
    if (!raw || !raw.trim()) return '#ffffff'
    const trimmed = raw.trim()
    if (!trimmed.startsWith('var(')) return trimmed
    const varName = trimmed.match(/var\(([^)]+)\)/)?.[1]?.trim()
    if (varName) {
      try {
        const el = document.querySelector('.app-shell') || document.documentElement
        const computed = getComputedStyle(el).getPropertyValue(varName).trim()
        if (computed) return computed
        // Fall back to the document root ifthe value lives there instead.
        const rootVal = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
        if (rootVal) return rootVal
      } catch {
        /* fall through to neutral */
      }
    }
    return '#ffffff'
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || mode === 'off') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dataArray: Uint8Array<ArrayBuffer>
    let bufferLength = 0

    if (analyserNode) {
      bufferLength = analyserNode.frequencyBinCount
      // Guards against pathological fftSize producing an unusably large buffer.
      if (!bufferLength || bufferLength < 0 || bufferLength > 16384) bufferLength = 256
      dataArray = new Uint8Array(bufferLength)
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const col = resolveAccentColor(accentColor)

      if (!analyserNode || !isPlaying) {
        // Idle subtle wave or line
        ctx.fillStyle = 'rgba(128, 128, 128, 0.25)'
        const numBars = Math.min(barCount, 32)
        const barWidth = (canvas.width - (numBars - 1) * 2) / numBars
        for (let i = 0; i < numBars; i++) {
          const x = i * (barWidth + 2)
          const h = 3
          const y = canvas.height - h
          ctx.beginPath()
          ctx.roundRect(x, y, barWidth, h, 2)
          ctx.fill()
        }
        animFrameRef.current = requestAnimationFrame(render)
        return
      }

      if (mode === 'bars') {
        analyserNode.getByteFrequencyData(dataArray)
        const numBars = barCount
        const barWidth = Math.max(2, (canvas.width - (numBars - 1) * 2) / numBars)

        // Gradient for neon glow
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        gradient.addColorStop(0, col)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)')

        ctx.fillStyle = gradient

        const step = Math.floor(bufferLength / numBars)
        for (let i = 0; i < numBars; i++) {
          const value = dataArray[i * step] || 0
          const percent = value / 255
          const barHeight = Math.max(3, percent * canvas.height)
          const x = i * (barWidth + 2)
          const y = canvas.height - barHeight

          ctx.beginPath()
          ctx.roundRect(x, y, barWidth, barHeight, 2)
          ctx.fill()
        }
      } else if (mode === 'wave') {
        analyserNode.getByteTimeDomainData(dataArray)
        ctx.lineWidth = 2
        ctx.strokeStyle = col
        ctx.beginPath()

        const sliceWidth = canvas.width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * canvas.height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          x += sliceWidth
        }

        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()
      } else if (mode === 'radial') {
        analyserNode.getByteFrequencyData(dataArray)
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const radius = Math.min(centerX, centerY) * 0.45

        ctx.strokeStyle = col
        ctx.lineWidth = 2
        ctx.beginPath()

        const points = 36
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2
          const freqVal = dataArray[i * 2] || 0
          const dist = radius + (freqVal / 255) * (radius * 0.9)
          const x = centerX + Math.cos(angle) * dist
          const y = centerY + Math.sin(angle) * dist

          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.stroke()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [analyserNode, isPlaying, mode, accentColor, resolveAccentColor, width, height, barCount])

  if (mode === 'off') return null

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`audio-visualizer-canvas ${className}`}
      style={{ display: 'block', pointerEvents: 'none' }}
    />
  )
}
