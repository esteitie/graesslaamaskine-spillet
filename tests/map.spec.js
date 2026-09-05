import { test, expect } from '@playwright/test'
import { openGame, seedSave } from './helpers.js'

test('kun klarede baner og den naeste kan aabnes', async ({ page }) => {
  await seedSave(page, {
    machine: { name: 'Zippy', color: 'orange', wheels: 'standard', blade: 'small', screen: 'lamp', extras: [] },
    stars: [3, 2, 0, 0, 0]
  })
  await openGame(page)
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('map')

  await expect(page.getByLabel('have 1')).toBeEnabled()
  await expect(page.getByLabel('have 2')).toBeEnabled()
  await expect(page.getByLabel('have 3')).toBeEnabled()
  await expect(page.getByLabel('have 4')).toBeDisabled()
  await expect(page.getByLabel('have 5')).toBeDisabled()

  // stjerner vises for klarede haver: 3 + 2 = 5 gule stjerner
  const lit = await page.evaluate(() =>
    [...document.querySelectorAll('.star')].filter(s => s.style.color === 'rgb(255, 195, 0)').length)
  expect(lit).toBe(5)
})

test('voksen-panelet slaar lyd fra og starter forfra efter 3 sekunders tryk', async ({ page }) => {
  await seedSave(page, {
    machine: { name: 'Max', color: 'pink', wheels: 'terrain', blade: 'star', screen: 'cat', extras: [] },
    stars: [3, 3, 3, 0, 0]
  })
  await page.goto('/index.html?skipIntro=1&sw=0')
  await page.waitForFunction(() => window.__game?.screen === 'map')

  await page.getByLabel('indstillinger for voksne').click()
  await expect(page.locator('.panel')).toBeVisible()

  await page.getByLabel('lyd til og fra').click()
  expect(await page.evaluate(() => window.__game.save.muted)).toBe(true)

  const reset = page.getByLabel('start helt forfra – hold nede i 3 sekunder')
  const box = await reset.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(3400)
  await page.mouse.up()

  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')
  expect(await page.evaluate(() => window.__game.save.stars)).toEqual([0, 0, 0, 0, 0])
})

test('for tidligt slip paa start forfra goer ingenting', async ({ page }) => {
  await seedSave(page, {
    machine: { name: 'Max', color: 'pink', wheels: 'terrain', blade: 'star', screen: 'cat', extras: [] },
    stars: [3, 0, 0, 0, 0]
  })
  await openGame(page)
  await page.getByLabel('indstillinger for voksne').click()
  const reset = page.getByLabel('start helt forfra – hold nede i 3 sekunder')
  const box = await reset.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(900)
  await page.mouse.up()
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.__game.screen)).toBe('map')
  expect(await page.evaluate(() => window.__game.save.stars[0])).toBe(3)
})

test('skruenoeglen foerer til vaerkstedet og tilbage', async ({ page }) => {
  await seedSave(page, {
    machine: { name: 'Flip', color: 'blue', wheels: 'spikes', blade: 'triple', screen: 'rainbow', extras: ['flag'] },
    stars: [1, 0, 0, 0, 0]
  })
  await openGame(page)
  await page.getByLabel('byg om på maskinen').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')
  await page.getByLabel('tilbage til kortet').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('map')
})

test('graesmester-skaermen kommer efter bane 5', async ({ page }) => {
  await seedSave(page, {
    machine: { name: 'Zippy', color: 'rainbow', wheels: 'tracks', blade: 'laser', screen: 'smiley', extras: ['flag', 'lights'] },
    stars: [3, 3, 3, 3, 3]
  })
  await openGame(page)
  await page.evaluate(() => window.__game.go('master'))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('master')
  await expect(page.locator('#machine-stage svg')).toBeVisible()
  await page.getByLabel('tilbage til kortet').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('map')
})
