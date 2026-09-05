// Geometry helpers. Every point is [x, y] in the logical 960x600 canvas.

export const TAU = Math.PI * 2

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
export const lerp = (a, b, t) => a + (b - a) * t

export function dist2 (a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return dx * dx + dy * dy
}

export function dist (a, b) {
  return Math.sqrt(dist2(a, b))
}

/** Even-odd ray cast. Points exactly on an edge may fall either way. */
export function pointInPolygon (p, poly) {
  const x = p[0]
  const y = p[1]
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function closestPointOnSegment (p, a, b) {
  const abx = b[0] - a[0]
  const aby = b[1] - a[1]
  const len2 = abx * abx + aby * aby
  if (len2 === 0) return [a[0], a[1]]
  let t = ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2
  t = clamp(t, 0, 1)
  return [a[0] + abx * t, a[1] + aby * t]
}

export function distToSegment (p, a, b) {
  return dist(p, closestPointOnSegment(p, a, b))
}

/** Nearest point on a closed polygon outline -> { point, dist }. */
export function closestPointOnPolygon (p, poly) {
  let best = null
  let bestD = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = closestPointOnSegment(p, poly[j], poly[i])
    const d = dist2(p, c)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return { point: best, dist: Math.sqrt(bestD) }
}

export function distToPolygon (p, poly) {
  return closestPointOnPolygon(p, poly).dist
}

export function polylineLength (pts) {
  let total = 0
  for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i])
  return total
}

export function polygonLength (poly) {
  if (poly.length < 2) return 0
  return polylineLength(poly) + dist(poly[poly.length - 1], poly[0])
}

export function polygonArea (poly) {
  let a = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]
  }
  return Math.abs(a) / 2
}

export function polygonBounds (poly) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity
  for (const [x, y] of poly) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

export function polygonCentroid (poly) {
  let x = 0; let y = 0
  for (const p of poly) { x += p[0]; y += p[1] }
  return [x / poly.length, y / poly.length]
}

const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

export function segmentsIntersect (p1, p2, p3, p4) {
  const d1 = orient(p3, p4, p1)
  const d2 = orient(p3, p4, p2)
  const d3 = orient(p1, p2, p3)
  const d4 = orient(p1, p2, p4)
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
  const on = (a, b, c) => orient(a, b, c) === 0 &&
    Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1])
  return on(p3, p4, p1) || on(p3, p4, p2) || on(p1, p2, p3) || on(p1, p2, p4)
}

export function segmentIntersectsPolygon (a, b, poly) {
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (segmentsIntersect(a, b, poly[j], poly[i])) return true
  }
  return pointInPolygon(a, poly) || pointInPolygon(b, poly)
}

export function segmentIntersectsCircle (a, b, c, r) {
  return distToSegment(c, a, b) <= r
}

export function circleToPolygon (cx, cy, r, steps = 40) {
  const pts = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * TAU
    pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r])
  }
  return pts
}

export function rectToPolygon (x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
}

/**
 * Level shapes are { shape: 'circle'|'rect'|'polygon', ... }.
 * shapePolygon() gives an outline usable everywhere else.
 */
export function shapePolygon (shape) {
  if (shape.polygon) return shape.polygon
  if (shape.shape === 'circle') return circleToPolygon(shape.x, shape.y, shape.r)
  if (shape.shape === 'rect') return rectToPolygon(shape.x, shape.y, shape.w, shape.h)
  return shape.points || []
}

export function pointInShape (p, shape) {
  if (shape.shape === 'circle') return dist2(p, [shape.x, shape.y]) <= shape.r * shape.r
  if (shape.shape === 'rect') {
    return p[0] >= shape.x && p[0] <= shape.x + shape.w && p[1] >= shape.y && p[1] <= shape.y + shape.h
  }
  return pointInPolygon(p, shapePolygon(shape))
}

export function distToShape (p, shape) {
  if (shape.shape === 'circle') return Math.abs(dist(p, [shape.x, shape.y]) - shape.r)
  return distToPolygon(p, shapePolygon(shape))
}

export function segmentHitsShape (a, b, shape) {
  if (shape.shape === 'circle') return segmentIntersectsCircle(a, b, [shape.x, shape.y], shape.r)
  return segmentIntersectsPolygon(a, b, shapePolygon(shape))
}

/** Shortest signed angle difference, in radians. */
export function angleDelta (from, to) {
  let d = (to - from) % TAU
  if (d > Math.PI) d -= TAU
  if (d < -Math.PI) d += TAU
  return d
}

/** Deterministic pseudo random, so decorations look the same every time. */
export function makeRandom (seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}
