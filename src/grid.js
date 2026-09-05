// Celle-gitteret under plaenen: hvad er graes, hvad kan naas, hvad er klippet.
// 12 px celler i det logiske 960x600-laerred (spilplan 9.4).

import { pointInPolygon, pointInShape } from './geometry.js'

export const CELL = 12
export const GRID_W = 80
export const GRID_H = 50
export const CELL_COUNT = GRID_W * GRID_H

export const cellX = i => i * CELL + CELL / 2
export const cellY = j => j * CELL + CELL / 2
export const cellCenter = (i, j) => [cellX(i), cellY(j)]

/** En celle er graes, hvis dens centrum ligger i plaenen og uden for alle oeer. */
export function createGrid (lawn, islands) {
  const grass = new Uint8Array(CELL_COUNT)
  let grassCount = 0
  for (let j = 0; j < GRID_H; j++) {
    for (let i = 0; i < GRID_W; i++) {
      const c = cellCenter(i, j)
      let ok = pointInPolygon(c, lawn)
      if (ok) for (const isl of islands) if (pointInShape(c, isl)) { ok = false; break }
      if (ok) { grass[j * GRID_W + i] = 1; grassCount++ }
    }
  }
  return { grass, grassCount }
}

/**
 * Hvilke graesceller kan maskinen faktisk naa at klippe?
 *
 * 1. Find alle gitterpunkter hvor maskinen maa staa (canBeAt).
 * 2. Behold kun dem der haenger sammen med startpunktet - ellers kunne en
 *    afskaaret lomme goere banen umulig, og man skal aldrig kunne tabe.
 * 3. En celle er klippelig, hvis et af de punkter er inden for klipperadius.
 *
 * Returnerer { mowable, mowableCount }.
 */
export function computeMowable ({ grass, inWire, canBeAt, start, cutRadius }) {
  const standable = new Uint8Array(CELL_COUNT)
  for (let j = 0; j < GRID_H; j++) {
    for (let i = 0; i < GRID_W; i++) {
      if (canBeAt(cellX(i), cellY(j))) standable[j * GRID_W + i] = 1
    }
  }

  // bredde-foerst fra startpunktet, saa kun sammenhaengende omraade taeller med
  const reached = new Uint8Array(CELL_COUNT)
  const queue = []
  const seed = nearestStandable(standable, start)
  if (seed >= 0) { reached[seed] = 1; queue.push(seed) }
  for (let head = 0; head < queue.length; head++) {
    const k = queue[head]
    const i = k % GRID_W
    const j = (k / GRID_W) | 0
    if (i > 0) push(k - 1)
    if (i < GRID_W - 1) push(k + 1)
    if (j > 0) push(k - GRID_W)
    if (j < GRID_H - 1) push(k + GRID_W)
  }
  function push (k) {
    if (reached[k] || !standable[k]) return
    reached[k] = 1
    queue.push(k)
  }

  const mowable = new Uint8Array(CELL_COUNT)
  let mowableCount = 0
  const span = Math.ceil(cutRadius / CELL)
  const r2 = cutRadius * cutRadius
  for (const k of queue) {
    const pi = k % GRID_W
    const pj = (k / GRID_W) | 0
    const px = cellX(pi)
    const py = cellY(pj)
    for (let j = Math.max(0, pj - span); j <= Math.min(GRID_H - 1, pj + span); j++) {
      for (let i = Math.max(0, pi - span); i <= Math.min(GRID_W - 1, pi + span); i++) {
        const c = j * GRID_W + i
        if (mowable[c] || !grass[c] || !inWire[c]) continue
        const dx = cellX(i) - px
        const dy = cellY(j) - py
        if (dx * dx + dy * dy > r2) continue
        mowable[c] = 1
        mowableCount++
      }
    }
  }
  return { mowable, mowableCount, standable, reached }
}

/**
 * Korteste vej mellem to punkter hen over de felter maskinen maa staa paa.
 * Bruges af hjaelpe-haanden: i en labyrint er "stationen ligger derovre" ikke nok.
 */
