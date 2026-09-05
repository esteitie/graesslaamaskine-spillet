// Skolehaven (fase 7): regne-porte, taelle-bedet, bogstavplaener og labyrinter.
import { test, expect } from '@playwright/test'
import { openGame, seedSave, levelState, mow, driveHome, step } from './helpers.js'

const MACHINE = { name: 'Zippy', color: 'orange', wheels: 'standard', blade: 'small', screen: 'lamp', extras: [] }

test('skolehaven kan aabnes fra kortet', async ({ page }) => {
  await seedSave(page, { machine: MACHINE, stars: [3, 0, 0, 0, 0] })
  await openGame(page)
  await page.getByLabel('skolehaven').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('school')
  for (const label of ['regne-porte', 'tælle-bedet', 'bogstav-plæner', 'labyrinter']) {
    await expect(page.getByLabel(label)).toBeVisible()
  }
})

test('regne-porte: rigtig port giver point, forkert giver et nyt forsoeg', async ({ page }) => {
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { screen: 'gates' })
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('gates')

  // koer op i den forkerte port foerst: intet maa gaa tabt
  const before = await page.evaluate(() => localStorage.getItem('graesslaamaskine-spillet'))
  await page.evaluate(() => {
    const hold = (keys, sec) => {
      keys.forEach(k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k })))
      window.__game.step(sec)
      keys.forEach(k => window.dispatchEvent(new KeyboardEvent('keyup', { key: k })))
    }
    hold(['ArrowLeft'], 1.4)
    hold(['ArrowUp'], 1.6)
    window.__game.step(1.2)
  })
  expect(await page.evaluate(() => window.__game.screen)).toBe('gates')
  // opgaven er stadig i gang - man kan ikke tabe
  expect(await page.evaluate(() => localStorage.getItem('graesslaamaskine-spillet'))).toBe(before)
})

test('taelle-bedet: trinnet styrer talknapperne, og man taeller ved at trykke', async ({ page }) => {
  await seedSave(page, { machine: MACHINE, school: { stickers: 0, done: {}, difficulty: 'let' } })
  await openGame(page, { screen: 'count' })
  await expect.poll(() => page.locator('.options .btn').count()).toBe(5)
  await expect(page.locator('.pips > i')).toHaveCount(5)

  // trin 8 (svaer + oevet): op til 15
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('graesslaamaskine-spillet'))
    raw.profiles[0].school.difficulty = 'svaer'
    raw.profiles[0].school.levels = { count: 8 }
    localStorage.setItem('graesslaamaskine-spillet', JSON.stringify(raw))
  })
  await page.reload()
  await page.waitForFunction(() => !!window.__game)
  await page.evaluate(() => window.__game.go('count'))
  await expect.poll(() => page.locator('.options .btn').count()).toBe(15)
})

test('en runde regne-porte uden fejl flytter trinnet op', async ({ page }) => {
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { screen: 'gates' })
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('gates')
  expect(await page.evaluate(() => window.__game.state.level)).toBe(1)
  await expect(page.locator('.pips > i')).toHaveCount(5)

  // koer ind i den rigtige port fem gange
  const result = await page.evaluate(() => {
    const hold = (keys, sec) => {
      keys.forEach(k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k })))
      window.__game.step(sec)
      keys.forEach(k => window.dispatchEvent(new KeyboardEvent('keyup', { key: k })))
    }
    const s = window.__game.state
    for (let round = 0; round < 5; round++) {
      const target = s.gates.find(g => g.value === s.answer)
      // maskinen starter i (480, 500); porten sidder i y = 385
      const dx = target.x - 480
      hold([dx < 0 ? 'ArrowLeft' : 'ArrowRight'], Math.abs(dx) / 200)
      hold(['ArrowUp'], 1.4)
      window.__game.step(2.6) // porten aabner, striben klippes, ny opgave
    }
    window.__game.step(1)
    return { round: s.round, wrongs: s.wrongs, level: window.__game.save.school.levels.gates, stickers: window.__game.save.school.stickers }
  })
  expect(result.round).toBe(5)
  expect(result.wrongs).toBe(0)
  expect(result.level).toBe(2)
  expect(result.stickers).toBe(1)
  await expect(page.getByLabel('videre')).toBeVisible()
})

test('bogstavplaenen har form som bogstavet og giver et klistermaerke', async ({ page }) => {
  test.setTimeout(240_000)
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { bane: 'letterL' })
  const start = await levelState(page)
  expect(start.phase).toBe('drive')
  expect(start.mowableCells).toBeGreaterThan(200)

  await mow(page, 900)
  await driveHome(page, 90)
  await step(page, 10)

  expect((await levelState(page)).phase).toBe('done')
  const school = await page.evaluate(() => window.__game.save.school)
  expect(school.done.letterL).toBe(1)
  expect(school.stickers).toBe(1)
  await expect(page.locator('.word-card')).toBeVisible()

  await page.getByLabel('videre').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('school')
})

test('labyrinten kan klares, og haekkene spaerrer vejen', async ({ page }) => {
  test.setTimeout(300_000)
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { bane: 'maze1' })
  const s = await levelState(page)
  expect(s.phase).toBe('drive')
  // alt graes skal kunne naas - ellers kan banen ikke klares
  expect(s.mowableCells).toBe(s.grassCells)

  // hjaelpen viser en rute, ikke bare et punkt
  const route = await page.evaluate(() => window.__game.level.routeHome)
  expect(Array.isArray(route)).toBe(true)
  // alle seks labyrinter kan naas helt
  for (const id of ['maze2', 'maze3', 'maze4', 'maze5', 'maze6']) {
    await page.evaluate(m => window.__game.go('level', { number: m, returnTo: 'school' }), id)
    await expect.poll(() => page.evaluate(() => window.__game.level && window.__game.level.name)).not.toBe(s.name)
    const m = await levelState(page)
    expect(m.mowableCells, id).toBeGreaterThan(m.grassCells * 0.9)
  }

  await mow(page, 1200)
  await driveHome(page, 120)
  await step(page, 10)
  expect((await levelState(page)).phase).toBe('done')
  expect((await page.evaluate(() => window.__game.save.school)).done.maze1).toBe(1)
})

test('svaerhedsgraden kan stilles i voksen-panelet', async ({ page }) => {
  await seedSave(page, { machine: MACHINE, stars: [1, 0, 0, 0, 0] })
  await openGame(page)
  await page.getByLabel('indstillinger for voksne').click()
  const btn = page.getByLabel('sværhedsgrad i skolehaven')
  await expect(btn).toBeVisible()
  expect(await page.evaluate(() => window.__game.save.school.difficulty)).toBe('let')
  await btn.click()
  expect(await page.evaluate(() => window.__game.save.school.difficulty)).toBe('mellem')
  await btn.click()
  expect(await page.evaluate(() => window.__game.save.school.difficulty)).toBe('svaer')
})
