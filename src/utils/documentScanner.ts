/**
 * Document Scanner Module for NDLOCR-lite Web AI: Model BLUEPOND
 *
 * Provides browser-based document detection, perspective correction,
 * and curved page dewarping using Canvas API.
 *
 * Algorithms:
 *   - Edge detection: Sobel operator + non-maximum suppression
 *   - Document boundary: Contour tracing + convex hull + quadrilateral fitting
 *   - Perspective correction: Bilinear interpolation with homography matrix
 *   - Page dewarping: Horizontal text-line detection + mesh-based remapping
 */

// ============================================================================
// Types
// ============================================================================

export interface Point {
  x: number
  y: number
}

export interface Quadrilateral {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

export interface ScanResult {
  /** Perspective-corrected image as data URL */
  dataUrl: string
  /** Detected document corners (in original image coordinates) */
  corners: Quadrilateral
  /** Original image dimensions */
  originalWidth: number
  originalHeight: number
}

// ============================================================================
// Internal Helpers
// ============================================================================

function createCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2D context')
  return { canvas, ctx }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/** Convert RGBA ImageData to single-channel grayscale Float32Array */
function toGrayscale(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const j = i * 4
    gray[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]
  }
  return gray
}

/** Gaussian blur (5×5 separable, σ ≈ 1.4) on single-channel */
function gaussianBlur(src: Float32Array, w: number, h: number): Float32Array {
  const kernel = [1, 4, 6, 4, 1]
  const kSum = 16 // 1+4+6+4+1
  const tmp = new Float32Array(w * h)
  const dst = new Float32Array(w * h)

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let k = -2; k <= 2; k++) {
        const sx = Math.max(0, Math.min(w - 1, x + k))
        sum += src[y * w + sx] * kernel[k + 2]
      }
      tmp[y * w + x] = sum / kSum
    }
  }

  // Vertical pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let k = -2; k <= 2; k++) {
        const sy = Math.max(0, Math.min(h - 1, y + k))
        sum += tmp[sy * w + x] * kernel[k + 2]
      }
      dst[y * w + x] = sum / kSum
    }
  }
  return dst
}

/** Sobel edge detection, returns gradient magnitude */
function sobelEdges(gray: Float32Array, w: number, h: number): Float32Array {
  const mag = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = gray[(y - 1) * w + (x - 1)]
      const t  = gray[(y - 1) * w + x]
      const tr = gray[(y - 1) * w + (x + 1)]
      const l  = gray[y * w + (x - 1)]
      const r  = gray[y * w + (x + 1)]
      const bl = gray[(y + 1) * w + (x - 1)]
      const b  = gray[(y + 1) * w + x]
      const br = gray[(y + 1) * w + (x + 1)]

      const gx = -tl + tr - 2 * l + 2 * r - bl + br
      const gy = -tl - 2 * t - tr + bl + 2 * b + br
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return mag
}

/** Adaptive threshold on edge magnitude → binary edge map */
function thresholdEdges(mag: Float32Array, w: number, h: number): Uint8Array {
  const binary = new Uint8Array(w * h)

  // Compute mean of non-zero magnitudes
  let sum = 0, count = 0
  for (let i = 0; i < mag.length; i++) {
    if (mag[i] > 0) { sum += mag[i]; count++ }
  }
  const mean = count > 0 ? sum / count : 128
  const thresh = mean * 0.5

  for (let i = 0; i < mag.length; i++) {
    binary[i] = mag[i] > thresh ? 255 : 0
  }
  return binary
}

/** Dilate binary image to connect nearby edges (3×3 kernel) */
function dilate(binary: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let maxVal = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          maxVal = Math.max(maxVal, binary[(y + dy) * w + (x + dx)])
        }
      }
      out[y * w + x] = maxVal
    }
  }
  return out
}

// ============================================================================
// Contour Detection & Quadrilateral Fitting
// ============================================================================

/**
 * Scan the edge map for connected components using flood fill,
 * then find the largest contour points.
 */
