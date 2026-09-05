// Maskinens datamodel, effekt-tabel og tegning.
// Designet er vores eget: afrundet "bille"-form, stor roed stopknap,
// to store baghjul og et lille forhjul. Naesen peger mod +x (vinkel 0).

export const VIEW_W = 280
export const VIEW_H = 240
export const DRAW_W = 56 // logiske px paa banen
export const DRAW_H = 48

export const BASE_SPEED = 140 // px/s manuelt
export const AUTO_SPEED = 110 // px/s i auto

export const COLORS = {
  orange: { base: '#f97316', dark: '#b8460b', light: '#ffc48a' },
  green: { base: '#2fb457', dark: '#177038', light: '#96eeae' },
  blue: { base: '#3b82f6', dark: '#1b4bad', light: '#a8c9ff' },
  pink: { base: '#ec4899', dark: '#a4155f', light: '#ffb0d8' },
  silver: { base: '#cbd5e1', dark: '#6b7a8d', light: '#f4f8fc' },
  rainbow: { base: 'rainbow', dark: '#7a3fa0', light: '#ffffff' }
}

export const WHEELS = {
  standard: { speed: 1.0, hill: 0.4 },
  terrain: { speed: 1.0, hill: 0.9 },
  tracks: { speed: 0.85, hill: 1.0 },
  spikes: { speed: 1.15, hill: 0.7 }
}

export const BLADES = { small: 20, star: 26, triple: 32, laser: 40 }

export const SCREENS = ['lamp', 'smiley', 'rainbow', 'cat']

export const EXTRAS = ['flag', 'lights', 'horn', 'eyes', 'solar', 'stickers']

export const NAMES = [
  { id: 'Zippy', icon: '⚡' },
  { id: 'Bob', icon: '🔧' },
  { id: 'Flip', icon: '🌀' },
  { id: 'Græs-Gunnar', icon: '🌿' },
  { id: 'Lotte', icon: '🌸' },
  { id: 'Max', icon: '🚀' },
  { id: 'Mimi', icon: '🐱' },
  { id: 'Turbo', icon: '🔥' }
]

export function defaultMachine () {
  return {
    name: 'Zippy',
    color: 'orange',
    wheels: 'standard',
    blade: 'small',
    screen: 'lamp',
    extras: []
  }
}

/** Retter et hvilket som helst objekt op til en gyldig maskine. */
export function sanitize (m) {
  const d = defaultMachine()
  if (!m || typeof m !== 'object') return d
  const known = NAMES.map(n => n.id)
  return {
    name: known.includes(m.name) ? m.name : d.name,
    color: COLORS[m.color] ? m.color : d.color,
    wheels: WHEELS[m.wheels] ? m.wheels : d.wheels,
    blade: BLADES[m.blade] ? m.blade : d.blade,
    screen: SCREENS.includes(m.screen) ? m.screen : d.screen,
    extras: Array.isArray(m.extras) ? m.extras.filter(e => EXTRAS.includes(e)) : []
  }
}

export function stats (machine) {
  const m = sanitize(machine)
  const w = WHEELS[m.wheels]
  return {
    speed: w.speed,
    hill: w.hill,
    cutRadius: BLADES[m.blade],
    batteryMul: m.extras.includes('solar') ? 1.5 : 1
  }
}

export function has (machine, extra) {
  return !!machine && Array.isArray(machine.extras) && machine.extras.includes(extra)
}

// ------------------------------------------------------------------ SVG-dele

function bodyFill (color, uid) {
  return color === 'rainbow' ? `url(#body${uid})` : COLORS[color].base
}

function defs (color, uid) {
  const c = COLORS[color]
  let out = `<linearGradient id="gloss${uid}" x1="0" y1="0" x2="0" y2="1">` +
    '<stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>' +
    '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>'
  if (color === 'rainbow') {
    out += `<linearGradient id="body${uid}" x1="0" y1="0" x2="1" y2="1">` +
      '<stop offset="0" stop-color="#ff5f6d"/><stop offset=".25" stop-color="#ffb347"/>' +
      '<stop offset=".5" stop-color="#ffe66d"/><stop offset=".75" stop-color="#4fd46e"/>' +
      '<stop offset="1" stop-color="#5b8def"/></linearGradient>'
  } else {
    out += `<radialGradient id="body${uid}" cx=".35" cy=".3" r=".95">` +
      `<stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.base}"/>` +
      `<stop offset="1" stop-color="${c.dark}"/></radialGradient>`
  }
  return `<defs>${out}</defs>`
}

