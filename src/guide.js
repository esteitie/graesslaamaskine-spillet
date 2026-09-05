// Gro, gartneren: figuren der fortaeller hvad en skaerm ER, og hvad man skal.
// Hun dukker op i hjoernet, siger sin replik med en taleboble (kun ikoner,
// aldrig laesetekst), og gaar igen. Taenk de gamle Magnus og Myggen-spil.

import { say, sayText } from './audio.js'
import { line } from './voice-lines.js'
import { el } from './ui.js'

const SVG = `
<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" class="gro">
  <g class="gro-body">
    <!-- rive -->
    <g class="gro-rake">
      <line x1="28" y1="118" x2="18" y2="238" stroke="#8c5f2b" stroke-width="7" stroke-linecap="round"/>
      <path d="M2 238 h34 l-3 -12 h-28 z" fill="#9aa1ab" stroke="#5c6470" stroke-width="3" stroke-linejoin="round"/>
    </g>
    <!-- krop: groenne overalls -->
    <path d="M62 148 q38 -18 76 0 l14 92 h-104 z" fill="#3f9142" stroke="#1f6f30" stroke-width="4" stroke-linejoin="round"/>
    <rect x="76" y="126" width="12" height="40" rx="5" fill="#3f9142" stroke="#1f6f30" stroke-width="3"/>
    <rect x="112" y="126" width="12" height="40" rx="5" fill="#3f9142" stroke="#1f6f30" stroke-width="3"/>
    <rect x="84" y="170" width="32" height="26" rx="6" fill="#2c6d31"/>
    <circle cx="100" cy="183" r="5" fill="#ffd166"/>
    <!-- skjorte -->
    <path d="M62 148 q38 -18 76 0 v-20 q-38 -14 -76 0 z" fill="#ffd166" stroke="#c88a00" stroke-width="3"/>
    <!-- venstre arm holder riven -->
    <path d="M64 156 q-24 10 -34 -20" fill="none" stroke="#f2c9a0" stroke-width="14" stroke-linecap="round"/>
    <!-- hoejre arm: den der peger -->
    <g class="gro-arm">
      <path d="M136 156 q22 14 40 -6" fill="none" stroke="#f2c9a0" stroke-width="14" stroke-linecap="round"/>
      <circle cx="178" cy="148" r="11" fill="#f2c9a0"/>
    </g>
    <!-- hoved -->
    <circle cx="100" cy="88" r="40" fill="#f2c9a0" stroke="#c98b5c" stroke-width="3"/>
    <circle cx="80" cy="100" r="7" fill="#ff9a8f" opacity=".7"/>
    <circle cx="120" cy="100" r="7" fill="#ff9a8f" opacity=".7"/>
    <g class="gro-eyes">
      <ellipse cx="86" cy="86" rx="7" ry="8" fill="#fff"/>
      <ellipse cx="114" cy="86" rx="7" ry="8" fill="#fff"/>
      <circle cx="88" cy="87" r="4" fill="#2c2c31"/>
      <circle cx="116" cy="87" r="4" fill="#2c2c31"/>
    </g>
    <path d="M76 74 q10 -6 18 0" fill="none" stroke="#7a4a25" stroke-width="3" stroke-linecap="round"/>
    <path d="M106 74 q8 -6 18 0" fill="none" stroke="#7a4a25" stroke-width="3" stroke-linecap="round"/>
    <path class="gro-mouth" d="M84 108 q16 14 32 0" fill="#c0453f" stroke="#7a2a26" stroke-width="3" stroke-linejoin="round"/>
    <!-- straahat -->
    <ellipse cx="100" cy="58" rx="58" ry="12" fill="#e8c46a" stroke="#b8860b" stroke-width="3"/>
    <path d="M66 58 q4 -36 34 -36 q30 0 34 36 z" fill="#f2d27a" stroke="#b8860b" stroke-width="3"/>
    <rect x="66" y="48" width="68" height="9" fill="#c0453f"/>
  </g>
</svg>`