function findLargestContour(binary: Uint8Array, w: number, h: number): Point[] {
  const visited = new Uint8Array(w * h)
  let largestContour: Point[] = []

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (binary[idx] === 0 || visited[idx]) continue

      // BFS flood fill to collect contour points
      const contour: Point[] = []
      const queue: number[] = [idx]
      visited[idx] = 1

      while (queue.length > 0) {
        const ci = queue.pop()!
        const cy = (ci / w) | 0
        const cx = ci % w
        contour.push({ x: cx, y: cy })

        // 4-connected neighbors
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          const ni = ny * w + nx
          if (binary[ni] === 0 || visited[ni]) continue
          visited[ni] = 1
          queue.push(ni)
        }
      }

      if (contour.length > largestContour.length) {
        largestContour = contour
      }
    }
  }
  return largestContour
}

/** Compute convex hull using Graham scan */
function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points

  // Find bottom-most (then left-most) point
  let pivot = points[0]
  for (const p of points) {
    if (p.y > pivot.y || (p.y === pivot.y && p.x < pivot.x)) {
      pivot = p
    }
  }

  const sorted = points
    .filter(p => p !== pivot)
    .sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x)
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x)
      if (angleA !== angleB) return angleA - angleB
      const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2
      const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2
      return distA - distB
    })

  const hull: Point[] = [pivot]

  for (const p of sorted) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2]
      const b = hull[hull.length - 1]
      const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
      if (cross <= 0) hull.pop()
      else break
    }
    hull.push(p)
  }
  return hull
}

/** Find the 4 corners of a quadrilateral that best fits the convex hull */
function fitQuadrilateral(hull: Point[], w: number, h: number): Quadrilateral {
  if (hull.length < 4) {
    // Fallback: use image corners
    return {
      topLeft: { x: 0, y: 0 },
      topRight: { x: w, y: 0 },
      bottomRight: { x: w, y: h },
      bottomLeft: { x: 0, y: h },
    }
  }

  // Classify points by distance to each corner of the image
  const corners = [
    { x: 0, y: 0 },       // topLeft
    { x: w, y: 0 },       // topRight
    { x: w, y: h },       // bottomRight
    { x: 0, y: h },       // bottomLeft
  ]

  const closest: Point[] = corners.map(corner => {
    let minDist = Infinity
    let best = hull[0]
    for (const p of hull) {
      const dist = (p.x - corner.x) ** 2 + (p.y - corner.y) ** 2
      if (dist < minDist) {
        minDist = dist
        best = p
      }
    }
    return best
  })

  return {
    topLeft: closest[0],
    topRight: closest[1],
    bottomRight: closest[2],
    bottomLeft: closest[3],
  }
}

// ============================================================================
// Perspective Correction (Homography)
// ============================================================================

/**
 * Solve 3×3 homography matrix from 4 point correspondences
 * Maps src[i] → dst[i]
 */
function computeHomography(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point]
): number[] {
  // Build 8×8 system: A * h = b
  const A: number[][] = []
  const b: number[] = []

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = src[i]
    const { x: dx, y: dy } = dst[i]

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
    b.push(dx)
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
    b.push(dy)
  }

  // Solve using Gaussian elimination
  const n = 8
  const augmented = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col
    let maxVal = Math.abs(augmented[col][col])
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(augmented[row][col])
      if (val > maxVal) { maxVal = val; maxRow = row }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]]

    const pivot = augmented[col][col]
    if (Math.abs(pivot) < 1e-10) continue

    // Eliminate
    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = augmented[row][col] / pivot
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j]
      }
    }
  }

  // Extract solution
  const h = new Array(9)
  for (let i = 0; i < 8; i++) {
    h[i] = augmented[i][n] / augmented[i][i]
  }
  h[8] = 1
  return h
}

/**
 * Apply perspective transform using homography matrix (inverse mapping)
 */
