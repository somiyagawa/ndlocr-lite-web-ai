/**
 * PDF エクスポート（テキスト情報埋め込み）
 *
 * OCR結果の元画像を背景として配置し、各テキストブロックの位置に
 * 透明テキストレイヤーを重ねた PDF を生成する。
 * これによりPDF上でテキスト検索・選択が可能になる。
 *
 * pdf-lib + fontkit を使用し、CJK (日本語) テキストを正しくエンコードする。
 *
 * === テキストレイヤー設計方針 ===
 *
 * 不可視テキスト (opacity: 0.01) を画像の上に重ねる。
 * 目的は検索 (Ctrl+F) とテキスト選択の提供であり、視覚表示ではない。
 *
 * テキストは行単位で drawText する。
 *   - 1文字ずつ描画するとビューアがギャップを半角スペースと誤認する
 *   - ブロック全体を1回で描画するとテキストがページ外にはみ出す
 *   - 行単位なら1回の drawText 内は連続し、行間はY座標の差で分離される
 *
 * フォントサイズはブロック幅÷1行あたりの文字数から逆算し、
 * テキストがブロック領域内に概ね収まるようにする。
 */

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { OCRResult } from '../types/ocr'
import { loadCJKFontBytes } from './pdfFont'

const TEXT_OPACITY = 0.01

// ---- ユーティリティ ----

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function isPng(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/png')
}

async function embedImage(pdfDoc: PDFDocument, dataUrl: string) {
  const imageBytes = dataUrlToUint8Array(dataUrl)
  return isPng(dataUrl) ? pdfDoc.embedPng(imageBytes) : pdfDoc.embedJpg(imageBytes)
}

/**
 * フォントでエンコードできない文字を除去する。
 * 高速パス: 文字列全体を一括チェック → 成功ならそのまま返す。
 */
function filterEncodableText(
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
): string {
  try {
    font.encodeText(text)
    return text
  } catch {
    // 文字単位フィルタ（低速パス — エンコード不可文字がある場合のみ）
  }
  let result = ''
  for (const ch of text) {
    try {
      font.encodeText(ch)
      result += ch
    } catch { /* skip */ }
  }
  return result
}

// ---- 公開 API ----

export async function downloadPDF(result: OCRResult, fullImageDataUrl?: string): Promise<void> {
  const imageDataUrl = fullImageDataUrl || result.imageDataUrl
  if (!imageDataUrl) return

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontBytes = await loadCJKFontBytes()
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: false })
    : undefined

  if (!font) console.warn('[exportPDF] CJK font not available — text layer skipped')

  await addPageToPdf(pdfDoc, result, imageDataUrl, font)

  const pdfBytes = await pdfDoc.save()
  const baseName = result.fileName.replace(/\.[^/.]+$/, '')
  triggerDownload(pdfBytes, `${baseName}_ocr.pdf`)
}

export async function downloadBatchPDF(
  results: OCRResult[],
  fullImageDataUrls?: (string | undefined)[],
): Promise<void> {
  if (results.length === 0) return

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontBytes = await loadCJKFontBytes()
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: false })
    : undefined

  if (!font) console.warn('[exportPDF] CJK font not available — text layer skipped')

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const imageDataUrl = fullImageDataUrls?.[i] || result.imageDataUrl
    if (!imageDataUrl) continue
    await addPageToPdf(pdfDoc, result, imageDataUrl, font)
  }

  if (pdfDoc.getPageCount() === 0) return
  const pdfBytes = await pdfDoc.save()
  triggerDownload(pdfBytes, 'ocr_all_pages.pdf')
}

// ---- 内部ヘルパー ----

/**
 * PDFDocument に1ページを追加（画像背景 + 透明テキストレイヤー）
 */
async function addPageToPdf(
  pdfDoc: PDFDocument,
  result: OCRResult,
  imageDataUrl: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>> | undefined,
): Promise<void> {
  const { width: imgW, height: imgH } = await getImageDimensions(imageDataUrl)

  const DPI = 150
  const pdfW = (imgW / DPI) * 72
  const pdfH = (imgH / DPI) * 72

  const page = pdfDoc.addPage([pdfW, pdfH])
  const image = await embedImage(pdfDoc, imageDataUrl)
  page.drawImage(image, { x: 0, y: 0, width: pdfW, height: pdfH })

  if (!font) return

  const sortedBlocks = [...result.textBlocks].sort((a, b) => a.readingOrder - b.readingOrder)
  const scaleX = pdfW / imgW
  const scaleY = pdfH / imgH

  for (const block of sortedBlocks) {
    if (!block.text.trim()) continue

    const bx = block.x * scaleX
    const by = pdfH - (block.y * scaleY)  // 左下原点に変換
    const bw = block.width * scaleX
    const bh = block.height * scaleY

    const rawText = block.text.replace(/\n/g, '')
    const safeText = filterEncodableText(font, rawText)
    if (!safeText.trim()) continue

    const isVertical = block.height > block.width * 1.5

    try {
      if (isVertical) {
        drawVerticalBlock(page, font, safeText, bx, by, bw, bh)
      } else {
        drawHorizontalBlock(page, font, safeText, bx, by, bw, bh)
      }
    } catch (e) {
      console.warn('[exportPDF] drawText failed for block:', e)
    }
  }
}