const BODY_PATH = 'M 62 34 H 178 C 216 34 236 62 236 120 C 236 178 216 206 178 206 H 62 ' +
  'C 40 206 26 190 26 168 V 72 C 26 50 40 34 62 34 Z'

function wheelsMarkup (type) {
  const tyre = '#2c2c31'
  const rim = '#6f7078'
  if (type === 'tracks') {
    let seg = ''
    for (let x = 46; x <= 190; x += 18) {
      seg += `<line x1="${x}" y1="12" x2="${x}" y2="40"/><line x1="${x}" y1="200" x2="${x}" y2="228"/>`
    }
    return `<g fill="${tyre}">` +
      '<rect x="34" y="6" width="170" height="40" rx="20"/>' +
      '<rect x="34" y="194" width="170" height="40" rx="20"/></g>' +
      `<g stroke="${rim}" stroke-width="5" stroke-linecap="round">${seg}</g>` +
      `<g fill="${rim}"><circle cx="50" cy="26" r="9"/><circle cx="188" cy="26" r="9"/>` +
      '<circle cx="50" cy="214" r="9"/><circle cx="188" cy="214" r="9"/></g>'
  }
  if (type === 'terrain') {
    let tread = ''
    for (let x = 56; x <= 122; x += 21) {
      tread += `<rect x="${x}" y="4" width="11" height="46" rx="5"/><rect x="${x}" y="190" width="11" height="46" rx="5"/>`
    }
    return `<g fill="${tyre}">` +
      '<rect x="42" y="2" width="90" height="50" rx="24"/>' +
      '<rect x="42" y="188" width="90" height="50" rx="24"/></g>' +
      `<g fill="${rim}" opacity=".85">${tread}</g>` +
      `<g fill="#f0c419"><circle cx="87" cy="27" r="11"/><circle cx="87" cy="213" r="11"/></g>` +
      '<g fill="#2c2c31"><circle cx="87" cy="27" r="5"/><circle cx="87" cy="213" r="5"/></g>'
  }
  let spikes = ''
  if (type === 'spikes') {
    for (let x = 62; x <= 112; x += 17) {
      spikes += `<path d="M ${x - 9} 12 L ${x} -2 L ${x + 9} 12 Z"/>`
      spikes += `<path d="M ${x - 9} 228 L ${x} 242 L ${x + 9} 228 Z"/>`
    }
    spikes = `<g fill="#9aa1ab">${spikes}</g>`
  }
  return spikes + `<g fill="${tyre}">` +
    '<rect x="52" y="10" width="70" height="34" rx="16"/>' +
    '<rect x="52" y="196" width="70" height="34" rx="16"/></g>' +
    `<g stroke="${rim}" stroke-width="4" stroke-linecap="round">` +
    '<line x1="68" y1="17" x2="68" y2="37"/><line x1="87" y1="17" x2="87" y2="37"/><line x1="106" y1="17" x2="106" y2="37"/>' +
    '<line x1="68" y1="203" x2="68" y2="223"/><line x1="87" y1="203" x2="87" y2="223"/><line x1="106" y1="203" x2="106" y2="223"/></g>'
}

