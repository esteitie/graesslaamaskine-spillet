// Service worker: spillet skal kunne startes fra iPadens hjemmeskaerm uden internet.
// Netvaerk foerst, cache som reserve - saa er en opdatering aldrig laast fast.

const CACHE = 'graesslaamaskine-v5'

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './src/main.js',
  './src/audio.js',
  './src/save.js',
  './src/machine.js',
  './src/workshop.js',
  './src/map.js',
  './src/level.js',
  './src/grid.js',
  './src/render.js',
  './src/critters.js',
  './src/school.js',
  './src/guide.js',
  './src/garage3d.js',
  './libs/three.module.js',
  './src/geometry.js',
  './src/input.js',
  './src/confetti.js',
  './src/ui.js',
  './src/voice-lines.js',
  './src/levels/level1.json',
  './src/levels/level2.json',
  './src/levels/level3.json',
  './src/levels/level4.json',
  './src/levels/level5.json',
  './src/levels/maze1.json',
  './src/levels/maze2.json',
  './src/levels/maze3.json',
  './src/levels/maze4.json',
  './src/levels/maze5.json',
  './src/levels/maze6.json',
  './src/levels/letterI.json',
  './src/levels/letterL.json',
  './src/levels/letterT.json',
  './src/levels/letterH.json',
  './src/levels/letterU.json',
  './src/levels/letterF.json',
  './src/levels/letterE.json',
  './src/levels/letterM.json',
  './src/levels/letterN.json',
  './src/levels/letterZ.json'
]

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req)
      const cache = await caches.open(CACHE)
      cache.put(req, fresh.clone())
      return fresh
    } catch {
      const hit = await caches.match(req)
      if (hit) return hit
      if (req.mode === 'navigate') {
        const index = await caches.match('./index.html')
        if (index) return index
      }
      throw new Error('offline')
    }
  })())
})
