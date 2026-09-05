// Vaerkstedet: byg din maskine (spilplan afsnit 3).

import {
  machineSVG, sanitize, COLORS, WHEELS, BLADES, SCREENS, EXTRAS, NAMES, defaultMachine
} from './machine.js'
import { sfx, say, music } from './audio.js'
import { createGarage, webglAvailable } from './garage3d.js'
import { bubble } from './guide.js'
import * as save from './save.js'
import { el, iconButton, ICONS } from './ui.js'

const CATEGORIES = [
  { id: 'wheels', values: Object.keys(WHEELS) },
  { id: 'blade', values: Object.keys(BLADES) },
  { id: 'screen', values: SCREENS },
  { id: 'color', values: Object.keys(COLORS) },
  { id: 'extras', values: EXTRAS, multi: true },
  { id: 'name', values: NAMES.map(n => n.id) }
]

const svg = (inner, extra = '') =>
  `<svg viewBox="0 0 48 48" ${extra}>${inner}</svg>`

const CATEGORY_ICON = {
  wheels: svg('<circle cx="24" cy="24" r="17" fill="#2c2c31"/><circle cx="24" cy="24" r="7" fill="#9aa1ab"/>' +
    '<g stroke="#9aa1ab" stroke-width="3"><line x1="24" y1="9" x2="24" y2="17"/><line x1="24" y1="31" x2="24" y2="39"/>' +
    '<line x1="9" y1="24" x2="17" y2="24"/><line x1="31" y1="24" x2="39" y2="24"/></g>'),
  blade: svg('<path d="M24 6 l4.5 11.5 L40 22 l-11.5 4.5 L24 38 l-4.5-11.5 L8 22 l11.5-4.5 Z" fill="#7b8ca0" stroke="#4a5364" stroke-width="2.5" stroke-linejoin="round"/>'),
  screen: svg('<rect x="8" y="10" width="32" height="28" rx="7" fill="#132a44"/><circle cx="19" cy="21" r="3.2" fill="#ffe066"/>' +
    '<circle cx="29" cy="21" r="3.2" fill="#ffe066"/><path d="M17 28 q7 7 14 0" stroke="#ffe066" stroke-width="3" fill="none" stroke-linecap="round"/>'),
  color: svg('<circle cx="24" cy="24" r="17" fill="#eee"/>' +
    '<path d="M24 7 A17 17 0 0 1 41 24 L24 24 Z" fill="#e5484d"/>' +
    '<path d="M41 24 A17 17 0 0 1 24 41 L24 24 Z" fill="#ffd166"/>' +
    '<path d="M24 41 A17 17 0 0 1 7 24 L24 24 Z" fill="#4fd46e"/>' +
    '<path d="M7 24 A17 17 0 0 1 24 7 L24 24 Z" fill="#5b8def"/>'),
  extras: svg('<path d="M24 5 l4 12 12 4 -12 4 -4 12 -4 -12 -12 -4 12 -4 Z" fill="#ffc300" stroke="#b8860b" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<circle cx="39" cy="10" r="3.5" fill="#ff6b9d"/><circle cx="9" cy="36" r="3" fill="#5b8def"/>'),
  name: svg('<path d="M6 14 h22 l14 10 -14 10 H6 Z" fill="#ffd166" stroke="#b8860b" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="15" cy="24" r="3.5" fill="#8a5a00"/>')
}