/** Ikoner til boblen - aldrig laesetekst, men et bogstav eller et tal ER indholdet. */
export const bubble = {
  letter: ch => `<span class="bubble-letter">${ch}</span>`,
  sum: (a, b, minus) => `<span class="bubble-sum">${a} ${minus ? '−' : '+'} ${b}</span>`,
  emoji: e => `<span class="bubble-emoji">${e}</span>`,
  svg: markup => `<span class="bubble-svg">${markup}</span>`,
  dots: n => `<span class="bubble-dots">${'●'.repeat(Math.max(1, Math.min(n, 12)))}</span>`
}

export function createGuide (ui) {
  const box = el('div', { id: 'guide', class: 'hidden', 'aria-hidden': 'true' })
  const bubbleEl = el('div', { class: 'guide-bubble' })
  const figure = el('div', { class: 'guide-figure', html: SVG })
  box.append(bubbleEl, figure)
  ui.append(box)

  let hideTimer = 0
  let talkTimer = 0
  let poll = 0
  let sticky = false

  function stopTalking () {
    clearInterval(poll)
    poll = 0
    box.classList.remove('talk')
  }

  function talkFor (seconds) {
    box.classList.add('talk')
    clearTimeout(talkTimer)
    talkTimer = setTimeout(stopTalking, seconds * 1000)
    // stop munden naar talen faktisk er faerdig
    clearInterval(poll)
    poll = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) stopTalking()
    }, 250)
  }

  function show (opts = {}) {
    box.classList.remove('hidden')
    box.classList.toggle('right', opts.side === 'right')
    box.classList.toggle('center', opts.side === 'center')
    box.classList.toggle('top', !!opts.top)
    box.classList.remove('flip')
    sticky = !!opts.sticky
    clearTimeout(hideTimer)
  }

  function hide () {
    box.classList.add('hidden')
    box.classList.remove('point', 'cheer')
    stopTalking()
    sticky = false
  }

  function scheduleHide (seconds) {
    clearTimeout(hideTimer)
    if (!sticky) hideTimer = setTimeout(hide, seconds * 1000)
  }

  function speak (text, opts) {
    show(opts)
    box.classList.remove('point', 'cheer')
    if (opts.pose) box.classList.add(opts.pose)
    bubbleEl.innerHTML = opts.icon || ''
    bubbleEl.classList.toggle('empty', !opts.icon)
    const seconds = opts.hold || Math.min(9, 1.8 + text.length * 0.055)
    talkFor(seconds)
    scheduleHide(seconds + 1.2)
  }

  return {
    /** Siger en replik fra afsnit 10 med et ikon i boblen. */
    say (key, vars = {}, opts = {}) {
      const text = line(key, vars)
      if (!text) return
      say(key, vars, { force: true, ...opts })
      speak(text, opts)
    },
    sayText (text, opts = {}) {
      if (!text) return
      sayText(text, { force: true })
      speak(text, opts)
    },
    /** Peger - mod hoejre hvis maalet er til hoejre for hende. */
    point (lx) {
      const keep = { sticky, side: box.classList.contains('right') ? 'right' : box.classList.contains('center') ? 'center' : 'left', top: box.classList.contains('top') }
      show(keep)
      box.classList.remove('cheer')
      box.classList.add('point')
      // hun staar til venstre og peger mod hoejre - er maalet bag hende, vender hun sig
      const herX = keep.side === 'right' ? 880 : keep.side === 'center' ? 330 : 110
      box.classList.toggle('flip', lx < herX)
      scheduleHide(4)
    },
    cheer () {
      const keep = { sticky, side: box.classList.contains('right') ? 'right' : box.classList.contains('center') ? 'center' : 'left', top: box.classList.contains('top') }
      show(keep)
      box.classList.remove('point')
      box.classList.add('cheer')
      scheduleHide(5)
    },
    show,
    hide,
    destroy () {
      clearTimeout(hideTimer)
      clearTimeout(talkTimer)
      clearInterval(poll)
      box.remove()
    }
  }
}
