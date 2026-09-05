// Alle lyde laves i kode med Web Audio (ingen lydfiler).
// Oplaeseren bruger speechSynthesis med da-DK. Spillet skal virke uden begge dele.

import { line } from './voice-lines.js'

let ac = null
let master = null
let muted = false
let unlocked = false

/** Kaldes inde i en click-handler - ellers blokerer iOS baade lyd og tale. */
export function unlock () {
  if (unlocked) return
  unlocked = true
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (Ctor) {
      ac = new Ctor()
      master = ac.createGain()
      master.gain.value = muted ? 0 : 0.9
      master.connect(ac.destination)
    }
  } catch { ac = null }
  try {
    if (window.speechSynthesis) {
      // En tom utterance aabner tale-kanalen paa iOS.
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
    }
  } catch { /* ingen tale - spillet virker stadig */ }
}

export function resume () {
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {})
}

export function setMuted (value) {
  muted = !!value
  if (master) master.gain.value = muted ? 0 : 0.9
  if (muted) {
    stopSpeech()
    engine.stop()
    music.stop()
    ambience.stop()
  }
}

export function isMuted () {
  return muted
}

// ------------------------------------------------------------------ byggeklodser

function now () { return ac ? ac.currentTime : 0 }

function env (gain, t0, attack, hold, release, peak) {
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + attack)
  gain.gain.setValueAtTime(Math.max(0.0001, peak), t0 + attack + hold)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release)
}

function tone (opts) {
  if (!ac || muted) return
  const {
    freq = 440, to = null, type = 'sine', delay = 0,
    attack = 0.008, hold = 0.03, release = 0.12, gain = 0.25, detune = 0
  } = opts
  const t0 = now() + delay
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.detune.value = detune
  osc.frequency.setValueAtTime(freq, t0)
  if (to != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + attack + hold + release)
  env(g, t0, attack, hold, release, gain)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + attack + hold + release + 0.05)
}

function noise (opts) {
  if (!ac || muted) return
  const { dur = 0.2, gain = 0.2, cutoff = 1200, type = 'lowpass', delay = 0, sweepTo = null } = opts
  const t0 = now() + delay
  const frames = Math.max(1, Math.floor(ac.sampleRate * dur))
  const buf = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = ac.createBufferSource()
  src.buffer = buf
  const filt = ac.createBiquadFilter()
  filt.type = type
  filt.frequency.setValueAtTime(cutoff, t0)
  if (sweepTo != null) filt.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur)
  const g = ac.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filt).connect(g).connect(master)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

// ------------------------------------------------------------------ lydene

