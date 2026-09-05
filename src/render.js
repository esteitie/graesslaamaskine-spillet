// Tegnefunktioner til banen. Alt her er uden hukommelse: de faar det de skal
// bruge som argumenter, saa level.js kun holder styr paa spillets tilstand.

import {
  TAU, dist, lerp, polylineLength, polygonBounds, polygonCentroid,
  shapePolygon, pointInPolygon, closestPointOnPolygon, makeRandom, clamp
} from './geometry.js'
import { getImage, DRAW_W, DRAW_H } from './machine.js'

export const SKY = '#8fd3f4'

/**
 * Hver have har sin egen tid paa dagen: bane 1 er morgen, bane 5 er solnedgang.
 * sun er retningen skyggerne falder, tint laegges over hele billedet.
 */
export const DAYLIGHT = {
  1: { sky: ['#a8e0f7', '#d8f0b0'], ground: ['#cfa976', '#a8763e'], sun: [0.5, 0.9], shadow: 0.2, tint: 'rgba(150, 200, 255, .10)' },
  2: { sky: ['#8fd3f4', '#cfeaa8'], ground: ['#c8a06a', '#a8763e'], sun: [0.8, 0.7], shadow: 0.24, tint: 'rgba(255, 250, 220, .06)' },
  3: { sky: ['#95d0ee', '#e2e6a0'], ground: ['#cfa065', '#a06f38'], sun: [-1.1, 0.6], shadow: 0.28, tint: 'rgba(255, 214, 150, .12)' },
  4: { sky: ['#9ccbe8', '#efd79a'], ground: ['#c99a5c', '#96652f'], sun: [-1.5, 0.5], shadow: 0.3, tint: 'rgba(255, 186, 110, .16)' },
  5: { sky: ['#ffb178', '#ffd9a0'], ground: ['#b8823f', '#7d5325'], sun: [-2.2, 0.35], shadow: 0.34, tint: 'rgba(255, 140, 70, .22)' }
}

export const daylight = n => DAYLIGHT[n] || DAYLIGHT[2]

export function polygonPath (ctx, poly) {
  ctx.beginPath()
  ctx.moveTo(poly[0][0], poly[0][1])
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1])
  ctx.closePath()
}

// ------------------------------------------------------------------ baggrund