function wheelIcon (type) {
  if (type === 'tracks') {
    return svg('<rect x="4" y="14" width="40" height="20" rx="10" fill="#2c2c31"/>' +
      '<g stroke="#7b8ca0" stroke-width="3"><line x1="12" y1="17" x2="12" y2="31"/><line x1="20" y1="17" x2="20" y2="31"/>' +
      '<line x1="28" y1="17" x2="28" y2="31"/><line x1="36" y1="17" x2="36" y2="31"/></g>')
  }
  if (type === 'terrain') {
    return svg('<circle cx="24" cy="24" r="18" fill="#2c2c31"/><circle cx="24" cy="24" r="8" fill="#f0c419"/>' +
      '<g fill="#7b8ca0"><rect x="21" y="4" width="6" height="8" rx="3"/><rect x="21" y="36" width="6" height="8" rx="3"/>' +
      '<rect x="4" y="21" width="8" height="6" rx="3"/><rect x="36" y="21" width="8" height="6" rx="3"/></g>')
  }
  if (type === 'spikes') {
    let sp = ''
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const x = 24 + Math.cos(a) * 21
      const y = 24 + Math.sin(a) * 21
      sp += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#9aa1ab"/>`
    }
    return svg(sp + '<circle cx="24" cy="24" r="16" fill="#2c2c31"/><circle cx="24" cy="24" r="6" fill="#9aa1ab"/>')
  }
  return svg('<circle cx="24" cy="24" r="16" fill="#2c2c31"/><circle cx="24" cy="24" r="6" fill="#9aa1ab"/>' +
    '<g stroke="#7b8ca0" stroke-width="3" stroke-linecap="round"><line x1="24" y1="10" x2="24" y2="15"/>' +
    '<line x1="24" y1="33" x2="24" y2="38"/><line x1="10" y1="24" x2="15" y2="24"/><line x1="33" y1="24" x2="38" y2="24"/></g>')
}

function bladeIcon (type) {
  const r = { small: 11, star: 15, triple: 18, laser: 21 }[type]
  if (type === 'star') {
    let d = ''
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      d += `${i ? 'L' : 'M'} ${(24 + Math.cos(a) * rr).toFixed(1)} ${(24 + Math.sin(a) * rr).toFixed(1)} `
    }
    return svg(`<path d="${d}Z" fill="#c3cedd" stroke="#4a5364" stroke-width="2.5" stroke-linejoin="round"/>`)
  }
  if (type === 'triple') {
    let out = `<circle cx="24" cy="24" r="${r}" fill="none" stroke="#7b8ca0" stroke-width="2" stroke-dasharray="4 4"/>`
    for (let i = 0; i < 3; i++) {
      out += `<rect x="21.5" y="${24 - r}" width="5" height="${r}" rx="2.5" fill="#c3cedd" stroke="#4a5364" stroke-width="2" transform="rotate(${i * 120} 24 24)"/>`
    }
    return svg(out)
  }
  if (type === 'laser') {
    return svg(`<circle cx="24" cy="24" r="${r}" fill="#8ef0ff" fill-opacity=".35" stroke="#2aa9c9" stroke-width="3"/>` +
      '<circle cx="24" cy="24" r="6" fill="#2aa9c9"/>' +
      '<g stroke="#2aa9c9" stroke-width="2.5" stroke-linecap="round"><line x1="24" y1="2" x2="24" y2="8"/><line x1="24" y1="40" x2="24" y2="46"/></g>')
  }
  return svg(`<circle cx="24" cy="24" r="${r}" fill="#c3cedd" stroke="#4a5364" stroke-width="2.5"/>` +
    '<circle cx="24" cy="24" r="3.5" fill="#4a5364"/>')
}

function screenIcon (type) {
  const frame = '<rect x="6" y="9" width="36" height="30" rx="8" fill="#132a44"/>'
  if (type === 'lamp') return svg(frame + '<circle cx="24" cy="24" r="9" fill="#ffe066"/><circle cx="24" cy="24" r="13" fill="none" stroke="#ffe066" stroke-width="2" opacity=".5"/>')
  if (type === 'smiley') {
    return svg(frame + '<circle cx="18" cy="20" r="3.4" fill="#ffe066"/><circle cx="30" cy="20" r="3.4" fill="#ffe066"/>' +
      '<path d="M16 27 q8 8 16 0" stroke="#ffe066" stroke-width="3.4" fill="none" stroke-linecap="round"/>')
  }
  if (type === 'rainbow') {
    return svg(frame + '<g fill="none" stroke-width="4" stroke-linecap="round">' +
      '<path d="M11 33 a13 13 0 0 1 26 0" stroke="#ff5f6d"/><path d="M16 33 a8 8 0 0 1 16 0" stroke="#ffd166"/>' +
      '<path d="M20.5 33 a3.5 3.5 0 0 1 7 0" stroke="#4fd46e"/></g>')
  }
  return svg(frame + '<path d="M12 14 L13 6 L20 12 Z" fill="#ffb0d8"/><path d="M36 14 L35 6 L28 12 Z" fill="#ffb0d8"/>' +
    '<ellipse cx="19" cy="22" rx="3" ry="4" fill="#ffe066"/><ellipse cx="29" cy="22" rx="3" ry="4" fill="#ffe066"/>' +
    '<path d="M22 29 h4 l-2 3 Z" fill="#ffb0d8"/>')
}

