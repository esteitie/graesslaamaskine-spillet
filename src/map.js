// Banekortet + voksen-panelet (spilplan afsnit 4 og 8).

import * as save from './save.js'
import { sfx, say, setMuted, isMuted } from './audio.js'
import { el, iconButton, holdButton, starRow, ICONS } from './ui.js'
import { makeRandom, TAU } from './geometry.js'

const SPOTS = [
  { x: 165, y: 430 },
  { x: 345, y: 248 },
  { x: 522, y: 442 },
  { x: 700, y: 244 },
  { x: 864, y: 428 }
]

const g = (inner) => `<svg viewBox="0 0 64 64">${inner}</svg>`
const LAWN = '#4fae5a'
const LAWN_DARK = '#2f7d32'

const GARDEN_ICON = [
  g(`<rect x="8" y="14" width="48" height="36" rx="8" fill="${LAWN}" stroke="${LAWN_DARK}" stroke-width="4"/>` +
    '<circle cx="32" cy="32" r="5" fill="#ffd166"/>'),
  g(`<rect x="6" y="14" width="52" height="36" rx="8" fill="${LAWN}" stroke="${LAWN_DARK}" stroke-width="4"/>` +
    '<circle cx="32" cy="32" r="11" fill="#7a4a25"/><circle cx="28" cy="29" r="4" fill="#ff6b9d"/>' +
    '<circle cx="36" cy="31" r="4" fill="#ffd166"/><circle cx="31" cy="37" r="4" fill="#c77dff"/>'),
  g(`<path d="M6 50 V20 h34 v14 h18 v16 Z" fill="${LAWN}" stroke="${LAWN_DARK}" stroke-width="4" stroke-linejoin="round"/>` +
    '<path d="M40 44 l10 -8 l-4 0 M50 36 l0 5" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
  g(`<path d="M6 14 h30 v10 h22 v26 H6 Z" fill="${LAWN}" stroke="${LAWN_DARK}" stroke-width="4" stroke-linejoin="round"/>` +
    '<ellipse cx="27" cy="38" rx="11" ry="8" fill="#4fb8e8" stroke="#2b7fb8" stroke-width="3"/>'),
  g(`<path d="M6 14 h18 v10 h16 V14 h18 v36 H40 V40 H24 v10 H6 Z" fill="${LAWN}" stroke="${LAWN_DARK}" stroke-width="4" stroke-linejoin="round"/>`)
]

export function createMap (app) {
  const root = el('div', { class: 'screen' })
  const state = save.get()
  const next = save.nextLevel()
  let veil = null
  let t = 0

  root.append(iconButton({
    icon: 'gear',
    x: 62,
    y: 62,
    label: 'indstillinger for voksne',
    onClick: openPanel
  }))

  root.append(iconButton({
    icon: 'wrench',
    x: 898,
    y: 62,
    label: 'byg om på maskinen',
    onClick: () => { sfx.tap(); app.go('workshop', { fromMap: true }) }
  }))

  // Skolehaven ligger for sig selv oppe i hjoernet
  // Skolehaven er sin egen "have" - lige saa stor som de andre
  root.append(iconButton({
    html: '<span style="font-size:.78em">🏫</span>',
    class: 'round garden go',
    x: 780,
    y: 104,
    label: 'skolehaven',
    onClick: () => { sfx.whoosh(); app.go('school') }
  }))

  SPOTS.forEach((spot, i) => {
    const n = i + 1
    const stars = state.stars[i]
    const unlocked = save.isUnlocked(n)
    const isNext = unlocked && stars === 0 && n === next

    const btn = iconButton({
      html: unlocked ? GARDEN_ICON[i] : ICONS.lock,
      class: 'round ' + (unlocked ? (isNext ? 'go garden' : 'garden') : 'locked'),
      x: spot.x,
      y: spot.y,
      label: `have ${n}`,
      onClick: () => {
        if (!unlocked) { sfx.nope(); return }
        sfx.whoosh()
        app.go('level', { number: n })
      }
    })
    if (!unlocked) btn.disabled = true
    root.append(btn)

    if (stars > 0) {
      const row = starRow(stars, 3, 30)
      row.className = 'pos'
      Object.assign(row.style, {
        position: 'absolute',
        left: (spot.x / 960) * 100 + '%',
        top: ((spot.y - 82) / 600) * 100 + '%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.35))'
      })
      root.append(row)
    }
  })

  function closePanel () {
    veil?.remove()
    veil = null
  }

  function openPanel () {
    if (veil) return
    sfx.tap()
    const soundBtn = iconButton({
      icon: isMuted() ? 'soundOff' : 'soundOn',
      label: 'lyd til og fra'
    })
    soundBtn.addEventListener('click', () => {
      const nextMuted = !isMuted()
      setMuted(nextMuted)
      save.update(s => { s.muted = nextMuted })
      soundBtn.innerHTML = ICONS[nextMuted ? 'soundOff' : 'soundOn']
      if (!nextMuted) sfx.tap()
    })

    const resetBtn = holdButton({
      icon: 'reset',
      class: 'warn',
      seconds: 3,
      label: 'start helt forfra – hold nede i 3 sekunder',
      onStart: () => say('reset.hold', {}, { force: true }),
      onHold: () => {
        sfx.fanfare()
        save.reset()
        app.machine = null
        closePanel()
        app.go('workshop')
      }
    })

    // svaerhedsgrad i Skolehaven: 1, 2 eller 3 trin
    const levels = save.LEVELS_OF_DIFFICULTY
    const stepBtn = iconButton({ label: 'sværhedsgrad i skolehaven' })
    const paintSteps = () => {
      const i = levels.indexOf(save.school().difficulty)
      stepBtn.innerHTML = ICONS.steps +
        `<span style="position:absolute;bottom:8%;font-size:.3em;font-weight:800;letter-spacing:.06em">${'●'.repeat(i + 1)}</span>`
      stepBtn.style.position = 'relative'
    }
    stepBtn.addEventListener('click', () => {
      const i = levels.indexOf(save.school().difficulty)
      save.setDifficulty(levels[(i + 1) % levels.length])
      paintSteps()
      sfx.tap()
    })
    paintSteps()

    const swapBtn = iconButton({
      html: '<span style="font-size:.62em">👦👦</span>',
      label: 'skift spiller'
    })
    swapBtn.addEventListener('click', () => {
      sfx.tap()
      closePanel()
      location.search = ''
    })

    const closeBtn = iconButton({ icon: 'check', class: 'go', label: 'luk' })
    closeBtn.addEventListener('click', () => { sfx.tap(); closePanel() })

    // dagens overblik - det eneste sted i spillet med laesetekst, og det er til de voksne
    const t = save.todayStats()
    const overview = el('div', { class: 'overview' },
      `I dag: ${t.gates} regnestykker · ${t.count} tælleopgaver · ${t.letters} bogstaver · ${t.mazes} labyrinter`)

    veil = el('div', { class: 'veil' },
      el('div', { class: 'panel' },
        el('div', { class: 'row' }, soundBtn, stepBtn, swapBtn, resetBtn),
        overview,
        closeBtn))
    veil.addEventListener('pointerdown', ev => { if (ev.target === veil) closePanel() })
    root.append(veil)
  }

  // Gro peger paa den have der blinker
  const spot = SPOTS[Math.max(0, next - 1)]
  app.guide.say('guide.map', {}, { icon: '<span class="bubble-emoji">🌱</span>' })
  setTimeout(() => app.guide.point(spot.x), 900)

  function drawCloud (ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.9)'
    ctx.beginPath()
    ctx.arc(x, y, 22 * s, 0, TAU)
    ctx.arc(x + 26 * s, y + 6 * s, 17 * s, 0, TAU)
    ctx.arc(x - 26 * s, y + 8 * s, 15 * s, 0, TAU)
    ctx.arc(x + 6 * s, y - 14 * s, 16 * s, 0, TAU)
    ctx.fill()
  }

  function draw (ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 600)
    sky.addColorStop(0, '#9fdcf7')
    sky.addColorStop(1, '#d8f0b0')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 960, 600)

    drawCloud(ctx, (120 + t * 9) % 1100 - 70, 78, 1)
    drawCloud(ctx, (560 + t * 6) % 1100 - 70, 46, 0.75)

    // baggrundsbakker
    ctx.fillStyle = '#77c46b'
    ctx.beginPath()
    ctx.moveTo(0, 210)
    for (let x = 0; x <= 960; x += 40) ctx.lineTo(x, 200 + Math.sin(x / 130) * 26)
    ctx.lineTo(960, 600); ctx.lineTo(0, 600)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#8ed07d'
    ctx.beginPath()
    ctx.moveTo(0, 300)
    for (let x = 0; x <= 960; x += 40) ctx.lineTo(x, 290 + Math.cos(x / 90) * 20)
    ctx.lineTo(960, 600); ctx.lineTo(0, 600)
    ctx.closePath(); ctx.fill()

    // sti mellem haverne
    ctx.strokeStyle = '#e0cfa2'
    ctx.lineWidth = 30
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(SPOTS[0].x, SPOTS[0].y)
    for (let i = 1; i < SPOTS.length; i++) {
      const a = SPOTS[i - 1]
      const b = SPOTS[i]
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2 + (i % 2 ? 70 : -70)
      ctx.quadraticCurveTo(mx, my, b.x, b.y)
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,.6)'
    ctx.lineWidth = 5
    ctx.setLineDash([14, 20])
    ctx.stroke()
    ctx.setLineDash([])

    // traeer og blomster
    const rnd = makeRandom(4242)
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 960
      const y = 200 + rnd() * 380
      if (SPOTS.some(s => Math.hypot(s.x - x, s.y - y) < 120)) continue
      ctx.fillStyle = '#8c5f2b'
      ctx.fillRect(x - 4, y, 9, 20)
      ctx.fillStyle = '#2f7d32'
      ctx.beginPath(); ctx.arc(x, y - 8, 22, 0, TAU); ctx.fill()
      ctx.fillStyle = '#46a049'
      ctx.beginPath(); ctx.arc(x - 8, y - 16, 14, 0, TAU); ctx.fill()
    }
  }

  return {
    root,
    state: { screen: 'map' },
    update (dt) { t += dt },
    draw,
    destroy () { closePanel(); root.remove() }
  }
}
