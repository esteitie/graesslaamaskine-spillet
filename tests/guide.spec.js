// Gro, gartneren (fase 10): hun fortaeller hvad hver skaerm er.
import { test, expect } from '@playwright/test'
import { openGame, seedSave, step } from './helpers.js'

const MACHINE = { name: 'Zippy', color: 'orange', wheels: 'standard', blade: 'small', screen: 'lamp', extras: [] }

async function bubble (page) {
  return page.evaluate(() => {
    const g = document.getElementById('guide')
    return { visible: !g.classList.contains('hidden'), html: g.querySelector('.guide-bubble').innerHTML, classes: g.className }
  })
}

test('Gro siger goddag paa introen, og saa starter spillet', async ({ page }) => {
  await page.goto('/index.html?mute=1&sw=0')
  await page.waitForFunction(() => !!window.__game)
  await page.getByLabel('start spillet').click()
  const b = await bubble(page)
  expect(b.visible).toBe(true)
  expect(b.html).toContain('👋')
  await expect.poll(() => page.evaluate(() => window.__game.screen), { timeout: 8000 }).toBe('workshop')
})

test('paa kortet peger hun paa haven der blinker', async ({ page }) => {
  await seedSave(page, { machine: MACHINE, stars: [3, 0, 0, 0, 0] })
  await openGame(page)
  await expect.poll(async () => (await bubble(page)).visible).toBe(true)
  await page.waitForTimeout(1200)
  expect((await bubble(page)).classes).toContain('point')
})

test('i en have fortaeller hun hvad man skal, og giver et tip', async ({ page }) => {
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { level: '4' })
  const b = await bubble(page)
  expect(b.visible).toBe(true)
  expect(b.html).toContain('svg')
  await page.waitForTimeout(5600)
  expect((await bubble(page)).html).toContain('💦') // dammen
})

test('bogstavbanen viser bogstavet stort, og Gro har det i boblen', async ({ page }) => {
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { bane: 'letterM' })
  await expect(page.locator('.big-letter')).toHaveText('M')
  expect((await bubble(page)).html).toContain('bubble-letter')
})

test('regne-porte: foerst forklarer hun legen, saa kommer regnestykket i boblen', async ({ page }) => {
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { screen: 'gates' })
  expect((await bubble(page)).html).toContain('➕')
  await expect.poll(async () => (await bubble(page)).html, { timeout: 8000 }).toContain('bubble-sum')
  expect(await page.evaluate(() => window.__game.state.answer)).toBeGreaterThan(0)
})

test('naar alt er klippet, peger hun mod stationen', async ({ page }) => {
  test.setTimeout(180_000)
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { level: '1' })
  await page.evaluate(() => window.__kit.mow(700))
  await step(page, 0.2)
  const b = await bubble(page)
  expect(b.visible).toBe(true)
  expect(b.html).toContain('🔋')
})

test('hun ligger aldrig i vejen for fingeren', async ({ page }) => {
  await seedSave(page, { machine: MACHINE })
  await openGame(page, { level: '1' })
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('guide')).pointerEvents)).toBe('none')
})
