// Acceptkriterier for fase 2 (spilplan afsnit 12), uden tegnefasen.
import { test, expect } from '@playwright/test'
import { openGame, mow, driveHome, step, levelState, playLevel } from './helpers.js'

test('bane 2 - bedet er beskyttet fra start, og banen kan klares', async ({ page }) => {
  test.setTimeout(180_000)
  await openGame(page, { level: '2' })
  const start = await levelState(page)
  expect(start.phase).toBe('drive')
  expect(start.islandsDone).toBe(1)
  expect(start.islandsTotal).toBe(1)

  const s = await playLevel(page, 2)
  expect(s.phase).toBe('done')
  // bedet er slet ikke graes, saa der er intet at klippe derinde
  expect(s.grassCells).toBe(s.insideCells)
})

test('bane 3 - standardhjul er tydeligt langsomme op ad bakke', async ({ page }) => {
  await openGame(page, { level: '3' })
  expect((await levelState(page)).phase).toBe('drive')

  const result = await page.evaluate(() => {
    const g = window.__game.level
    window.__kit.goTo(620, 220, 14)
    const a = g.position
    window.__kit.holdKeys(['ArrowRight'], 1)
    const b = g.position
    window.__kit.holdKeys(['ArrowLeft'], 1)
    const c = g.position
    return { uphill: b[0] - a[0], downhill: b[0] - c[0] }
  })

  // standardhjul: 140 px/s * 0.4 op ad bakke, * 1.2 ned ad bakke
  expect(result.uphill).toBeGreaterThan(40)
  expect(result.uphill).toBeLessThan(75)
  expect(result.downhill).toBeGreaterThan(140)
})

test('bane 4 - dammen taeller ikke med i de 100 %', async ({ page }) => {
  await openGame(page, { level: '4' })
  const s = await levelState(page)
  // cellerne under dammen kan ikke naas, saa de er ikke med i regnestykket
  expect(s.mowableCells).toBeLessThan(s.grassCells)
  expect(s.mowableCells).toBeGreaterThan(s.grassCells * 0.85)
})

test('bane 4 - dammen giver plask uden straf', async ({ page }) => {
  test.setTimeout(180_000)
  await openGame(page, { level: '4' })

  const pond = await page.evaluate(() => {
    const g = window.__game.level
    window.__kit.goTo(430, 290, 14)
    window.__kit.holdKeys(['ArrowDown'], 2)
    const p = g.position
    return { dist: Math.hypot(p[0] - 430, p[1] - 380), phase: g.phase }
  })
  expect(pond.dist).toBeGreaterThan(54) // sat tilbage paa toert graes
  expect(pond.phase).toBe('drive') // ingen straf, spillet koerer videre

  await mow(page, 800)
  await driveHome(page, 80)
  await step(page, 10)
  expect((await levelState(page)).phase).toBe('done')
})

test('bane 5 - batteriet loeber toert, maskinen koerer hjem, lader og fortsaetter', async ({ page }) => {
  test.setTimeout(240_000)
  await openGame(page, { level: '5' })

  const start = await levelState(page)
  expect(start.battery.mode).toBe('ok')
  expect(start.battery.max).toBe(45) // standardmaskine uden solpanel

  const drained = await page.evaluate(() => {
    const g = window.__game.level
    let n = 0
    while (n < 400 && g.battery.mode === 'ok') {
      window.__kit.holdKeys(['ArrowRight'], 0.5)
      window.__kit.holdKeys(['ArrowLeft'], 0.5)
      n++
    }
    return { mode: g.battery.mode, left: Math.round(g.battery.left) }
  })
  expect(drained.mode).toBe('returning')
  expect(drained.left).toBe(0)

  await step(page, 30)
  const home = await levelState(page)
  expect(home.battery.mode).toBe('ok')
  expect(home.battery.left).toBeGreaterThan(40)
  // og maskinen sidder ikke fast i ladestationen bagefter
  const moved = await page.evaluate(() => {
    const g = window.__game.level
    const a = g.position
    window.__kit.holdKeys(['ArrowRight'], 1.5)
    const b = g.position
    return Math.hypot(b[0] - a[0], b[1] - a[1])
  })
  expect(moved).toBeGreaterThan(40)

  await mow(page, 900)
  await driveHome(page, 80)
  await step(page, 10)
  expect((await levelState(page)).phase).toBe('done')
})

test('solpanel giver 50 % mere batteri', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('graesslaamaskine-spillet', JSON.stringify({
      version: 1,
      machine: { name: 'Zippy', color: 'orange', wheels: 'standard', blade: 'small', screen: 'lamp', extras: ['solar'] },
      stars: [0, 0, 0, 0, 0],
      muted: false
    }))
  })
  await openGame(page, { level: '5' })
  expect((await levelState(page)).battery.max).toBe(68) // 45 * 1.5, rundet
})

test('alle fem baner kan spilles igennem via ?level=N', async ({ page }) => {
  test.setTimeout(600_000)
  for (const n of [1, 2, 3, 4, 5]) {
    await openGame(page, { level: String(n) })
    expect((await levelState(page)).phase, `bane ${n} starter med at slaa graes`).toBe('drive')
    const s = await playLevel(page, n, { budget: 1100 })
    expect(s.phase, `bane ${n}`).toBe('done')
    expect(s.progress, `bane ${n}`).toBe(1)
    expect(s.stars, `bane ${n}`).toBeGreaterThanOrEqual(2)
  }
  const save = await page.evaluate(() => window.__game.save)
  expect(save.stars.every(v => v > 0)).toBe(true)
})
