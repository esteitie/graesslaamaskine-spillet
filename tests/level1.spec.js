// Bane 1: banen starter direkte med at slaa graes (tegnefasen er slaaet fra).
import { test, expect } from '@playwright/test'
import {
  openGame, drive, mow, driveHome, step, levelState, elementAt
} from './helpers.js'

test('banen starter med at slaa graes, og ledningen ligger klar', async ({ page }) => {
  await openGame(page, { level: '1' })
  const s = await levelState(page)
  expect(s.phase).toBe('drive')
  expect(s.wireClosed).toBe(true)
  expect(s.wirePoints).toBe(4) // selve plaenekanten
  expect(s.insideCells).toBe(s.grassCells)
  expect(s.stars).toBe(3)
  // ingen groen startknap at trykke paa
  await expect(page.getByLabel('kør', { exact: true })).toBeHidden()
})

test('spilfladen er ikke daekket af et overlay', async ({ page }) => {
  await openGame(page, { level: '1' })
  expect(await elementAt(page, 480, 300)).toBe('scene')
  expect(await elementAt(page, 200, 305)).toBe('scene')
})

test('joystick opstaar under musen og flytter maskinen', async ({ page }) => {
  await openGame(page, { level: '1' })
  const before = (await levelState(page)).position

  const box = await page.locator('#scene').boundingBox()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await page.mouse.down()
  await expect(page.locator('#joystick')).toBeVisible()
  await page.mouse.move(box.x + box.width * 0.5 + 70, box.y + box.height * 0.5)
  await page.waitForTimeout(700)
  await page.mouse.up()
  await expect(page.locator('#joystick')).toBeHidden()

  const after = (await levelState(page)).position
  expect(after[0]).toBeGreaterThan(before[0] + 20)
})

test('piletaster koerer maskinen, og ledningen stopper den', async ({ page }) => {
  await openGame(page, { level: '1' })

  await drive(page, 1, 0, 1200)
  expect((await levelState(page)).position[0]).toBeGreaterThan(300)

  // hold mod hoejre laenge nok til at ramme ledningen - maskinen skal blive indenfor
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    window.__game.step(10)
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))
  })
  const s = await levelState(page)
  expect(s.position[0]).toBeLessThanOrEqual(760 - 14 + 1)
  expect(s.progress).toBeGreaterThan(0)
})

test('WASD virker ogsaa via fysiske tastekoder', async ({ page }) => {
  await openGame(page, { level: '1' })
  const before = (await levelState(page)).position
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }))
    window.__game.step(1.5)
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }))
  })
  expect((await levelState(page)).position[0]).toBeGreaterThan(before[0] + 40)
})

test('auto-knappen koerer selv, og et tastetryk tager over igen', async ({ page }) => {
  await openGame(page, { level: '1' })

  await page.getByLabel('kør selv').click()
  expect(await page.evaluate(() => window.__game.level.auto)).toBe(true)
  const before = (await levelState(page)).position
  await step(page, 4)
  const after = (await levelState(page)).position
  expect(Math.hypot(after[0] - before[0], after[1] - before[1])).toBeGreaterThan(50)

  await page.keyboard.press('ArrowUp')
  expect(await page.evaluate(() => window.__game.level.auto)).toBe(false)
})

test('alt graesset skal klippes - 95 % er ikke nok', async ({ page }) => {
  test.setTimeout(180_000)
  await openGame(page, { level: '1' })

  await mow(page, 700)
  const s = await levelState(page)
  expect(s.progress).toBe(1)
  expect(s.allCut).toBe(true)
  expect(s.cutCells).toBe(s.mowableCells)
  // maskinen koerer ALDRIG selv hjem: banen er ikke slut endnu
  expect(s.phase).toBe('drive')

  await step(page, 8)
  expect((await levelState(page)).phase).toBe('drive')
})

test('banen er foerst slut naar man selv har koert hjem', async ({ page }) => {
  test.setTimeout(180_000)
  await openGame(page, { level: '1' })
  await mow(page, 700)
  await driveHome(page, 80)
  await step(page, 8)

  const s = await levelState(page)
  expect(s.phase).toBe('done')
  expect(s.stars).toBeGreaterThanOrEqual(2) // klippet alt + selv koert hjem
  expect((await page.evaluate(() => window.__game.save)).stars[0]).toBe(s.stars)

  await page.getByLabel('videre').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('map')
  await expect(page.getByLabel('have 2')).toBeEnabled()
})

test('auto efter sidste straa koster hjem-stjernen', async ({ page }) => {
  test.setTimeout(180_000)
  await openGame(page, { level: '1' })
  await mow(page, 700)
  expect((await levelState(page)).allCut).toBe(true)

  await page.getByLabel('kør selv').click()
  await step(page, 2)
  await page.getByLabel('kør selv').click()
  await driveHome(page, 80)
  await step(page, 8)

  const s = await levelState(page)
  expect(s.phase).toBe('done')
  expect(s.stars).toBe(1) // klippet alt, men robotten hjalp baade undervejs og hjem
})

test('tre stjerner kraever at man gjorde det hele selv', async ({ page }) => {
  test.setTimeout(180_000)
  await openGame(page, { level: '1' })
  await mow(page, 700)
  await driveHome(page, 80)
  await step(page, 8)
  const s = await levelState(page)
  expect(s.phase).toBe('done')
  expect(s.stars).toBe(3)
})

test('sommerfugle er pynt: de kommer, flyver igen og taeller ikke', async ({ page }) => {
  await openGame(page, { level: '1' })
  expect(await page.evaluate(() => window.__game.level.butterflyActive)).toBe(null)
  await step(page, 6)
  const fly = await page.evaluate(() => window.__game.level.butterflyActive)
  expect(fly).not.toBe(null)
  // hjaelpen peger paa graesset, aldrig paa sommerfuglen
  await page.getByLabel('hjælp').click()
  await step(page, 0.2)
  await step(page, 30)
  expect(await page.evaluate(() => window.__game.level.butterflyActive)).toBe(null)
})

test('de sidste pletter: hjaelpen kommer naar man koerer uden at klippe', async ({ page }) => {
  await openGame(page, { level: '1' })
  // klip lidt, koer saa rundt paa det klippede i 26 sekunder
  await page.evaluate(() => {
    const hold = (k, sec) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))
      window.__game.step(sec)
      window.dispatchEvent(new KeyboardEvent('keyup', { key: k }))
    }
    hold('ArrowRight', 2)
    for (let i = 0; i < 7; i++) { hold('ArrowLeft', 1.9); hold('ArrowRight', 1.9) }
  })
  const s = await levelState(page)
  expect(s.sinceProgress).toBeLessThan(25) // hjaelpen har nulstillet taelleren
})
