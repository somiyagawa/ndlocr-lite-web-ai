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
 * 1 ブロック = 1 回の drawText（縦書き・横書き共通）。
 * 複数 drawText に分割すると PDF ビューアがギャップを半角スペースとして
 * 解釈するため、必ず単一 drawText にする。
 * フォントサイズはテキスト幅がブロック幅を超えないよう逆算。
 *
 * ブロック座標は originalWidth × originalHeight（元画像ピクセル）基準。
 * imageDataUrl がサムネイルでも、originalWidth/originalHeight を使って
 * 正しく PDF 座標にマッピングする。
 */

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { OCRResult } from '../types/ocr'
import { loadCJKFontBytes } from './pdfFont'

const TEXT_OPACITY = 0.01

// CJK全角文字の幅は概ね fontSize の 0.5〜0.6 倍（フォント依存）
const CJK_WIDTH_RATIO = 0.55

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

  // ブロック座標の基準となる元画像サイズを決定
  // originalWidth/originalHeight があればそれを使用（サムネイルと元画像のサイズが異なる場合に正確）
  const blockCoordWidth = result.originalWidth
  const blockCoordHeight = result.originalHeight

  await addPageToPdf(pdfDoc, result, imageDataUrl, font, blockCoordWidth, blockCoordHeight)

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
    await addPageToPdf(pdfDoc, result, imageDataUrl, font, result.originalWidth, result.originalHeight)
  }

  if (pdfDoc.getPageCount() === 0) return
  const pdfBytes = await pdfDoc.save()
  triggerDownload(pdfBytes, 'ocr_all_pages.pdf')
}

// ---- 内部ヘルパー ----

/**
 * PDFDocument に1ページを追加（画像背景 + 透明テキストレイヤー）
 *
 * === テキストレイヤー設計 ===
 *
 * 各ブロックのテキストを **1 回の drawText** で描画する（縦書き・横書き共通）。
 * 複数の drawText に分割すると PDF ビューアがオブジェクト間のギャップを
 * 半角スペースとして解釈してしまうため、必ず 1 ブロック = 1 drawText とする。
 *
 * テキストは不可視 (opacity 0.01) で、目的は検索 (Ctrl+F) とテキスト選択のみ。
 * フォントサイズはテキスト幅がブロック幅（またはページ幅）を超えないよう逆算する。
 *
 * ブロック座標は originalWidth × originalHeight の空間で定義されているため、
 * coordW/coordH にその値を使ってスケーリングする。
 */
async function addPageToPdf(
  pdfDoc: PDFDocument,
  result: OCRResult,
  imageDataUrl: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>> | undefined,
  blockCoordWidth?: number,
  blockCoordHeight?: number,
): Promise<void> {
  const { width: imgW, height: imgH } = await getImageDimensions(imageDataUrl)

  // ブロック座標の基準サイズ:
  //   originalWidth/originalHeight が渡された場合 → 元画像サイズ（ブロック座標の基準）
  //   渡されない場合 → imageDataUrl の実サイズ（サムネイルの場合あり）をフォールバック
  const coordW = blockCoordWidth && blockCoordWidth > 0 ? blockCoordWidth : imgW
  const coordH = blockCoordHeight && blockCoordHeight > 0 ? blockCoordHeight : imgH

  // PDF ページサイズは元画像サイズ基準で計算（高解像度PDFを生成）
  const DPI = 150
  const pdfW = (coordW / DPI) * 72
  const pdfH = (coordH / DPI) * 72

  const page = pdfDoc.addPage([pdfW, pdfH])
  const image = await embedImage(pdfDoc, imageDataUrl)
  // 画像はページ全体に引き伸ばして配置（サムネイルでも元サイズのページに拡大表示）
  page.drawImage(image, { x: 0, y: 0, width: pdfW, height: pdfH })

  if (!font) return

  const sortedBlocks = [...result.textBlocks].sort((a, b) => a.readingOrder - b.readingOrder)
  // ブロック座標 → PDF座標への変換係数
  // ブロック座標は coordW × coordH の空間、PDF座標は pdfW × pdfH の空間
  const scaleX = pdfW / coordW
  const scaleY = pdfH / coordH

  for (const block of sortedBlocks) {
    if (!block.text.trim()) continue

    const bx = block.x * scaleX
    // pdf-lib は左下原点: 画像の Y=0(上) → PDF の Y=pdfH(上)
    const byTop = pdfH - (block.y * scaleY)
    const bw = block.width * scaleX
    const bh = block.height * scaleY

    // 改行を除去して連続文字列にする（1 drawText = スペース誤挿入なし）
    const rawText = block.text.replace(/\n/g, '')
    const safeText = filterEncodableText(font, rawText)
    if (!safeText.trim()) continue

    const charCount = safeText.length

    // フォントサイズ逆算:
    // テキスト水平幅 ≈ charCount × fontSize × CJK_WIDTH_RATIO
    // これがブロック幅を超えないようにする。
    // ブロック幅が狭い場合（縦書き等）はページ幅を上限にとる。
    const maxWidth = Math.max(bw, pdfW * 0.8)
    let fontSize = maxWidth / (charCount * CJK_WIDTH_RATIO)
    fontSize = Math.max(1, Math.min(fontSize, 14))

    // テキストをブロックの中央付近に配置
    // byTop はブロック上端。テキストベースラインを bh の中央に置く。
    const textY = byTop - (bh / 2) - (fontSize / 2)

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
