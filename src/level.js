// En bane: (tegn ledning ->) koer og klip alt graesset -> koer selv hjem.
// Spilplan 9.4/9.5 + spilplan-niveau-2.md fase 4.

import {
  pointInPolygon, dist, polylineLength, closestPointOnPolygon, distToShape,
  pointInShape, segmentHitsShape, shapePolygon, polygonCentroid,
  clamp, lerp, angleDelta, makeRandom, closestPointOnSegment, TAU
} from './geometry.js'
import { sfx, engine, ambience, say, sayText, forgetSaid } from './audio.js'
import * as save from './save.js'
import { stats, BASE_SPEED, AUTO_SPEED, has } from './machine.js'
import { createDrawInput, createJoystick, createKeyboard, LOGICAL_W, LOGICAL_H } from './input.js'
import { createConfetti, prefersReducedMotion } from './confetti.js'
import { el, iconButton, ICONS } from './ui.js'
import { firstSentence } from './voice-lines.js'
import { bubble } from './guide.js'
import {
  CELL, GRID_W, GRID_H, cellX, cellY, createGrid, computeMowable, findRoute, paintLawn, paintCut
} from './grid.js'
import * as render from './render.js'
import { createCritters } from './critters.js'

const WIRE_START_RADIUS = 60
const WIRE_CLOSE_RADIUS = 50
const WIRE_MIN_LENGTH = 400
const WIRE_STEP = 6
const SNAP_RADIUS = 60
const SNAP_SHARE = 0.8
const APPROVE_SHARE = 0.6
const ISLAND_START_RADIUS = 60
const ISLAND_CLOSE_RADIUS = 40
const ISLAND_MIN_LENGTH = 100
const ISLAND_SNAP_RADIUS = 40
const ISLAND_SNAP_SHARE = 0.7
const MACHINE_RADIUS = 14
const HELP_AFTER = 45          // fase 4: barnet skal selv naa at lede
const BUTTERFLIES = 3
const BUTTERFLY_REACH = 42
const BUTTERFLY_FIRST = 5      // foerste sommerfugl kommer efter 5 sek. koersel
const BUTTERFLY_GAP = 16       // og saa en ny hvert 16. sekund
const BUTTERFLY_STAY = 26      // og flyver videre af sig selv - de er pynt, ikke point
const HOME_RADIUS = 40
const GLOW_FROM = 0.9          // de sidste pletter lyser, saa de kan findes
const PROGRESS_STALL = 25      // sek. uden nyt klip -> hjaelpen viser vej

export { CELL, GRID_W, GRID_H }

export async function loadLevelData (id) {
  const file = typeof id === 'number' || /^\d+$/.test(String(id)) ? `level${id}` : String(id)
  const res = await fetch(`src/levels/${file}.json`)
  if (!res.ok) throw new Error('kunne ikke hente bane ' + id)
  return res.json()
}