function colorIcon (id) {
  if (id === 'rainbow') {
    return svg('<defs><linearGradient id="ci" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#ff5f6d"/><stop offset=".3" stop-color="#ffb347"/>' +
      '<stop offset=".6" stop-color="#4fd46e"/><stop offset="1" stop-color="#5b8def"/></linearGradient></defs>' +
      '<circle cx="24" cy="24" r="17" fill="url(#ci)" stroke="#7a3fa0" stroke-width="3"/>')
  }
  const c = COLORS[id]
  return svg(`<circle cx="24" cy="24" r="17" fill="${c.base}" stroke="${c.dark}" stroke-width="3"/>` +
    `<circle cx="18" cy="18" r="6" fill="${c.light}" opacity=".8"/>`)
}

const EXTRA_ICON = {
  flag: svg('<line x1="14" y1="42" x2="14" y2="8" stroke="#4a3b2f" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M14 8 L38 14 L14 22 Z" fill="#e5484d" stroke="#a01f24" stroke-width="2.5" stroke-linejoin="round"/>'),
  lights: svg('<circle cx="24" cy="26" r="11" fill="#ffb703" stroke="#8a5a00" stroke-width="3"/>' +
    '<g stroke="#ffb703" stroke-width="3" stroke-linecap="round"><line x1="24" y1="4" x2="24" y2="10"/>' +
    '<line x1="8" y1="12" x2="12" y2="16"/><line x1="40" y1="12" x2="36" y2="16"/></g>'),
  horn: svg('<path d="M8 20 h8 l12 -9 v26 l-12 -9 H8 Z" fill="#c9a227" stroke="#8a6d13" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M34 17 a10 10 0 0 1 0 14" stroke="#8a6d13" stroke-width="3.5" fill="none" stroke-linecap="round"/>'),
  eyes: svg('<ellipse cx="16" cy="24" rx="9" ry="11" fill="#fff" stroke="#2c2c31" stroke-width="3"/>' +
    '<ellipse cx="34" cy="24" rx="9" ry="11" fill="#fff" stroke="#2c2c31" stroke-width="3"/>' +
    '<circle cx="19" cy="25" r="4" fill="#2c2c31"/><circle cx="37" cy="25" r="4" fill="#2c2c31"/>'),
  solar: svg('<rect x="7" y="12" width="34" height="24" rx="4" fill="#173a63" stroke="#0c2340" stroke-width="3"/>' +
    '<g stroke="#5aa0e0" stroke-width="2.5"><line x1="18" y1="12" x2="18" y2="36"/><line x1="30" y1="12" x2="30" y2="36"/>' +
    '<line x1="7" y1="24" x2="41" y2="24"/></g>'),
  stickers: svg('<path d="M17 8 l3 7 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1 Z" fill="#ffd166" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M33 24 c-4 -6 -13 -1 -8 5 l8 8 8 -8 c5 -6 -4 -11 -8 -5 Z" fill="#ff6b9d" stroke="#a4155f" stroke-width="2"/>')
}

function optionIcon (category, value) {
  if (category === 'wheels') return wheelIcon(value)
  if (category === 'blade') return bladeIcon(value)
  if (category === 'screen') return screenIcon(value)
  if (category === 'color') return colorIcon(value)
  if (category === 'extras') return EXTRA_ICON[value]
  const entry = NAMES.find(n => n.id === value)
  return `<span style="font-size:.62em;line-height:1;display:grid;gap:2px;place-items:center">
      <span style="font-size:1.5em">${entry.icon}</span>
      <span style="font-size:.42em;font-weight:800">${entry.id}</span></span>`
}

