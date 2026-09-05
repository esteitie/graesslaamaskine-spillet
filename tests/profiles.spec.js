// To boern, hver sin gemmeplads (fase 8).
import { test, expect } from '@playwright/test'
import { openGame } from './helpers.js'

test('foerste gang er der kun en start-knap', async ({ page }) => {
  await page.goto('/index.html?mute=1&sw=0')
  await page.waitForFunction(() => !!window.__game)
  await expect(page.getByLabel('start spillet')).toBeVisible()
  await page.getByLabel('start spillet').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')
})

test('to spillere har hver sin maskine og sine stjerner', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('graesslaamaskine-spillet', JSON.stringify({
      version: 3,
      active: 0,
      profiles: [
        {
          machine: { name: 'Turbo', color: 'orange', wheels: 'spikes', blade: 'small', screen: 'lamp', extras: [] },
          stars: [3, 3, 0, 0, 0],
          muted: false,
          school: { stickers: 2, done: {}, difficulty: 'let' }
        },
        {
          machine: { name: 'Mimi', color: 'pink', wheels: 'tracks', blade: 'star', screen: 'cat', extras: [] },
          stars: [1, 0, 0, 0, 0],
          muted: false,
          school: { stickers: 0, done: {}, difficulty: 'mellem' }
        }
      ]
    }))
  })

  await page.goto('/index.html?mute=1&sw=0')
  await page.waitForFunction(() => !!window.__game)
  await expect(page.getByLabel('spil som Turbo')).toBeVisible()
  await expect(page.getByLabel('spil som Mimi')).toBeVisible()

  await page.getByLabel('spil som Mimi').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('map')
  expect(await page.evaluate(() => window.__game.machine.name)).toBe('Mimi')
  expect(await page.evaluate(() => window.__game.save.stars)).toEqual([1, 0, 0, 0, 0])
  expect(await page.evaluate(() => window.__game.save.school.difficulty)).toBe('mellem')
  // Mimi har kun klaret bane 1, saa bane 3 er stadig laast
  await expect(page.getByLabel('have 3')).toBeDisabled()

  await page.goto('/index.html?mute=1&sw=0')
  await page.waitForFunction(() => !!window.__game)
  await page.getByLabel('spil som Turbo').click()
  await expect.poll(() => page.evaluate(() => window.__game.machine.name)).toBe('Turbo')
  expect(await page.evaluate(() => window.__game.save.stars)).toEqual([3, 3, 0, 0, 0])
  expect(await page.evaluate(() => window.__game.save.school.stickers)).toBe(2)
})

test('gamle gem fra version 1 bliver til spiller 1', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('graesslaamaskine-spillet', JSON.stringify({
      version: 1,
      machine: { name: 'Bob', color: 'blue', wheels: 'terrain', blade: 'triple', screen: 'smiley', extras: ['flag'] },
      stars: [3, 2, 1, 0, 0],
      muted: false
    }))
  })
  await openGame(page)
  expect(await page.evaluate(() => window.__game.machine.name)).toBe('Bob')
  expect(await page.evaluate(() => window.__game.save.stars)).toEqual([3, 2, 1, 0, 0])
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('graesslaamaskine-spillet')).version)).toBe(1)
})

test('start forfra rammer kun det barn der spiller', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('graesslaamaskine-spillet', JSON.stringify({
      version: 3,
      active: 0,
      profiles: [
        { machine: { name: 'Turbo', color: 'orange', wheels: 'standard', blade: 'small', screen: 'lamp', extras: [] }, stars: [3, 3, 3, 0, 0], muted: false, school: { stickers: 1, done: {}, difficulty: 'let' } },
        { machine: { name: 'Mimi', color: 'pink', wheels: 'standard', blade: 'small', screen: 'cat', extras: [] }, stars: [2, 0, 0, 0, 0], muted: false, school: { stickers: 3, done: {}, difficulty: 'let' } }
      ]
    }))
  })
  await openGame(page)
  await page.getByLabel('indstillinger for voksne').click()
  const reset = page.getByLabel('start helt forfra – hold nede i 3 sekunder')
  const box = await reset.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(3400)
  await page.mouse.up()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')

  const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('graesslaamaskine-spillet')))
  expect(raw.profiles[0].stars).toEqual([0, 0, 0, 0, 0])
  expect(raw.profiles[1].stars).toEqual([2, 0, 0, 0, 0]) // den anden er urørt
  expect(raw.profiles[1].school.stickers).toBe(3)
})