export const sfx = {
  tap () { tone({ freq: 660, to: 880, type: 'triangle', hold: 0.01, release: 0.08, gain: 0.18 }) },
  click () {
    tone({ freq: 520, to: 900, type: 'square', hold: 0.01, release: 0.07, gain: 0.12 })
    noise({ dur: 0.07, gain: 0.16, cutoff: 3000 })
  },
  peg () { tone({ freq: 1200, type: 'sine', hold: 0.005, release: 0.04, gain: 0.05 }) },
  snap () {
    tone({ freq: 440, to: 1320, type: 'triangle', hold: 0.02, release: 0.22, gain: 0.22 })
    noise({ dur: 0.18, gain: 0.12, cutoff: 2600, sweepTo: 600 })
  },
  beep () { tone({ freq: 300, type: 'square', hold: 0.05, release: 0.06, gain: 0.1 }) },
  nope () {
    tone({ freq: 300, to: 180, type: 'sawtooth', hold: 0.04, release: 0.18, gain: 0.12 })
  },
  splash () {
    noise({ dur: 0.5, gain: 0.3, cutoff: 2400, sweepTo: 200, type: 'bandpass' })
    tone({ freq: 900, to: 180, type: 'sine', hold: 0.02, release: 0.35, gain: 0.14 })
  },
  star (index = 0) {
    const scale = [659.25, 783.99, 987.77, 1318.5]
    tone({ freq: scale[Math.min(index, 3)], type: 'triangle', hold: 0.08, release: 0.3, gain: 0.26 })
    tone({ freq: scale[Math.min(index, 3)] * 2, type: 'sine', hold: 0.04, release: 0.2, gain: 0.1, delay: 0.02 })
  },
  fanfare () {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => tone({ freq: f, type: 'triangle', delay: i * 0.13, hold: 0.1, release: 0.3, gain: 0.24 }))
  },
  unlock () {
    tone({ freq: 523.25, type: 'sine', hold: 0.06, release: 0.2, gain: 0.2 })
    tone({ freq: 783.99, type: 'sine', delay: 0.1, hold: 0.06, release: 0.26, gain: 0.2 })
  },
  horn () {
    tone({ freq: 392, type: 'sawtooth', hold: 0.22, release: 0.12, gain: 0.16 })
    tone({ freq: 523.25, type: 'sawtooth', hold: 0.22, release: 0.12, gain: 0.12, detune: 6 })
  },
  blinker () { tone({ freq: 1100, type: 'square', hold: 0.02, release: 0.05, gain: 0.07 }) },
  charge () {
    for (let i = 0; i < 5; i++) tone({ freq: 400 + i * 120, type: 'sine', delay: i * 0.16, hold: 0.05, release: 0.14, gain: 0.14 })
  },
  sleepy () { tone({ freq: 420, to: 180, type: 'sine', hold: 0.16, release: 0.4, gain: 0.16 }) },
  whoosh () { noise({ dur: 0.35, gain: 0.16, cutoff: 400, sweepTo: 2400, type: 'bandpass' }) },
  pop () { tone({ freq: 880, to: 1500, type: 'sine', hold: 0.01, release: 0.09, gain: 0.14 }) },
  butterfly () {
    const notes = [880, 1174.7, 1568]
    notes.forEach((f, i) => tone({ freq: f, type: 'sine', delay: i * 0.07, hold: 0.03, release: 0.22, gain: 0.16 }))
  },
  wrench () {
    for (let i = 0; i < 5; i++) {
      noise({ dur: 0.035, gain: 0.09, cutoff: 5000, delay: i * 0.035, type: 'highpass' })
    }
    tone({ freq: 240, to: 180, type: 'square', hold: 0.02, release: 0.1, gain: 0.07 })
  },
  airLift () {
    noise({ dur: 0.7, gain: 0.16, cutoff: 900, sweepTo: 3200, type: 'bandpass' })
    tone({ freq: 90, to: 150, type: 'sine', hold: 0.35, release: 0.3, gain: 0.12 })
  },
  rev () {
    tone({ freq: 70, to: 260, type: 'sawtooth', attack: 0.05, hold: 0.18, release: 0.35, gain: 0.14 })
    tone({ freq: 140, to: 520, type: 'sawtooth', attack: 0.05, hold: 0.18, release: 0.3, gain: 0.07, detune: 8 })
    noise({ dur: 0.5, gain: 0.08, cutoff: 500, sweepTo: 2000 })
  },
  shutter () {
    noise({ dur: 0.9, gain: 0.12, cutoff: 700, sweepTo: 260 })
    tone({ freq: 160, to: 90, type: 'square', hold: 0.5, release: 0.2, gain: 0.06 })
  },
  allCut () {
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((f, i) => tone({ freq: f, type: 'triangle', delay: i * 0.1, hold: 0.08, release: 0.3, gain: 0.2 }))
  }
}

// ------------------------------------------------------------------ motorlyd

