import { test, expect } from '@playwright/test'
import { openGame, gameUrl, elementAt, levelState } from './helpers.js'

test('intro starter og foerer til vaerkstedet foerste gang', async ({ page }) => {
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto('/index.html?mute=1&sw=0')
  await page.waitForFunction(() => !!window.__game)
  expect(await page.evaluate(() => window.__game.screen)).toBe('intro')

  await page.getByLabel('start spillet').click()
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')
  expect(errors).toEqual([])
})

test('ingen konsolfejl i vaerksted, kort og bane', async ({ page }) => {
  const errors = await openGame(page, { level: '1' })
  await page.evaluate(() => window.__game.go('workshop'))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('workshop')
  await page.evaluate(() => window.__game.go('map'))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('map')
  await page.evaluate(() => window.__game.go('level', { number: 2 }))
  await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe('level')
  expect(errors).toEqual([])
})

test('alle synlige knapper er mindst 80x80 px', async ({ page }) => {
  await openGame(page, { level: '2' })
  for (const screen of ['workshop', 'map', 'master']) {
    await page.evaluate(s => window.__game.go(s), screen)
    await expect.poll(() => page.evaluate(() => window.__game.screen)).toBe(screen)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter(b => !b.hidden && b.getBoundingClientRect().width > 0)
        .map(b => ({ label: b.getAttribute('aria-label'), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height }))
        .filter(b => b.w < 80 || b.h < 80))
    expect(small, `for smaa knapper paa ${screen}`).toEqual([])
  }
})

test('URL-parametre virker', async ({ page }) => {
  await page.goto(gameUrl({ level: '4' }))
  await page.waitForFunction(() => window.__game?.screen === 'level')
  expect(await page.evaluate(() => window.__game.level.phase)).toBe('drive')

  await page.goto(gameUrl({ level: '4', draw: '1' }))
  await page.waitForFunction(() => window.__game?.screen === 'level')
  expect(await page.evaluate(() => window.__game.level.phase)).toBe('wire')
})

test('spilfladen tager imod mus og finger paa alle baner', async ({ page }) => {
  for (const n of ['1', '2', '3', '4', '5']) {
    await openGame(page, { level: n })
    expect(await elementAt(page, 480, 300), `bane ${n}`).toBe('scene')
  }
})

test('spillet kan koeres med tastatur alene', async ({ page }) => {
  await openGame(page, { level: '1' })
  const before = (await levelState(page)).position
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(900)
  await page.keyboard.up('ArrowRight')
  const after = (await levelState(page)).position
  expect(after[0]).toBeGreaterThan(before[0] + 30)
  expect((await levelState(page)).progress).toBeGreaterThan(0)
})