function applyPerspectiveTransform(
  srcImageData: ImageData,
  H: number[],
  outWidth: number,
  outHeight: number
): ImageData {
  const srcData = srcImageData.data
  const srcW = srcImageData.width
  const srcH = srcImageData.height

  const { ctx } = createCanvas(outWidth, outHeight)
  const outImageData = ctx.createImageData(outWidth, outHeight)
  const outData = outImageData.data

  // Compute inverse homography (maps dst → src)
  const Hinv = invertHomography(H)

  for (let dy = 0; dy < outHeight; dy++) {
    for (let dx = 0; dx < outWidth; dx++) {
      // Map destination pixel to source
      const denom = Hinv[6] * dx + Hinv[7] * dy + Hinv[8]
      const sx = (Hinv[0] * dx + Hinv[1] * dy + Hinv[2]) / denom
      const sy = (Hinv[3] * dx + Hinv[4] * dy + Hinv[5]) / denom

      // Bilinear interpolation
      const x0 = Math.floor(sx)
      const y0 = Math.floor(sy)
      const x1 = x0 + 1
      const y1 = y0 + 1

      if (x0 < 0 || y0 < 0 || x1 >= srcW || y1 >= srcH) {
        // Out of bounds → white
        const di = (dy * outWidth + dx) * 4
        outData[di] = 255
        outData[di + 1] = 255
        outData[di + 2] = 255
        outData[di + 3] = 255
        continue
      }

      const fx = sx - x0
      const fy = sy - y0

      const di = (dy * outWidth + dx) * 4
      for (let c = 0; c < 4; c++) {
        const v00 = srcData[(y0 * srcW + x0) * 4 + c]
        const v10 = srcData[(y0 * srcW + x1) * 4 + c]
        const v01 = srcData[(y1 * srcW + x0) * 4 + c]
        const v11 = srcData[(y1 * srcW + x1) * 4 + c]

        outData[di + c] = Math.round(
          v00 * (1 - fx) * (1 - fy) +
          v10 * fx * (1 - fy) +
          v01 * (1 - fx) * fy +
          v11 * fx * fy
        )
      }
    }
  }

  return outImageData
}

/** Invert a 3×3 homography matrix stored as flat array [h0..h8] */
function invertHomography(H: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = H
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
  if (Math.abs(det) < 1e-10) return [...H] // degenerate

  const invDet = 1 / det
  return [
    (e * i - f * h) * invDet,
    (c * h - b * i) * invDet,
    (b * f - c * e) * invDet,
    (f * g - d * i) * invDet,
    (a * i - c * g) * invDet,
    (c * d - a * f) * invDet,
    (d * h - e * g) * invDet,
    (b * g - a * h) * invDet,
    (a * e - b * d) * invDet,
  ]
}

// ============================================================================
// Curved Page Dewarping
// ============================================================================

/**
 * Improved curved page dewarping.
 *
 * Strategy:
 * 1. Detect horizontal text lines via row projection peaks
 * 2. Track each text line's y-position across horizontal segments
 * 3. Compute the curvature shift per column by averaging deviations
 * 4. Remap pixels to straighten the curve
 *
 * This handles moderate page curvature (e.g. book pages photographed from above).
 */
