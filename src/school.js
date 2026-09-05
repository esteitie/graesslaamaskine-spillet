// Skolehaven: begyndende skoleopgaver pakket ind i graesslaaning.
// Oplaeseren er laereren - intet skal laeses, og et forkert svar er aldrig en straf.
// Fase 9: man bliver bedre (trin 1-8 pr. aktivitet), man kan se hvor langt man er
// (fem prikker pr. runde), og hjaelpen kommer i lag: foerst et vink, saa et stillads.

import { sfx, say, sayText } from './audio.js'
import * as save from './save.js'
import { el, iconButton } from './ui.js'
import { createJoystick, createKeyboard, createDrawInput, LOGICAL_W, LOGICAL_H } from './input.js'
import { createConfetti } from './confetti.js'
import { makeRandom, TAU, clamp, dist } from './geometry.js'
import * as render from './render.js'
import { bubble } from './guide.js'

const KIND_EMOJI = { flower: '🌼', butterfly: '🦋', ladybird: '🐞', apple: '🍎' }

export const LETTERS = ['letterI', 'letterL', 'letterT', 'letterH', 'letterU', 'letterF', 'letterE', 'letterM', 'letterN', 'letterZ']
export const MAZES = ['maze1', 'maze2', 'maze3', 'maze4', 'maze5', 'maze6']
const ROUNDS = 5
const NUMBER_WORDS = ['en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten']

// trin 1-8: hvad opgaverne kraever
const GATE_LEVELS = [
  { max: 4, options: 2, minus: false },
  { max: 5, options: 2, minus: false },
  { max: 6, options: 3, minus: false },
  { max: 8, options: 3, minus: false },
  { max: 10, options: 3, minus: false },
  { max: 10, options: 3, minus: true },
  { max: 15, options: 4, minus: true },
  { max: 20, options: 4, minus: true }
]
const COUNT_LEVELS = [
  { max: 3, kinds: 1 },
  { max: 5, kinds: 1 },
  { max: 6, kinds: 1 },
  { max: 8, kinds: 1 },
  { max: 8, kinds: 2 },
  { max: 10, kinds: 2 },
  { max: 12, kinds: 2 },
  { max: 15, kinds: 3 }
]
const KINDS = [
  { id: 'flower', plural: 'blomster' },
  { id: 'butterfly', plural: 'sommerfugle' },
  { id: 'ladybird', plural: 'mariehøns' },
  { id: 'apple', plural: 'æbler' }
]

function sky (ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H)
  g.addColorStop(0, '#a8dcf5')
  g.addColorStop(1, '#dff0c0')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
}

// ------------------------------------------------------------------ en runde paa fem

/**
 * Holder styr paa de fem runder, prikkerne oeverst, og om trinnet skal op
 * eller ned bagefter. Bruges af baade regne-porte og taelle-bedet.
 */
function createSession (root, id, guide) {
  const level = save.schoolLevel(id)
  const pips = el('div', { class: 'pips' }, ...Array.from({ length: ROUNDS }, () => el('i')))
  root.append(pips)
  const confetti = createConfetti()
  const s = { level, round: 0, wrongs: 0, wrongThisRound: 0, done: false, confetti, guide }

  s.right = (x, y) => {
    s.round++
    s.wrongThisRound = 0
    pips.children[s.round - 1]?.classList.add('done')
    confetti.sparkle(x, y, 26)
    sfx.star(Math.min(3, s.round - 1))
    const left = ROUNDS - s.round
    if (left > 0 && left < ROUNDS - 1) guide.say('school.roundsLeft', { antal: left }, { icon: bubble.dots(left) })
    else guide.say('school.right', {}, { icon: bubble.emoji('👍') })
    return s.round >= ROUNDS
  }

  s.wrong = () => {
    s.wrongs++
    s.wrongThisRound++
    sfx.nope()
    guide.say('school.tryAgain', {}, { icon: bubble.emoji('🙂') })
  }

  /** Runden er slut: klistermaerke, fanfare og maaske et trin op. */
  s.finish = () => {
    s.done = true
    let next = level
    if (s.wrongs <= 1) next = Math.min(save.SCHOOL_LEVEL_MAX, level + 1)
    else if (s.wrongs >= 4) next = Math.max(1, level - 1)
    save.setSchoolLevel(id, next)
    save.recordSchool(id, { repeatable: true })
    save.bumpToday(id, ROUNDS)
    sfx.fanfare()
    confetti.burst(LOGICAL_W / 2, 260, 140)
    s.guide.say('school.done', {}, { icon: bubble.emoji('⭐'), sticky: true })
    s.guide.cheer()
    if (next > level) setTimeout(() => s.guide.say('school.levelUp', {}, { icon: bubble.emoji('📈'), sticky: true }), 2400)
    s.leveledUp = next > level
  }
  return s
}

