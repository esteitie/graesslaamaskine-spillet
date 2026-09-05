// Smaa dyr i haven. De hopper vaek naar maskinen kommer - intet kommer til skade.

import { TAU, dist, pointInPolygon, makeRandom, clamp } from './geometry.js'

const KINDS = ['hedgehog', 'bird', 'ladybird']
const FLEE_RADIUS = 78

export function createCritters (level, inside) {
  const rnd = makeRandom(level.id * 977 + 31)
  const list = []
  const bounds = level.lawn.reduce((b, p) => ({
    minX: Math.min(b.minX, p[0]), maxX: Math.max(b.maxX, p[0]),
    minY: Math.min(b.minY, p[1]), maxY: Math.max(b.maxY, p[1])
  }), { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9 })

  const wanted = 5
  let guard = 0
  while (list.length < wanted && guard++ < 300) {
    const x = bounds.minX - 40 + rnd() * (bounds.maxX - bounds.minX + 80)
    const y = bounds.minY - 40 + rnd() * (bounds.maxY - bounds.minY + 80)
    // de holder til i kanten af plaenen og udenfor - ikke midt i klippezonen
    if (pointInPolygon([x, y], level.lawn) && rnd() < 0.6) continue
    if (y < 70) continue
    list.push({
      kind: KINDS[(rnd() * KINDS.length) | 0],
      x,
      y,
      home: [x, y],
      vx: 0,
      vy: 0,
      hop: rnd() * TAU,
      flee: 0,
      phase: rnd() * TAU
    })
  }

  function update (dt, machine, clock) {
    for (const c of list) {
      const d = dist([c.x, c.y], machine)
      if (d < FLEE_RADIUS) {
        c.flee = 1
        const a = Math.atan2(c.y - machine[1], c.x - machine[0])
        const speed = c.kind === 'bird' ? 190 : 120
        c.vx = Math.cos(a) * speed
        c.vy = Math.sin(a) * speed
      } else if (c.flee > 0) {
        c.flee = Math.max(0, c.flee - dt * 0.6)
        c.vx *= Math.pow(0.05, dt)
        c.vy *= Math.pow(0.05, dt)
      } else {
        // luntende tilbage mod sit sted
        const dx = c.home[0] - c.x
        const dy = c.home[1] - c.y
        const len = Math.hypot(dx, dy)
        if (len > 6) {
          c.vx = (dx / len) * 22
          c.vy = (dy / len) * 22
        } else {
          c.vx = Math.sin(clock * 0.7 + c.phase) * 10
          c.vy = Math.cos(clock * 0.5 + c.phase) * 8
        }
      }
      c.x = clamp(c.x + c.vx * dt, 10, 950)
      c.y = clamp(c.y + c.vy * dt, 60, 590)
      c.hop += dt * (c.flee > 0 ? 16 : 4)
    }
  }

  function draw (ctx) {
    for (const c of list) {
      const bounce = Math.abs(Math.sin(c.hop)) * (c.flee > 0 ? 9 : 3)
      ctx.save()
      ctx.translate(c.x, c.y - bounce)
      ctx.fillStyle = 'rgba(0,0,0,.2)'
      ctx.beginPath(); ctx.ellipse(0, bounce + 6, 10, 4, 0, 0, TAU); ctx.fill()
      if (c.kind === 'hedgehog') {
        ctx.fillStyle = '#6b4a2f'
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 10, 0, 0, TAU); ctx.fill()
        ctx.strokeStyle = '#3f2c1c'
        ctx.lineWidth = 2
        for (let i = 0; i < 9; i++) {
          const a = Math.PI + (i / 8) * Math.PI
          ctx.beginPath()
          ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 6)
          ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 12)
          ctx.stroke()
        }
        ctx.fillStyle = '#d9b48f'
        ctx.beginPath(); ctx.ellipse(11, 3, 6, 5, 0, 0, TAU); ctx.fill()
        ctx.fillStyle = '#2c2c31'
        ctx.beginPath(); ctx.arc(15, 3, 2, 0, TAU); ctx.fill()
      } else if (c.kind === 'bird') {
        const wing = Math.sin(c.hop * 2) * (c.flee > 0 ? 8 : 2)
        ctx.fillStyle = '#5b6b8c'
        ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, TAU); ctx.fill()
        ctx.fillStyle = '#8fa3c4'
        ctx.beginPath(); ctx.ellipse(-2, -2 - wing * 0.4, 8, 4, -0.3, 0, TAU); ctx.fill()
        ctx.fillStyle = '#5b6b8c'
        ctx.beginPath(); ctx.arc(9, -5, 5, 0, TAU); ctx.fill()
        ctx.fillStyle = '#ffb703'
        ctx.beginPath(); ctx.moveTo(13, -5); ctx.lineTo(18, -3); ctx.lineTo(13, -2); ctx.fill()
      } else {
        ctx.fillStyle = '#e5484d'
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 7, 0, 0, TAU); ctx.fill()
        ctx.fillStyle = '#2c2c31'
        ctx.beginPath(); ctx.arc(-4, -3, 2, 0, TAU); ctx.fill()
        ctx.beginPath(); ctx.arc(3, 2, 2, 0, TAU); ctx.fill()
        ctx.beginPath(); ctx.arc(2, -4, 1.7, 0, TAU); ctx.fill()
        ctx.beginPath(); ctx.arc(6, -1, 3.5, 0, TAU); ctx.fill()
      }
      ctx.restore()
    }
  }

  return { update, draw, list }
}