function screenMarkup (type, mood) {
  const sleepy = mood === 'sleepy'
  const happy = mood === 'happy'
  const frame = '<rect x="118" y="78" width="78" height="84" rx="16" fill="#132a44" stroke="#0a1a2c" stroke-width="5"/>' +
    '<rect x="124" y="84" width="66" height="30" rx="12" fill="#ffffff" opacity=".10"/>'
  const cx = 157
  const cy = 120
  let face = ''
  if (type === 'lamp') {
    const glow = sleepy ? '#6b7b8c' : '#ffe066'
    face = `<circle cx="${cx}" cy="${cy}" r="${sleepy ? 15 : 20}" fill="${glow}"/>` +
      (sleepy ? '' : `<circle cx="${cx}" cy="${cy}" r="27" fill="none" stroke="${glow}" stroke-width="4" opacity=".45"/>`)
  } else if (type === 'smiley') {
    if (sleepy) {
      face = '<g stroke="#ffe066" stroke-width="6" stroke-linecap="round" fill="none">' +
        `<path d="M 138 112 q 8 8 16 0"/><path d="M 162 112 q 8 8 16 0"/>` +
        `<circle cx="${cx}" cy="140" r="7"/></g>` +
        '<text x="184" y="94" font-size="22" fill="#ffe066" font-family="system-ui, sans-serif">z</text>'
    } else {
      face = '<g fill="#ffe066">' +
        `<circle cx="142" cy="110" r="8"/><circle cx="172" cy="110" r="8"/></g>` +
        `<path d="M 136 ${happy ? 132 : 136} q 21 ${happy ? 26 : 14} 42 0" fill="none" stroke="#ffe066" stroke-width="7" stroke-linecap="round"/>`
    }
  } else if (type === 'rainbow') {
    const op = sleepy ? '.35' : '1'
    face = `<g fill="none" stroke-width="9" stroke-linecap="round" opacity="${op}">` +
      `<path d="M 128 146 a 29 29 0 0 1 58 0" stroke="#ff5f6d"/>` +
      `<path d="M 138 146 a 19 19 0 0 1 38 0" stroke="#ffd166"/>` +
      `<path d="M 148 146 a 9 9 0 0 1 18 0" stroke="#4fd46e"/></g>`
  } else {
    const op = sleepy ? '.5' : '1'
    face = `<g opacity="${op}">` +
      '<path d="M 130 96 L 134 76 L 148 90 Z" fill="#ffb0d8"/>' +
      '<path d="M 184 96 L 180 76 L 166 90 Z" fill="#ffb0d8"/>'
    face += sleepy
      ? '<g stroke="#ffe066" stroke-width="5" stroke-linecap="round" fill="none"><path d="M 136 112 q 8 7 16 0"/><path d="M 162 112 q 8 7 16 0"/></g>'
      : '<g fill="#ffe066"><ellipse cx="144" cy="112" rx="7" ry="9"/><ellipse cx="170" cy="112" rx="7" ry="9"/></g>'
    face += `<path d="M 152 130 L 162 130 L 157 137 Z" fill="#ffb0d8"/>` +
      '<g stroke="#ffe066" stroke-width="3" stroke-linecap="round">' +
      '<line x1="124" y1="128" x2="140" y2="132"/><line x1="190" y1="128" x2="174" y2="132"/>' +
      '<line x1="124" y1="140" x2="140" y2="138"/><line x1="190" y1="140" x2="174" y2="138"/></g></g>'
  }
  return frame + face
}

function extrasMarkup (machine, mood, tick) {
  const on = machine.extras || []
  let out = ''
  if (on.includes('solar')) {
    out += '<rect x="86" y="76" width="28" height="88" rx="6" fill="#173a63" stroke="#0c2340" stroke-width="4"/>' +
      '<g stroke="#5aa0e0" stroke-width="3" opacity=".8">' +
      '<line x1="100" y1="80" x2="100" y2="160"/><line x1="88" y1="104" x2="112" y2="104"/>' +
      '<line x1="88" y1="128" x2="112" y2="128"/></g>'
  }
  if (on.includes('horn')) {
    out += '<path d="M 66 170 L 92 160 L 92 196 L 66 186 Z" fill="#c9a227" stroke="#8a6d13" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="98" cy="178" r="9" fill="#e5c766" stroke="#8a6d13" stroke-width="4"/>'
  }
  if (on.includes('lights')) {
    const glow = tick ? '#fff3b0' : '#ffb703'
    out += `<g stroke="#8a5a00" stroke-width="4">` +
      `<circle cx="200" cy="72" r="12" fill="${glow}"/><circle cx="200" cy="168" r="12" fill="${glow}"/></g>`
    if (tick) {
      out += '<g fill="#fff3b0" opacity=".45"><circle cx="200" cy="72" r="22"/><circle cx="200" cy="168" r="22"/></g>'
    }
  }
  if (on.includes('eyes')) {
    const look = mood === 'sleepy' ? 0 : 4
    out += '<g stroke="#2c2c31" stroke-width="4">' +
      '<ellipse cx="216" cy="98" rx="15" ry="17" fill="#ffffff"/>' +
      '<ellipse cx="216" cy="142" rx="15" ry="17" fill="#ffffff"/></g>'
    out += mood === 'sleepy'
      ? '<g stroke="#2c2c31" stroke-width="5" stroke-linecap="round"><line x1="206" y1="98" x2="226" y2="98"/><line x1="206" y1="142" x2="226" y2="142"/></g>'
      : `<g fill="#2c2c31"><circle cx="${216 + look}" cy="98" r="7"/><circle cx="${216 + look}" cy="142" r="7"/></g>`
  }
  if (on.includes('flag')) {
    out += '<line x1="62" y1="68" x2="20" y2="22" stroke="#4a3b2f" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M 20 22 L 62 32 L 24 46 Z" fill="#e5484d" stroke="#a01f24" stroke-width="4" stroke-linejoin="round"/>'
  }
  if (on.includes('stickers')) {
    out += '<path d="M 150 176 l 5 11 12 2 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -2 Z" fill="#ffd166" stroke="#b8860b" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M 150 66 c -7 -10 -22 -2 -14 8 l 14 14 14 -14 c 8 -10 -7 -18 -14 -8 Z" fill="#ff6b9d" stroke="#a4155f" stroke-width="3"/>' +
      '<circle cx="206" cy="192" r="9" fill="#4fd46e" stroke="#177038" stroke-width="3"/>'
  }
  return out
}

