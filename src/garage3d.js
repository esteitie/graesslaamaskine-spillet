// 3D-garagen: maskinen bygges som en rigtig model, man kan dreje, zoome og
// loefte op paa liften for at se undersiden. Spilplan-niveau-2 fase 5.

import * as THREE from '../libs/three.module.js'
import { COLORS, BLADES, sanitize } from './machine.js'

const DEG = Math.PI / 180
const MIN_PITCH = -26 * DEG
const MAX_PITCH = 72 * DEG
const MIN_DIST = 5
const MAX_DIST = 12
const LIFT_HEIGHT = 3.0

// ------------------------------------------------------------------ materialer

function bodyMaterial (color) {
  const c = COLORS[color]
  if (color === 'rainbow') {
    return new THREE.MeshStandardMaterial({
      map: rainbowTexture(),
      metalness: 0.45,
      roughness: 0.22
    })
  }
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(c.base),
    metalness: color === 'silver' ? 0.85 : 0.35,
    roughness: color === 'silver' ? 0.22 : 0.3
  })
}

function rainbowTexture () {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 256, 256)
  const stops = ['#ff5f6d', '#ffb347', '#ffe66d', '#4fd46e', '#5b8def', '#c77dff']
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Lille studie-milj0 saa lakken faar reflekser uden en ekstra fil. */
function environmentTexture () {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#20263a')
  g.addColorStop(0.42, '#5c6a86')
  g.addColorStop(0.5, '#ffffff')
  g.addColorStop(0.58, '#3d4457')
  g.addColorStop(1, '#0d1016')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 256)
  // to lysstofroer i loftet
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(60, 26, 150, 26)
  ctx.fillRect(300, 26, 150, 26)
  const t = new THREE.CanvasTexture(c)
  t.mapping = THREE.EquirectangularReflectionMapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function faceTexture (type, mood) {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#0d1a2c'
  ctx.fillRect(0, 0, 256, 256)
  const sleepy = mood === 'sleepy'
  const gold = sleepy ? '#7b8794' : '#ffe066'
  ctx.strokeStyle = gold
  ctx.fillStyle = gold
  ctx.lineCap = 'round'
  ctx.lineWidth = 18
  if (type === 'lamp') {
    ctx.beginPath(); ctx.arc(128, 128, sleepy ? 46 : 62, 0, Math.PI * 2); ctx.fill()
    if (!sleepy) {
      ctx.globalAlpha = 0.4
      ctx.beginPath(); ctx.arc(128, 128, 90, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = 1
    }
  } else if (type === 'smiley') {
    if (sleepy) {
      ctx.beginPath(); ctx.arc(86, 100, 26, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.arc(170, 100, 26, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.arc(128, 172, 18, 0, Math.PI * 2); ctx.stroke()
    } else {
      ctx.beginPath(); ctx.arc(88, 98, 20, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(168, 98, 20, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(128, 140, 54, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    }
  } else if (type === 'rainbow') {
    const arcs = [['#ff5f6d', 96], ['#ffd166', 68], ['#4fd46e', 40]]
    ctx.lineWidth = 24
    ctx.globalAlpha = sleepy ? 0.4 : 1
    for (const [col, r] of arcs) {
      ctx.strokeStyle = col
      ctx.beginPath(); ctx.arc(128, 186, r, Math.PI, 0); ctx.stroke()
    }
    ctx.globalAlpha = 1
  } else {
    ctx.fillStyle = '#ffb0d8'
    ctx.beginPath(); ctx.moveTo(48, 72); ctx.lineTo(58, 14); ctx.lineTo(104, 60); ctx.fill()
    ctx.beginPath(); ctx.moveTo(208, 72); ctx.lineTo(198, 14); ctx.lineTo(152, 60); ctx.fill()
    ctx.fillStyle = gold
    if (sleepy) {
      ctx.strokeStyle = gold; ctx.lineWidth = 14
      ctx.beginPath(); ctx.arc(90, 110, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.arc(166, 110, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    } else {
      ctx.beginPath(); ctx.ellipse(90, 110, 18, 24, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(166, 110, 18, 24, 0, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = '#ffb0d8'
    ctx.beginPath(); ctx.moveTo(112, 160); ctx.lineTo(144, 160); ctx.lineTo(128, 182); ctx.fill()
    ctx.strokeStyle = gold; ctx.lineWidth = 6
    for (const dy of [-10, 10]) {
      ctx.beginPath(); ctx.moveTo(40, 168 + dy); ctx.lineTo(100, 172 + dy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(216, 168 + dy); ctx.lineTo(156, 172 + dy); ctx.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function solarTexture () {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#173a63'
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = '#5aa0e0'
  ctx.lineWidth = 5
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo((i * 128) / 4, 0); ctx.lineTo((i * 128) / 4, 128); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, (i * 128) / 4); ctx.lineTo(128, (i * 128) / 4); ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// ------------------------------------------------------------------ maskinen

function bodyShape () {
  const s = new THREE.Shape()
  s.moveTo(-1.15, -0.9)
  s.lineTo(0.5, -0.95)
  s.quadraticCurveTo(1.28, -0.92, 1.28, 0)
  s.quadraticCurveTo(1.28, 0.92, 0.5, 0.95)
  s.lineTo(-1.15, 0.9)
  s.quadraticCurveTo(-1.38, 0.86, -1.38, 0.55)
  s.lineTo(-1.38, -0.55)
  s.quadraticCurveTo(-1.38, -0.86, -1.15, -0.9)
  return s
}

const dark = new THREE.MeshStandardMaterial({ color: 0x24252b, metalness: 0.5, roughness: 0.55 })
const rubber = new THREE.MeshStandardMaterial({ color: 0x1b1c20, metalness: 0.1, roughness: 0.85 })
const metal = new THREE.MeshStandardMaterial({ color: 0xaeb4bd, metalness: 0.95, roughness: 0.25 })

function wheel (type) {
  const g = new THREE.Group()
  if (type === 'tracks') {
    const belt = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, 0.34), rubber)
    belt.castShadow = true
    g.add(belt)
    for (let i = -4; i <= 4; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.68, 0.38), metal)
      rib.position.x = i * 0.22
      g.add(rib)
    }
    for (const x of [-0.95, 0.95]) {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 24), metal)
      hub.rotation.x = Math.PI / 2
      hub.position.x = x
      g.add(hub)
    }
    return g
  }
  const big = type === 'terrain'
  const r = big ? 0.54 : 0.44
  const tube = big ? 0.2 : 0.15
  const width = big ? 0.42 : 0.32
  // daek: en torus - blaenk og rund som et rigtigt gummihjul
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(r - tube * 0.9, tube, 18, 40), rubber)
  tyre.castShadow = true
  g.add(tyre)
  const hubMat = big
    ? new THREE.MeshStandardMaterial({ color: 0xf0c419, metalness: 0.55, roughness: 0.3 })
    : new THREE.MeshStandardMaterial({ color: 0xd8dee8, metalness: 0.9, roughness: 0.25 })
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r - tube * 0.95, r - tube * 0.95, width * 0.9, 28), hubMat)
  hub.rotation.x = Math.PI / 2
  g.add(hub)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 0.28, 18, 12), metal)
  g.add(cap)
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, (r - tube) * 1.7, width * 0.95), dark)
    spoke.rotation.z = (i / 6) * Math.PI
    g.add(spoke)
  }
  const knobs = big ? 12 : 16
  for (let i = 0; i < knobs; i++) {
    const a = (i / knobs) * Math.PI * 2
    const knob = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.13 : 0.08, big ? 0.1 : 0.06, width + 0.02), rubber)
    knob.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
    knob.rotation.z = a
    g.add(knob)
  }
  if (type === 'spikes') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 8), metal)
      spike.position.set(Math.cos(a) * (r + 0.1), Math.sin(a) * (r + 0.1), 0)
      spike.rotation.z = a - Math.PI / 2
      g.add(spike)
    }
  }
  return g
}

