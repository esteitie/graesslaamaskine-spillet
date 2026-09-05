// localStorage med versionsnummer (spilplan 9.3, udvidet i niveau 2 fase 7).

const KEY = 'graesslaamaskine-spillet'
const VERSION = 3

export const LEVEL_COUNT = 5
export const PROFILE_COUNT = 2
export const LEVELS_OF_DIFFICULTY = ['let', 'mellem', 'svaer']

/** Et barns egen gemmeplads: maskine, stjerner, skoleopgaver og lyd. */
function blankProfile () {
  return {
    machine: null,
    stars: [0, 0, 0, 0, 0],
    muted: false,
    school: { stickers: 0, done: {}, difficulty: 'let', levels: {}, today: null }
  }
}

export const SCHOOL_LEVEL_MAX = 8

function blankFile () {
  return {
    version: VERSION,
    active: 0,
    profiles: [blankProfile(), blankProfile()]
  }
}

function saneProfile (data) {
  const s = blankProfile()
  if (!data || typeof data !== 'object') return s
  if (data.machine && typeof data.machine === 'object') s.machine = data.machine
  if (Array.isArray(data.stars)) {
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const v = Number(data.stars[i])
      s.stars[i] = Number.isFinite(v) ? Math.min(3, Math.max(0, Math.round(v))) : 0
    }
  }
  s.muted = data.muted === true
  const school = data.school
  if (school && typeof school === 'object') {
    const stickers = Number(school.stickers)
    s.school.stickers = Number.isFinite(stickers) ? Math.max(0, Math.round(stickers)) : 0
    if (school.done && typeof school.done === 'object') s.school.done = { ...school.done }
    if (LEVELS_OF_DIFFICULTY.includes(school.difficulty)) s.school.difficulty = school.difficulty
    if (school.levels && typeof school.levels === 'object') {
      for (const [k, v] of Object.entries(school.levels)) {
        const n = Number(v)
        if (Number.isFinite(n)) s.school.levels[k] = Math.max(1, Math.min(SCHOOL_LEVEL_MAX, Math.round(n)))
      }
    }
    if (school.today && typeof school.today === 'object' && typeof school.today.date === 'string') {
      s.school.today = { date: school.today.date, gates: 0, count: 0, letters: 0, mazes: 0 }
      for (const k of ['gates', 'count', 'letters', 'mazes']) {
        const n = Number(school.today[k])
        if (Number.isFinite(n)) s.school.today[k] = Math.max(0, Math.round(n))
      }
    }
  }
  return s
}

function sane (data) {
  const f = blankFile()
  if (!data || typeof data !== 'object') return f
  // aeldre gem havde kun ét barn - det bliver spiller 1
  if (data.version === 1 || data.version === 2) {
    f.profiles[0] = saneProfile(data)
    return f
  }
  if (data.version !== VERSION) return f
  const active = Number(data.active)
  f.active = Number.isFinite(active) ? Math.min(PROFILE_COUNT - 1, Math.max(0, Math.round(active))) : 0
  if (Array.isArray(data.profiles)) {
    for (let i = 0; i < PROFILE_COUNT; i++) f.profiles[i] = saneProfile(data.profiles[i])
  }
  return f
}

let file = blankFile()
let state = file.profiles[0]

export function load () {
  try {
    file = sane(JSON.parse(localStorage.getItem(KEY)))
  } catch {
    file = blankFile()
  }
  state = file.profiles[file.active]
  return state
}

export function get () {
  return state
}

export function persist () {
  try {
    localStorage.setItem(KEY, JSON.stringify(file))
  } catch {
    /* privat browsing: spillet virker stadig, det husker bare ikke. */
  }
  return state
}

export function update (fn) {
  fn(state)
  return persist()
}

/** Nulstiller kun det barn der spiller lige nu. */
export function reset () {
  file.profiles[file.active] = blankProfile()
  state = file.profiles[file.active]
  return persist()
}

// ------------------------------------------------------------------ spillere

export function activeProfile () {
  return file.active
}

export function setActiveProfile (index) {
  const i = Math.min(PROFILE_COUNT - 1, Math.max(0, Math.round(index)))
  file.active = i
  state = file.profiles[i]
  persist()
  return state
}

/** Kort overblik til vaelgeren paa introskaermen. */
export function profiles () {
  return file.profiles.map((p, i) => ({
    index: i,
    machine: p.machine,
    stars: p.stars.reduce((a, b) => a + b, 0),
    stickers: p.school.stickers,
    used: !!p.machine
  }))
}

export function anyProfileUsed () {
  return file.profiles.some(p => !!p.machine)
}

/** Bane n (1-baseret) er aaben hvis den er klaret foer, eller er den foerste ulaeste. */
export function isUnlocked (levelNumber) {
  if (levelNumber <= 1) return true
  return state.stars[levelNumber - 2] > 0
}

export function nextLevel () {
  for (let i = 0; i < LEVEL_COUNT; i++) {
    if (state.stars[i] === 0) return i + 1
  }
  return LEVEL_COUNT
}

export function allDone () {
  return state.stars.every(s => s > 0)
}

export function recordStars (levelNumber, stars) {
  update(s => {
    const i = levelNumber - 1
    if (stars > s.stars[i]) s.stars[i] = stars
  })
}

// ------------------------------------------------------------------ Skolehaven

export function school () {
  return state.school
}

export function setDifficulty (value) {
  if (!LEVELS_OF_DIFFICULTY.includes(value)) return
  update(s => { s.school.difficulty = value })
}

/**
 * Klarede opgaver giver klistermaerker til bogen. Bogstaver og labyrinter
 * giver kun foerste gang; regne-porte og taelle-bedet giver hver gang en
 * runde er klaret - det er dem man bliver bedre af at gentage.
 */
export function recordSchool (id, { repeatable = false, stickers = 1 } = {}) {
  let earned = 0
  update(s => {
    const before = s.school.done[id] || 0
    if (!before || repeatable) {
      s.school.stickers += stickers
      earned = stickers
    }
    s.school.done[id] = before + 1
  })
  return earned
}

/** Hvor langt barnet er i en aktivitet (1-8). Svaerhedsgraden saetter gulvet. */
export function schoolLevel (id) {
  const floor = { let: 1, mellem: 3, svaer: 5 }[state.school.difficulty] || 1
  const n = Number(state.school.levels[id])
  return Math.max(floor, Number.isFinite(n) ? Math.min(SCHOOL_LEVEL_MAX, Math.round(n)) : 1)
}

export function setSchoolLevel (id, n) {
  update(s => { s.school.levels[id] = Math.max(1, Math.min(SCHOOL_LEVEL_MAX, Math.round(n))) })
}

function todayKey () {
  return new Date().toISOString().slice(0, 10)
}

/** Dagens overblik til voksen-panelet. */
export function todayStats () {
  const t = state.school.today
  const key = todayKey()
  return t && t.date === key ? t : { date: key, gates: 0, count: 0, letters: 0, mazes: 0 }
}

export function bumpToday (kind, n = 1) {
  update(s => {
    const key = todayKey()
    if (!s.school.today || s.school.today.date !== key) {
      s.school.today = { date: key, gates: 0, count: 0, letters: 0, mazes: 0 }
    }
    s.school.today[kind] = (s.school.today[kind] || 0) + n
  })
}

export function schoolDone (id) {
  return !!state.school.done[id]
}