function backButton (app, root, to = 'school') {
  root.append(iconButton({
    icon: 'back', x: 62, y: 62, label: to === 'map' ? 'tilbage til kortet' : 'tilbage til skolehaven',
    onClick: () => { sfx.tap(); app.go(to) }
  }))
}

function doneButton (app, root, y) {
  const b = iconButton({
    icon: 'check', class: 'go', x: 480, y, label: 'videre',
    onClick: () => { sfx.tap(); app.go('school') }
  })
  b.hidden = true
  root.append(b)
  return b
}

// ------------------------------------------------------------------ hub

export function createSchool (app) {
  const root = el('div', { class: 'screen' })
  const school = save.school()
  backButton(app, root, 'map')

  const activities = [
    { icon: '➕', label: 'regne-porte', screen: 'gates', id: 'gates' },
    { icon: '🌼', label: 'tælle-bedet', screen: 'count', id: 'count' },
    { icon: '🔤', label: 'bogstav-plæner', list: LETTERS },
    { icon: '🌿', label: 'labyrinter', list: MAZES }
  ]

  activities.forEach((a, i) => {
    const x = 240 + (i % 2) * 480
    const y = 250 + Math.floor(i / 2) * 190
    root.append(iconButton({
      html: `<span style="font-size:.8em">${a.icon}</span>`,
      class: 'go garden',
      x,
      y,
      label: a.label,
      onClick: () => {
        sfx.whoosh()
        if (a.list) {
          const next = a.list.find(id => !save.schoolDone(id)) || a.list[(school.stickers) % a.list.length]
          app.go('level', { number: next, returnTo: 'school' })
        } else app.go(a.screen)
      }
    }))

    // under knappen: trin (regning/taelling) eller klarede baner (bogstaver/labyrinter)
    const ladder = el('div', { class: 'ladder' })
    ladder.style.left = (x / 960) * 100 + '%'
    ladder.style.top = ((y + 80) / 600) * 100 + '%'
    if (a.list) {
      const done = a.list.filter(id => save.schoolDone(id)).length
      a.list.forEach((_, k) => {
        const step = el('i', { class: k < done ? 'on' : '' })
        step.style.height = '12px'
        ladder.append(step)
      })
    } else {
      const level = save.schoolLevel(a.id)
      for (let k = 1; k <= save.SCHOOL_LEVEL_MAX; k++) {
        const step = el('i', { class: k <= level ? 'on' : '' })
        step.style.height = (6 + k * 2.2) + 'px'
        ladder.append(step)
      }
    }
    root.append(ladder)
  })

  app.guide.say('guide.school', {}, { icon: bubble.emoji('🏫'), side: 'center', sticky: true })
  let t = 0
  const stickers = school.stickers

  return {
    root,
    state: { screen: 'school' },
    update (dt) { t += dt },
    draw (ctx) {
      sky(ctx)
      ctx.fillStyle = '#8ed07d'
      ctx.beginPath()
      ctx.moveTo(0, 300)
      for (let x = 0; x <= LOGICAL_W; x += 40) ctx.lineTo(x, 296 + Math.cos(x / 110) * 14)
      ctx.lineTo(LOGICAL_W, LOGICAL_H); ctx.lineTo(0, LOGICAL_H)
      ctx.closePath(); ctx.fill()

      // skolehuset
      ctx.save()
      ctx.translate(480, 150)
      ctx.fillStyle = '#f2e2c4'
      ctx.beginPath(); ctx.roundRect(-120, -40, 240, 120, 10); ctx.fill()
      ctx.fillStyle = '#c0453f'
      ctx.beginPath(); ctx.moveTo(-140, -40); ctx.lineTo(0, -110); ctx.lineTo(140, -40); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#8fd3f4'
      for (const dx of [-70, 0, 70]) { ctx.beginPath(); ctx.roundRect(dx - 26, -18, 52, 46, 6); ctx.fill() }
      ctx.fillStyle = '#8c5f2b'
      ctx.beginPath(); ctx.roundRect(-24, 34, 48, 46, 5); ctx.fill()
      ctx.fillStyle = '#ffc300'
      ctx.beginPath(); ctx.arc(0, -74, 13, 0, TAU); ctx.fill()
      ctx.restore()

      // klistermaerkebogen
      ctx.save()
      ctx.translate(LOGICAL_W - 150, 78)
      ctx.fillStyle = 'rgba(255,255,255,.9)'
      ctx.beginPath(); ctx.roundRect(-96, -40, 192, 80, 14); ctx.fill()
      ctx.fillStyle = '#c0453f'
      ctx.beginPath(); ctx.roundRect(-96, -40, 16, 80, 8); ctx.fill()
      for (let k = 0; k < 8; k++) {
        const x = -62 + (k % 4) * 40
        const y = -18 + Math.floor(k / 4) * 36
        if (k < stickers) {
          ctx.fillStyle = ['#ffd166', '#ff6b9d', '#4fd46e', '#5b8def'][k % 4]
          ctx.beginPath()
          for (let s = 0; s < 10; s++) {
            const r = s % 2 ? 6 : 14
            const a = (s / 10) * TAU - Math.PI / 2 + t * 0.3
            s ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
          }
          ctx.closePath(); ctx.fill()
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,.16)'
          ctx.setLineDash([4, 4])
          ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke()
          ctx.setLineDash([])
        }
      }
      if (stickers > 8) {
        ctx.fillStyle = '#c0453f'
        ctx.font = 'bold 26px "Baloo 2", system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('×' + stickers, 84, 26)
      }
      ctx.restore()
    },
    destroy () { root.remove() }
  }
}