function buildMachine (raw) {
  const m = sanitize(raw)
  const root = new THREE.Group()
  const shell = new THREE.Group()
  root.add(shell)

  const geo = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: 0.46,
    bevelEnabled: true,
    bevelThickness: 0.28,
    bevelSize: 0.24,
    bevelSegments: 12,
    curveSegments: 40
  })
  geo.rotateX(-Math.PI / 2)
  geo.computeBoundingBox()
  geo.translate(0, -geo.boundingBox.min.y, 0)
  const body = new THREE.Mesh(geo, bodyMaterial(m.color))
  body.castShadow = true
  body.receiveShadow = true
  body.position.y = 0.26
  shell.add(body)
  // alt der sidder oven paa maskinen, sidder paa daekket - uanset hvor hoej kroppen er
  const deck = geo.boundingBox.max.y + 0.26

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.26, 0.2, 30), dark)
  plate.position.y = 0.32
  plate.castShadow = true
  shell.add(plate)
  // lidt mekanik paa undersiden, saa den ligner noget naar den er loeftet
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8), metal)
    bolt.position.set(Math.cos(a) * 0.95, 0.22, Math.sin(a) * 0.95)
    shell.add(bolt)
  }
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.22, 20), metal)
  motor.position.set(0.1, 0.28, 0)
  shell.add(motor)

  // stopknap
  const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.14, 24),
    new THREE.MeshStandardMaterial({ color: 0xe5484d, metalness: 0.2, roughness: 0.35 }))
  stop.position.set(-0.72, deck + 0.02, 0)
  stop.castShadow = true
  shell.add(stop)
  const stopRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 10, 26), dark)
  stopRing.rotation.x = Math.PI / 2
  stopRing.position.set(-0.72, deck - 0.04, 0)
  shell.add(stopRing)

  // skaerm
  const screenGeo = new THREE.BoxGeometry(0.86, 0.08, 0.72)
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture(m.screen, 'happy'),
    emissive: 0xffffff,
    emissiveMap: faceTexture(m.screen, 'happy'),
    emissiveIntensity: 0.95,
    roughness: 0.4
  })
  const screen = new THREE.Mesh(screenGeo, [dark, dark, faceMat, dark, dark, dark])
  screen.position.set(0.42, deck - 0.02, 0)
  screen.rotation.z = -6 * DEG
  screen.castShadow = true
  shell.add(screen)
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.86), dark)
  bezel.position.set(0.42, deck - 0.06, 0)
  bezel.rotation.z = -6 * DEG
  shell.add(bezel)

  // hjul
  const wheels = []
  for (const z of [-1, 1]) {
    const w = wheel(m.wheels)
    w.position.set(m.wheels === 'tracks' ? -0.1 : -0.5, m.wheels === 'terrain' ? 0.54 : 0.44, z * (m.wheels === 'tracks' ? 0.86 : 0.98))
    shell.add(w)
    wheels.push(w)
  }
  if (m.wheels !== 'tracks') {
    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), rubber)
    caster.position.set(1.12, 0.24, 0)
    caster.castShadow = true
    shell.add(caster)
  }

  // klinge under bunden
  const bladeGroup = new THREE.Group()
  const bladeR = (BLADES[m.blade] / 20) * 0.42 + 0.34
  const shiny = new THREE.MeshStandardMaterial({ color: 0xd8dee8, metalness: 1, roughness: 0.12 })
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(bladeR, bladeR, 0.05, 30), shiny)
  bladeGroup.add(disc)
  const bars = m.blade === 'triple' ? 3 : m.blade === 'star' ? 5 : 2
  for (let i = 0; i < bars; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bladeR * 1.9, 0.06, 0.14),
      m.blade === 'laser'
        ? new THREE.MeshStandardMaterial({ color: 0x8ef0ff, emissive: 0x35c8e0, emissiveIntensity: 1.4, roughness: 0.2 })
        : shiny)
    bar.rotation.y = (i / bars) * Math.PI * 2
    bar.position.y = 0.02
    bladeGroup.add(bar)
  }
  bladeGroup.position.set(0.1, 0.07, 0)
  shell.add(bladeGroup)

  // ekstraudstyr
  const blinkers = []
  const on = m.extras
  if (on.includes('solar')) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 1.1),
      new THREE.MeshStandardMaterial({ map: solarTexture(), metalness: 0.5, roughness: 0.25 }))
    panel.position.set(-0.2, deck - 0.02, 0)
    panel.castShadow = true
    shell.add(panel)
  }
  if (on.includes('flag')) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 10), metal)
    pole.position.set(-1.05, deck + 0.55, 0.5)
    shell.add(pole)
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xe5484d, side: THREE.DoubleSide, roughness: 0.7 }))
    flag.position.set(-0.7, deck + 1.1, 0.5)
    shell.add(flag)
  }
  if (on.includes('lights')) {
    for (const z of [-0.55, 0.55]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0xffb703, emissiveIntensity: 0.45, roughness: 0.3 }))
      lamp.position.set(0.92, deck - 0.12, z)
      shell.add(lamp)
      blinkers.push(lamp)
    }
  }
  if (on.includes('horn')) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide }))
    horn.rotation.z = Math.PI / 2
    horn.position.set(-1.2, deck - 0.32, -0.5)
    shell.add(horn)
  }
  if (on.includes('eyes')) {
    for (const z of [-0.34, 0.34]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }))
      white.position.set(1.05, deck - 0.22, z)
      shell.add(white)
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), dark)
      pupil.position.set(1.25, deck - 0.2, z)
      shell.add(pupil)
    }
  }
  if (on.includes('stickers')) {
    const spots = [[0.0, 0.6], [-0.5, -0.55], [0.75, -0.3]]
    const cols = [0xffd166, 0xff6b9d, 0x4fd46e]
    spots.forEach(([x, z], i) => {
      const disc2 = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20),
        new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.5 }))
      disc2.rotation.x = -Math.PI / 2
      disc2.position.set(x, deck - 0.055, z)
      shell.add(disc2)
    })
  }

  root.userData = { shell, wheels, bladeGroup, blinkers, faceMat }
  return root
}

