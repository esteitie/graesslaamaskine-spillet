// Opstart og skaermskift: intro -> vaerksted -> banekort -> bane.

import * as save from './save.js'
import { unlock, resume, setMuted, sfx, say, engine } from './audio.js'
import { sanitize, defaultMachine, preloadMachine, machineSVG, NAMES } from './machine.js'
import { createWorkshop } from './workshop.js'
import { createMap } from './map.js'
import { createLevel } from './level.js'
import { createSchool, createMathGates, createCounting } from './school.js'
import { createConfetti } from './confetti.js'
import { el, iconButton } from './ui.js'
import { createGuide } from './guide.js'
import { LOGICAL_W, LOGICAL_H } from './input.js'
import { TAU } from './geometry.js'

const params = new URLSearchParams(location.search)
const askedLevel = Number(params.get('level')) || 0
const skipIntro = params.get('skipIntro') === '1'
const forceMute = params.get('mute') === '1'
const turbo = Math.max(1, Math.min(20, Number(params.get('turbo')) || 1))
// Tegnefasen er slaaet fra indtil videre - banerne starter direkte med at slaa graes.
const drawingEnabled = params.get('draw') === '1'
// ?flat=1 beholder det gamle flade vaerksted (reserve til svage enheder)
const flatWorkshop = params.get('flat') === '1'

const stage = document.getElementById('stage')
const canvas = document.getElementById('scene')
const ctx = canvas.getContext('2d')
const ui = document.getElementById('ui')

const app = {
  stage,
  canvas,
  ui,
  joystick: {
    root: document.getElementById('joystick'),
    base: document.getElementById('joystick-base'),
    thumb: document.getElementById('joystick-thumb')
  },
  machine: null,
  drawingEnabled,
  flatWorkshop,
  guide: null,
  go
}
// Gro lever oven paa alle skaerme og faar noget at sige af hver af dem
app.guide = createGuide(ui)

let scale = 1
let current = null
let screenName = 'intro'
let switching = null

function resize () {
  const r = stage.getBoundingClientRect()
  if (!r.width || !r.height) return
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  canvas.width = Math.round(r.width * dpr)
  canvas.height = Math.round(r.height * dpr)
  scale = (r.width / LOGICAL_W) * dpr
  const css = document.documentElement.style
  css.setProperty('--stage-w', r.width + 'px')
  css.setProperty('--stage-h', r.height + 'px')
}

window.addEventListener('resize', resize)
window.addEventListener('orientationchange', () => setTimeout(resize, 120))
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage)
resize()

// ------------------------------------------------------------------ intro

