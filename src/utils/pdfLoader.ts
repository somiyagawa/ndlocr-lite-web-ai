/**
 * pdfjs-dist を使用したPDF → ImageData 変換
 */

import type { ProcessedImage } from '../types/ocr'
import { makeThumbnailDataUrl } from './imageLoader'

let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function getPdfJs() {
  if (!pdfjsLib) {
    // 動的import でpdfjs-distとworkerを遅延ロード（初回PDF利用時のみ）
    const [lib, { default: workerSrc }] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
    lib.GlobalWorkerOptions.workerSrc = workerSrc
    pdfjsLib = lib
  }
  return pdfjsLib
}

export async function pdfToProcessedImages(
  file: File,
  scale = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedImage[]> {
  const pdfjs = await getPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages

  const images: ProcessedImage[] = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) onProgress(pageNum, totalPages)

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const thumbnailDataUrl = makeThumbnailDataUrl(imageData)

    images.push({
      fileName: file.name,
      pageIndex: pageNum,
      imageData,
      thumbnailDataUrl,
    })
  }

  return images
}
