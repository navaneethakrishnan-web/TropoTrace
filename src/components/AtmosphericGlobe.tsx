import { useEffect, useRef } from 'react'

export function AtmosphericGlobe({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600)

    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener('resize', handleResize)

    // Particles for storm vortex
    const particleCount = 120
    const particles = Array.from({ length: particleCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 40 + Math.random() * 180,
      speed: 0.004 + Math.random() * 0.012,
      size: 1 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.7,
      color: Math.random() > 0.6 ? '#38E4C0' : Math.random() > 0.3 ? '#56CFFF' : '#FFC857',
    }))

    let rotation = 0
    let radarSweep = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      const cx = width / 2
      const cy = height / 2
      const baseRadius = Math.min(width, height) * 0.38

      // Background atmospheric glow
      const radialGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 1.6)
      radialGrad.addColorStop(0, 'rgba(56, 228, 192, 0.16)')
      radialGrad.addColorStop(0.5, 'rgba(86, 207, 255, 0.06)')
      radialGrad.addColorStop(1, 'rgba(6, 16, 14, 0)')
      ctx.fillStyle = radialGrad
      ctx.fillRect(0, 0, width, height)

      // Outer radar concentric rings
      ctx.lineWidth = 1
      for (let r = 0.3; r <= 1.1; r += 0.25) {
        ctx.strokeStyle = `rgba(36, 66, 56, ${0.4 - r * 0.15})`
        ctx.beginPath()
        ctx.arc(cx, cy, baseRadius * r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Range ring distance labels
      ctx.font = '9px "DM Mono", monospace'
      ctx.fillStyle = 'rgba(86, 207, 255, 0.35)'
      ctx.fillText('50 km', cx + baseRadius * 0.3 + 4, cy - 4)
      ctx.fillText('100 km', cx + baseRadius * 0.55 + 4, cy - 4)
      ctx.fillText('150 km', cx + baseRadius * 0.8 + 4, cy - 4)
      ctx.fillText('200 km', cx + baseRadius * 1.05 + 4, cy - 4)

      // Crosshairs / cardinal lines
      ctx.strokeStyle = 'rgba(56, 228, 192, 0.15)'
      ctx.beginPath()
      ctx.moveTo(cx - baseRadius * 1.2, cy)
      ctx.lineTo(cx + baseRadius * 1.2, cy)
      ctx.moveTo(cx, cy - baseRadius * 1.2)
      ctx.lineTo(cx, cy + baseRadius * 1.2)
      ctx.stroke()

      // Radar sweep beam
      radarSweep += 0.015
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(radarSweep)
      const sweepGrad = ctx.createLinearGradient(0, 0, baseRadius * 1.1, baseRadius * 0.3)
      sweepGrad.addColorStop(0, 'rgba(56, 228, 192, 0.35)')
      sweepGrad.addColorStop(1, 'rgba(56, 228, 192, 0)')
      ctx.fillStyle = sweepGrad
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, baseRadius * 1.1, -0.35, 0)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // Rotating 3D Latitude/Longitude sphere rings
      rotation += 0.003
      ctx.save()
      ctx.translate(cx, cy)

      // Outer sphere boundary
      ctx.strokeStyle = 'rgba(56, 228, 192, 0.45)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Latitude ellipses
      for (let lat = -60; lat <= 60; lat += 30) {
        const rad = (lat * Math.PI) / 180
        const y = Math.sin(rad) * baseRadius
        const rLat = Math.cos(rad) * baseRadius
        ctx.strokeStyle = 'rgba(36, 66, 56, 0.5)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.ellipse(0, y, rLat, rLat * 0.28, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Longitude rotated ellipses
      for (let lon = 0; lon < 180; lon += 45) {
        const angle = ((lon * Math.PI) / 180) + rotation
        const rx = Math.abs(Math.sin(angle)) * baseRadius
        ctx.strokeStyle = 'rgba(56, 228, 192, 0.22)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.ellipse(0, 0, rx, baseRadius, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.restore()

      // Storm convective vortex particles
      particles.forEach((p) => {
        p.angle += p.speed
        p.radius -= 0.15
        if (p.radius < 25) {
          p.radius = baseRadius * 0.95
          p.angle = Math.random() * Math.PI * 2
        }

        const px = cx + Math.cos(p.angle) * p.radius
        const py = cy + Math.sin(p.angle) * (p.radius * 0.72) // perspective squish

        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha * (p.radius / (baseRadius * 0.95))
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1.0

      // Core storm eye
      const eyeGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 32)
      eyeGrad.addColorStop(0, '#FFFFFF')
      eyeGrad.addColorStop(0.3, '#38E4C0')
      eyeGrad.addColorStop(0.7, 'rgba(56, 228, 192, 0.2)')
      eyeGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = eyeGrad
      ctx.beginPath()
      ctx.arc(cx, cy, 32, 0, Math.PI * 2)
      ctx.fill()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className={`atmospheric-globe-container ${className}`}>
      <canvas ref={canvasRef} className="atmospheric-globe-canvas" />
    </div>
  )
}