function createIntro (target) {
  const root = el('div', { class: 'screen' })
  root.append(el('div', { id: 'intro-title' }, 'Græsslåmaskine Spillet'))

  let started = false
  function begin (profileIndex) {
    if (started) return
    started = true
    if (profileIndex != null) {
      save.setActiveProfile(profileIndex)
      const picked = save.get()
      app.machine = picked.machine ? sanitize(picked.machine) : null
    }
    unlock()
    resume()
    applyMute()
    sfx.fanfare()
    const chosen = app.machine
      ? (target.screen === 'workshop' ? { screen: 'map', params: {} } : target)
      : { screen: 'workshop', params: {} }
    // Gro siger goddag foerst - saa kender barnet hende, naar hun dukker op igen
    app.guide.say('guide.hello', {}, { icon: '<span class="bubble-emoji">👋</span>', side: 'center' })
    setTimeout(() => go(chosen.screen, chosen.params), 3400)
  }

  if (save.anyProfileUsed()) {
    // to boern, hver sin maskine: vaelg hvem der spiller
    save.profiles().forEach(p => {
      const entry = p.machine ? NAMES.find(n => n.id === p.machine.name) : null
      const btn = iconButton({
        html: p.used
          ? `<span style="display:grid;place-items:center;gap:2px;line-height:1">
               <span style="font-size:1.1em">${entry ? entry.icon : '🚜'}</span>
               <span style="font-size:.26em;font-weight:800">${p.machine.name}</span>
               <span style="font-size:.24em;color:#c88a00">${'★'.repeat(Math.min(5, Math.ceil(p.stars / 3)))}</span>
             </span>`
          : '<span style="font-size:1.1em">＋</span>',
        class: 'go garden round',
        x: p.index === 0 ? 340 : 620,
        y: 390,
        label: p.used ? `spil som ${p.machine.name}` : 'byg en ny maskine',
        onClick: () => begin(p.index)
      })
      root.append(btn)
    })
  } else {
    root.append(iconButton({
      icon: 'play',
      class: 'go',
      x: 480,
      y: 380,
      label: 'start spillet',
      onClick: () => begin(null)
    }))
  }
  let t = 0
  return {
    root,
    state: { screen: 'intro' },
    update (dt) { t += dt },
    draw (c) {
      const sky = c.createLinearGradient(0, 0, 0, LOGICAL_H)
      sky.addColorStop(0, '#8fd3f4')
      sky.addColorStop(1, '#c9efa0')
      c.fillStyle = sky
      c.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
      c.fillStyle = '#4fae5a'
      c.beginPath()
      c.moveTo(0, 430)
      for (let x = 0; x <= LOGICAL_W; x += 30) c.lineTo(x, 420 + Math.sin(x / 90 + t) * 10)
      c.lineTo(LOGICAL_W, LOGICAL_H); c.lineTo(0, LOGICAL_H)
      c.closePath(); c.fill()
      c.fillStyle = '#3f9142'
      for (let x = 10; x < LOGICAL_W; x += 26) {
        const h = 26 + Math.sin(x + t * 2) * 8
        c.beginPath()
        c.moveTo(x, LOGICAL_H)
        c.quadraticCurveTo(x + 6, LOGICAL_H - h, x + 14, LOGICAL_H - h - 10)
        c.lineTo(x + 8, LOGICAL_H)
        c.closePath(); c.fill()
      }
      c.fillStyle = 'rgba(255,255,255,.9)'
      for (let i = 0; i < 3; i++) {
        const x = ((i * 340 + t * 12) % 1200) - 120
        const y = 90 + i * 40
        c.beginPath()
        c.arc(x, y, 26, 0, TAU); c.arc(x + 30, y + 8, 19, 0, TAU); c.arc(x - 30, y + 9, 17, 0, TAU)
        c.fill()
      }
    },
    destroy () { root.remove() }
  }
}

// ------------------------------------------------------------------ graesmester

function createMaster () {
  const root = el('div', { class: 'screen' })
  root.append(el('div', { class: 'big-title' }, 'Græsmester!'))
  const showcase = el('div', {
    id: 'machine-stage',
    style: { top: '47%', height: '36%', width: 'auto' }
  })
  showcase.innerHTML = machineSVG({ ...app.machine, color: 'rainbow' }, { mood: 'happy', uid: 'x' })
  root.append(showcase)
  root.append(iconButton({
    icon: 'map',
    class: 'go',
    x: 848,
    y: 512,
    label: 'tilbage til kortet',
    onClick: () => { sfx.tap(); go('map') }
  }))

  const confetti = createConfetti()
  confetti.burst(LOGICAL_W / 2, 260, 160)
  confetti.rain(LOGICAL_W, 90)
  sfx.fanfare()
  app.guide.say('master', {}, { icon: '<span class="bubble-emoji">🏆</span>', sticky: true })
  app.guide.cheer()
  let t = 0
  let rainTimer = 2.5

  return {
    root,
    state: { screen: 'master' },
    update (dt) {
      t += dt
      confetti.update(dt)
      rainTimer -= dt
      if (rainTimer <= 0) { rainTimer = 2.5; confetti.rain(LOGICAL_W, 40) }
    },
    draw (c) {
      const sky = c.createLinearGradient(0, 0, 0, LOGICAL_H)
      sky.addColorStop(0, '#ffd166')
      sky.addColorStop(1, '#ff9f68')
      c.fillStyle = sky
      c.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
      c.save()
      c.translate(LOGICAL_W / 2, 300)
      for (let i = 0; i < 16; i++) {
        c.rotate(TAU / 16)
        c.fillStyle = 'rgba(255,255,255,.16)'
        c.beginPath(); c.moveTo(0, 0); c.lineTo(700, -34); c.lineTo(700, 34); c.closePath(); c.fill()
      }
      c.restore()
      // pokal
      c.save()
      c.translate(150, 470)
      const s = 1 + Math.sin(t * 3) * 0.03
      c.scale(s, s)
      c.fillStyle = '#ffc300'
      c.strokeStyle = '#b8860b'
      c.lineWidth = 6
      c.beginPath(); c.roundRect(-42, -70, 84, 70, [10, 10, 34, 34]); c.fill(); c.stroke()
      c.beginPath(); c.roundRect(-16, 0, 32, 22, 6); c.fill(); c.stroke()
      c.beginPath(); c.roundRect(-46, 22, 92, 18, 8); c.fill(); c.stroke()
      c.restore()
      confetti.draw(c)
    },
    destroy () { root.remove() }
  }
}

