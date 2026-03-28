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

  // CJK フォント読み込み・埋め込み
  const fontBytes = await loadCJKFontBytes()
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: false })
    : undefined

  if (!font) {
    console.warn('[exportPDF] CJK font not available — PDF text may be garbled')
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
 */
export async function downloadBatchPDF(results: OCRResult[]): Promise<void> {
  if (results.length === 0) return

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  // CJK フォント読み込み（1回だけ）
  const fontBytes = await loadCJKFontBytes()
  const font = fontBytes
    ? await pdfDoc.embedFont(fontBytes, { subset: false })
    : undefined

  if (!font) {
    console.warn('[exportPDF] CJK font not available — PDF text may be garbled')
  }

  for (const result of results) {
    const imageDataUrl = result.imageDataUrl
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

    // 透明テキストを描画（opacity: 0 で不可視だが検索可能）
    if (isVerticalBlock) {
      // 縦書き: 1文字ずつ上から下へ配置
      const chars = block.text.replace(/\n/g, '')
      const charHeight = fontSize * 1.2
      let cy = by - fontSize  // 上端からスタート

      for (const ch of chars) {
        if (cy < by - bh) break  // ブロック下端を超えたら終了
        try {
          page.drawText(ch, {
            x: bx + bw * 0.3,
            y: cy,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: 0,
          })
        } catch {
          // フォントに含まれないグリフはスキップ
        }
        cy -= charHeight
      }
    } else {
      // 横書き: テキスト全体を配置
      const text = block.text.replace(/\n/g, ' ')
      try {
        page.drawText(text, {
          x: bx,
          y: by - fontSize,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          opacity: 0,
          maxWidth: bw,
          lineHeight: fontSize * 1.2,
        })
      } catch {
        // フォントに含まれないグリフはスキップ
      }
    }
  }
}

/**
 * Uint8Array を Blob 化してブラウザダウンロードをトリガー
 */
function triggerDownload(pdfBytes: Uint8Array, fileName: string): void {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
