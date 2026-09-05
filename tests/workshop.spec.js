import { test, expect } from '@playwright/test'
import { openGame, levelState } from './helpers.js'

test('3D-garagen aabner, og liften kan koere op', async ({ page }) => {
  await openGame(page)
  await page.evaluate(() => window.__game.go('workshop'))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')

  await expect(page.locator('#scene3d')).toBeVisible()
  await expect(page.locator('#machine-stage')).toBeHidden()

  const lift = page.getByLabel('løft maskinen op på liften')
  await expect(lift).toBeVisible()
  await lift.click()
  await expect(lift).toHaveClass(/on/)
  await page.evaluate(() => window.__game.step(3))
  await lift.click()
  await expect(lift).not.toHaveClass(/on/)

  await expect(page.getByLabel('skift kameravinkel')).toBeVisible()
})

test('?flat=1 giver det flade vaerksted som reserve', async ({ page }) => {
  await openGame(page, { flat: '1' })
  await page.evaluate(() => window.__game.go('workshop'))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')
  await expect(page.locator('#scene3d')).toBeHidden()
  await expect(page.locator('#machine-stage svg')).toBeVisible()
})

test('3D-laerredet forsvinder naar man forlader vaerkstedet', async ({ page }) => {
  await openGame(page)
  await page.evaluate(() => window.__game.go('workshop'))
  await expect(page.locator('#scene3d')).toBeVisible()
  await page.evaluate(() => window.__game.go('map'))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('map')
  await expect(page.locator('#scene3d')).toBeHidden()
})

test('alle seks kategorier kan vaelges og maskinen opdateres', async ({ page }) => {
  await openGame(page)
  await page.evaluate(() => window.__game.go('workshop'))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')

  expect(await page.locator('.tray .btn').count()).toBe(6)

  await page.getByLabel('wheels terrain').click()
  expect(await page.evaluate(() => window.__game.machine.wheels)).toBe('terrain')

  await page.getByLabel('blade laser').click()
  expect(await page.evaluate(() => window.__game.machine.blade)).toBe('laser')

  await page.getByLabel('color pink').click()
  await page.getByLabel('screen cat').click()
  await page.getByLabel('extras solar').click()
  await page.getByLabel('name Turbo').click()

  const m = await page.evaluate(() => window.__game.machine)
  expect(m).toMatchObject({ wheels: 'terrain', blade: 'laser', color: 'pink', screen: 'cat', name: 'Turbo' })
  expect(m.extras).toContain('solar')

})

test('maskinen gemmes og genindlaeses, og naeste start gaar til kortet', async ({ page }) => {
  await openGame(page)
  await page.evaluate(() => window.__game.go('workshop'))
  await page.getByLabel('wheels tracks').click()
  await page.getByLabel('name Mimi').click()

  await page.reload()
  await page.waitForFunction(() => !!window.__game)
  expect(await page.evaluate(() => window.__game.screen)).toBe('map')
  expect(await page.evaluate(() => window.__game.machine)).toMatchObject({ wheels: 'tracks', name: 'Mimi' })
})

async function cutAfterTwoSeconds (page, machine) {
  // localStorage kan foerst saettes naar vi staar paa spillets eget origin
  await page.goto('/index.html?skipIntro=1&mute=1&sw=0')
  await page.evaluate(m => {
    localStorage.setItem('graesslaamaskine-spillet', JSON.stringify({
      version: 1, machine: m, stars: [0, 0, 0, 0, 0], muted: false
    }))
  }, machine)
  await openGame(page, { level: '1' })
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    window.__game.step(2)
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))
  })
  return levelState(page)
}

test('klinge og hjul aendrer klipperadius og fart', async ({ page }) => {
  const small = await cutAfterTwoSeconds(page, {
    name: 'Bob', color: 'blue', wheels: 'tracks', blade: 'small', screen: 'lamp', extras: []
  })
  const big = await cutAfterTwoSeconds(page, {
    name: 'Bob', color: 'blue', wheels: 'spikes', blade: 'laser', screen: 'lamp', extras: []
  })
  // stoerre klinge klipper flere celler
  expect(big.cutCells).toBeGreaterThan(small.cutCells * 1.5)
  // hurtigere hjul naar laengere paa samme tid
  expect(big.position[0]).toBeGreaterThan(small.position[0])
})