// ------------------------------------------------------------------ garagen

export function createGarage (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf4ecdc)
  scene.environment = environmentTexture()
  scene.fog = new THREE.Fog(0xf4ecdc, 16, 34)

  const camera = new THREE.PerspectiveCamera(38, 1.6, 0.1, 100)

  // traegulv i lyst egetrae, som et legetoejs-showroom
  const floorCanvas = document.createElement('canvas')
  floorCanvas.width = 512; floorCanvas.height = 512
  {
    const c = floorCanvas.getContext('2d')
    c.fillStyle = '#d9b98a'
    c.fillRect(0, 0, 512, 512)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 3; col++) {
        const x = (col * 170 + (row % 2) * 85) % 512
        const tone = 190 + ((row * 7 + col * 13) % 5) * 9
        c.fillStyle = `rgb(${tone + 30}, ${tone - 5}, ${tone - 50})`
        c.fillRect(x, row * 64, 168, 62)
        c.strokeStyle = 'rgba(90, 60, 20, .25)'
        c.lineWidth = 2
        c.strokeRect(x, row * 64, 168, 62)
        c.strokeStyle = 'rgba(120, 80, 30, .18)'
        for (let k = 0; k < 4; k++) {
          c.beginPath(); c.moveTo(x + 8, row * 64 + 12 + k * 13); c.lineTo(x + 160, row * 64 + 10 + k * 13); c.stroke()
        }
      }
    }
  }
  const floorTex = new THREE.CanvasTexture(floorCanvas)
  floorTex.colorSpace = THREE.SRGBColorSpace
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping
  floorTex.repeat.set(3, 3)
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 48),
    new THREE.MeshStandardMaterial({ map: floorTex, metalness: 0.05, roughness: 0.55 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // drejeskive
  const turntable = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.8, 0.16, 48),
    new THREE.MeshStandardMaterial({ color: 0xe9e2d3, metalness: 0.2, roughness: 0.45 }))
  turntable.position.y = -0.08
  turntable.receiveShadow = true
  scene.add(turntable)
  const edge = new THREE.Mesh(new THREE.TorusGeometry(2.74, 0.06, 10, 64),
    new THREE.MeshStandardMaterial({ color: 0xb8ad9c, metalness: 0.4, roughness: 0.4 }))
  edge.rotation.x = Math.PI / 2
  edge.position.y = 0.01
  scene.add(edge)

  // lys: masser af det, bloedt og varmt
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcdbfa8, 0.95))
  const key = new THREE.SpotLight(0xfff6e8, 170, 34, 0.6, 0.5, 1.4)
  key.position.set(3.5, 9.5, 4.5)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.0008
  scene.add(key)
  scene.add(key.target)
  const fill = new THREE.DirectionalLight(0xe6f0ff, 1.3)
  fill.position.set(-6, 5, -2)
  scene.add(fill)

  // bagvaeg: lys, blank, med et par striber saa der er dybde
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfaf3e6, roughness: 0.95, side: THREE.DoubleSide })
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 13.5, 10, 48, 1, true), wallMat)
  wall.position.y = 5
  scene.add(wall)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(13.4, 13.4, 0.5, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x4fae5a, roughness: 0.8, side: THREE.DoubleSide }))
  band.position.y = 1.4
  scene.add(band)

  // selve liften: to soejler og to arme - de kommer op af gulvet, naar man loefter
  const liftRig = new THREE.Group()
  const liftMat = new THREE.MeshStandardMaterial({ color: 0xe0a800, metalness: 0.5, roughness: 0.35 })
  const posts = []
  for (const z of [-2.5, 2.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 0.24), liftMat)
    post.position.set(-0.2, -2.1, z)
    post.castShadow = true
    scene.add(post)
    posts.push(post)
  }
  const arms = new THREE.Group()
  for (const z of [-1.35, 1.35]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.26), liftMat)
    arm.position.set(0, 0, z)
    arm.castShadow = true
    arms.add(arm)
  }
  liftRig.add(arms)
  scene.add(liftRig)

  // arbejdslampe der taendes under maskinen, naar liften koerer op
  const underLight = new THREE.PointLight(0xfff0d0, 0, 9)
  underLight.position.set(0.2, 0.5, 0)
  scene.add(underLight)

  const holder = new THREE.Group()
  scene.add(holder)
  let model = null

  const cam = { yaw: -0.7, pitch: 20 * DEG, dist: 7.6, targetY: 1.0 }
  const spin = { vel: 0 }
  let lift = 0
  let liftTarget = 0
  let bounce = 0
  let rev = 0
  let clock = 0
  let camPreset = null
  let viewW = 0
  let viewH = 0

  function setMachine (machine) {
    if (model) {
      holder.remove(model)
      model.traverse(o => {
        if (o.geometry) o.geometry.dispose()
      })
    }
    model = buildMachine(machine)
    holder.add(model)
    bounce = 1
  }

  function setLift (on) {
    liftTarget = on ? LIFT_HEIGHT : 0
  }

  function toggleLift () {
    setLift(liftTarget === 0)
    return liftTarget !== 0
  }

  function setCamera (mode) {
    if (mode === 'top') camPreset = { pitch: 64 * DEG, dist: 7.4 }
    else if (mode === 'eye') camPreset = { pitch: 7 * DEG, dist: 8 }
    else if (mode === 'close') camPreset = { pitch: 20 * DEG, dist: 5.4 }
    else camPreset = null
  }

  function drag (dx, dy) {
    cam.yaw -= dx * 0.008
    cam.pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, cam.pitch + dy * 0.006))
    spin.vel = -dx * 0.008
    camPreset = null
  }

  function zoom (delta) {
    cam.dist = Math.max(MIN_DIST, Math.min(MAX_DIST, cam.dist + delta))
    camPreset = null
  }

  function revEngine () {
    rev = 1
    bounce = Math.max(bounce, 0.7)
  }

  function update (dt) {
    clock += dt
    // inerti paa drejningen
    if (Math.abs(spin.vel) > 0.0001) {
      cam.yaw += spin.vel
      spin.vel *= Math.pow(0.02, dt)
    }
    if (camPreset) {
      cam.pitch += (camPreset.pitch - cam.pitch) * Math.min(1, dt * 5)
      cam.dist += (camPreset.dist - cam.dist) * Math.min(1, dt * 5)
    }
    lift += (liftTarget - lift) * Math.min(1, dt * 4)

    if (model) {
      const u = model.userData
      model.position.y = lift
      // kameraet dykker ned under maskinen, naar den er loeftet
      const bob = Math.sin(clock * 1.4) * 0.015
      u.shell.position.y = bob + (bounce > 0 ? Math.sin(bounce * Math.PI) * 0.18 : 0)
      u.shell.scale.setScalar(1 + (bounce > 0 ? Math.sin(bounce * Math.PI) * 0.05 : 0))
      const spinSpeed = 2 + rev * 26
      u.bladeGroup.rotation.y += dt * spinSpeed
      for (const w of u.wheels) w.rotation.z -= dt * rev * 6
      for (const b of u.blinkers) {
        b.material.emissiveIntensity = 0.3 + (Math.sin(clock * 8) > 0 ? 0.8 : 0)
      }
      if (u.shell.rotation) u.shell.rotation.z = -rev * 0.06
    }
    if (bounce > 0) bounce = Math.max(0, bounce - dt * 3)
    if (rev > 0) rev = Math.max(0, rev - dt * 1.6)

    // naar maskinen er oppe, glider kameraet ned og kigger op paa undersiden
    const up = lift / LIFT_HEIGHT
    const distNow = cam.dist * (1 - up) + 8.2 * up
    // nede: almindelig bane om maskinen. oppe: kameraet staar lavt og kigger op
    const downY = 0.85 + Math.sin(cam.pitch) * cam.dist
    const upY = Math.max(0.55, lift - 2.3)
    camera.position.set(
      Math.cos(cam.yaw) * Math.cos(cam.pitch * (1 - up)) * distNow,
      downY * (1 - up) + upY * up,
      Math.sin(cam.yaw) * Math.cos(cam.pitch * (1 - up)) * distNow
    )
    camera.lookAt(0, 0.8 * (1 - up) + (lift + 0.4) * up, 0)
    liftRig.position.y = lift
    arms.visible = lift > 0.02
    for (const post of posts) {
      post.visible = lift > 0.02
      post.position.y = -2.1 + Math.min(1, lift / LIFT_HEIGHT) * 4.3
    }
    underLight.intensity = up * 26
    underLight.position.y = Math.max(0.4, lift - 0.6)
    // naar maskinen er oppe, skal billedet ikke skubbes lige saa hoejt
    if (viewW) {
      camera.setViewOffset(viewW, viewH, 0, viewH * (0.04 + up * 0.02), viewW, viewH)
      camera.updateProjectionMatrix()
    }
    key.target.position.set(0, lift * 0.6, 0)
    turntable.position.y = -0.08 + lift * 0.02
  }

  function render () {
    renderer.render(scene, camera)
  }

  function resize (w, h) {
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    viewW = w
    viewH = h
    // skub motivet opad i billedet: den nederste tredjedel er delevaelgeren
    camera.setViewOffset(w, h, 0, h * 0.04, w, h)
    camera.updateProjectionMatrix()
  }

  function dispose () {
    renderer.dispose()
    scene.traverse(o => { if (o.geometry) o.geometry.dispose() })
  }

  return {
    setMachine, setLift, toggleLift, setCamera, drag, zoom, revEngine,
    update, render, resize, dispose,
    get lifted () { return liftTarget !== 0 }
  }
}

export function webglAvailable () {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}
