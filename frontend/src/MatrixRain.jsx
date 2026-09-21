import { useRef, useEffect } from 'react'

const GLYPHS = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function MatrixRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const fontSize = 15
    let cols, drops, w, h, intervalId

    function resize() {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      cols = Math.floor(w / fontSize)
      drops = new Array(cols).fill(0).map(() => Math.random() * -50)
    }

    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,.08)'
      ctx.fillRect(0, 0, w, h)
      ctx.font = fontSize + 'px monospace'
      for (let i = 0; i < cols; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        const y = drops[i] * fontSize
        ctx.fillStyle = Math.random() < 0.05 ? '#c8ffd4' : '#00ff41'
        ctx.fillText(char, i * fontSize, y)
        if (y > h && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduceMotion) intervalId = setInterval(draw, 50)

    return () => {
      window.removeEventListener('resize', resize)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  return <canvas id="rain" ref={canvasRef} />
}