export function createWorkshop (app, opts = {}) {
  const machine = sanitize(app.machine || save.get().machine || defaultMachine())
  app.machine = machine

  const root = el('div', { class: 'screen' })
  const preview = el('div', { id: 'machine-stage' })
  const nameTag = el('div', { class: 'name-tag' })
  const optionsRow = el('div', { class: 'options' })
  const tray = el('div', { class: 'tray' })
  root.append(preview, nameTag, optionsRow, tray)

  // 3D-garagen, hvis maskinen kan. ?flat=1 tvinger den flade SVG frem.
  const canvas3d = document.getElementById('scene3d')
  const use3d = !app.flatWorkshop && webglAvailable()
  let garage = null
  let lastW = 0
  let lastH = 0

  if (use3d) {
    preview.hidden = true
    canvas3d.hidden = false
    // kategorier i venstre kolonne, dele i hoejre - maskinen faar hele midten
    tray.classList.add('side')
    optionsRow.classList.add('side')
    try {
      garage = createGarage(canvas3d)
      garage.setMachine(machine)
    } catch (err) {
      console.error(err)
      garage = null
      canvas3d.hidden = true
      preview.hidden = false
    }
  }

  let openCategory = 'wheels'
  let partClicks = 0

  function renderMachine (hop) {
    const entry = NAMES.find(n => n.id === machine.name)
    nameTag.innerHTML = `${entry ? entry.icon : ''} ${machine.name}`
    if (garage) {
      garage.setMachine(machine)
      return
    }
    preview.innerHTML = machineSVG(machine, {
      mood: 'happy',
      uid: 'w',
      showBlade: openCategory === 'blade'
    })
    if (hop) {
      preview.classList.remove('hop')
      void preview.offsetWidth
      preview.classList.add('hop')
    }
  }

  function selected (cat, value) {
    if (cat.id === 'extras') return machine.extras.includes(value)
    return machine[cat.id] === value
  }

  function renderOptions () {
    optionsRow.innerHTML = ''
    const cat = CATEGORIES.find(c => c.id === openCategory)
    for (const value of cat.values) {
      const b = iconButton({
        html: optionIcon(cat.id, value),
        class: selected(cat, value) ? 'selected' : '',
        label: `${cat.id} ${value}`
      })
      b.addEventListener('click', () => pick(cat, value))
      optionsRow.append(b)
    }
  }

  function pick (cat, value) {
    if (cat.multi) {
      const i = machine.extras.indexOf(value)
      if (i >= 0) machine.extras.splice(i, 1)
      else machine.extras.push(value)
    } else {
      machine[cat.id] = value
    }
    sfx.wrench()
    partClicks++
    if (partClicks % 3 === 0) say('workshop.part', {}, { force: true })
    renderMachine(true)
    renderOptions()
    save.update(s => { s.machine = { ...machine } })
  }

  function renderTray () {
    tray.innerHTML = ''
    for (const cat of CATEGORIES) {
      const b = iconButton({
        html: CATEGORY_ICON[cat.id],
        class: cat.id === openCategory ? 'selected' : '',
        label: cat.id
      })
      b.addEventListener('click', () => {
        openCategory = cat.id
        sfx.tap()
        music.sweep()
        renderTray()
        renderOptions()
        renderMachine(false)
      })
      tray.append(b)
    }
  }

  if (opts.fromMap) {
    root.append(iconButton({
      icon: 'back',
      x: 62,
      y: 62,
      label: 'tilbage til kortet',
      onClick: () => { sfx.tap(); app.go('map') }
    }))
  }

  root.append(iconButton({
    icon: 'play',
    class: 'go',
    x: use3d ? 560 : 878,
    y: use3d ? 538 : 96,
    label: 'kør',
    onClick: () => {
      sfx.fanfare()
      save.update(s => { s.machine = { ...machine } })
      say('workshop.done', { navn: machine.name }, { force: true })
      app.go('map')
    }
  }))

  // ---------------------------------------------------------------- garage-vaerktoej

  let liftBtn = null
  let cameraMode = 0
  const CAMERAS = ['eye', 'top', 'close']

  if (garage) {
    liftBtn = iconButton({
      icon: 'lift',
      label: 'løft maskinen op på liften',
      onClick: () => {
        const up = garage.toggleLift()
        liftBtn.classList.toggle('on', up)
        sfx.airLift()
        if (up) say('garage.lift', {}, { force: true })
      }
    })
    const camBtn = iconButton({
      icon: 'camera',
      label: 'skift kameravinkel',
      onClick: () => {
        cameraMode = (cameraMode + 1) % CAMERAS.length
        garage.setCamera(CAMERAS[cameraMode])
        sfx.tap()
      }
    })
    root.append(el('div', { class: 'garage-tools' }, liftBtn, camBtn))
  }

  // ---------------------------------------------------------------- drej og zoom

  let pointerId = null
  let last = null
  let moved = 0
  const isUi = t => t instanceof Element && t.closest('button, .panel, .tray, .options')

  const down = ev => {
    if (!garage || pointerId !== null || isUi(ev.target)) return
    pointerId = ev.pointerId
    last = [ev.clientX, ev.clientY]
    moved = 0
    try { app.stage.setPointerCapture(ev.pointerId) } catch { /* ignore */ }
  }
  const move = ev => {
    if (ev.pointerId !== pointerId) return
    const dx = ev.clientX - last[0]
    const dy = ev.clientY - last[1]
    last = [ev.clientX, ev.clientY]
    moved += Math.abs(dx) + Math.abs(dy)
    garage.drag(dx, dy)
  }
  const up = ev => {
    if (ev.pointerId !== pointerId) return
    pointerId = null
    try { app.stage.releasePointerCapture(ev.pointerId) } catch { /* ignore */ }
    // et kort tryk uden bevaegelse = giv den lige gas
    if (moved < 6) {
      garage.revEngine()
      sfx.rev()
    }
  }
  const wheelZoom = ev => {
    if (!garage) return
    ev.preventDefault()
    garage.zoom(ev.deltaY * 0.004)
  }

  if (garage) {
    app.stage.addEventListener('pointerdown', down)
    app.stage.addEventListener('pointermove', move)
    app.stage.addEventListener('pointerup', up)
    app.stage.addEventListener('pointercancel', up)
    app.stage.addEventListener('wheel', wheelZoom, { passive: false })
  }

  renderTray()
  renderOptions()
  renderMachine(false)
  app.guide.say(garage ? 'guide.garage' : 'workshop.start', {}, { icon: bubble.svg(ICONS.wrench), side: 'center' })
  music.startGarage()

  const sky = { t: 0 }
  return {
    root,
    state: { screen: 'workshop' },
    update (dt) {
      sky.t += dt
      if (!garage) return
      const r = canvas3d.getBoundingClientRect()
      if (r.width && (r.width !== lastW || r.height !== lastH)) {
        lastW = r.width
        lastH = r.height
        garage.resize(r.width, r.height)
      }
      garage.update(dt)
      garage.render()
    },
    draw (ctx) {
      if (garage) return // 3D-laerredet ligger ovenpaa
      const g = ctx.createLinearGradient(0, 0, 0, 600)
      g.addColorStop(0, '#ffd79a')
      g.addColorStop(1, '#ffb35c')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 960, 600)
      ctx.fillStyle = '#5b5b66'
      ctx.fillRect(0, 430, 960, 170)
      ctx.strokeStyle = 'rgba(255,255,255,.14)'
      ctx.lineWidth = 4
      for (let x = -200; x < 1200; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 600); ctx.lineTo(x + 120, 430); ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(0,0,0,.12)'
      ctx.lineWidth = 10
      ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(960, 120); ctx.stroke()
      ctx.fillStyle = 'rgba(0,0,0,.10)'
      for (let i = 0; i < 7; i++) {
        const x = 120 + i * 120
        ctx.beginPath(); ctx.roundRect(x - 16, 120, 32, 60 + (i % 3) * 22, 12); ctx.fill()
      }
      const glow = ctx.createRadialGradient(480, 210, 20, 480, 210, 300)
      glow.addColorStop(0, 'rgba(255,255,255,.45)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(120, 20, 720, 460)
    },
    destroy () {
      music.stop()
      if (garage) {
        app.stage.removeEventListener('pointerdown', down)
        app.stage.removeEventListener('pointermove', move)
        app.stage.removeEventListener('pointerup', up)
        app.stage.removeEventListener('pointercancel', up)
        app.stage.removeEventListener('wheel', wheelZoom)
        garage.dispose()
      }
      canvas3d.hidden = true
      preview.hidden = false
      root.remove()
    }
  }
}
