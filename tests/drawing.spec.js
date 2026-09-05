// Tegnefasen er slaaet fra i spillet, men koden er der stadig bag ?draw=1.
// Testene her holder den i live, indtil vi beslutter om den skal tilbage.
import { test, expect } from '@playwright/test'
import {
  openGame, drawWire, drawRing, lawnPath, startDriving, levelState, playLevel
} from './helpers.js'

const DRAW = { draw: '1' }

test('tegn firkant -> ledningen lukker og snapper til plaenen', async ({ page }) => {
  await openGame(page, { level: '1', ...DRAW })
  expect((await levelState(page)).phase).toBe('wire')

  // en lidt sjusket firkant, som et barn ville tegne den
  await drawWire(page, [
    [200, 305], [206, 150], [420, 134], [755, 148],
    [770, 300], [752, 460], [430, 478], [204, 466], [200, 305]
  ])

  const s = await levelState(page)
  expect(s.wireClosed).toBe(true)
  expect(s.phase).toBe('ready')
  expect(s.wirePoints).toBe(4)
  expect(s.insideCells).toBe(s.grassCells)
  expect(s.stars).toBe(3)
})

test('for lille ledning afvises venligt og kan tegnes igen', async ({ page }) => {
  await openGame(page, { level: '1', ...DRAW })
  await drawWire(page, [[200, 305], [200, 240], [330, 240], [330, 380], [200, 380], [200, 305]])
  const s = await levelState(page)
  expect(s.wireClosed).toBe(false)
  expect(s.wirePoints).toBe(0) // ledningen er slettet, ingen straf
  expect(s.phase).toBe('wire')

  await drawWire(page, await lawnPath(page, 1))
  expect((await levelState(page)).phase).toBe('ready')
})

test('bane 2: ledning gennem bedet afvises, ringen snapper til bedet', async ({ page }) => {
  await openGame(page, { level: '2', ...DRAW })

  await page.evaluate(() => window.__kit.drawPath([[160, 315], [400, 315], [600, 315]]))
  const blocked = await levelState(page)
  expect(blocked.wireClosed).toBe(false)
  expect(blocked.wirePoints).toBeLessThan(60) // naaede ikke forbi bedets kant

  await page.reload()
  await page.waitForFunction(() => !!window.__game)
  await page.addScriptTag({ url: '/tools/testkit.js' })

  await drawWire(page, await lawnPath(page, 2))
  expect((await levelState(page)).phase).toBe('island')

  await drawRing(page, 490, 315, 85)
  const afterRing = await levelState(page)
  expect(afterRing.islandsDone).toBe(1)
  expect(afterRing.phase).toBe('ready')
})

test('bane 4: terrassen blokerer ledningen', async ({ page }) => {
  await openGame(page, { level: '4', ...DRAW })
  await page.evaluate(() => window.__kit.drawPath([[150, 315], [150, 130], [820, 130]]))
  const blocked = await levelState(page)
  expect(blocked.wireClosed).toBe(false)
  expect(blocked.wirePoints).toBeGreaterThan(0)

  await drawWire(page, await lawnPath(page, 4))
  expect((await levelState(page)).phase).toBe('ready')
})

test('en bane kan stadig spilles helt igennem med tegnefasen', async ({ page }) => {
  test.setTimeout(180_000)
  await openGame(page, { level: '2', ...DRAW })
  const s = await playLevel(page, 2, { draw: true, islands: [{ x: 490, y: 315, r: 70 }] })
  expect(s.phase).toBe('done')
  expect(s.stars).toBeGreaterThanOrEqual(1)
})

test('startknappen findes kun naar der er tegnet', async ({ page }) => {
  await openGame(page, { level: '3', ...DRAW })
  await expect(page.getByLabel('kør', { exact: true })).toBeHidden()
  await drawWire(page, await lawnPath(page, 3))
  await expect(page.getByLabel('kør', { exact: true })).toBeVisible()
  await startDriving(page)
  expect((await levelState(page)).phase).toBe('drive')
})