/**
 * 横書きブロック: テキストを行に分割して描画
 *
 * フォントサイズをブロック幅と文字数から逆算し、
 * テキストがブロック領域内に概ね収まるようにする。
 * 各行は1回の drawText で描画し、行内に半角スペースが入らないようにする。
 */
function drawHorizontalBlock(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): void {
  const charCount = text.length
  if (charCount === 0) return

  // ブロック面積に文字を敷き詰めた時のフォントサイズを推定
  // CJK全角文字: 1文字 ≈ fontSize × fontSize の面積を占める
  const area = bw * bh
  let fontSize = Math.sqrt(area / Math.max(charCount, 1))
  fontSize = Math.max(2, Math.min(fontSize, 24))

  // 1行に収まる文字数
  const charsPerLine = Math.max(1, Math.floor(bw / (fontSize * 0.9)))
  const lineHeight = fontSize * 1.3

  let cy = by - fontSize  // 1行目ベースライン
  let offset = 0

  while (offset < charCount && cy > by - bh - lineHeight) {
    const line = text.slice(offset, offset + charsPerLine)
    page.drawText(line, {
      x: bx,
      y: cy,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      opacity: TEXT_OPACITY,
    })
    offset += charsPerLine
    cy -= lineHeight
  }

  // 残りの文字がある場合、最終行に詰め込む
  if (offset < charCount) {
    const remaining = text.slice(offset)
    const smallSize = Math.max(1, bw / remaining.length)
    page.drawText(remaining, {
      x: bx,
      y: Math.max(by - bh, 0),
      size: Math.min(smallSize, fontSize),
      font,
      color: rgb(0, 0, 0),
      opacity: TEXT_OPACITY,
    })
  }
}

/**
 * 縦書きブロック: テキストを列に分割して描画
 *
 * 縦書きは右から左に列が進む。pdf-lib は横書きのみサポートするため、
 * 各列を短い横書き文字列として描画する。
 * 1列は1回の drawText で描画（半角スペース誤認を防ぐ）。
 */
function drawVerticalBlock(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): void {
  const charCount = text.length
  if (charCount === 0) return

  // ブロック面積からフォントサイズを推定（横書きと同じロジック）
  const area = bw * bh
  let fontSize = Math.sqrt(area / Math.max(charCount, 1))
  fontSize = Math.max(2, Math.min(fontSize, 24))

  // 1列に収まる文字数（縦方向）
  const charsPerCol = Math.max(1, Math.floor(bh / (fontSize * 0.9)))
  // 列幅（横方向のステップ）
  const colWidth = fontSize * 1.3

  // 縦書きは右から左なので、右端から開始
  let cx = bx + bw - colWidth
  let offset = 0

  while (offset < charCount && cx >= bx - colWidth) {
    const col = text.slice(offset, offset + charsPerCol)

    // 各列を短い横書き文字列として、列の上端に描画
    // フォントサイズを極小にして列幅内に収める
    const colFontSize = Math.max(1, Math.min(fontSize, colWidth * 0.8))
    page.drawText(col, {
      x: cx,
      y: by - colFontSize,
      size: colFontSize,
      font,
      color: rgb(0, 0, 0),
      opacity: TEXT_OPACITY,
    })

    offset += charsPerCol
    cx -= colWidth
  }

  // 残りの文字
  if (offset < charCount) {
    const remaining = text.slice(offset)
    page.drawText(remaining, {
      x: Math.max(bx, 0),
      y: by - fontSize,
      size: Math.max(1, fontSize * 0.5),
      font,
      color: rgb(0, 0, 0),
      opacity: TEXT_OPACITY,
    })
  }
}

function triggerDownload(pdfBytes: Uint8Array, fileName: string): void {
  const blob = new Blob([pdfBytes.slice(0).buffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
