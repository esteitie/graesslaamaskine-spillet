// Konfetti tegnet direkte paa banens canvas.

const COLORS = ['#ff5f6d', '#ffb347', '#ffe66d', '#4fd46e', '#5b8def', '#ff6b9d', '#8ef0ff']

export function prefersReducedMotion () {
  return typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function createConfetti () {
  const parts = []
  const reduced = prefersReducedMotion()

  function burst (x, y, count = 90) {
    const n = reduced ? Math.round(count * 0.25) : count
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 90 + Math.random() * 320
      parts.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 160,
        w: 6 + Math.random() * 8,
        h: 9 + Math.random() * 12,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * (reduced ? 3 : 9),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 2.2 + Math.random() * 1.4
      })
    }
  }

  function rain (w, count = 60) {
    const n = reduced ? Math.round(count * 0.25) : count
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 60,
        vy: 90 + Math.random() * 120,
        w: 6 + Math.random() * 8,
        h: 9 + Math.random() * 12,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * (reduced ? 3 : 9),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 5 + Math.random() * 3
      })
    }
  }

  /** Smaa gyldne glimt der stiger - bruges naar en sommerfugl flyver op. */
  function sparkle (x, y, count = 16) {
    const n = reduced ? Math.round(count * 0.3) : count
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 30 + Math.random() * 90
      parts.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 70,
        w: 4 + Math.random() * 4,
        h: 4 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 6,
        color: ['#ffe066', '#fff3b0', '#ffffff'][(Math.random() * 3) | 0],
        life: 0.7 + Math.random() * 0.6,
        rise: true
      })
    }
  }

  function update (dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.life -= dt
      if (p.life <= 0) { parts.splice(i, 1); continue }
      p.vy += (p.rise ? -60 : 520) * dt
      p.vx *= 0.995
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.spin * dt
    }
  }

  function draw (ctx) {
    for (const p of parts) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = Math.min(1, p.life)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  return {
    burst,
    sparkle,
    rain,
    update,
    draw,
    clear () { parts.length = 0 },
    get active () { return parts.length > 0 }
  }
}