export function dewarpPage(imageData: ImageData): ImageData {
  const { data, width, height } = imageData
  const gray = toGrayscale(imageData)

  // 1. Adaptive threshold: compute Otsu's threshold
  const histogram = new Int32Array(256)
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++
  const total = gray.length
  let sumAll = 0
  for (let i = 0; i < 256; i++) sumAll += i * histogram[i]
  let sumBg = 0, wBg = 0, maxVariance = 0, threshold = 128
  for (let i = 0; i < 256; i++) {
    wBg += histogram[i]
    if (wBg === 0) continue
    const wFg = total - wBg
    if (wFg === 0) break
    sumBg += i * histogram[i]
    const meanBg = sumBg / wBg
    const meanFg = (sumAll - sumBg) / wFg
    const variance = wBg * wFg * (meanBg - meanFg) * (meanBg - meanFg)
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = i
    }
  }

  // 2. Compute row-wise dark pixel density to find text lines
  const rowDensity = new Float32Array(height)
  for (let y = 0; y < height; y++) {
    let darkCount = 0
    for (let x = 0; x < width; x++) {
      if (gray[y * width + x] < threshold) darkCount++
    }
    rowDensity[y] = darkCount / width
  }

  // 3. Find text line positions as peaks in row density
  // Smooth row density first
  const smoothedDensity = new Float32Array(height)
  const smoothRadius = Math.max(2, Math.round(height / 200))
  for (let y = 0; y < height; y++) {
    let sum = 0, count = 0
    for (let k = Math.max(0, y - smoothRadius); k <= Math.min(height - 1, y + smoothRadius); k++) {
      sum += rowDensity[k]
      count++
    }
    smoothedDensity[y] = sum / count
  }

  // Detect peaks: find rows where density is a local maximum and above average
  let avgDensity = 0
  for (let y = 0; y < height; y++) avgDensity += smoothedDensity[y]
  avgDensity /= height
  const peakThreshold = avgDensity * 0.5

  const textLineYs: number[] = []
  const minLineGap = Math.max(5, Math.round(height / 80))
  for (let y = minLineGap; y < height - minLineGap; y++) {
    if (smoothedDensity[y] > peakThreshold &&
        smoothedDensity[y] >= smoothedDensity[y - 1] &&
        smoothedDensity[y] >= smoothedDensity[y + 1]) {
      if (textLineYs.length === 0 || y - textLineYs[textLineYs.length - 1] >= minLineGap) {
        textLineYs.push(y)
      }
    }
  }

  // If too few lines detected, return original
  if (textLineYs.length < 3) {
    return imageData
  }

  // 4. For each text line, track its y-position across horizontal segments
  const numSegments = 24
  const segWidth = Math.floor(width / numSegments)
  // shiftPerSegment[seg] accumulates deviations from each line's mean
  const shiftSum = new Float32Array(numSegments)
  const shiftCount = new Int32Array(numSegments)

  for (const lineY of textLineYs) {
    // Search window around the global line position
    const searchHalf = Math.max(10, Math.round(height / 40))
    const yMin = Math.max(0, lineY - searchHalf)
    const yMax = Math.min(height - 1, lineY + searchHalf)

    // Find the local peak y in each segment
    const localYs = new Float32Array(numSegments)
    const localValid = new Uint8Array(numSegments)

    for (let s = 0; s < numSegments; s++) {
      const x0 = s * segWidth
      const x1 = Math.min(x0 + segWidth, width)
      let bestY = lineY
      let bestDensity = 0

      for (let y = yMin; y <= yMax; y++) {
        let darkCount = 0
        for (let x = x0; x < x1; x++) {
          if (gray[y * width + x] < threshold) darkCount++
        }
        if (darkCount > bestDensity) {
          bestDensity = darkCount
          bestY = y
        }
      }

      // Only use if there's enough signal
      if (bestDensity > (x1 - x0) * 0.02) {
        localYs[s] = bestY
        localValid[s] = 1
      }
    }

    // Compute the mean y for this line across valid segments
    let meanY = 0, validCount = 0
    for (let s = 0; s < numSegments; s++) {
      if (localValid[s]) {
        meanY += localYs[s]
        validCount++
      }
    }
    if (validCount < numSegments * 0.4) continue
    meanY /= validCount

    // Accumulate deviation from line mean into shift arrays
    for (let s = 0; s < numSegments; s++) {
      if (localValid[s]) {
        shiftSum[s] += localYs[s] - meanY
        shiftCount[s]++
      }
    }
  }

  // 5. Average the shifts across all text lines
  const rawShifts = new Float32Array(numSegments)
  for (let s = 0; s < numSegments; s++) {
    rawShifts[s] = shiftCount[s] > 0 ? shiftSum[s] / shiftCount[s] : 0
  }

  // Smooth the shift curve with a wider kernel
  const smoothShifts = new Float32Array(numSegments)
  for (let s = 0; s < numSegments; s++) {
    let sum = 0, count = 0
    for (let k = Math.max(0, s - 3); k <= Math.min(numSegments - 1, s + 3); k++) {
      sum += rawShifts[k]
      count++
    }
    smoothShifts[s] = sum / count
  }

  // Check if the max shift is significant enough to warrant dewarping
  let maxShift = 0
  for (let s = 0; s < numSegments; s++) {
    maxShift = Math.max(maxShift, Math.abs(smoothShifts[s]))
  }
  if (maxShift < 2) {
    // Negligible curvature, return original
    return imageData
  }

  // 6. Remap pixels
  const { ctx } = createCanvas(width, height)
  const outImageData = ctx.createImageData(width, height)
  const outData = outImageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Interpolate shift for this x position
      const segF = (x / width) * (numSegments - 1)
      const s0 = Math.floor(segF)
      const s1 = Math.min(s0 + 1, numSegments - 1)
      const t = segF - s0
      const shift = smoothShifts[s0] * (1 - t) + smoothShifts[s1] * t

      const srcY = y + shift
      const srcYi = Math.floor(srcY)
      const frac = srcY - srcYi

      if (srcYi < 0 || srcYi >= height - 1) {
        // Out of bounds → white
        const di = (y * width + x) * 4
        outData[di] = 255
        outData[di + 1] = 255
        outData[di + 2] = 255
        outData[di + 3] = 255
        continue
      }

      const di = (y * width + x) * 4
      const si0 = (srcYi * width + x) * 4
      const si1 = ((srcYi + 1) * width + x) * 4

      for (let ch = 0; ch < 4; ch++) {
        outData[di + ch] = Math.round(
          data[si0 + ch] * (1 - frac) + data[si1 + ch] * frac
        )
      }
    }
  }

  return outImageData
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Detect document edges in an image.
 * Works at reduced resolution for speed, then scales corners back.
 *
 * @param dataUrl - Source image as data URL
 * @returns Detected quadrilateral corners in original image coordinates
 */