export function paintBackground (ctx, { number, lawn, blocked, width, height }) {
  const rnd = makeRandom(number * 7919 + 13)
  const light = daylight(number)
  const sky = ctx.createLinearGradient(0, 0, 0, 60)
  sky.addColorStop(0, light.sky[0])
  sky.addColorStop(1, light.sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)
  const g = ctx.createLinearGradient(0, 0, 0, height)
  g.addColorStop(0, light.ground[0])
  g.addColorStop(1, light.ground[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 40, width, height - 40)

  ctx.fillStyle = '#b5803f'
  ctx.fillRect(0, 0, width, 42)
  ctx.fillStyle = '#8c5f2b'
  for (let x = 6; x < width; x += 34) ctx.fillRect(x, 4, 22, 36)
  ctx.fillStyle = '#7a5324'
  ctx.fillRect(0, 16, width, 6)
  ctx.fillRect(0, 30, width, 6)

  ctx.strokeStyle = '#d9c9a3'
  ctx.lineWidth = 26
  ctx.lineJoin = 'round'
  polygonPath(ctx, lawn)
  ctx.stroke()
  ctx.strokeStyle = '#cbb88d'
  ctx.setLineDash([16, 14])
  polygonPath(ctx, lawn)
  ctx.stroke()
  ctx.setLineDash([])

  for (let n = 0; n < 90; n++) {
    const x = rnd() * width
    const y = 60 + rnd() * (height - 70)
    const p = [x, y]
    if (pointInPolygon(p, lawn)) continue
    if (closestPointOnPolygon(p, lawn).dist < 30) continue
    if (blocked.some(b => pointInPolygon(p, shapePolygon(b)))) continue
    const kind = rnd()
    if (kind < 0.35) {
      ctx.fillStyle = ['#ff6b9d', '#ffd166', '#ff8fab', '#c77dff'][(rnd() * 4) | 0]
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU
        ctx.beginPath()
        ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, TAU)
        ctx.fill()
      }
      ctx.fillStyle = '#ffe066'
      ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill()
    } else if (kind < 0.75) {
      const r = 12 + rnd() * 8
      ctx.fillStyle = `rgba(0,0,0,${light.shadow})`
      ctx.beginPath()
      ctx.ellipse(x + light.sun[0] * r * 0.9, y + light.sun[1] * r * 0.5, r * 1.1, r * 0.45, 0, 0, TAU)
      ctx.fill()
      ctx.fillStyle = '#2f7d32'
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
      ctx.fillStyle = '#3f9142'
      ctx.beginPath(); ctx.arc(x - 4, y - 4, 8, 0, TAU); ctx.fill()
    } else {
      ctx.fillStyle = `rgba(0,0,0,${light.shadow})`
      ctx.beginPath()
      ctx.ellipse(x + light.sun[0] * 26, y + light.sun[1] * 14, 26, 11, 0, 0, TAU)
      ctx.fill()
      ctx.fillStyle = '#8c5f2b'
      ctx.fillRect(x - 4, y, 8, 16)
      ctx.fillStyle = '#2f7d32'
      ctx.beginPath(); ctx.arc(x, y - 6, 20, 0, TAU); ctx.fill()
      ctx.fillStyle = '#46a049'
      ctx.beginPath(); ctx.arc(x - 7, y - 12, 12, 0, TAU); ctx.fill()
    }
  }

  for (const b of blocked) {
    if (b.shape !== 'rect') continue
    ctx.fillStyle = '#c9b79a'
    ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.strokeStyle = '#a89577'
    ctx.lineWidth = 3
    for (let x = b.x; x <= b.x + b.w; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, b.y); ctx.lineTo(x, b.y + b.h); ctx.stroke()
    }
    for (let y = b.y; y <= b.y + b.h; y += 32) {
      ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke()
    }
    ctx.strokeStyle = '#8b7a5f'
    ctx.lineWidth = 6
    ctx.strokeRect(b.x, b.y, b.w, b.h)
    const cx = b.x + b.w / 2
    const cy = b.y + b.h / 2
    ctx.fillStyle = '#e5484d'
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, TAU); ctx.fill()
    ctx.fillStyle = '#fff'
    for (let k = 0; k < 4; k++) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, 30, (k / 4) * TAU, (k / 4) * TAU + 0.5)
      ctx.closePath(); ctx.fill()
    }
    ctx.fillStyle = '#6b4f2a'
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill()
  }

  ctx.fillStyle = '#2c5f2e'
  polygonPath(ctx, lawn)
  ctx.fill()
}