export function findRoute (standable, from, to) {
  const start = nearestStandable(standable, from)
  const goal = nearestStandable(standable, to)
  if (start < 0 || goal < 0) return null
  const prev = new Int32Array(CELL_COUNT).fill(-1)
  const seen = new Uint8Array(CELL_COUNT)
  const queue = [start]
  seen[start] = 1
  for (let head = 0; head < queue.length; head++) {
    const k = queue[head]
    if (k === goal) break
    const i = k % GRID_W
    const j = (k / GRID_W) | 0
    const step = n => {
      if (seen[n] || !standable[n]) return
      seen[n] = 1
      prev[n] = k
      queue.push(n)
    }
    if (i > 0) step(k - 1)
    if (i < GRID_W - 1) step(k + 1)
    if (j > 0) step(k - GRID_W)
    if (j < GRID_H - 1) step(k + GRID_W)
  }
  if (!seen[goal]) return null
  const path = []
  for (let k = goal; k !== -1; k = prev[k]) {
    path.push([cellX(k % GRID_W), cellY((k / GRID_W) | 0)])
    if (k === start) break
  }
  path.reverse()
  // udtynd, saa haanden glider i stedet for at hakke fra celle til celle
  const out = path.filter((_, i) => i % 3 === 0)
  if (out[out.length - 1] !== path[path.length - 1]) out.push(path[path.length - 1])
  return out
}

function nearestStandable (standable, [x, y]) {
  const si = Math.min(GRID_W - 1, Math.max(0, Math.round((x - CELL / 2) / CELL)))
  const sj = Math.min(GRID_H - 1, Math.max(0, Math.round((y - CELL / 2) / CELL)))
  if (standable[sj * GRID_W + si]) return sj * GRID_W + si
  for (let r = 1; r < 20; r++) {
    for (let j = sj - r; j <= sj + r; j++) {
      for (let i = si - r; i <= si + r; i++) {
        if (i < 0 || j < 0 || i >= GRID_W || j >= GRID_H) continue
        if (Math.max(Math.abs(i - si), Math.abs(j - sj)) !== r) continue
        if (standable[j * GRID_W + i]) return j * GRID_W + i
      }
    }
  }
  return -1
}

/** Graessets farve. Klippede celler er lysere og faar en stribe. */
export function cellShade (i, j, cut) {
  const band = (Math.floor(j / 2) % 2) === 0
  const n = ((i * 73856093) ^ (j * 19349663)) >>> 0
  const jitter = (n % 7) - 3
  if (cut) return `hsl(${106 + jitter} 46% ${band ? 62 : 57}%)`
  return `hsl(${118 + jitter} 42% ${band ? 34 : 31}%)`
}

/** Smaa straa, saa graesset ikke er en flad flade. */
function blades (ctx, i, j, cut) {
  const n = ((i * 374761393) ^ (j * 668265263)) >>> 0
  const count = cut ? 1 : 2
  ctx.strokeStyle = cut ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.16)'
  ctx.lineWidth = cut ? 1 : 1.6
  ctx.lineCap = 'round'
  for (let k = 0; k < count; k++) {
    const seed = (n >> (k * 6)) & 63
    const x = i * CELL + 2 + (seed % 8)
    const y = j * CELL + 2 + ((seed >> 3) % 8)
    const h = cut ? 2.5 : 5 + (seed % 3)
    const lean = ((seed % 5) - 2) * 0.8
    ctx.beginPath()
    ctx.moveTo(x, y + h / 2)
    ctx.quadraticCurveTo(x + lean, y, x + lean * 1.6, y - h / 2)
    ctx.stroke()
  }
}

/** Maler hele plaenen med uklippet graes og klipper laget til plaenens form. */
export function paintLawn (ctx, lawn) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(lawn[0][0], lawn[0][1])
  for (let i = 1; i < lawn.length; i++) ctx.lineTo(lawn[i][0], lawn[i][1])
  ctx.closePath()
  ctx.clip()
  for (let j = 0; j < GRID_H; j++) {
    for (let i = 0; i < GRID_W; i++) {
      if (!pointInPolygon(cellCenter(i, j), lawn)) continue
      ctx.fillStyle = cellShade(i, j, false)
      ctx.fillRect(i * CELL, j * CELL, CELL + 1, CELL + 1)
    }
  }
  // klippet bliver liggende, saa alt der males herefter ogsaa holder sig til plaenen
}

export function paintCut (ctx, i, j) {
  ctx.fillStyle = cellShade(i, j, true)
  ctx.fillRect(i * CELL, j * CELL, CELL + 1, CELL + 1)
  ctx.strokeStyle = 'rgba(255,255,255,.22)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(i * CELL, j * CELL + CELL)
  ctx.lineTo(i * CELL + CELL, j * CELL)
  ctx.stroke()
  blades(ctx, i, j, true)
}