export const engine = {
  _osc: null,
  _sub: null,
  _gain: null,
  _filter: null,
  start () {
    if (!ac || muted || this._osc) return
    const g = ac.createGain()
    g.gain.value = 0
    const f = ac.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 700
    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 62
    const sub = ac.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = 31
    osc.connect(f)
    sub.connect(f)
    f.connect(g).connect(master)
    osc.start()
    sub.start()
    this._osc = osc; this._sub = sub; this._gain = g; this._filter = f
  },
  /** level 0..1 = hvor haardt maskinen koerer. */
  setLevel (level) {
    // Banen kan starte foer lyden er laast op - saa startes motoren her.
    if (!this._osc) this.start()
    if (!this._gain || !ac) return
    const t = now()
    this._gain.gain.setTargetAtTime(0.035 + level * 0.055, t, 0.08)
    this._osc.frequency.setTargetAtTime(58 + level * 46, t, 0.12)
    this._sub.frequency.setTargetAtTime(29 + level * 23, t, 0.12)
    this._filter.frequency.setTargetAtTime(520 + level * 900, t, 0.12)
  },
  stop () {
    if (!this._osc) return
    try {
      const t = now()
      this._gain.gain.setTargetAtTime(0.0001, t, 0.06)
      this._osc.stop(t + 0.4)
      this._sub.stop(t + 0.4)
    } catch { /* ignore */ }
    this._osc = null; this._sub = null; this._gain = null; this._filter = null
  }
}

// ------------------------------------------------------------------ musik
//
// En lille sequencer i stedet for lydfiler: dyb bas, hi-hat og en akkord der
// aander. Den skal ligge under talen, aldrig oven paa.

const BASS = [0, 0, 7, 0, 5, 0, 7, 3]
const ROOT = 55 // A1

export const music = {
  _timer: null,
  _step: 0,
  _next: 0,
  _gain: null,
  _filter: null,

  startGarage () {
    if (!ac || muted || this._timer) return
    const g = ac.createGain()
    g.gain.value = 0.0001
    g.gain.setTargetAtTime(0.5, ac.currentTime, 1.2)
    const f = ac.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 900
    f.Q.value = 3
    f.connect(g).connect(master)
    this._gain = g
    this._filter = f
    this._step = 0
    this._next = ac.currentTime + 0.15
    this._timer = setInterval(() => this._schedule(), 60)
  },

  /** Filteret aabner et oejeblik - bruges naar man skifter kategori. */
  sweep () {
    if (!this._filter || !ac) return
    const t = ac.currentTime
    this._filter.frequency.cancelScheduledValues(t)
    this._filter.frequency.setValueAtTime(2600, t)
    this._filter.frequency.setTargetAtTime(900, t + 0.05, 0.5)
  },

  _schedule () {
    if (!ac || !this._gain) return
    const spb = 0.155
    while (this._next < ac.currentTime + 0.35) {
      const t = this._next
      const step = this._step % 16
      const half = step % 8
      if (step % 2 === 0) {
        const osc = ac.createOscillator()
        const eg = ac.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(ROOT * Math.pow(2, BASS[half] / 12), t)
        eg.gain.setValueAtTime(0.0001, t)
        eg.gain.exponentialRampToValueAtTime(0.22, t + 0.01)
        eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
        osc.connect(eg).connect(this._filter)
        osc.start(t); osc.stop(t + 0.34)
      }
      if (step % 4 === 2) {
        const frames = Math.floor(ac.sampleRate * 0.05)
        const buf = ac.createBuffer(1, frames, ac.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / frames)
        const src = ac.createBufferSource()
        src.buffer = buf
        const hp = ac.createBiquadFilter()
        hp.type = 'highpass'
        hp.frequency.value = 6000
        const hg = ac.createGain()
        hg.gain.value = 0.06
        src.connect(hp).connect(hg).connect(this._gain)
        src.start(t)
      }
      if (step === 0 || step === 8) {
        for (const mul of [4, 6, 9.51]) {
          const osc = ac.createOscillator()
          const eg = ac.createGain()
          osc.type = 'triangle'
          osc.frequency.value = ROOT * mul * 0.5
          eg.gain.setValueAtTime(0.0001, t)
          eg.gain.exponentialRampToValueAtTime(0.03, t + 0.4)
          eg.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
          osc.connect(eg).connect(this._gain)
          osc.start(t); osc.stop(t + 1.4)
        }
      }
      this._next += spb
      this._step++
    }
  },

  stop () {
    if (this._timer) { clearInterval(this._timer); this._timer = null }
    if (this._gain && ac) {
      this._gain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2)
      const g = this._gain
      setTimeout(() => { try { g.disconnect() } catch { /* ignore */ } }, 800)
    }
    this._gain = null
    this._filter = null
  }
}