// ------------------------------------------------------------------ regne-porte

export function createMathGates (app) {
  const root = el('div', { class: 'screen' })
  backButton(app, root)
  const doneBtn = doneButton(app, root, 470)
  const session = createSession(root, 'gates', app.guide)
  const cfg = GATE_LEVELS[session.level - 1]

  const FIELD = { x: 150, y: 200, w: 660, h: 340 }
  const GATE_Y = 385
  const START = [480, 500]
  const mob = { x: START[0], y: START[1], heading: -Math.PI / 2 }
  let gates = []
  let question = null
  let reward = null
  let cooldown = 0
  let t = 0

  const joystick = createJoystick(app.stage, app.joystick, () => {})
  const keys = createKeyboard(() => {})
  joystick.enable()

  function newQuestion () {
    const rnd = Math.random
    const minus = cfg.minus && rnd() < 0.4
    let a; let b; let answer
    if (minus) {
      answer = 1 + Math.floor(rnd() * (cfg.max - 1))
      b = 1 + Math.floor(rnd() * Math.min(9, cfg.max - answer))
      a = answer + b
    } else {
      a = 1 + Math.floor(rnd() * (cfg.max - 1))
      b = 1 + Math.floor(rnd() * Math.max(1, cfg.max - a))
      answer = a + b
    }
    const answers = new Set([answer])
    let guard = 0
    while (answers.size < cfg.options && guard++ < 50) {
      const wrong = Math.max(1, answer + (Math.floor(rnd() * 5) - 2))
      if (wrong !== answer) answers.add(wrong)
    }
    const list = [...answers].sort(() => rnd() - 0.5)
    const step = FIELD.w / list.length
    gates = list.map((value, i) => ({
      value,
      x: FIELD.x + step * i + step / 2,
      y: GATE_Y,
      w: Math.min(150, step - 26),
      wobble: 0,
      open: 0,
      mown: 0
    }))
    question = { a, b, minus, answer }
    mob.x = START[0]
    mob.y = START[1]
    mob.heading = -Math.PI / 2
    app.guide.say('school.gate', { stykke: `${a} ${minus ? 'minus' : 'plus'} ${b}` }, { icon: bubble.sum(a, b, minus) })
  }
  // Gro forklarer legen foerst - saa kommer det foerste regnestykke
  app.guide.say('guide.gates', {}, { icon: bubble.emoji('➕') })
  const firstQuestion = setTimeout(newQuestion, 4200)

  function enterGate (g) {
    cooldown = 1.2
    if (g.value === question.answer) {
      const finished = session.right(g.x, g.y)
      reward = { gate: g, t: 0, finished }
      sfx.whoosh()
      return
    }
    g.wobble = 0.7
    session.wrong()
    mob.y = START[1]
    // hjaelpen kommer i lag: foerst prikker man kan taelle, saa lyser den rigtige port
    if (session.wrongThisRound === 1) {
      setTimeout(() => app.guide.say('school.gateHint', {}, { icon: bubble.dots(question.minus ? question.a : question.a + question.b) }), 1400)
    }
    if (session.wrongThisRound >= 2) {
      const right = gates.find(x => x.value === question.answer)
      if (right) right.glow = 1
      setTimeout(() => {
        app.guide.say('school.gateShow', {}, { icon: bubble.emoji('✨') })
        if (right) app.guide.point(right.x)
      }, 1400)
    }
  }

  function update (dt) {
    t += dt
    session.confetti.update(dt)
    for (const g of gates) if (g.wobble > 0) g.wobble -= dt
    if (cooldown > 0) cooldown -= dt
    if (session.done || !question) return

    if (reward) {
      // porten aabner, og maskinen klipper det hoeje graes bag den
      const g = reward.gate
      reward.t += dt
      g.open = Math.min(1, reward.t / 0.4)
      const p = clamp((reward.t - 0.3) / 1.2, 0, 1)
      mob.x = g.x
      mob.y = g.y - 30 - p * 140
      mob.heading = -Math.PI / 2
      g.mown = p
      if (p > 0 && p < 1 && Math.random() < 0.5) session.confetti.sparkle(mob.x + (Math.random() - 0.5) * 30, mob.y + 20, 2)
      if (reward.t > 2.0) {
        reward = null
        if (session.round >= ROUNDS) {
          session.finish()
          doneBtn.hidden = false
        } else newQuestion()
      }
      return
    }

    let v = joystick.vector()
    if (v.mag === 0) v = keys.vector()
    if (v.mag > 0) {
      const speed = 200 * v.mag
      mob.x = clamp(mob.x + v.x * speed * dt, FIELD.x + 20, FIELD.x + FIELD.w - 20)
      mob.y = clamp(mob.y + v.y * speed * dt, GATE_Y - 10, FIELD.y + FIELD.h - 20)
      mob.heading = Math.atan2(v.y, v.x)
    }
    if (cooldown > 0) return
    for (const g of gates) {
      if (Math.abs(mob.x - g.x) < g.w / 2 && Math.abs(mob.y - g.y) < 44) { enterGate(g); break }
    }
  }

  function dots (ctx, n, x, y, color) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(x + i * 26, y, 10, 0, TAU); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,.35)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  function draw (ctx) {
    sky(ctx)
    ctx.fillStyle = '#3f9142'
    ctx.beginPath(); ctx.roundRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 24); ctx.fill()
    ctx.strokeStyle = '#2c5f2e'
    ctx.lineWidth = 6
    ctx.beginPath(); ctx.roundRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 24); ctx.stroke()

    // hoejt graes bag hver port - det der klippes naar man rammer rigtigt
    for (const g of gates) {
      const top = FIELD.y + 16
      const bottom = g.y - 48
      const left = g.x - g.w / 2
      ctx.fillStyle = '#2e6f31'
      ctx.beginPath(); ctx.roundRect(left, top, g.w, bottom - top, 12); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,.18)'
      ctx.lineWidth = 2
      for (let y = top + 8; y < bottom; y += 14) {
        for (let x = left + 8; x < left + g.w; x += 16) {
          ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.quadraticCurveTo(x + 2, y + 2, x + 5, y - 2); ctx.stroke()
        }
      }
      if (g.mown > 0) {
        const h = (bottom - top) * g.mown
        ctx.fillStyle = '#8ede98'
        ctx.beginPath(); ctx.roundRect(left, bottom - h, g.w, h, 12); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,.35)'
        ctx.lineWidth = 3
        for (let y = bottom - h + 10; y < bottom; y += 18) {
          ctx.beginPath(); ctx.moveTo(left + 6, y); ctx.lineTo(left + g.w - 6, y); ctx.stroke()
        }
      }
    }

    // regnestykket - stort, og prikker under naar man har gaettet forkert
    if (question) {
      ctx.font = 'bold 74px "Baloo 2", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 10
      ctx.strokeStyle = '#ffffff'
      ctx.fillStyle = '#2f5d2f'
      const text = `${question.a} ${question.minus ? '−' : '+'} ${question.b}`
      ctx.strokeText(text, LOGICAL_W / 2, 118)
      ctx.fillText(text, LOGICAL_W / 2, 118)
      if (session.wrongThisRound >= 1) {
        const total = question.minus ? question.a : question.a + question.b
        const width = total * 26
        const x0 = LOGICAL_W / 2 - width / 2 + 13
        if (question.minus) {
          dots(ctx, question.a, x0, 172, '#ffd166')
          ctx.strokeStyle = '#e5484d'
          ctx.lineWidth = 4
          for (let i = 0; i < question.b; i++) {
            const x = x0 + (question.a - 1 - i) * 26
            ctx.beginPath(); ctx.moveTo(x - 8, 164); ctx.lineTo(x + 8, 180); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(x + 8, 164); ctx.lineTo(x - 8, 180); ctx.stroke()
          }
        } else {
          dots(ctx, question.a, x0, 172, '#ffd166')
          dots(ctx, question.b, x0 + question.a * 26, 172, '#8ef0ff')
        }
      }
    }

    for (const g of gates) {
      const shake = g.wobble > 0 ? Math.sin(g.wobble * 40) * 8 : 0
      ctx.save()
      ctx.translate(g.x + shake, g.y)
      if (g.glow) {
        ctx.shadowColor = '#ffe066'
        ctx.shadowBlur = 24 + Math.sin(t * 6) * 10
      }
      ctx.fillStyle = g.wobble > 0 ? '#e5484d' : g.glow ? '#fff1b8' : '#f2e2c4'
      ctx.strokeStyle = '#8c5f2b'
      ctx.lineWidth = 6
      ctx.beginPath(); ctx.roundRect(-g.w / 2, -46, g.w, 92, 16); ctx.fill(); ctx.stroke()
      ctx.shadowBlur = 0
      // laagen der svinger op
      if (g.open > 0) {
        ctx.save()
        ctx.translate(-g.w / 2 + 8, -40)
        ctx.rotate(-g.open * 1.2)
        ctx.fillStyle = '#c9a227'
        ctx.beginPath(); ctx.roundRect(0, 0, g.w - 16, 80, 10); ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = '#2f5d2f'
      ctx.font = 'bold 58px "Baloo 2", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = 1 - g.open * 0.7
      ctx.fillText(String(g.value), 0, 2)
      ctx.restore()
    }

    render.drawMachine(ctx, {
      machine: app.machine, x: mob.x, y: mob.y, heading: mob.heading, mood: 'happy',
      shake: 0, blade: reward ? 20 : 0, bladeSpin: t * 10, lights: false, t, hornWave: 0
    })
    session.confetti.draw(ctx)
  }

  return {
    root,
    state: {
      screen: 'gates',
      get level () { return session.level },
      get round () { return session.round },
      get wrongs () { return session.wrongs },
      get answer () { return question ? question.answer : null },
      get gates () { return gates.map(g => ({ value: g.value, x: g.x, y: g.y })) },
      get busy () { return !!reward }
    },
    update,
    draw,
    destroy () { clearTimeout(firstQuestion); joystick.destroy(); keys.destroy(); root.remove() }
  }
}