/** Vind der loeber hen over plaenen, og dagens farve over det hele. */
export function drawAmbient (ctx, { number, lawn, t, width, height, reduced }) {
  const light = daylight(number)
  if (!reduced) {
    ctx.save()
    polygonPath(ctx, lawn)
    ctx.clip()
    const x = ((t * 90) % (width + 500)) - 250
    const g = ctx.createLinearGradient(x - 160, 0, x + 160, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, 'rgba(255,255,255,.10)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }
  ctx.fillStyle = light.tint
  ctx.fillRect(0, 0, width, height)
}

// ------------------------------------------------------------------ ledning

export function drawWire (ctx, pts, closed) {
  if (pts.length < 2) return
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const stroke = (color, width, dy = 0) => {
    ctx.save()
    if (dy) ctx.translate(0, dy)
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    if (closed) ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
  stroke('rgba(0,0,0,.18)', 12, 3)
  stroke('#f97316', 8)
  stroke('#ffb066', 3)

  let acc = 0
  ctx.fillStyle = '#8a4b12'
  const n = closed ? pts.length : pts.length - 1
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const seg = dist(a, b)
    let t = acc
    while (t < seg) {
      ctx.beginPath()
      ctx.arc(lerp(a[0], b[0], t / seg), lerp(a[1], b[1], t / seg), 5, 0, TAU)
      ctx.fill()
      t += 40
    }
    acc = t - seg
  }
}

// ------------------------------------------------------------------ have

export function drawStation (ctx, station, { pulse = 0 } = {}) {
  ctx.save()
  ctx.translate(station[0], station[1])
  if (pulse > 0) {
    ctx.fillStyle = `rgba(255, 220, 90, ${0.15 + pulse * 0.35})`
    ctx.beginPath(); ctx.arc(0, 0, 34 + pulse * 12, 0, TAU); ctx.fill()
  }
  ctx.fillStyle = '#e6e9ef'
  ctx.strokeStyle = '#7b8496'
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.roundRect(-26, -18, 52, 36, 10); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#4a5364'
  ctx.beginPath(); ctx.roundRect(-16, -8, 32, 16, 6); ctx.fill()
  ctx.fillStyle = pulse > 0.5 ? '#ffe066' : '#4fd46e'
  ctx.beginPath(); ctx.arc(0, -24, 6, 0, TAU); ctx.fill()
  ctx.restore()
}

export function drawIslands (ctx, islands, { activeIndex = -1, t = 0 } = {}) {
  islands.forEach((isl, index) => {
    const poly = shapePolygon(isl)
    const centre = isl.shape === 'circle' ? [isl.x, isl.y] : polygonCentroid(poly)
    if (isl.type === 'hedge') {
      drawHedge(ctx, isl, poly)
      return
    }
    ctx.save()
    polygonPath(ctx, poly)
    ctx.fillStyle = '#7a4a25'
    ctx.fill()
    ctx.clip()
    const rnd = makeRandom((isl.x || 1) * 131 + (isl.y || 1))
    for (let k = 0; k < 26; k++) {
      const a = rnd() * TAU
      const r = Math.sqrt(rnd()) * (isl.r || 60)
      const x = centre[0] + Math.cos(a) * r
      const y = centre[1] + Math.sin(a) * r
      ctx.fillStyle = ['#ff6b9d', '#ffd166', '#c77dff', '#ff8fab'][(rnd() * 4) | 0]
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * TAU
        ctx.beginPath(); ctx.arc(x + Math.cos(pa) * 6, y + Math.sin(pa) * 6, 5, 0, TAU); ctx.fill()
      }
      ctx.fillStyle = '#fff3b0'
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill()
    }
    ctx.restore()
    if (index === activeIndex) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 5)
      ctx.strokeStyle = `rgba(255,230,102,${0.4 + pulse * 0.6})`
      ctx.lineWidth = 6 + pulse * 4
      polygonPath(ctx, poly)
      ctx.stroke()
    }
  })
}

/** Haek i labyrinthaverne: taet, groen og ikke til at koere igennem. */
function drawHedge (ctx, isl, poly) {
  ctx.save()
  polygonPath(ctx, poly)
  ctx.fillStyle = 'rgba(0,0,0,.22)'
  ctx.translate(4, 6)
  ctx.fill()
  ctx.restore()
  ctx.save()
  polygonPath(ctx, poly)
  ctx.fillStyle = '#215c26'
  ctx.fill()
  ctx.clip()
  const x0 = isl.x != null ? isl.x : 0
  const y0 = isl.y != null ? isl.y : 0
  const w = isl.w || 40
  const h = isl.h || 40
  const rnd = makeRandom(Math.round(x0 * 31 + y0 * 7 + w))
  for (let k = 0; k < Math.max(6, (w * h) / 320); k++) {
    const x = x0 + rnd() * w
    const y = y0 + rnd() * h
    ctx.fillStyle = ['#2f7d32', '#3f9142', '#46a049', '#1c4f21'][(rnd() * 4) | 0]
    ctx.beginPath(); ctx.arc(x, y, 8 + rnd() * 7, 0, TAU); ctx.fill()
  }
  ctx.restore()
  ctx.strokeStyle = '#17421b'
  ctx.lineWidth = 3
  polygonPath(ctx, poly)
  ctx.stroke()
}

