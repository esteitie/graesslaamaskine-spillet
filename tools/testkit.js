/* Hjaelpere til at styre spillet fra en test (Playwright eller konsollen).
   Indlaeses med page.addScriptTag({ url: '/tools/testkit.js' }).
   Bruger kun rigtige pointer- og tastaturhaendelser plus window.__game.step(). */
(function () {
  const L = () => window.__game.level

  function canvas () { return document.getElementById('scene') }

  function fire (type, lx, ly) {
    const c = canvas()
    const r = c.getBoundingClientRect()
    if (!r.width) throw new Error('scenen har ingen stoerrelse - er vinduet skjult?')
    c.dispatchEvent(new PointerEvent(type, {
      pointerId: 1,
      isPrimary: true,
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      clientX: r.left + (lx / 960) * r.width,
      clientY: r.top + (ly / 600) * r.height
    }))
  }

  /** Tegner en streg gennem punkterne som en finger ville. */
  function drawPath (points, stepPx = 9) {
    fire('pointerdown', points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]
      const b = points[i]
      const d = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.max(1, Math.ceil(d / stepPx))
      for (let k = 1; k <= n; k++) {
        fire('pointermove', a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n)
      }
    }
    const last = points[points.length - 1]
    fire('pointerup', last[0], last[1])
  }

  function circlePath (cx, cy, r, steps = 28) {
    const out = []
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
    return out
  }

  function holdKeys (keys, seconds) {
    for (const key of keys) window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    window.__game.step(seconds)
    for (const key of keys) window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  }

  /** Koerer mod et punkt med piletaster. Returnerer forbrugt spiltid. */
  function goTo (tx, ty, maxSeconds = 8) {
    let t = 0
    const slice = 0.08
    while (t < maxSeconds) {
      const g = L()
      if (!g || g.phase !== 'drive') break
      const [x, y] = g.position
      const dx = tx - x
      const dy = ty - y
      if (Math.hypot(dx, dy) < 12) break
      const keys = []
      if (dx > 5) keys.push('ArrowRight')
      else if (dx < -5) keys.push('ArrowLeft')
      if (dy > 5) keys.push('ArrowDown')
      else if (dy < -5) keys.push('ArrowUp')
      if (!keys.length) break
      holdKeys(keys, slice)
      t += slice
    }
    return t
  }

  const DIRS = [['ArrowRight'], ['ArrowLeft'], ['ArrowUp'], ['ArrowDown'],
    ['ArrowRight', 'ArrowUp'], ['ArrowLeft', 'ArrowDown']]

  /**
   * Klipper hele plaenen ved altid at koere mod naermeste uklippede celle.
   * Er vejen spaerret (fx af et blomsterbed), gaas der sidelaens udenom.
   */
  function mow (maxSeconds = 600) {
    let t = 0
    let stuck = 0
    let side = 1
    while (t < maxSeconds) {
      const g = L()
      if (!g || g.phase !== 'drive') break
      // en sommerfugl er kun fremme et stykke tid - tag den foerst
      const fly = g.butterflyActive
      if (fly) {
        t += goTo(fly[0], fly[1], 4)
        continue
      }
      const target = g.nearestUncut
      if (!target) break // alt er klippet - koer selv hjem bagefter
      const before = g.cutCells
      // rutesoegning er dyr - den bruges kun naar den lige vej er spaerret
      if (stuck > 0 && g.routeTo) {
        const route = g.routeTo(target)
        if (route && route.length > 3) {
          for (const point of route.slice(1, 6)) {
            if (L().phase !== 'drive') break
            t += goTo(point[0], point[1], 3)
          }
        } else {
          t += goTo(target[0], target[1], 5)
        }
      } else {
        t += goTo(target[0], target[1], 5)
      }
      if (L().cutCells !== before) {
        stuck = 0
        continue
      }
      stuck++
      const [x, y] = L().position
      const dx = target[0] - x
      const dy = target[1] - y
      const len = Math.hypot(dx, dy) || 1
      // vinkelret paa retningen mod maalet - saa glider vi rundt om forhindringen
      t += goTo(x + (-dy / len) * 120 * side, y + (dx / len) * 120 * side, 2.5)
      if (stuck % 2 === 0) side = -side
      if (stuck > 12) {
        holdKeys(DIRS[stuck % DIRS.length], 1)
        t += 1
      }
    }
    return t
  }

  /** Koerer maskinen hjem til ladestationen ad den korteste vej. */
  function driveHome (maxSeconds = 90) {
    let t = 0
    while (t < maxSeconds) {
      const g = L()
      if (!g || g.phase !== 'drive') break
      const before = g.position
      const route = g.routeHome
      if (!route || route.length < 2) {
        t += goTo(g.station[0], g.station[1], 6)
        continue
      }
      // foelg ruten et stykke ad gangen, saa vi ogsaa kommer gennem labyrinter
      for (const point of route.slice(1, 8)) {
        if (L().phase !== 'drive') break
        t += goTo(point[0], point[1], 3)
      }
      const after = L().position
      if (Math.hypot(after[0] - before[0], after[1] - before[1]) < 3) break
    }
    return t
  }

  /** Klipper hele banen og koerer hjem - hele runden fra start til stjerner. */
  function playThrough (maxSeconds = 900) {
    const t = mow(maxSeconds)
    return t + driveHome(80)
  }

  function press (selector) {
    const b = document.querySelector(selector)
    if (!b) throw new Error('ingen knap: ' + selector)
    b.click()
  }

  window.__kit = { fire, drawPath, circlePath, holdKeys, goTo, mow, driveHome, playThrough, press, level: L }
})()
