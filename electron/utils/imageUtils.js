/**
 * Creates a 16x16 colored circle as a raw RGBA Buffer
 * suitable for nativeImage.createFromBuffer(buf, { width: 16, height: 16 })
 */
export function coloredCircleBuffer(hex = '#9333ea', size = 16) {
  const [r, g, b] = hexToRgb(hex)

  const buf = Buffer.alloc(size * size * 4, 0)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 1.5

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const alpha = dist <= radius ? 255
        : dist <= radius + 1 ? Math.round((radius + 1 - dist) * 255)
        : 0
      const i = (y * size + x) * 4
      // nativeImage.createFromBuffer expects BGRA
      buf[i]     = b
      buf[i + 1] = g
      buf[i + 2] = r
      buf[i + 3] = alpha
    }
  }
  return buf
}

// ── Modernized clepsydra (hourglass) icons for the menu-bar tray ────────────
//
// Refresh from the previous "6 straight line segments at 1.4 px" sketch:
//   • Bell-curved sides instead of straight diagonals (CURVE_K < 1) — softer
//     neck transition, less geometric, closer to SF-Symbols silhouette.
//   • Slightly thicker stroke (1.7 px) — more confident at 22 px without
//     closing up the negative space inside the bowtie.
//   • 4×4 supersampling for clean anti-aliased edges and rounded line caps.
//   • Filled variant overlays the stroke so the bar caps stay crisp instead
//     of showing the bare wedge corners of the bowtie.
//   • Result is cached per (hex, size) so the 1 Hz tray tick doesn't redo
//     the heavy sub-pixel render on every refresh.

const CURVE_K     = 0.62   // < 1 → bell-shaped sides; > 1 → starry/spiky
const PADDING     = 2.5    // edge padding inside the icon box
const STROKE_HALF = 0.85   // half stroke width → 1.7 px stroke
const SS          = 4      // supersampling factor (4×4 = 16 samples / px)
const CURVE_PTS   = 32     // polyline approximation of each side curve

function geometryFor(size) {
  const cx    = (size - 1) / 2
  const cy    = (size - 1) / 2
  const halfH = cy - PADDING
  // Inset the silhouette slightly so the stroke fits inside the icon box
  // without ever clipping at the rim.
  const maxHW = cx - PADDING - 0.25
  return { cx, cy, halfH, maxHW }
}

// Half-width of the silhouette at vertical offset yRel (relative to neck).
// Power CURVE_K shapes how aggressively the curve narrows toward the neck.
function silhouetteHalfWidth(yRel, halfH, maxHW) {
  const ady = Math.abs(yRel)
  if (ady > halfH) return -1
  return Math.pow(ady / halfH, CURVE_K) * maxHW
}

function isInsideSilhouette(x, y, g) {
  const yRel = y - g.cy
  if (Math.abs(yRel) > g.halfH) return false
  const hw = silhouetteHalfWidth(yRel, g.halfH, g.maxHW)
  return Math.abs(x - g.cx) <= hw
}

// Sample the right side of the bowtie into a polyline, top → neck → bottom.
function rightCurvePolyline(g, n = CURVE_PTS) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t  = i / n
    const dy = (t - 0.5) * 2 * g.halfH
    const hw = silhouetteHalfWidth(dy, g.halfH, g.maxHW)
    pts.push([g.cx + hw, g.cy + dy])
  }
  return pts
}

// Distance from (x, y) to the stroke path = top bar + bottom bar +
// right curve + mirrored left curve. Bars use segment-distance, which is
// equivalent to a capsule SDF when thresholded by stroke half-width.
function distToStroke(x, y, g, rightPoly) {
  let d = Infinity
  const yTop = PADDING
  const yBot = (g.cy * 2) - PADDING
  d = Math.min(d, segDist(x, y, g.cx - g.maxHW, yTop, g.cx + g.maxHW, yTop))
  d = Math.min(d, segDist(x, y, g.cx - g.maxHW, yBot, g.cx + g.maxHW, yBot))
  for (let i = 0; i < rightPoly.length - 1; i++) {
    const [x1, y1] = rightPoly[i]
    const [x2, y2] = rightPoly[i + 1]
    d = Math.min(d, segDist(x, y, x1, y1, x2, y2))
    d = Math.min(d, segDist(x, y, 2 * g.cx - x1, y1, 2 * g.cx - x2, y2))
  }
  return d
}

// Per-pixel coverage of the stroke band, supersampled.
function strokeCoverage(px, py, g, rightPoly) {
  let cov = 0
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const fx = px + (sx + 0.5) / SS - 0.5
      const fy = py + (sy + 0.5) / SS - 0.5
      const d  = distToStroke(fx, fy, g, rightPoly)
      if (d <= STROKE_HALF) cov++
      else if (d < STROKE_HALF + 0.5) cov += (STROKE_HALF + 0.5 - d) * 2
    }
  }
  return cov
}

// ── Caches ─────────────────────────────────────────────────────────────────
const outlineCache = new Map()
const filledCache  = new Map()

/**
 * Outline clepsydra — black on transparent. Use with
 * nativeImage.setTemplateImage(true) so macOS adapts it to both light and
 * dark menu bars automatically.
 */
export function hourglassBuffer(size = 22) {
  const cached = outlineCache.get(size)
  if (cached) return cached

  const buf = Buffer.alloc(size * size * 4, 0)
  const g   = geometryFor(size)
  const rp  = rightCurvePolyline(g)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cov = strokeCoverage(x, y, g, rp)
      const a   = Math.min(255, Math.round((cov / (SS * SS)) * 255))
      if (a > 0) {
        const i = (y * size + x) * 4
        buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = a
      }
    }
  }
  outlineCache.set(size, buf)
  return buf
}

/**
 * Solid filled clepsydra in a hex color, for the active-tracking state.
 * The fill is the bell-curved silhouette unioned with the stroke band so the
 * top/bottom bar caps stay rounded and visible above the wedge corners.
 */
export function hourglassFilledBuffer(hex = '#9333ea', size = 22) {
  const key = `${hex}@${size}`
  const cached = filledCache.get(key)
  if (cached) return cached

  const [r, g_, b] = hexToRgb(hex)
  const buf = Buffer.alloc(size * size * 4, 0)
  const g   = geometryFor(size)
  const rp  = rightCurvePolyline(g)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cov = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS - 0.5
          const fy = y + (sy + 0.5) / SS - 0.5
          if (isInsideSilhouette(fx, fy, g)) {
            cov++
          } else {
            const d = distToStroke(fx, fy, g, rp)
            if (d <= STROKE_HALF) cov++
            else if (d < STROKE_HALF + 0.5) cov += (STROKE_HALF + 0.5 - d) * 2
          }
        }
      }
      const a = Math.min(255, Math.round((cov / (SS * SS)) * 255))
      if (a > 0) {
        const i = (y * size + x) * 4
        buf[i] = b; buf[i + 1] = g_; buf[i + 2] = r; buf[i + 3] = a
      }
    }
  }
  filledCache.set(key, buf)
  return buf
}

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (!len2) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy)
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}