export function drawHazards (ctx, hazards, t) {
  for (const h of hazards) {
    const poly = shapePolygon(h)
    ctx.save()
    polygonPath(ctx, poly)
    const g = ctx.createRadialGradient(h.x || 0, h.y || 0, 4, h.x || 0, h.y || 0, h.r || 60)
    g.addColorStop(0, '#7fd8ff')
    g.addColorStop(1, '#2b7fb8')
    ctx.fillStyle = g
    ctx.fill()
    ctx.clip()
    ctx.strokeStyle = 'rgba(255,255,255,.5)'
    ctx.lineWidth = 3
    for (let k = 0; k < 4; k++) {
      const rr = ((t * 18 + k * 18) % 70)
      ctx.globalAlpha = 1 - rr / 70
      ctx.beginPath(); ctx.arc(h.x, h.y, rr, 0, TAU); ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.restore()
    ctx.strokeStyle = '#5c8fa8'
    ctx.lineWidth = 6
    polygonPath(ctx, poly)
    ctx.stroke()
  }
}

export function drawHill (ctx, hill) {
  if (!hill) return
  const poly = hill.polygon
  const b = polygonBounds(poly)
  const u = hill.uphill
  ctx.save()
  polygonPath(ctx, poly)
  ctx.clip()
  const g = ctx.createLinearGradient(
    b.minX + (u[0] < 0 ? b.maxX - b.minX : 0), b.minY + (u[1] < 0 ? b.maxY - b.minY : 0),
    b.minX + (u[0] > 0 ? b.maxX - b.minX : 0), b.minY + (u[1] > 0 ? b.maxY - b.minY : 0))
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(1, 'rgba(255,255,255,.38)')
  ctx.fillStyle = g
  ctx.fillRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY)
  ctx.strokeStyle = 'rgba(255,255,255,.42)'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  const ang = Math.atan2(u[1], u[0])
  for (let y = b.minY + 26; y < b.maxY; y += 52) {
    for (let x = b.minX + 26; x < b.maxX; x += 70) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(ang)
      ctx.beginPath()
      ctx.moveTo(-12, -10); ctx.lineTo(4, 0); ctx.lineTo(-12, 10)
      ctx.stroke()
      ctx.restore()
    }
  }
  ctx.restore()
}

export function drawGuides (ctx, lawn, t) {
  ctx.save()
  ctx.setLineDash([18, 16])
  ctx.lineDashOffset = -t * 26
  ctx.strokeStyle = 'rgba(255,255,255,.85)'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  polygonPath(ctx, lawn)
  ctx.stroke()
  ctx.restore()
}

// ------------------------------------------------------------------ sommerfugle

const WING = ['#ffd166', '#ff8fab', '#8ef0ff']

export function drawButterflies (ctx, list, t) {
  list.forEach((b, index) => {
    if (b.state === 'gone' || b.state === 'waiting') return
    const flap = Math.abs(Math.sin(t * (b.state === 'leaving' ? 16 : 5) + b.phase))
    const lift = b.state === 'leaving' ? b.timer * 90 : Math.sin(t * 1.6 + b.phase) * 3
    const alpha = b.state === 'leaving' ? clamp(1 - b.timer / 1.2, 0, 1) : 1
    const color = WING[index % WING.length]
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(b.x, b.y - lift)
    ctx.rotate(Math.sin(t * 1.2 + b.phase) * 0.2)
    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(60,40,20,.55)'
    ctx.lineWidth = 1.5
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.scale(side * (0.35 + flap * 0.65), 1)
      ctx.beginPath()
      ctx.ellipse(7, -3, 8, 6, -0.3, 0, TAU)
      ctx.fill(); ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(6, 5, 6, 5, 0.3, 0, TAU)
      ctx.fill(); ctx.stroke()
      ctx.restore()
    }
    ctx.fillStyle = '#4a3b2f'
    ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 7, 0, 0, TAU); ctx.fill()
    ctx.restore()
  })
  ctx.globalAlpha = 1
}

// ------------------------------------------------------------------ maskine

