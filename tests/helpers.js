// Faelles hjaelpere til Playwright-testene.
import { expect } from '@playwright/test'

/** Bygger en spil-URL. Tests koerer altid uden intro, uden lyd og uden service worker. */
export function gameUrl (params = {}) {
  const q = new URLSearchParams({ skipIntro: '1', mute: '1', sw: '0', ...params })
  return '/index.html?' + q.toString()
}

/** Skolehavens baner hedder noget (maze1, letterL), ikke et nummer. */
export function schoolUrl (name, params = {}) {
  return gameUrl({ bane: name, ...params })
}

/** Aabner spillet, indlaeser testkit og opsamler konsolfejl. */
export async function openGame (page, params = {}) {
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(String(err)))
  await page.goto(gameUrl(params))
  await page.waitForFunction(() => !!window.__game)
  await page.addScriptTag({ url: '/tools/testkit.js' })
  return errors
}

/** Seeder localStorage foer spillet starter. */
export async function seedSave (page, data) {
  await page.addInitScript(save => {
    // version 1-formen bliver automatisk til spiller 1 naar spillet indlaeser
    localStorage.setItem('graesslaamaskine-spillet', JSON.stringify({
      version: 1, machine: null, stars: [0, 0, 0, 0, 0], muted: false, ...save
    }))
  }, data)
}

export function levelState (page) {
  return page.evaluate(() => {
    const l = window.__game.level
    if (!l) return null
    return {
      phase: l.phase,
      progress: l.progress,
      wireClosed: l.wireClosed,
      stars: l.stars,
      allCut: l.allCut,
      butterflies: l.butterflies,
      mowableCells: l.mowableCells,
      position: l.position,
      wirePoints: l.wirePoints,
      grassCells: l.grassCells,
      insideCells: l.insideCells,
      cutCells: l.cutCells,
      islandsDone: l.islandsDone,
      islandsTotal: l.islandsTotal,
      battery: l.battery ? { mode: l.battery.mode, left: Math.round(l.battery.left), max: Math.round(l.battery.max) } : null
    }
  })
}

/** Ledningsruten for en bane: fra ladestationen hele vejen rundt om plaenen. */
export async function lawnPath (page, n) {
  return page.evaluate(async number => {
    const d = await (await fetch(`src/levels/level${number}.json`)).json()
    const st = [d.station.x, d.station.y]
    const p = d.lawn
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < p.length; i++) {
      const a = p[(i - 1 + p.length) % p.length]
      const b = p[i]
      const abx = b[0] - a[0]
      const aby = b[1] - a[1]
      const len2 = abx * abx + aby * aby
      let t = len2 ? ((st[0] - a[0]) * abx + (st[1] - a[1]) * aby) / len2 : 0
      t = Math.max(0, Math.min(1, t))
      const cx = a[0] + abx * t
      const cy = a[1] + aby * t
      const dd = (cx - st[0]) ** 2 + (cy - st[1]) ** 2
      if (dd < bestD) { bestD = dd; best = i }
    }
    const out = [st]
    for (let k = 0; k < p.length; k++) out.push(p[(best + k) % p.length])
    out.push(st)
    return out
  }, n)
}

/** Tegner ledningen som en finger ville: pointerdown, mange pointermove, pointerup. */
export async function drawWire (page, points) {
  await page.evaluate(pts => window.__kit.drawPath(pts), points)
  await page.evaluate(() => window.__game.step(1))
}

/** Tegner en ring om en oe. */
export async function drawRing (page, cx, cy, r) {
  await page.evaluate(([x, y, rr]) => window.__kit.drawPath(window.__kit.circlePath(x, y, rr)), [cx, cy, r])
  await page.evaluate(() => window.__game.step(0.6))
}

/**
 * Trykker paa den store groenne Koer-knap. Uden tegnefasen (standard) er banen
 * allerede i gang, og saa goer den ingenting.
 */
export async function startDriving (page) {
  if (await page.evaluate(() => window.__game.level.phase) === 'drive') return
  await page.getByLabel('kør', { exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__game.level.phase)).toBe('drive')
}

/** Koerer med piletaster i rigtig tid (som et barn ville). */
export async function drive (page, dx, dy, ms) {
  const keys = []
  if (dx > 0) keys.push('ArrowRight')
  else if (dx < 0) keys.push('ArrowLeft')
  if (dy > 0) keys.push('ArrowDown')
  else if (dy < 0) keys.push('ArrowUp')
  for (const k of keys) await page.keyboard.down(k)
  await page.waitForTimeout(ms)
  for (const k of keys) await page.keyboard.up(k)
}

/** Klipper hele plaenen ved at koere mod naermeste uklippede celle. */
export async function mow (page, seconds = 700) {
  return page.evaluate(s => window.__kit.mow(s), seconds)
}

/** Koerer maskinen hjem til ladestationen - barnet skal selv goere det (fase 4). */
export async function driveHome (page, seconds = 80) {
  return page.evaluate(s => window.__kit.driveHome(s), seconds)
}

/** Klipper alt og koerer hjem. */
export async function playThrough (page, seconds = 900) {
  return page.evaluate(s => window.__kit.playThrough(s), seconds)
}

/** Lader spillet koere videre i simuleret tid uden at vente i rigtig tid. */
export async function step (page, seconds) {
  await page.evaluate(s => window.__game.step(s), seconds)
}

/**
 * Spiller en hel bane igennem og returnerer sluttilstanden.
 * opts.draw: banen er aabnet med ?draw=1, saa ledningen skal tegnes foerst.
 */
export async function playLevel (page, n, opts = {}) {
  if (opts.draw) {
    await drawWire(page, await lawnPath(page, n))
    for (const isl of opts.islands || []) await drawRing(page, isl.x, isl.y, isl.r + 15)
    await startDriving(page)
  }
  await playThrough(page, opts.budget || 900)
  await step(page, 10)
  return levelState(page)
}

/** Hvilket element ligger oeverst i et logisk punkt? Fanger overlays der daekker spillet. */
export function elementAt (page, lx, ly) {
  return page.evaluate(([x, y]) => {
    const r = document.getElementById('stage').getBoundingClientRect()
    const el = document.elementFromPoint(r.left + (x / 960) * r.width, r.top + (y / 600) * r.height)
    return el ? (el.id || el.className || el.tagName) : null
  }, [lx, ly])
}