// ------------------------------------------------------------------ taelle-bedet

function drawObject (ctx, o, t) {
  const bounce = o.bounce > 0 ? Math.sin(o.bounce * Math.PI) * 14 : 0
  const wobble = o.wobble > 0 ? Math.sin(o.wobble * 30) * 6 : 0
  ctx.save()
  ctx.translate(o.x + wobble, o.y - bounce)
  if (o.kind === 'flower') {
    const sway = Math.sin(t * 1.6 + o.phase) * 3
    ctx.strokeStyle = '#2f7d32'
    ctx.lineWidth = 5
    ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(sway, 0); ctx.stroke()
    ctx.translate(sway, 0)
    ctx.fillStyle = '#e5484d'
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * TAU
      ctx.beginPath(); ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 11, 0, TAU); ctx.fill()
    }
    ctx.fillStyle = '#ffe066'
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill()
  } else if (o.kind === 'butterfly') {
    const flap = Math.abs(Math.sin(t * 5 + o.phase))
    ctx.fillStyle = '#5b8def'
    ctx.strokeStyle = 'rgba(30,40,80,.5)'
    ctx.lineWidth = 2
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.scale(side * (0.4 + flap * 0.6), 1)
      ctx.beginPath(); ctx.ellipse(12, -6, 14, 10, -0.3, 0, TAU); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(10, 8, 10, 8, 0.3, 0, TAU); ctx.fill(); ctx.stroke()
      ctx.restore()
    }
    ctx.fillStyle = '#4a3b2f'
    ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 12, 0, 0, TAU); ctx.fill()
  } else if (o.kind === 'ladybird') {
    ctx.fillStyle = '#e5484d'
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 15, 0, 0, TAU); ctx.fill()
    ctx.fillStyle = '#2c2c31'
    ctx.beginPath(); ctx.arc(12, 0, 8, 0, TAU); ctx.fill()
    for (const [dx, dy] of [[-8, -6], [-2, 4], [-9, 6], [4, -6]]) {
      ctx.beginPath(); ctx.arc(dx, dy, 3.2, 0, TAU); ctx.fill()
    }
    ctx.strokeStyle = '#2c2c31'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(4, -15); ctx.lineTo(4, 15); ctx.stroke()
  } else {
    ctx.fillStyle = '#e5484d'
    ctx.beginPath(); ctx.arc(-6, 2, 15, 0, TAU); ctx.fill()
    ctx.beginPath(); ctx.arc(6, 2, 15, 0, TAU); ctx.fill()
    ctx.fillStyle = '#ff8a8f'
    ctx.beginPath(); ctx.arc(-8, -4, 5, 0, TAU); ctx.fill()
    ctx.strokeStyle = '#6b4f2a'
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(2, -22); ctx.stroke()
    ctx.fillStyle = '#4fd46e'
    ctx.beginPath(); ctx.ellipse(8, -18, 8, 4, -0.5, 0, TAU); ctx.fill()
  }
  ctx.restore()
  if (o.counted) {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(o.x, o.y - bounce, 30, 0, TAU); ctx.stroke()
    ctx.strokeStyle = '#2f9e44'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(o.x + 16, o.y - bounce - 30)
    ctx.lineTo(o.x + 24, o.y - bounce - 22)
    ctx.lineTo(o.x + 36, o.y - bounce - 38)
    ctx.stroke()
  }
}

