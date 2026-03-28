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
 * 各ブロックのテキストは 1 回の drawText で描画する。
 * フォントサイズはテキスト全体の水平幅がページ幅を超えないよう逆算する。
 * これにより:
 *   - 半角スペース誤認なし（1回の drawText 内は連続文字列）
 *   - ページ外はみ出しなし（フォントサイズで制御）
 *   - 検索ハイライトがブロック付近に表示される
 *   - 高速（ブロック数 = drawText 回数）
 */

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { OCRResult } from '../types/ocr'
import { loadCJKFontBytes } from './pdfFont'

const TEXT_OPACITY = 0.01

// CJK全角文字の幅は概ね fontSize の 0.6 倍（フォント依存）
const CJK_WIDTH_RATIO = 0.6

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
    // 文字単位フィルタ
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
 *
 * テキストは 1 ブロック = 1 回の drawText で描画する。
 * フォントサイズはテキストの水平幅がブロック幅を大きく超えないよう逆算する。
 * ブロック幅に収まらない場合はページ幅を上限とする。
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
    // pdf-lib は左下原点: 画像の Y=0(上) → PDF の Y=pdfH(上)
    const by = pdfH - (block.y * scaleY)
    const bw = block.width * scaleX
    const bh = block.height * scaleY

    const rawText = block.text.replace(/\n/g, '')
    const safeText = filterEncodableText(font, rawText)
    if (!safeText.trim()) continue

    const charCount = safeText.length

    // フォントサイズ逆算:
    // テキスト水平幅 ≈ charCount × fontSize × CJK_WIDTH_RATIO
    // これがブロック幅を超えないようにする（最低でもページ幅以内）
    const maxWidth = Math.max(bw, pdfW * 0.9)
    let fontSize = maxWidth / (charCount * CJK_WIDTH_RATIO)
    fontSize = Math.max(1, Math.min(fontSize, 16))

    // テキストをブロックの上端中央付近に配置
    // by はブロック上端の PDF Y 座標
    // テキストベースラインは by から fontSize 分だけ下
    const textY = by - fontSize - (bh * 0.1)

    try {
      page.drawText(safeText, {
        x: bx,
        y: Math.max(textY, 0),
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        opacity: TEXT_OPACITY,
      })
    } catch (e) {
      console.warn('[exportPDF] drawText failed for block:', e)
    }
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
