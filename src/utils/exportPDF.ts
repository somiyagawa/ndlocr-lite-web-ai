/**
 * PDF エクスポート（テキスト情報埋め込み）
 *
 * OCR結果の元画像を背景として配置し、各テキストブロックの位置に
 * 透明テキストレイヤーを重ねた PDF を生成する。
 * これによりPDF上でテキスト検索・選択が可能になる。
 *
 * pdf-lib + fontkit を使用し、CJK (日本語) テキストを正しくエンコードする。
 */

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { OCRResult } from '../types/ocr'
import { loadCJKFontBytes } from './pdfFont'

// テキストレイヤーの不可視テキスト用 opacity
// 0 ではなく極小値を使用する。
// 一部の PDF ビューア (古い Acrobat バージョン含む) は
// opacity=0 のテキストを検索インデックスから除外するため、
// 人間には知覚できないが PDF エンジンが「可視」と判定する値にする。
const TEXT_OPACITY = 0.01

/**
 * dataURL から画像の自然サイズを取得
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * dataURL を Uint8Array に変換
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * dataURL が PNG かどうか判定
 */
function isPng(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/png')
}

/**
 * PDFDocument に画像を埋め込む
 */
async function embedImage(pdfDoc: PDFDocument, dataUrl: string) {
  const imageBytes = dataUrlToUint8Array(dataUrl)
  if (isPng(dataUrl)) {
    return pdfDoc.embedPng(imageBytes)
  }
  return pdfDoc.embedJpg(imageBytes)
}

/**
 * テキストからフォントでエンコードできない文字を除去する。
 * 1文字ずつ encodeText を試すのではなく、
 * 文字列全体を一度に試し、失敗した場合のみ文字単位でフィルタする。
 */
function filterEncodableText(
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
): string {
  // まず文字列全体を試す（大半のケースでこれが成功 → 高速）
  try {
    font.encodeText(text)
    return text
  } catch {
    // 失敗した場合のみ文字単位でフィルタ
  }

  let result = ''
  for (const ch of text) {
    try {
      font.encodeText(ch)
      result += ch
    } catch {
      // エンコード不可の文字をスキップ
    }
  }
  return result
}

/**
 * OCR結果からテキスト埋め込みPDFを生成・ダウンロード
 *
 * @param result - OCR結果
 * @param fullImageDataUrl - 元画像のフルサイズ dataURL（オプション、なければ result.imageDataUrl を使用）
 */
export async function downloadPDF(result: OCRResult, fullImageDataUrl?: string): Promise<void> {
  const imageDataUrl = fullImageDataUrl || result.imageDataUrl
  if (!imageDataUrl) return

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  // CJK フォント読み込み・埋め込み（subset: false で /Widths 破損を回避）
  const fontBytes = await loadCJKFontBytes()
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: false })
    : undefined

  if (!font) {
    console.warn('[exportPDF] CJK font not available — PDF text layer will be skipped')
  }

  await addPageToPdf(pdfDoc, result, imageDataUrl, font)

  // ダウンロード
  const pdfBytes = await pdfDoc.save()
  const baseName = result.fileName.replace(/\.[^/.]+$/, '')
  triggerDownload(pdfBytes, `${baseName}_ocr.pdf`)
}

/**
 * 複数ページのOCR結果を1つのPDFファイルとしてダウンロード
 * 各ページが1ページとなる複数ページPDFを生成
 *
 * @param results - OCR結果配列
 * @param fullImageDataUrls - 各ページのフルサイズ画像 dataURL 配列（オプション）
 */
export async function downloadBatchPDF(
  results: OCRResult[],
  fullImageDataUrls?: (string | undefined)[],
): Promise<void> {
  if (results.length === 0) return

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  // CJK フォント読み込み（ドキュメント単位で1回だけ）
  const fontBytes = await loadCJKFontBytes()
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: false })
    : undefined

  if (!font) {
    console.warn('[exportPDF] CJK font not available — PDF text layer will be skipped')
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    // フルサイズ画像があればそちらを使用、なければサムネイルにフォールバック
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

  // PDF サイズ（150dpi 基準でポイント変換）
  const DPI = 150
  const pdfW = (imgW / DPI) * 72
  const pdfH = (imgH / DPI) * 72

  const page = pdfDoc.addPage([pdfW, pdfH])

  // 背景画像を配置
  const image = await embedImage(pdfDoc, imageDataUrl)
  page.drawImage(image, { x: 0, y: 0, width: pdfW, height: pdfH })

  // フォントが無ければテキスト埋め込みスキップ
  if (!font) return

  // テキストブロックを読み順で並べてテキストレイヤーを重ねる
  const sortedBlocks = [...result.textBlocks].sort((a, b) => a.readingOrder - b.readingOrder)

  // スケールファクター（画像ピクセル → PDFポイント）
  const scaleX = pdfW / imgW
  const scaleY = pdfH / imgH

  for (const block of sortedBlocks) {
    if (!block.text.trim()) continue

    const bx = block.x * scaleX
    // pdf-lib は左下原点なので Y を反転
    const by = pdfH - (block.y * scaleY)
    const bw = block.width * scaleX
    const bh = block.height * scaleY

    const isVerticalBlock = block.height > block.width * 1.5
    let fontSize: number

    if (isVerticalBlock) {
      fontSize = Math.max(4, Math.min(bw * 0.85, 48))
    } else {
      fontSize = Math.max(4, Math.min(bh * 0.75, 48))
    }

    // テキストをフォントでエンコード可能な文字のみに絞る
    // （文字列全体を一括チェック → 失敗時のみ文字単位フィルタ）
    const rawText = block.text.replace(/\n/g, '')
    const safeText = filterEncodableText(font, rawText)
    if (!safeText.trim()) continue

    try {
      if (isVerticalBlock) {
        // 縦書き: ブロック上端から1文字ずつ下へ配置
        // drawText は横書きなので、縦書きは1文字ずつ配置が必要
        const charHeight = fontSize * 1.2
        let cy = by - fontSize
        for (const ch of safeText) {
          if (cy < by - bh) break
          if (!ch.trim()) { cy -= charHeight; continue }
          page.drawText(ch, {
            x: bx + bw * 0.3,
            y: cy,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: TEXT_OPACITY,
          })
          cy -= charHeight
        }
      } else {
        // 横書き: ブロック全体のテキストを一括描画
        // テキストは不可視（検索・選択用）なので、
        // はみ出しは視覚的に問題にならない。
        // 一括描画により数千回の drawText を 1 回に削減。
        page.drawText(safeText, {
          x: bx,
          y: by - fontSize,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          opacity: TEXT_OPACITY,
          maxWidth: bw,
          lineHeight: fontSize * 1.2,
        })
      }
    } catch (e) {
      console.warn(`[exportPDF] drawText failed for block:`, e)
    }
  }
}

/**
 * Uint8Array を Blob 化してブラウザダウンロードをトリガー
 *
 * 注意: Uint8Array.buffer は元の ArrayBuffer 全体を返すため、
 * Uint8Array がビューの場合にサイズ不一致で PDF が破損する。
 * .slice(0) で独立した ArrayBuffer を作成する。
 */
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