// ------------------------------------------------------------------ havelyd

export const ambience = {
  _timer: null,
  _src: null,
  _gain: null,
  _birds: true,

  start ({ birds = true, water = false } = {}) {
    if (!ac || muted || this._timer) return
    this._birds = birds
    // vind: filtreret stoej der aander
    const frames = Math.floor(ac.sampleRate * 2)
    const buf = ac.createBuffer(1, frames, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < frames; i++) d[i] = Math.random() * 2 - 1
    const src = ac.createBufferSource()
    src.buffer = buf
    src.loop = true
    const filt = ac.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.value = water ? 700 : 420
    filt.Q.value = 0.7
    const g = ac.createGain()
    g.gain.value = 0.0001
    g.gain.setTargetAtTime(water ? 0.05 : 0.035, ac.currentTime, 1.5)
    const lfo = ac.createOscillator()
    const lfoGain = ac.createGain()
    lfo.frequency.value = 0.12
    lfoGain.gain.value = 160
    lfo.connect(lfoGain).connect(filt.frequency)
    lfo.start()
    src.connect(filt).connect(g).connect(master)
    src.start()
    this._src = src
    this._gain = g
    this._lfo = lfo
    this._timer = setInterval(() => this._chirp(), 2600)
  },

  _chirp () {
    if (!ac || muted || !this._birds || Math.random() < 0.45) return
    const base = 1500 + Math.random() * 1400
    const n = 2 + ((Math.random() * 3) | 0)
    for (let i = 0; i < n; i++) {
      tone({
        freq: base * (1 + i * 0.12),
        to: base * (1 + i * 0.12) * (Math.random() < 0.5 ? 1.5 : 0.7),
        type: 'sine',
        delay: i * 0.09,
        attack: 0.01,
        hold: 0.02,
        release: 0.09,
        gain: 0.035
      })
    }
  },

  stop () {
    if (this._timer) { clearInterval(this._timer); this._timer = null }
    if (this._gain && ac) this._gain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3)
    const src = this._src
    const lfo = this._lfo
    setTimeout(() => {
      try { src && src.stop() } catch { /* ignore */ }
      try { lfo && lfo.stop() } catch { /* ignore */ }
    }, 700)
    this._src = null
    this._gain = null
    this._lfo = null
  }
}

// ------------------------------------------------------------------ oplaeser

let danishVoice = null
let voicesReady = false

function pickVoice () {
  if (!window.speechSynthesis) return null
  const all = window.speechSynthesis.getVoices() || []
  if (all.length) voicesReady = true
  return all.find(v => (v.lang || '').toLowerCase().startsWith('da')) || null
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  danishVoice = pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => { danishVoice = pickVoice() })
}

export function stopSpeech () {
  try { window.speechSynthesis?.cancel() } catch { /* ignore */ }
}

const lastSaid = new Map()

/**
 * Siger en vilkaarlig tekst. opts.key styrer gentagelses-spaerren.
 * Samme replik gentages ikke inden for 5 sekunder, medmindre force er sat.
 */
export function sayText (text, opts = {}) {
  if (!text) return
  const key = opts.key || text
  const stamp = performance.now()
  if (!opts.force && stamp - (lastSaid.get(key) || -1e9) < 5000) return
  lastSaid.set(key, stamp)
  if (muted || !window.speechSynthesis) return
  try {
    if (!danishVoice) danishVoice = pickVoice()
    if (!danishVoice && voicesReady) return // ingen dansk stemme -> stille
    stopSpeech()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'da-DK'
    if (danishVoice) u.voice = danishVoice
    u.rate = 0.95
    u.pitch = 1.15
    u.volume = 1
    window.speechSynthesis.speak(u)
  } catch { /* stille er ogsaa fint */ }
}

/** say('done', { navn: 'Zippy' }) - slaar replikken op i afsnit 10. */
export function say (key, vars = {}, opts = {}) {
  return sayText(line(key, vars), { ...opts, key })
}

export function forgetSaid (key) {
  if (key) lastSaid.delete(key)
  else lastSaid.clear()
}