export function createCounting (app) {
  const root = el('div', { class: 'screen' })
  backButton(app, root)
  const doneBtn = doneButton(app, root, 430)
  const session = createSession(root, 'count', app.guide)
  const cfg = COUNT_LEVELS[session.level - 1]
  const row = el('div', { class: 'options', style: { bottom: '3%' } })
  root.append(row)

  let t = 0
  let objects = []
  let target = KINDS[0]
  let answer = 0
  let counted = 0
  let locked = false
  let demo = null
  const rnd = makeRandom(Date.now() % 100000 + 17)

  function newQuestion () {
    locked = false
    counted = 0
    demo = null
    const kinds = KINDS.slice().sort(() => rnd() - 0.5).slice(0, cfg.kinds)
    target = kinds[0]
    answer = 1 + Math.floor(rnd() * cfg.max)
    objects = []
    let guard = 0
    const place = kind => {
      while (guard++ < 600) {
        const x = 230 + rnd() * 500
        const y = 190 + rnd() * 210
        if (objects.some(o => Math.hypot(o.x - x, o.y - y) < 70)) continue
        objects.push({ kind, x, y, phase: rnd() * TAU, counted: false, bounce: 0, wobble: 0 })
        return
      }
    }
    for (let i = 0; i < answer; i++) place(target.id)
    // de andre slags er der bare for at drille lidt - dem skal man ikke taelle med
    for (const k of kinds.slice(1)) {
      const n = 1 + Math.floor(rnd() * Math.max(1, Math.min(4, cfg.max - 2)))
      for (let i = 0; i < n; i++) place(k.id)
    }
    objects.sort(() => rnd() - 0.5)
    app.guide.say('school.count', { ting: target.plural }, { icon: bubble.emoji(KIND_EMOJI[target.id]), top: true })
  }

  function tap (p) {
    if (locked || session.done || demo || !objects.length) return
    let best = null
    let bestD = 42
    for (const o of objects) {
      const d = dist(p, [o.x, o.y])
      if (d < bestD) { bestD = d; best = o }
    }
    if (!best) return
    if (best.kind !== target.id) {
      best.wobble = 0.5
      sfx.nope()
      return
    }
    if (best.counted) { best.bounce = 1; sfx.tap(); return }
    best.counted = true
    best.bounce = 1
    counted++
    sfx.pop()
    // oplaeseren taeller med: en, to, tre ...
    sayText(NUMBER_WORDS[Math.min(counted, NUMBER_WORDS.length) - 1], { force: true })
    if (counted === answer) setTimeout(() => app.guide.say('school.countAll', {}, { icon: bubble.dots(answer), top: true }), 900)
  }

  function chooseNumber (n) {
    if (locked || session.done || demo || !objects.length) return
    if (n === answer) {
      locked = true
      for (const o of objects) if (o.kind === target.id) o.bounce = 1
      const finished = session.right(480, 300)
      setTimeout(() => {
        if (finished) {
          session.finish()
          doneBtn.hidden = false
          row.hidden = true
        } else newQuestion()
      }, 1300)
      return
    }
    session.wrong()
    for (const o of objects) o.counted = false
    counted = 0
    if (session.wrongThisRound === 1) setTimeout(() => app.guide.say('school.countHint', {}, { icon: bubble.emoji('👆'), top: true }), 1300)
    if (session.wrongThisRound >= 2) {
      // stilladset: de rigtige hopper en ad gangen, og oplaeseren taeller dem
      const list = objects.filter(o => o.kind === target.id)
      demo = { list, i: 0, timer: 1.2 }
    }
  }

  function buildRow () {
    row.innerHTML = ''
    const max = Math.max(5, cfg.max)
    for (let n = 1; n <= max; n++) {
      const b = iconButton({
        html: `<span style="font-size:.62em;font-weight:800">${n}</span>`,
        label: 'tallet ' + n
      })
      b.addEventListener('click', () => chooseNumber(n))
      row.append(b)
    }
  }

  const drawInput = createDrawInput(app.canvas, { start: p => tap(p) })
  buildRow()
  app.guide.say('guide.count', {}, { icon: bubble.emoji('🌼'), top: true })
  const firstQuestion = setTimeout(newQuestion, 4600)

  return {
    root,
    state: { screen: 'count', get level () { return session.level }, get round () { return session.round }, get answer () { return answer } },
    update (dt) {
      t += dt
      session.confetti.update(dt)
      for (const o of objects) {
        if (o.bounce > 0) o.bounce = Math.max(0, o.bounce - dt * 2.2)
        if (o.wobble > 0) o.wobble -= dt
      }
      if (demo) {
        demo.timer -= dt
        if (demo.timer <= 0) {
          const o = demo.list[demo.i]
          if (o) {
            o.counted = true
            o.bounce = 1
            counted = demo.i + 1
            sfx.pop()
            sayText(NUMBER_WORDS[Math.min(counted, NUMBER_WORDS.length) - 1], { force: true })
            demo.i++
            demo.timer = 0.75
          } else {
            demo = null
            app.guide.say('school.countAll', {}, { icon: bubble.dots(answer), top: true })
          }
        }
      }
    },
    draw (ctx) {
      sky(ctx)
      ctx.fillStyle = '#7a4a25'
      ctx.beginPath(); ctx.ellipse(480, 300, 300, 145, 0, 0, TAU); ctx.fill()
      ctx.fillStyle = '#8b5a2f'
      ctx.beginPath(); ctx.ellipse(480, 294, 288, 136, 0, 0, TAU); ctx.fill()
      // hvad skal taelles? en stor udgave af tingen oeverst til hoejre
      ctx.save()
      ctx.translate(LOGICAL_W - 120, 120)
      ctx.fillStyle = 'rgba(255,255,255,.9)'
      ctx.beginPath(); ctx.roundRect(-52, -52, 104, 104, 22); ctx.fill()
      ctx.scale(1.5, 1.5)
      drawObject(ctx, { kind: target.id, x: 0, y: target.id === 'flower' ? -8 : 0, phase: 0, bounce: 0, wobble: 0, counted: false }, t)
      ctx.restore()
      for (const o of objects) drawObject(ctx, o, t)
      session.confetti.draw(ctx)
    },
    destroy () { clearTimeout(firstQuestion); drawInput.destroy(); root.remove() }
  }
}

export const SCHOOL_LEVELS = { LETTERS, MAZES }