export async function detectDocument(dataUrl: string): Promise<Quadrilateral> {
  const img = await loadImage(dataUrl)
  const origW = img.width
  const origH = img.height

  // Work at reduced resolution for speed (max 600px on longest side)
  const maxDim = 600
  const scale = Math.min(1, maxDim / Math.max(origW, origH))
  const w = Math.round(origW * scale)
  const h = Math.round(origH * scale)

  const { ctx } = createCanvas(w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)

  // Process: grayscale → blur → edges → dilate → find contour → fit quad
  let gray = toGrayscale(imageData)
  gray = gaussianBlur(gray, w, h)
  const edges = sobelEdges(gray, w, h)
  let binary = thresholdEdges(edges, w, h)
  binary = dilate(binary, w, h)
  binary = dilate(binary, w, h)

  const contour = findLargestContour(binary, w, h)
  const hull = convexHull(contour)
  const quad = fitQuadrilateral(hull, w, h)

  // Scale corners back to original resolution
  const invScale = 1 / scale
  return {
    topLeft: { x: Math.round(quad.topLeft.x * invScale), y: Math.round(quad.topLeft.y * invScale) },
    topRight: { x: Math.round(quad.topRight.x * invScale), y: Math.round(quad.topRight.y * invScale) },
    bottomRight: { x: Math.round(quad.bottomRight.x * invScale), y: Math.round(quad.bottomRight.y * invScale) },
    bottomLeft: { x: Math.round(quad.bottomLeft.x * invScale), y: Math.round(quad.bottomLeft.y * invScale) },
  }
}

/**
 * Apply perspective correction using detected (or manually adjusted) corners.
 *
 * @param dataUrl - Source image as data URL
 * @param corners - Four corners of the document region
 * @returns Corrected image as data URL
 */