export function drawMachine (ctx, { machine, x, y, heading, mood, shake, blade, bladeSpin, lights, t, hornWave }) {
  const img = getImage(machine, mood)
  const sx = shake > 0 ? (Math.random() - 0.5) * 8 : 0
  const sy = shake > 0 ? (Math.random() - 0.5) * 8 : 0
  ctx.save()
  ctx.translate(x + sx, y + sy)
  ctx.fillStyle = 'rgba(0,0,0,.22)'
  ctx.beginPath(); ctx.ellipse(2, 6, DRAW_W * 0.5, DRAW_H * 0.42, 0, 0, TAU); ctx.fill()
  ctx.rotate(heading)
  if (blade) {
    ctx.save()
    ctx.rotate(bladeSpin)
    ctx.fillStyle = 'rgba(255,255,255,.16)'
    ctx.beginPath(); ctx.arc(0, 0, blade, 0, TAU); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.35)'
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(0, 0, blade, 0, TAU); ctx.stroke()
    ctx.restore()
  }
  if (img) {
    ctx.drawImage(img, -DRAW_W / 2, -DRAW_H / 2, DRAW_W, DRAW_H)
  } else {
    ctx.fillStyle = '#f97316'
    ctx.beginPath(); ctx.roundRect(-DRAW_W / 2, -DRAW_H / 2, DRAW_W, DRAW_H, 12); ctx.fill()
  }
  if (lights && Math.sin(t * 9) > 0) {
    ctx.fillStyle = 'rgba(255,220,110,.85)'
    for (const oy of [-9.6, 9.6]) {
      ctx.beginPath(); ctx.arc(12, oy, 9, 0, TAU); ctx.fill()
    }
  }
  ctx.restore()
  if (hornWave > 0) {
    ctx.save()
    ctx.strokeStyle = `rgba(255,255,255,${hornWave})`
    ctx.lineWidth = 4
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath()
      ctx.arc(x, y, 30 + k * 16 + (0.6 - hornWave) * 40, 0, TAU)
      ctx.stroke()
    }
    ctx.restore()
  }
}

// ------------------------------------------------------------------ hjaelp og stjerner

export function drawHelpHand (ctx, points, t) {
  let x
  let y
  if (points.length === 1) {
    x = points[0][0]; y = points[0][1]
  } else {
    const total = polylineLength(points)
    const along = (t * 220) % total
    let acc = 0
    x = points[0][0]; y = points[0][1]
    for (let i = 1; i < points.length; i++) {
      const seg = dist(points[i - 1], points[i])
      if (acc + seg >= along) {
        const f = (along - acc) / seg
        x = lerp(points[i - 1][0], points[i][0], f)
        y = lerp(points[i - 1][1], points[i][1], f)
        break
      }
      acc += seg
    }
  }
  const pulse = 0.5 + 0.5 * Math.sin(t * 6)
  ctx.save()
  ctx.strokeStyle = `rgba(255,255,255,${0.75 - pulse * 0.35})`
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.arc(x, y, 26 + pulse * 16, 0, TAU); ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,.45)'
  ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill()
  ctx.translate(x, y + 6)
  ctx.scale(1.6, 1.6)
  ctx.fillStyle = 'rgba(0,0,0,.28)'
  ctx.beginPath(); ctx.ellipse(2, 24, 13, 5, 0, 0, TAU); ctx.fill()
  ctx.fillStyle = '#ffdbb0'
  ctx.strokeStyle = '#7a4a25'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.roundRect(-11, -2, 22, 26, 10); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.roundRect(-6, -24, 12, 24, 6); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.roundRect(-13, 4, 9, 15, 4.5); ctx.fill(); ctx.stroke()
  ctx.restore()
}

export function drawStarRow (ctx, shown, { width, y = 250, total = 3 }) {
  for (let i = 0; i < total; i++) {
    const lit = i < shown
    ctx.save()
    ctx.translate(width / 2 + (i - 1) * 110, y)
    if (lit) ctx.scale(1.15, 1.15)
    ctx.beginPath()
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 24 : 52
      const a = (k / 10) * TAU - Math.PI / 2
      const px = Math.cos(a) * r
      const py = Math.sin(a) * r
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
    }
    ctx.closePath()
    ctx.fillStyle = lit ? '#ffc300' : 'rgba(0,0,0,.25)'
    ctx.strokeStyle = lit ? '#b8860b' : 'rgba(0,0,0,.2)'
    ctx.lineWidth = 6
    ctx.fill(); ctx.stroke()
    ctx.restore()
  }
}
