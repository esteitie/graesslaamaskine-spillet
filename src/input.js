// Pointer Events overalt, saa finger og mus opfoerer sig ens.

export const LOGICAL_W = 960
export const LOGICAL_H = 600

const DEAD_ZONE = 8
const MAX_PULL = 60

/** Skaermkoordinat -> logisk koordinat i 960x600-laerredet. */
export function makeMapper (el) {
  return (clientX, clientY) => {
    const r = el.getBoundingClientRect()
    return [
      ((clientX - r.left) / r.width) * LOGICAL_W,
      ((clientY - r.top) / r.height) * LOGICAL_H
    ]
  }
}

/**
 * Tegne-input paa canvas: start / flyt / slip i logiske koordinater.
 * Ignorerer pointere der starter paa en knap.
 */
export function createDrawInput (el, handlers) {
  const toLogical = makeMapper(el)
  let active = null

  const isUi = t => t instanceof Element && t.closest('button, .panel, .tray, .options')

  const down = ev => {
    if (active !== null || isUi(ev.target)) return
    active = ev.pointerId
    try { el.setPointerCapture(ev.pointerId) } catch { /* ignore */ }
    handlers.start?.(toLogical(ev.clientX, ev.clientY), ev)
  }
  const move = ev => {
    if (ev.pointerId !== active) return
    handlers.move?.(toLogical(ev.clientX, ev.clientY), ev)
  }
  const up = ev => {
    if (ev.pointerId !== active) return
    active = null
    try { el.releasePointerCapture(ev.pointerId) } catch { /* ignore */ }
    handlers.end?.(toLogical(ev.clientX, ev.clientY), ev)
  }

  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('pointerleave', up)

  return {
    destroy () {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', up)
    }
  }
}

/**
 * Flydende joystick: opstaar der hvor fingeren lander.
 * vector() -> { x, y, mag } hvor mag er 0..1.
 */
export function createJoystick (stage, ui, onInput) {
  const root = ui.root
  const base = ui.base
  const thumb = ui.thumb
  let pointerId = null
  let origin = [0, 0]
  let vec = { x: 0, y: 0, mag: 0 }
  let enabled = false

  const isUi = t => t instanceof Element && t.closest('button, .panel, .tray, .options')

  function place (el, x, y) {
    el.style.left = x + 'px'
    el.style.top = y + 'px'
  }

  function show (x, y) {
    const r = stage.getBoundingClientRect()
    origin = [x - r.left, y - r.top]
    root.hidden = false
    place(base, origin[0], origin[1])
    place(thumb, origin[0], origin[1])
  }

  function hide () {
    root.hidden = true
    vec = { x: 0, y: 0, mag: 0 }
  }

  const down = ev => {
    if (!enabled || pointerId !== null || isUi(ev.target)) return
    pointerId = ev.pointerId
    try { stage.setPointerCapture(ev.pointerId) } catch { /* ignore */ }
    show(ev.clientX, ev.clientY)
    onInput?.()
  }

  const move = ev => {
    if (ev.pointerId !== pointerId) return
    const r = stage.getBoundingClientRect()
    const px = ev.clientX - r.left
    const py = ev.clientY - r.top
    let dx = px - origin[0]
    let dy = py - origin[1]
    const len = Math.hypot(dx, dy)
    const clamped = Math.min(len, MAX_PULL)
    if (len > 0) {
      place(thumb, origin[0] + (dx / len) * clamped, origin[1] + (dy / len) * clamped)
    }
    if (len < DEAD_ZONE) {
      vec = { x: 0, y: 0, mag: 0 }
      return
    }
    dx /= len
    dy /= len
    vec = { x: dx, y: dy, mag: clamped / MAX_PULL }
    onInput?.()
  }

  const up = ev => {
    if (ev.pointerId !== pointerId) return
    pointerId = null
    try { stage.releasePointerCapture(ev.pointerId) } catch { /* ignore */ }
    hide()
  }

  stage.addEventListener('pointerdown', down)
  stage.addEventListener('pointermove', move)
  stage.addEventListener('pointerup', up)
  stage.addEventListener('pointercancel', up)

  return {
    enable () { enabled = true },
    disable () { enabled = false; pointerId = null; hide() },
    vector () { return vec },
    destroy () {
      this.disable()
      stage.removeEventListener('pointerdown', down)
      stage.removeEventListener('pointermove', move)
      stage.removeEventListener('pointerup', up)
      stage.removeEventListener('pointercancel', up)
    }
  }
}

// Bade tegn og fysisk tast: paa et dansk eller fransk tastatur giver de samme
// taster ikke altid de samme bogstaver, saa vi ser paa begge dele.
const KEY_VECTORS = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
  A: [-1, 0], D: [1, 0], W: [0, -1], S: [0, 1]
}

const CODE_VECTORS = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1]
}

function vectorFor (ev) {
  return CODE_VECTORS[ev.code] || KEY_VECTORS[ev.key] || null
}

/** Piletaster og WASD giver samme vektor som joysticket. */
export function createKeyboard (onInput) {
  const held = new Map()
  const idFor = ev => ev.code || ev.key

  const down = ev => {
    const vec = vectorFor(ev)
    if (!vec) return
    held.set(idFor(ev), vec)
    ev.preventDefault()
    onInput?.()
  }
  const up = ev => {
    if (!vectorFor(ev)) return
    held.delete(idFor(ev))
  }
  const blur = () => held.clear()
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', blur)

  return {
    vector () {
      let x = 0
      let y = 0
      for (const [dx, dy] of held.values()) {
        x += dx
        y += dy
      }
      const len = Math.hypot(x, y)
      if (len === 0) return { x: 0, y: 0, mag: 0 }
      return { x: x / len, y: y / len, mag: 1 }
    },
    destroy () {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }
}
