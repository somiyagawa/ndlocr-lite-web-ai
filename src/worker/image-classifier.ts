/**
 * 画像特徴分析による現代/古典籍自動判定モジュール
 *
 * 古典籍（くずし字・版本・写本）の典型的特徴:
 *   - 和紙の暖色系背景（セピア・黄土色・クリーム色）
 *   - 墨書きの筆跡（筆圧変化による太さの変動）
 *   - 低彩度・暖色寄りの色分布
 *   - 縦長テキスト領域が主体
 *
 * 現代文書の典型的特徴:
 *   - 白い紙（RGB均一で高輝度）
 *   - 均一な活字（フォント）
 *   - ニュートラルな色温度
 *
 * 判定ロジック:
 *   1. 色温度分析（暖色比率）
 *   2. 背景色のセピア度判定
 *   3. 彩度分析
 *   4. 総合スコアでモード決定
 */

export type DetectedMode = 'modern' | 'koten'

export interface ClassificationResult {
  detectedMode: DetectedMode
  confidence: number
  features: {
    warmRatio: number       // 暖色ピクセル比率 (0-1)
    sepiaScore: number      // セピア度スコア (0-1)
    avgColorTemp: number    // 平均色温度 (R-B差)
    saturation: number      // 平均彩度 (0-1)
    brightnessStd: number   // 輝度の標準偏差
    paperWhiteness: number  // 紙の白さ (0-1)
  }
}

/**
 * 画像の特徴を分析して現代/古典籍を自動判定する
 * サンプリングで高速処理（全ピクセル走査は不要）
 */
export function classifyImage(imageData: ImageData): ClassificationResult {
  const { data, width, height } = imageData

  // パフォーマンスのため等間隔サンプリング（最大50,000ピクセル）
  const totalPixels = width * height
  const sampleStep = Math.max(1, Math.floor(totalPixels / 50000))

  let totalR = 0, totalG = 0, totalB = 0
  let warmPixels = 0
  let sepiaPixels = 0
  let totalSaturation = 0
  let totalBrightness = 0
  let brightnesses: number[] = []
  let whitePixels = 0
  let samples = 0

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    samples++

    totalR += r
    totalG += g
    totalB += b

    const brightness = (r + g + b) / 3
    totalBrightness += brightness
    brightnesses.push(brightness)

    // 暖色判定: R > B かつ背景色帯 (中〜高輝度)
    if (r > b + 15 && g > b + 5 && brightness > 80 && brightness < 230) {
      warmPixels++
    }

    // セピア判定: 和紙特有の黄褐色 (R高, G中, B低)
    // 典型的なセピア: R≈180-220, G≈150-190, B≈110-160
    const rg = Math.abs(r - g)
    const rb = r - b
    if (rb > 20 && rb < 80 && rg < 40 && brightness > 100 && brightness < 230) {
      sepiaPixels++
    }

    // 彩度 (HSL)
    const max = Math.max(r, g, b) / 255
    const min = Math.min(r, g, b) / 255
    const l = (max + min) / 2
    const sat = max === min ? 0 : (l > 0.5
      ? (max - min) / (2 - max - min)
      : (max - min) / (max + min))
    totalSaturation += sat

    // 白さ判定: 明るく彩度が低い (白い紙)
    if (brightness > 220 && sat < 0.1) {
      whitePixels++
    }
  }

  const avgR = totalR / samples
  const avgG = totalG / samples
  const avgB = totalB / samples
  const avgBrightness = totalBrightness / samples

  // 輝度の標準偏差
  const brightnessVariance = brightnesses.reduce((sum, b) => sum + (b - avgBrightness) ** 2, 0) / samples
  const brightnessStd = Math.sqrt(brightnessVariance)

  const warmRatio = warmPixels / samples
  const sepiaScore = sepiaPixels / samples
  const avgColorTemp = avgR - avgB
  const saturation = totalSaturation / samples
  const paperWhiteness = whitePixels / samples

  // === 総合判定スコア ===
  // 各特徴のスコアを加重合計して判定
  let kotenScore = 0

  // 1. 暖色比率: 0.3以上で強い古典籍シグナル
  if (warmRatio > 0.4) kotenScore += 3.0
  else if (warmRatio > 0.25) kotenScore += 2.0
  else if (warmRatio > 0.15) kotenScore += 1.0

  // 2. セピア度: 和紙の黄褐色
  if (sepiaScore > 0.3) kotenScore += 3.0
  else if (sepiaScore > 0.15) kotenScore += 2.0
  else if (sepiaScore > 0.08) kotenScore += 1.0

  // 3. 色温度: R-B差が大きい (暖色系紙)
  if (avgColorTemp > 30) kotenScore += 2.0
  else if (avgColorTemp > 20) kotenScore += 1.5
  else if (avgColorTemp > 10) kotenScore += 0.5

  // 4. 紙の白さ: 白い紙 = 現代文書 (負のスコア)
  if (paperWhiteness > 0.5) kotenScore -= 3.0
  else if (paperWhiteness > 0.3) kotenScore -= 2.0
  else if (paperWhiteness > 0.15) kotenScore -= 1.0

  // 5. 低彩度: 古典籍は彩度が低い傾向
  if (saturation < 0.08) kotenScore += 1.0
  else if (saturation > 0.2) kotenScore -= 1.0

  // 閾値: 3.0 以上で古典籍と判定
  const threshold = 3.0
  const detectedMode: DetectedMode = kotenScore >= threshold ? 'koten' : 'modern'
  const maxScore = 10.0
  const confidence = Math.min(1.0, Math.abs(kotenScore) / maxScore)

  console.log(
    `[ImageClassifier] Score: ${kotenScore.toFixed(1)} → ${detectedMode}` +
    ` (warm=${warmRatio.toFixed(2)}, sepia=${sepiaScore.toFixed(2)},` +
    ` temp=${avgColorTemp.toFixed(1)}, white=${paperWhiteness.toFixed(2)},` +
    ` sat=${saturation.toFixed(3)})`
  )

  return {
    detectedMode,
    confidence,
    features: {
      warmRatio,
      sepiaScore,
      avgColorTemp,
      saturation,
      brightnessStd,
      paperWhiteness,
    },
  }
}