export async function createLevel (app, number, opts = {}) {
  const data = await loadLevelData(number)
  const isSchool = typeof number !== 'number'
  const returnTo = opts.returnTo || (isSchool ? 'school' : 'map')
  const machine = app.machine
  const spec = stats(machine)
  const lawn = data.lawn
  const islands = data.islands || []
  const hazards = data.hazards || []
  const blocked = data.blocked || []
  const station = [data.station.x, data.station.y]
  const centre = polygonCentroid(lawn)
  const reduced = prefersReducedMotion()
  const drawingEnabled = app.drawingEnabled === true

  // ------------------------------------------------------------ gitter
  const { grass, grassCount } = createGrid(lawn, islands)
  const inWireMask = new Uint8Array(GRID_W * GRID_H)
  const cutMask = new Uint8Array(GRID_W * GRID_H)
  let mowable = new Uint8Array(GRID_W * GRID_H)
  let standable = new Uint8Array(GRID_W * GRID_H)
  let mowableCount = 0
  let cutCount = 0

  // ------------------------------------------------------------ tilstand
  const state = {
    number,
    name: data.name,
    phase: drawingEnabled ? 'wire' : 'drive', // wire | island | ready | drive | done
    progress: 0,
    wireClosed: false,
    allCut: false,
    stars: 0,
    butterflies: 0,
    auto: false,
    battery: null,
    station,
    islandsDone: 0,
    islandsTotal: islands.length
  }

  let wire = []
  let wirePoly = null
  let drawingWire = false
  let snapAnim = null
  let blockedFlash = null
  let ring = []
  let drawingRing = false
  const islandRings = []
  let islandIndex = 0

  let idle = 0
  let help = null
  let clock = 0
  let bladeSpin = 0
  let beepCooldown = 0
  let pegLength = 0

  const mob = { x: station[0], y: station[1], heading: 0, mood: 'idle' }
  let dock = [station[0], station[1]]
  let lastDry = [station[0], station[1]]
  let shake = 0
  let autoDir = { x: 1, y: 0 }
  let script = null // { mode: 'return' | 'leave', path: [...] }
  let charge = 0
  let saidHalf = false
  let usedAutoAfterAllCut = false
  let usedAutoEver = false
  let sinceProgress = 0
  let lastCutCount = 0
  let lightsOn = false
  let hornWave = 0

  const butterflies = []
  const critters = createCritters(data)
  let driveTime = 0
  const confetti = createConfetti()
  let starShow = { shown: 0, timer: 0 }

  // ------------------------------------------------------------ offscreen
  const bg = document.createElement('canvas')
  bg.width = LOGICAL_W; bg.height = LOGICAL_H
  const bgc = bg.getContext('2d')
  render.paintBackground(bgc, { number, lawn, blocked, width: LOGICAL_W, height: LOGICAL_H })

  const grassLayer = document.createElement('canvas')
  grassLayer.width = LOGICAL_W; grassLayer.height = LOGICAL_H
  const gc = grassLayer.getContext('2d')
  paintLawn(gc, lawn)

  // ------------------------------------------------------------ DOM
  const root = el('div', { class: 'screen' })
  const bar = el('i')
  const barBox = el('div', { class: 'bar' }, bar)
  const batteryFill = el('i')
  const batteryBox = el('div', { class: 'battery' }, batteryFill)
  const hud = el('div', { class: 'hud' },
    el('span', { class: 'icon', html: ICONS.grass }), barBox)
  if (data.battery) hud.append(batteryBox)
  root.append(hud)

  const backBtn = iconButton({
    icon: 'back', x: 62, y: 62, label: 'tilbage til kortet',
    onClick: () => { sfx.tap(); app.go('map') }
  })
  const helpBtn = iconButton({
    icon: 'bulb', class: 'warn', x: 898, y: 62, label: 'hjælp',
    onClick: () => { sfx.tap(); showHelp(true) }
  })
  root.append(backBtn, helpBtn)

  const goBtn = iconButton({
    icon: 'play', class: 'go', x: 480, y: 505, label: 'kør',
    onClick: () => startDrive(true)
  })
  goBtn.hidden = true
  root.append(goBtn)

  const autoBtn = iconButton({ icon: 'robot', x: 898, y: 520, label: 'kør selv', onClick: () => toggleAuto() })
  autoBtn.hidden = true
  root.append(autoBtn)

  let hornBtn = null
  let lightBtn = null
  if (has(machine, 'horn')) {
    hornBtn = iconButton({
      icon: 'horn', x: 790, y: 520, label: 'horn',
      onClick: () => { sfx.horn(); hornWave = 0.6; touched() }
    })
    hornBtn.hidden = true
    root.append(hornBtn)
  }
  if (has(machine, 'lights')) {
    lightBtn = iconButton({
      icon: 'lights', x: hornBtn ? 682 : 790, y: 520, label: 'blinklys',
      onClick: () => {
        lightsOn = !lightsOn
        lightBtn.classList.toggle('on', lightsOn)
        sfx.blinker()
        touched()
      }
    })
    lightBtn.hidden = true
    root.append(lightBtn)
  }

  const nextBtn = iconButton({ icon: 'map', class: 'go', x: 480, y: 470, label: 'videre', onClick: leave })
  nextBtn.hidden = true
  root.append(nextBtn)

  // ------------------------------------------------------------ input
  const drawInput = drawingEnabled
    ? createDrawInput(app.canvas, {
      start: p => { touched(); onDown(p) },
      move: p => { touched(); onMove(p) },
      end: () => { drawingWire = false; drawingRing = false }
    })
    : null
  const joystick = createJoystick(app.stage, app.joystick, () => { touched(); if (state.auto) toggleAuto(false) })
  const keys = createKeyboard(() => { touched(); if (state.auto) toggleAuto(false) })

  function touched () { idle = 0; if (help && help.manual !== true) help = null }
  function nudgeHelp (seconds) { idle = Math.max(idle, HELP_AFTER - seconds) }

  // ------------------------------------------------------------ tegn-fase

  function hitsForbidden (a, b) {
    for (const bl of blocked) if (segmentHitsShape(a, b, bl)) return 'blocked'
    for (const isl of islands) if (segmentHitsShape(a, b, isl)) return 'island'
    return null
  }

  function onDown (p) {
    if (state.phase === 'wire') {
      if (state.wireClosed || snapAnim) return
      if (wire.length === 0) {
        if (dist(p, station) <= WIRE_START_RADIUS) {
          wire = [[station[0], station[1]]]
          drawingWire = true
          pegLength = 0
          sfx.peg()
        } else nudgeHelp(5)
        return
      }
      if (dist(p, wire[wire.length - 1]) <= WIRE_START_RADIUS) drawingWire = true
      else nudgeHelp(5)
      return
    }
    if (state.phase === 'island') {
      const isl = islands[islandIndex]
      if (!isl) return
      if (ring.length === 0) {
        if (distToShape(p, isl) <= ISLAND_START_RADIUS) {
          ring = [p]
          drawingRing = true
          sfx.peg()
        } else nudgeHelp(5)
        return
      }
      if (dist(p, ring[ring.length - 1]) <= ISLAND_START_RADIUS) drawingRing = true
      else nudgeHelp(5)
    }
  }

  function onMove (p) {
    if (state.phase === 'wire' && drawingWire && !state.wireClosed && !snapAnim) {
      const last = wire[wire.length - 1]
      if (dist(p, last) < WIRE_STEP) return
      if (hitsForbidden(last, p)) {
        blockedFlash = { a: last, b: p, t: 1 }
        sfx.nope()
        say('wire.blocked')
        drawingWire = false
        while (wire.length > 1 && [...blocked, ...islands].some(s => pointInShape(wire[wire.length - 1], s))) wire.pop()
        return
      }
      pegLength += dist(p, last)
      wire.push(p)
      if (pegLength > 40) { pegLength = 0; sfx.peg() }
      if (polylineLength(wire) > WIRE_MIN_LENGTH && dist(p, station) <= WIRE_CLOSE_RADIUS && wire.length > 4) closeWire()
      return
    }
    if (state.phase === 'island' && drawingRing) {
      const last = ring[ring.length - 1]
      if (dist(p, last) < WIRE_STEP) return
      pegLength += dist(p, last)
      ring.push(p)
      if (pegLength > 40) { pegLength = 0; sfx.peg() }
      if (polylineLength(ring) > ISLAND_MIN_LENGTH && dist(p, ring[0]) <= ISLAND_CLOSE_RADIUS && ring.length > 4) {
        closeRing(islands[islandIndex])
      }
    }
  }

  function shareNear (points, poly, radius) {
    if (!points.length) return 0
    let n = 0
    for (const p of points) if (closestPointOnPolygon(p, poly).dist <= radius) n++
    return n / points.length
  }

  function grassInside (poly) {
    let n = 0
    for (let j = 0; j < GRID_H; j++) {
      for (let i = 0; i < GRID_W; i++) {
        if (!grass[j * GRID_W + i]) continue
        if (pointInPolygon([cellX(i), cellY(j)], poly)) n++
      }
    }
    return n
  }

  function closeWire () {
    drawingWire = false
    const snaps = shareNear(wire, lawn, SNAP_RADIUS) >= SNAP_SHARE
    const finalPoly = snaps ? lawn.map(p => [p[0], p[1]]) : wire.map(p => [p[0], p[1]])
    const inside = grassInside(finalPoly)
    if (grassCount === 0 || inside / grassCount < APPROVE_SHARE) {
      sfx.nope()
      say('wire.tooSmall', {}, { force: true })
      wire = []
      return
    }
    state.wireClosed = true
    sfx.snap()
    say('wire.closed', {}, { force: true })
    if (snaps && !reduced) {
      snapAnim = {
        t: 0,
        from: wire.map(p => [p[0], p[1]]),
        to: wire.map(p => closestPointOnPolygon(p, lawn).point),
        final: finalPoly
      }
    } else applyWire(finalPoly)
  }

  /** Laegger ledningen fast og regner ud hvad der kan naas at klippe. */
  function applyWire (poly, advance = true) {
    wire = poly
    wirePoly = poly
    inWireMask.fill(0)
    for (let j = 0; j < GRID_H; j++) {
      for (let i = 0; i < GRID_W; i++) {
        const k = j * GRID_W + i
        if (grass[k] && pointInPolygon([cellX(i), cellY(j)], poly)) inWireMask[k] = 1
      }
    }
    dock = freeSpot([
      station[0] + (centre[0] - station[0]) * 0.12,
      station[1] + (centre[1] - station[1]) * 0.12
    ])
    const result = computeMowable({
      grass,
      inWire: inWireMask,
      canBeAt: (x, y) => machineFits(x, y, true),
      start: dock,
      cutRadius: spec.cutRadius
    })
    mowable = result.mowable
    standable = result.standable
    mowableCount = result.mowableCount
    placeButterflies()
    if (!advance) { idle = 0; return }
    if (islands.length) {
      state.phase = 'island'
      islandIndex = 0
      say('island.start', {}, { force: true })
    } else readyToDrive()
    idle = 0
  }

  function closeRing (isl) {
    drawingRing = false
    const outline = shapePolygon(isl)
    const snaps = shareNear(ring, outline, ISLAND_SNAP_RADIUS) >= ISLAND_SNAP_SHARE
    const finalRing = snaps ? outline.map(p => [p[0], p[1]]) : ring.map(p => [p[0], p[1]])
    const seed = isl.shape === 'circle' ? [isl.x, isl.y] : polygonCentroid(outline)
    if (!pointInPolygon(seed, finalRing)) {
      sfx.nope()
      say('island.start', {}, { force: true })
      ring = []
      return
    }
    islandRings.push(finalRing)
    ring = []
    sfx.snap()
    islandIndex++
    state.islandsDone = islandIndex
    if (islandIndex >= islands.length) {
      say('island.done', {}, { force: true })
      readyToDrive()
    } else say('island.start', {}, { force: true })
    idle = 0
  }

  function readyToDrive () {
    state.phase = 'ready'
    goBtn.hidden = false
    say('drive.start', { navn: machine.name }, { force: true })
    idle = 0
  }

  // ------------------------------------------------------------ sommerfugle

  /**
   * Sommerfuglene kommer en ad gangen og bliver kun et stykke tid.
   * De skal fanges - ellers ville de blive samlet op af sig selv, naar
   * hele plaenen alligevel bliver klippet, og den tredje stjerne var gratis.
   */
  function placeButterflies () {
    butterflies.length = 0
    const rnd = makeRandom(number * 2654435761 + 7)
    const spots = []
    for (let j = 0; j < GRID_H; j++) {
      for (let i = 0; i < GRID_W; i++) {
        const k = j * GRID_W + i
        if (!mowable[k]) continue
        const p = [cellX(i), cellY(j)]
        if (dist(p, station) < 110) continue
        spots.push(p)
      }
    }
    if (!spots.length) return
    const chosen = []
    let guard = 0
    while (chosen.length < BUTTERFLIES && guard++ < 500) {
      const p = spots[(rnd() * spots.length) | 0]
      if (chosen.some(c => dist(c, p) < 150)) continue
      chosen.push(p)
    }
    while (chosen.length < BUTTERFLIES) chosen.push(spots[(rnd() * spots.length) | 0])
    chosen.forEach((p, i) => {
      butterflies.push({
        home: p,
        x: p[0],
        y: p[1],
        state: 'waiting',
        spawnAt: BUTTERFLY_FIRST + i * BUTTERFLY_GAP,
        timer: 0,
        phase: rnd() * TAU
      })
    })
  }

  function updateButterflies (dt) {
    for (const b of butterflies) {
      if (b.state === 'waiting') {
        if (driveTime >= b.spawnAt) {
          b.state = 'sitting'
          b.timer = 0
          confetti.sparkle(b.x, b.y, 10)
          sfx.butterfly()
        }
        continue
      }
      if (b.state === 'sitting') {
        b.timer += dt
        // den flagrer lidt rundt, saa den er levende at fange
        b.x = b.home[0] + Math.sin(clock * 0.9 + b.phase) * 26
        b.y = b.home[1] + Math.cos(clock * 1.3 + b.phase) * 18
        if (b.timer >= BUTTERFLY_STAY) { b.state = 'leaving'; b.timer = 0 }
        continue
      }
      if (b.state === 'leaving') {
        b.timer += dt
        if (b.timer > 1.2) b.state = 'gone'
      }
    }
  }

  function checkButterflies () {
    for (const b of butterflies) {
      if (b.state !== 'sitting') continue
      if (dist([b.x, b.y], [mob.x, mob.y]) > BUTTERFLY_REACH) continue
      b.state = 'leaving'
      b.timer = 0
      b.caught = true
      state.butterflies++
      confetti.sparkle(b.x, b.y, 22)
      sfx.butterfly()
      say('drive.butterfly', {}, { force: true })
    }
  }

  /** Den sommerfugl der er fremme lige nu, hvis der er en. */
  function activeButterfly () {
    return butterflies.find(b => b.state === 'sitting') || null
  }

  // ------------------------------------------------------------ koer-fase

  function machineFits (x, y, avoidHazards) {
    if (!wirePoly) return false
    const pts = [[x, y], [x + MACHINE_RADIUS, y], [x - MACHINE_RADIUS, y], [x, y + MACHINE_RADIUS], [x, y - MACHINE_RADIUS]]
    for (const p of pts) {
      if (!pointInPolygon(p, wirePoly)) return false
      for (const r of islandRings) if (pointInPolygon(p, r)) return false
    }
    if (avoidHazards) for (const h of hazards) if (pointInShape([x, y], h)) return false
    return true
  }

  const canBeAt = (x, y) => machineFits(x, y, state.auto)

  function freeSpot (from) {
    for (let r = 0; r <= 140; r += 6) {
      if (r === 0) {
        if (machineFits(from[0], from[1], true)) return from
        continue
      }
      for (let a = 0; a < TAU; a += TAU / 24) {
        const p = [from[0] + Math.cos(a) * r, from[1] + Math.sin(a) * r]
        if (machineFits(p[0], p[1], true)) return p
      }
    }
    return from
  }

  function startDrive (fromButton) {
    if (fromButton) sfx.tap()
    goBtn.hidden = true
    autoBtn.hidden = false
    if (hornBtn) hornBtn.hidden = false
    if (lightBtn) lightBtn.hidden = false
    state.phase = 'drive'
    mob.x = dock[0]
    mob.y = dock[1]
    mob.heading = Math.atan2(centre[1] - mob.y, centre[0] - mob.x)
    mob.mood = 'happy'
    lastDry = [mob.x, mob.y]
    autoDir = { x: Math.cos(mob.heading), y: Math.sin(mob.heading) }
    joystick.enable()
    engine.start()
    ambience.start({ birds: true, water: hazards.length > 0 })
    if (data.battery) {
      const seconds = data.battery.seconds * spec.batteryMul
      state.battery = { max: seconds, left: seconds, mode: 'ok' }
    }
    idle = 0
  }

  function toggleAuto (value) {
    const next = value === undefined ? !state.auto : !!value
    if (next === state.auto) return
    state.auto = next
    autoBtn.classList.toggle('on', state.auto)
    if (state.auto) {
      usedAutoEver = true
      if (state.allCut) usedAutoAfterAllCut = true
      sfx.pop()
      say('drive.auto', { navn: machine.name })
      autoDir = { x: Math.cos(mob.heading), y: Math.sin(mob.heading) }
    }
    idle = 0
  }

  function inPond (x, y) {
    for (const h of hazards) if (pointInShape([x, y], h)) return h
    return null
  }

  function hillFactor (dx, dy) {
    if (!data.hill) return 1
    if (!pointInPolygon([mob.x, mob.y], data.hill.polygon)) return 1
    const u = data.hill.uphill
    const d = dx * u[0] + dy * u[1]
    if (d > 0.05) return spec.hill
    if (d < -0.05) return 1.2
    return 1
  }

  function cutAround (x, y) {
    const r = spec.cutRadius
    const i0 = Math.max(0, Math.floor((x - r) / CELL))
    const i1 = Math.min(GRID_W - 1, Math.floor((x + r) / CELL))
    const j0 = Math.max(0, Math.floor((y - r) / CELL))
    const j1 = Math.min(GRID_H - 1, Math.floor((y + r) / CELL))
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const k = j * GRID_W + i
        if (!mowable[k] || cutMask[k]) continue
        const dx = cellX(i) - x
        const dy = cellY(j) - y
        if (dx * dx + dy * dy > r * r) continue
        cutMask[k] = 1
        cutCount++
        paintCut(gc, i, j)
      }
    }
  }

  function pathFrom (points, from) {
    let bestI = 0
    let bestP = points[0]
    let bestD = Infinity
    for (let i = 1; i < points.length; i++) {
      const c = closestPointOnSegment(from, points[i - 1], points[i])
      const d = dist(from, c)
      if (d < bestD) { bestD = d; bestP = c; bestI = i }
    }
    return [bestP, ...points.slice(bestI)]
  }

  function startReturn () {
    state.battery.mode = 'returning'
    mob.mood = 'sleepy'
    sfx.sleepy()
    say('drive.batteryLow', { navn: machine.name }, { force: true })
    joystick.disable()
    toggleAuto(false)
    const guide = data.battery.guidePath && data.battery.guidePath.length
      ? pathFrom(data.battery.guidePath, [mob.x, mob.y])
      : []
    script = { mode: 'return', path: [...guide, [station[0], station[1]]] }
  }

  function allCutNow () {
    state.allCut = true
    usedAutoAfterAllCut = state.auto
    sfx.allCut()
    app.guide.say('guide.allCut', {}, { icon: bubble.emoji('🔋') })
    setTimeout(() => { if (!destroyed && state.phase === 'drive') app.guide.point(station[0]) }, 1200)
    barBox.classList.add('full')
    idle = 0
    const path = helpPath()
    if (path) help = { ...path, t: 0, life: 8, manual: false }
  }

  function finished () {
    state.phase = 'done'
    engine.stop()
    ambience.stop()
    joystick.disable()
    mob.mood = 'happy'
    mob.x = station[0]
    mob.y = station[1]
    // 1: alt klippet - 2: selv koert hjem - 3: hele banen uden robot-knappen
    state.stars = 1 + (usedAutoAfterAllCut ? 0 : 1) + (usedAutoEver ? 0 : 1)
    confetti.burst(station[0], station[1], 140)
    confetti.rain(LOGICAL_W, 70)
    sfx.fanfare()
    app.guide.say('done', { navn: machine.name }, { icon: bubble.emoji('⭐'), sticky: true })
    setTimeout(() => { if (!destroyed) app.guide.cheer() }, 600)
    starShow = { shown: 0, timer: 0.5 }
    if (isSchool) {
      const earned = save.recordSchool(number)
      save.bumpToday(data.letter ? 'letters' : 'mazes')
      if (data.letter) {
        const word = data.word || ''
        // ordet staar stort med et billede, og oplaeseren staver det
        root.append(el('div', { class: 'word-card' },
          el('span', { class: 'word-emoji' }, data.emoji || ''),
          el('span', { class: 'word-text' },
            el('b', {}, data.letter), word.slice(1))))
        say('school.letter', { bogstav: data.letter, ord: word }, { force: true })
        setTimeout(() => sayText(word.toUpperCase().split('').join(', ') + '.', { force: true }), 2600)
      } else if (earned) {
        say('school.sticker', {}, { force: true })
      }
    } else {
      save.recordStars(number, state.stars)
    }
    nextBtn.hidden = false
    autoBtn.hidden = true
    if (hornBtn) hornBtn.hidden = true
    if (lightBtn) lightBtn.hidden = true
    idle = 0
  }

  function leave () {
    sfx.tap()
    if (!isSchool && number === save.LEVEL_COUNT && save.allDone()) app.go('master')
    else app.go(returnTo)
  }

  function unstick () {
    if (machineFits(mob.x, mob.y, true)) return
    const spot = freeSpot([mob.x, mob.y])
    mob.x = spot[0]
    mob.y = spot[1]
    lastDry = [mob.x, mob.y]
  }

  function bump () {
    if (beepCooldown > 0) return
    beepCooldown = 0.5
    sfx.beep()
  }

  function turnAway () {
    const a = Math.atan2(autoDir.y, autoDir.x)
    const spread = Math.PI / 2 + Math.random() * Math.PI // 90-270 grader
    const b = a + (Math.random() < 0.5 ? spread : -spread)
    autoDir = { x: Math.cos(b), y: Math.sin(b) }
  }

  function splash () {
    sfx.splash()
    say('drive.pond', {}, { force: true })
    shake = 0.8
    mob.x = lastDry[0]
    mob.y = lastDry[1]
    if (state.auto) turnAway()
  }

  function stepMachine (dt, dirX, dirY, speed) {
    unstick()
    if (speed <= 0) return
    const move = speed * dt
    const steps = Math.max(1, Math.ceil(move / 4))
    const sub = move / steps
    for (let s = 0; s < steps; s++) {
      const nx = mob.x + dirX * sub
      const ny = mob.y + dirY * sub
      if (canBeAt(nx, ny)) {
        mob.x = nx; mob.y = ny
      } else if (canBeAt(nx, mob.y)) {
        mob.x = nx; bump()
      } else if (canBeAt(mob.x, ny)) {
        mob.y = ny; bump()
      } else {
        bump()
        if (state.auto) turnAway()
        break
      }
      if (inPond(mob.x, mob.y)) { splash(); break }
      lastDry = [mob.x, mob.y]
      cutAround(mob.x, mob.y)
      checkButterflies()
    }
  }

  function aim (target, dt) {
    const maxTurn = ((540 * Math.PI) / 180) * dt
    mob.heading += clamp(angleDelta(mob.heading, target), -maxTurn, maxTurn)
  }

  function followScript (dt) {
    const target = script.path[0]
    if (!target) {
      const mode = script.mode
      script = null
      if (mode === 'return') {
        state.battery.mode = 'charging'
        charge = 5
        sfx.charge()
      } else joystick.enable()
      return
    }
    const dx = target[0] - mob.x
    const dy = target[1] - mob.y
    const d = Math.hypot(dx, dy)
    if (d < 8) { script.path.shift(); return }
    const move = Math.min(d, AUTO_SPEED * spec.speed * dt)
    mob.x += (dx / d) * move
    mob.y += (dy / d) * move
    aim(Math.atan2(dy, dx), dt)
    cutAround(mob.x, mob.y)
    checkButterflies()
  }

  // ------------------------------------------------------------ hjaelp

  function nearestUncut () {
    let best = null
    let bestD = Infinity
    for (let j = 0; j < GRID_H; j++) {
      for (let i = 0; i < GRID_W; i++) {
        const k = j * GRID_W + i
        if (!mowable[k] || cutMask[k]) continue
        const d = (cellX(i) - mob.x) ** 2 + (cellY(j) - mob.y) ** 2
        if (d < bestD) { bestD = d; best = [cellX(i), cellY(j)] }
      }
    }
    return best
  }

  function helpPath () {
    if (state.phase === 'wire') {
      if (wire.length === 0) {
        const start = closestPointOnPolygon(station, lawn).point
        let bestI = 0
        let bestD = Infinity
        lawn.forEach((p, i) => {
          const d = dist(p, start)
          if (d < bestD) { bestD = d; bestI = i }
        })
        const out = [start]
        for (let k = 1; k <= lawn.length; k++) out.push(lawn[(bestI + k) % lawn.length])
        out.push(start)
        return { points: out, dashed: true }
      }
      return { points: [wire[wire.length - 1]], dashed: false }
    }
    if (state.phase === 'island') {
      const isl = islands[islandIndex]
      if (!isl) return null
      const outline = shapePolygon(isl)
      return { points: [...outline, outline[0]], dashed: true }
    }
    if (state.phase === 'ready') return { points: [[480, 505]], dashed: false }
    if (state.phase === 'drive') {
      const goal = state.allCut ? station : nearestUncut()
      if (!goal) return { points: [[mob.x, mob.y]], dashed: false }
      // vis hele vejen derhen - i en labyrint er et punkt ikke nok
      const route = findRoute(standable, [mob.x, mob.y], goal)
      return { points: route && route.length > 1 ? route : [goal], dashed: false }
    }
    return null
  }

  function showHelp (manual) {
    const path = helpPath()
    if (!path) return
    help = { ...path, t: 0, life: 9, manual: !!manual }
    idle = 0
    if (state.phase === 'wire') say(`level.intro.${number}`, {}, { force: true })
    else if (state.phase === 'island') say('island.start', {}, { force: true })
    else if (state.phase === 'ready') say('drive.start', { navn: machine.name }, { force: true })
    else if (state.phase === 'drive') {
      app.guide.say(state.allCut ? 'guide.allCut' : 'drive.stuck', { navn: machine.name },
        { icon: bubble.emoji(state.allCut ? '🔋' : '👉') })
      const target = path.points[path.points.length - 1]
      setTimeout(() => { if (!destroyed) app.guide.point(target[0]) }, 700)
    }
  }

  // ------------------------------------------------------------ loop

  function updateHud () {
    bar.style.width = Math.round(clamp(state.progress, 0, 1) * 100) + '%'
    if (state.battery) {
      const pct = clamp(state.battery.left / state.battery.max, 0, 1)
      batteryFill.style.width = Math.round(pct * 100) + '%'
      batteryBox.classList.toggle('low', pct < 0.25)
    }
  }

  function update (dt) {
    clock += dt
    bladeSpin += dt * 12
    if (beepCooldown > 0) beepCooldown -= dt
    if (shake > 0) shake -= dt
    if (hornWave > 0) hornWave -= dt
    confetti.update(dt)
    critters.update(dt, [mob.x, mob.y], clock)
    if (state.phase === 'drive') {
      driveTime += dt
      updateButterflies(dt)
      checkButterflies()
    }

    if (blockedFlash) {
      blockedFlash.t -= dt
      if (blockedFlash.t <= 0) blockedFlash = null
    }

    if (snapAnim) {
      snapAnim.t += dt / 0.5
      if (snapAnim.t >= 1) {
        const final = snapAnim.final
        snapAnim = null
        applyWire(final)
      }
    }

    if (help) {
      help.t += dt
      help.life -= dt
      if (help.life <= 0) help = null
    }

    if (state.phase !== 'done') {
      idle += dt
      if (idle > HELP_AFTER) showHelp(false)
    }

    if (state.phase === 'done') {
      if (starShow.shown < state.stars) {
        starShow.timer -= dt
        if (starShow.timer <= 0) {
          sfx.star(starShow.shown)
          starShow.shown++
          starShow.timer = 0.55
        }
      }
      return
    }

    if (state.phase !== 'drive') return

    const bat = state.battery
    if (bat && bat.mode === 'charging') {
      charge -= dt
      bat.left = Math.min(bat.max, bat.max * (1 - charge / 5))
      if (charge <= 0) {
        bat.mode = 'ok'
        bat.left = bat.max
        mob.mood = 'happy'
        sfx.pop()
        say('drive.charged', {}, { force: true })
        script = { mode: 'leave', path: [[dock[0], dock[1]]] }
      }
      updateHud()
      return
    }

    if (script) {
      followScript(dt)
      updateHud()
      return
    }

    let v = joystick.vector()
    if (v.mag === 0) v = keys.vector()
    if (v.mag > 0 && state.auto) toggleAuto(false)

    let dirX = 0
    let dirY = 0
    let speed = 0
    if (state.auto) {
      dirX = autoDir.x
      dirY = autoDir.y
      speed = AUTO_SPEED * spec.speed
    } else if (v.mag > 0) {
      dirX = v.x
      dirY = v.y
      speed = BASE_SPEED * v.mag * spec.speed
    }

    if (speed > 0) {
      speed *= hillFactor(dirX, dirY)
      stepMachine(dt, dirX, dirY, speed)
      aim(Math.atan2(dirY, dirX), dt)
      if (bat && bat.mode === 'ok') {
        bat.left -= dt
        if (bat.left <= 0) { bat.left = 0; startReturn() }
      }
      engine.setLevel(clamp(speed / BASE_SPEED, 0, 1))
    } else engine.setLevel(0)

    if (cutCount !== lastCutCount) {
      lastCutCount = cutCount
      sinceProgress = 0
    } else if (!state.allCut) {
      sinceProgress += dt
      if (sinceProgress > PROGRESS_STALL) { sinceProgress = 0; showHelp(false) }
    }
    state.progress = mowableCount ? cutCount / mowableCount : 0
    if (!saidHalf && state.progress >= 0.5) {
      saidHalf = true
      say('drive.half')
    }
    if (!state.allCut && mowableCount > 0 && cutCount >= mowableCount) allCutNow()
    // fase 4: barnet skal selv koere hjem - maskinen goer det aldrig af sig selv
    if (state.allCut && dist([mob.x, mob.y], station) <= HOME_RADIUS) finished()
    updateHud()
  }

  // ------------------------------------------------------------ tegning

  function draw (ctx) {
    ctx.drawImage(bg, 0, 0)
    ctx.drawImage(grassLayer, 0, 0)
    if (state.phase === 'drive' && !state.allCut && state.progress >= GLOW_FROM) {
      const pulse = 0.3 + 0.3 * Math.sin(clock * 5)
      ctx.fillStyle = `rgba(255, 225, 60, ${pulse})`
      ctx.strokeStyle = `rgba(255, 245, 160, ${pulse + 0.25})`
      ctx.lineWidth = 2
      for (let j = 0; j < GRID_H; j++) {
        for (let i = 0; i < GRID_W; i++) {
          const k = j * GRID_W + i
          if (!mowable[k] || cutMask[k]) continue
          ctx.fillRect(i * CELL - 2, j * CELL - 2, CELL + 4, CELL + 4)
          ctx.strokeRect(i * CELL - 2, j * CELL - 2, CELL + 4, CELL + 4)
        }
      }
    }
    render.drawAmbient(ctx, { number, lawn, t: clock, width: LOGICAL_W, height: LOGICAL_H, reduced })
    render.drawHill(ctx, data.hill)
    render.drawHazards(ctx, hazards, clock)
    render.drawIslands(ctx, islands, {
      activeIndex: state.phase === 'island' ? islandIndex : -1,
      t: clock
    })
    // haekke er faste i sig selv - de skal ikke have en ledning rundt om
    islandRings.forEach((r, i) => {
      if (islands[i] && islands[i].type === 'hedge') return
      render.drawWire(ctx, r, true)
    })

    const wantGuides = data.guideLines || (help && help.dashed)
    if (state.phase === 'wire' && wantGuides && !state.wireClosed) render.drawGuides(ctx, lawn, clock)

    if (snapAnim) {
      const t = snapAnim.t < 0.5 ? 2 * snapAnim.t * snapAnim.t : 1 - Math.pow(-2 * snapAnim.t + 2, 2) / 2
      render.drawWire(ctx, snapAnim.from.map((p, i) => [
        lerp(p[0], snapAnim.to[i][0], t),
        lerp(p[1], snapAnim.to[i][1], t)
      ]), true)
    } else if (wire.length > 1) {
      render.drawWire(ctx, wire, state.wireClosed)
    }
    if (ring.length > 1) render.drawWire(ctx, ring, false)

    if (blockedFlash) {
      ctx.strokeStyle = `rgba(229,72,77,${clamp(blockedFlash.t, 0, 1)})`
      ctx.lineWidth = 12
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(blockedFlash.a[0], blockedFlash.a[1])
      ctx.lineTo(blockedFlash.b[0], blockedFlash.b[1])
      ctx.stroke()
    }

    const blinkStation = (state.phase === 'wire' && wire.length === 0) || state.allCut
    render.drawStation(ctx, station, {
      pulse: blinkStation ? 0.5 + 0.5 * Math.sin(clock * 5) : 0
    })
    critters.draw(ctx)
    render.drawButterflies(ctx, butterflies, clock)

    if (state.phase === 'drive' || state.phase === 'done') {
      render.drawMachine(ctx, {
        machine,
        x: mob.x,
        y: mob.y,
        heading: mob.heading,
        mood: mob.mood,
        shake,
        blade: state.phase === 'drive' ? spec.cutRadius : 0,
        bladeSpin,
        lights: lightsOn,
        t: clock,
        hornWave
      })
    }

    if (help) render.drawHelpHand(ctx, help.points, help.t)
    if (state.phase === 'done') render.drawStarRow(ctx, starShow.shown, { width: LOGICAL_W })
    confetti.draw(ctx)
  }

  // ------------------------------------------------------------ opstart

  /** Ledningen ligger klar om plaenen, og bedene har allerede en ring. */
  function prelayWire () {
    state.wireClosed = true
    for (const isl of islands) islandRings.push(shapePolygon(isl).map(p => [p[0], p[1]]))
    state.islandsDone = islands.length
    applyWire(lawn.map(p => [p[0], p[1]]), false)
    startDrive(false)
  }

  let destroyed = false

  function destroy () {
    destroyed = true
    ambience.stop()
    drawInput?.destroy()
    joystick.destroy()
    keys.destroy()
    engine.stop()
    confetti.clear()
    root.remove()
  }

  // Testkroge: Playwright kan ikke aflaese et canvas.
  Object.defineProperties(state, {
    wirePoints: { get: () => wire.length, enumerable: true },
    drawing: { get: () => drawingWire || drawingRing, enumerable: true },
    grassCells: { get: () => grassCount, enumerable: true },
    insideCells: { get: () => mowableCount, enumerable: true },
    mowableCells: { get: () => mowableCount, enumerable: true },
    cutCells: { get: () => cutCount, enumerable: true },
    position: { get: () => [Math.round(mob.x), Math.round(mob.y)], enumerable: true },
    nearestUncut: { get: () => nearestUncut(), enumerable: true },
    routeHome: { get: () => findRoute(standable, [mob.x, mob.y], station), enumerable: true },
    routeTo: { value: target => findRoute(standable, [mob.x, mob.y], target), enumerable: false },
    butterflyCount: { get: () => butterflies.length, enumerable: true },
    usedAutoEver: { get: () => usedAutoEver, enumerable: true },
    sinceProgress: { get: () => sinceProgress, enumerable: true },
    butterflyActive: { get: () => { const b = activeButterfly(); return b ? [Math.round(b.x), Math.round(b.y)] : null }, enumerable: true }
  })

  if (drawingEnabled && !isSchool) {
    say(`level.intro.${number}`, {}, { force: true })
  } else {
    prelayWire()
    // Gro fortaeller hvad det her er for en have, og hvad man skal
    const guide = app.guide
    if (isSchool && data.letter) {
      root.append(el('div', { class: 'big-letter' }, data.letter))
      guide.say('guide.letter', { bogstav: data.letter }, { icon: bubble.letter(data.letter) })
    } else if (isSchool && data.maze) {
      guide.say('guide.maze', {}, { icon: bubble.emoji('🌿') })
    } else {
      guide.say('guide.level', { have: firstSentence(`level.intro.${number}`).replace(/^Her er /, '').replace(/[.!]$/, '') },
        { icon: bubble.svg(ICONS.grass) })
      const tip = `guide.tip.${number}`
      if (number >= 2 && number <= 5) {
        setTimeout(() => { if (!destroyed && state.phase === 'drive') guide.say(tip, {}, { icon: bubble.emoji(['', '', '🌸', '⛰️', '💦', '🔋'][number]) }) }, 5200)
      }
    }
  }
  forgetSaid('wire.blocked')
  updateHud()

  return {
    root,
    state,
    update: dt => { if (!destroyed) update(dt) },
    draw: ctx => { if (!destroyed) draw(ctx) },
    destroy
  }
}