function bladeMarkup (type) {
  const r = { small: 68, star: 88, triple: 110, laser: 132 }[type] || 68
  const cx = 140
  const cy = 120
  const skin = 'fill="#ffffff" fill-opacity=".22" stroke="#ffffff" stroke-opacity=".8" stroke-width="4"'
  if (type === 'star') {
    let d = ''
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      d += `${i ? 'L' : 'M'} ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `
    }
    return `<path d="${d}Z" ${skin} stroke-linejoin="round"/>`
  }
  if (type === 'triple') {
    let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="4" stroke-dasharray="10 10"/>`
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      out += `<rect x="${cx - 7}" y="${cy - r}" width="14" height="${r}" rx="7" ${skin} transform="rotate(${(a * 180) / Math.PI} ${cx} ${cy})"/>`
    }
    return out
  }
  if (type === 'laser') {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#8ef0ff" fill-opacity=".18" stroke="#8ef0ff" stroke-width="5" stroke-opacity=".9"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="#8ef0ff" stroke-width="4" stroke-opacity=".6" stroke-dasharray="12 10"/>` +
      `<circle cx="${cx}" cy="${cy}" r="14" fill="#8ef0ff" fill-opacity=".9"/>`
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${skin}/>`
}

/**
 * SVG-markup for maskinen.
 * opts: { mood: 'idle'|'happy'|'sleepy', showBlade, blink, uid }
 */
export function machineSVG (raw, opts = {}) {
  const m = sanitize(raw)
  const mood = opts.mood || 'idle'
  const uid = opts.uid || 'm'
  const c = COLORS[m.color]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">` +
    defs(m.color, uid) +
    wheelsMarkup(m.wheels) +
    (m.wheels === 'tracks' ? '' : `<circle cx="246" cy="120" r="12" fill="#2c2c31"/>`) +
    `<path d="${BODY_PATH}" fill="url(#body${uid})" stroke="${c.dark}" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="M 62 40 H 176 C 206 40 226 64 228 104 C 190 84 96 82 34 104 V 74 C 34 54 44 40 62 40 Z" fill="url(#gloss${uid})"/>` +
    extrasMarkup(m, mood, !!opts.blink) +
    screenMarkup(m.screen, mood) +
    `<circle cx="58" cy="120" r="25" fill="#e5484d" stroke="#8f1015" stroke-width="6"/>` +
    `<circle cx="58" cy="113" r="13" fill="#ff8a8f" opacity=".75"/>` +
    (opts.showBlade ? bladeMarkup(m.blade) : '') +
    '</svg>'
}

// ------------------------------------------------------------------ til canvas

const imageCache = new Map()

function key (machine, mood) {
  const m = sanitize(machine)
  return [m.name, m.color, m.wheels, m.blade, m.screen, m.extras.slice().sort().join('+'), mood].join('|')
}

function loadImage (machine, mood) {
  const svg = machineSVG(machine, { mood, uid: 'c' })
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  return new Promise(resolve => {
    const img = new Image()
    img.decoding = 'sync'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Henter et faerdigt Image (eller null hvis det ikke er indlaest endnu). */
export function getImage (machine, mood = 'idle') {
  return imageCache.get(key(machine, mood)) || null
}

/** Loader alle humoerer for maskinen, saa banen aldrig venter paa et billede. */
export async function preloadMachine (machine) {
  const moods = ['idle', 'happy', 'sleepy']
  await Promise.all(moods.map(async mood => {
    const k = key(machine, mood)
    if (imageCache.has(k)) return
    const img = await loadImage(machine, mood)
    if (img) imageCache.set(k, img)
  }))
  return moods.map(mood => getImage(machine, mood))
}