// ------------------------------------------------------------------ skaermskift

const SCREENS = {
  workshop: (a, p) => createWorkshop(a, p),
  map: a => createMap(a),
  master: () => createMaster(),
  school: a => createSchool(a),
  gates: a => createMathGates(a),
  count: a => createCounting(a),
  level: async (a, p) => createLevel(a, p.number, p)
}

async function go (name, opts = {}) {
  const token = {}
  switching = token
  app.guide.hide()
  if (current) { current.destroy?.(); current = null }
  screenName = name
  if (name === 'level' || name === 'gates') {
    await preloadMachine(app.machine)
  }
  const made = await SCREENS[name](app, opts)
  if (switching !== token) { made.destroy?.(); return }
  current = made
  ui.append(made.root)
  if (name !== 'level') engine.stop()
}

// ------------------------------------------------------------------ loop

let last = performance.now()
function frame (now) {
  const raw = Math.min(0.05, Math.max(0, (now - last) / 1000))
  last = now
  const dt = raw * turbo
  try {
    current?.update?.(dt)
  } catch (err) { console.error(err) }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  try {
    current?.draw?.(ctx)
  } catch (err) { console.error(err) }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

// ------------------------------------------------------------------ opstart

function applyMute () {
  setMuted(forceMute || save.get().muted)
}

const state = save.load()
app.machine = state.machine ? sanitize(state.machine) : null
applyMute()

// Foerste beroering laaser lyden op, ogsaa naar introen springes over.
const firstTouch = () => { unlock(); resume(); applyMute() }
window.addEventListener('pointerdown', firstTouch, { once: true })
window.addEventListener('keydown', firstTouch, { once: true })

const askedScreen = params.get('screen')
const askedName = params.get('bane')

const target = askedScreen && SCREENS[askedScreen]
  ? { screen: askedScreen, params: {} }
  : askedName
    ? { screen: 'level', params: { number: askedName, returnTo: 'school' } }
    : askedLevel >= 1 && askedLevel <= save.LEVEL_COUNT
      ? { screen: 'level', params: { number: askedLevel } }
      : app.machine
        ? { screen: 'map', params: {} }
        : { screen: 'workshop', params: {} }

if (target.screen !== 'workshop' && !app.machine) app.machine = defaultMachine()

if (skipIntro) go(target.screen, target.params)
else { current = createIntro(target); ui.append(current.root) }

// ------------------------------------------------------------------ testkroge

window.__game = {
  get screen () { return screenName },
  get level () { return screenName === 'level' ? current?.state : null },
  /** Den aktuelle skaerms tilstand - ogsaa Skolehavens (gates, count). */
  get state () { return current?.state || null },
  get machine () { return app.machine },
  get save () { return save.get() },
  go,
  /**
   * Simulerer tid uden at vente paa requestAnimationFrame.
   * Kun til tests - spillet selv bruger den ikke.
   */
  step (seconds = 1 / 60, slice = 1 / 60) {
    let left = Math.max(0, Math.min(600, seconds))
    while (left > 1e-9) {
      const dt = Math.min(slice, left)
      current?.update?.(dt)
      left -= dt
    }
    return screenName === 'level' ? current?.state?.phase : screenName
  }
}

// ------------------------------------------------------------------ PWA

// Kun paa https (GitHub Pages / hjemmeskaerm). Lokal http-server behoever den ikke,
// og nogle indlejrede browsere afviser service workers med en konsolfejl.
const wantsServiceWorker = params.get('sw') === '1' ||
  (location.protocol === 'https:' && params.get('sw') !== '0')

if ('serviceWorker' in navigator && !navigator.webdriver && wantsServiceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {})
  })
}