export async function correctPerspective(
  dataUrl: string,
  corners: Quadrilateral
): Promise<string> {
  const img = await loadImage(dataUrl)
  const { ctx } = createCanvas(img.width, img.height)
  ctx.drawImage(img, 0, 0)
  const srcImageData = ctx.getImageData(0, 0, img.width, img.height)

  const { topLeft, topRight, bottomRight, bottomLeft } = corners

  // Calculate output dimensions from the longer edges
  const topWidth = Math.sqrt((topRight.x - topLeft.x) ** 2 + (topRight.y - topLeft.y) ** 2)
  const bottomWidth = Math.sqrt((bottomRight.x - bottomLeft.x) ** 2 + (bottomRight.y - bottomLeft.y) ** 2)
  const leftHeight = Math.sqrt((bottomLeft.x - topLeft.x) ** 2 + (bottomLeft.y - topLeft.y) ** 2)
  const rightHeight = Math.sqrt((bottomRight.x - topRight.x) ** 2 + (bottomRight.y - topRight.y) ** 2)

  const outW = Math.round(Math.max(topWidth, bottomWidth))
  const outH = Math.round(Math.max(leftHeight, rightHeight))

  if (outW <= 0 || outH <= 0) return dataUrl

  // Compute homography: source corners → output rectangle
  const srcPts: [Point, Point, Point, Point] = [topLeft, topRight, bottomRight, bottomLeft]
  const dstPts: [Point, Point, Point, Point] = [
    { x: 0, y: 0 },
    { x: outW, y: 0 },
    { x: outW, y: outH },
    { x: 0, y: outH },
  ]

  const H = computeHomography(srcPts, dstPts)
  const correctedImageData = applyPerspectiveTransform(srcImageData, H, outW, outH)

  const { canvas: outCanvas, ctx: outCtx } = createCanvas(outW, outH)
  outCtx.putImageData(correctedImageData, 0, 0)
  return outCanvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Full scan pipeline: detect document → perspective correct → optional dewarp.
 *
 * @param dataUrl - Source image as data URL
 * @param enableDewarp - Whether to apply curved page dewarping
 * @returns ScanResult with corrected image and detected corners
 */
export async function scanDocument(
  dataUrl: string,
  enableDewarp = false
): Promise<ScanResult> {
  const img = await loadImage(dataUrl)
  const corners = await detectDocument(dataUrl)
  let correctedUrl = await correctPerspective(dataUrl, corners)

  if (enableDewarp) {
    const correctedImg = await loadImage(correctedUrl)
    const { ctx } = createCanvas(correctedImg.width, correctedImg.height)
    ctx.drawImage(correctedImg, 0, 0)
    const imageData = ctx.getImageData(0, 0, correctedImg.width, correctedImg.height)

    const dewarped = dewarpPage(imageData)
    const { canvas: outCanvas, ctx: outCtx } = createCanvas(dewarped.width, dewarped.height)
    outCtx.putImageData(dewarped, 0, 0)
    correctedUrl = outCanvas.toDataURL('image/jpeg', 0.92)
  }

  return {
    dataUrl: correctedUrl,
    corners,
    originalWidth: img.width,
    originalHeight: img.height,
  }
}

/**
 * Split a double-page scan into two separate pages.
 * Detects the center fold and splits accordingly.
 *
 * @param dataUrl - Source image as data URL
 * @returns [rightPage, leftPage] for Japanese reading order (right-to-left)
 */
export async function splitDoublePageScan(
  dataUrl: string
): Promise<[string, string]> {
  const img = await loadImage(dataUrl)
  const w = img.width
  const h = img.height

  const { canvas, ctx } = createCanvas(w, h)
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, w, h)
  const gray = toGrayscale(imageData)

  // Find the column with minimum dark pixel density in the center region
  const searchStart = Math.floor(w * 0.3)
  const searchEnd = Math.floor(w * 0.7)
  const windowSize = Math.max(10, Math.floor(w / 100))

  let minDensity = Infinity
  let splitX = Math.floor(w / 2)

  for (let x = searchStart; x < searchEnd; x++) {
    let density = 0
    for (let y = 0; y < h; y++) {
      for (let dx = -windowSize; dx <= windowSize; dx++) {
        const sx = Math.max(0, Math.min(w - 1, x + dx))
        if (gray[y * w + sx] < 128) density++
      }
    }
    if (density < minDensity) {
      minDensity = density
      splitX = x
    }
  }

  // Extract left and right halves
  const { canvas: leftCanvas, ctx: leftCtx } = createCanvas(splitX, h)
  leftCtx.drawImage(canvas, 0, 0, splitX, h, 0, 0, splitX, h)

  const rightW = w - splitX
  const { canvas: rightCanvas, ctx: rightCtx } = createCanvas(rightW, h)
  rightCtx.drawImage(canvas, splitX, 0, rightW, h, 0, 0, rightW, h)

  return [
    rightCanvas.toDataURL('image/jpeg', 0.92), // Right page first (Japanese order)
    leftCanvas.toDataURL('image/jpeg', 0.92),
  ]
}
