/**
 * 画像ファイル → ImageData + サムネイルDataUrl 変換
 */

import UTIF from 'utif'
import type { ProcessedImage } from '../types/ocr'

const THUMBNAIL_MAX_WIDTH = 200

export function isTiffFile(file: File): boolean {
  if (file.type === 'image/tiff') return true
  const ext = file.name.toLowerCase().split('.').pop()
  return ext === 'tiff' || ext === 'tif'
}

export function isHeicFile(file: File): boolean {
  if (file.type === 'image/heic' || file.type === 'image/heif') return true
  const ext = file.name.toLowerCase().split('.').pop()
  return ext === 'heic' || ext === 'heif'
}

export async function fileToProcessedImage(file: File): Promise<ProcessedImage> {
  const imageData = await fileToImageData(file)
  const thumbnailDataUrl = makeThumbnailDataUrl(imageData)

  return {
    fileName: file.name,
    imageData,
    thumbnailDataUrl,
  }
}

/** TIFF ファイル（複数ページ対応）→ ProcessedImage[] */
export async function tiffToProcessedImages(file: File): Promise<ProcessedImage[]> {
  const buffer = await file.arrayBuffer()
  const ifds = UTIF.decode(buffer)
  const results: ProcessedImage[] = []

  for (let i = 0; i < ifds.length; i++) {
    UTIF.decodeImage(buffer, ifds[i])
    const w = ifds[i].width
    const h = ifds[i].height
    const rgba = UTIF.toRGBA8(ifds[i])
    const imageData = new ImageData(new Uint8ClampedArray(rgba), w, h)
    const thumbnailDataUrl = makeThumbnailDataUrl(imageData)
    results.push({
      fileName: file.name,
      pageIndex: ifds.length > 1 ? i + 1 : undefined,
      imageData,
      thumbnailDataUrl,
    })
  }

  return results
}

async function fileToImageData(file: File): Promise<ImageData> {
  if (isHeicFile(file)) return heicFileToImageData(file)
  return standardImageToImageData(file)
}

async function heicFileToImageData(file: File): Promise<ImageData> {
  // heic2any は重いため動的インポート（初回HEIC処理時のみ読み込み）
  const { default: heic2any } = await import('heic2any')
  const result = await heic2any({ blob: file, toType: 'image/png' })
  const pngBlob = Array.isArray(result) ? result[0] : result
  return blobToImageData(pngBlob, file.name)
}

async function blobToImageData(blob: Blob, name: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${name}`))
    }
    img.src = url
  })
}

async function standardImageToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

export function makeThumbnailDataUrl(imageData: ImageData): string {
  const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / imageData.width)
  const w = Math.round(imageData.width * scale)
  const h = Math.round(imageData.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // ImageData → 元サイズキャンバス → 縮小キャンバス
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = imageData.width
  srcCanvas.height = imageData.height
  srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0)
  ctx.drawImage(srcCanvas, 0, 0, w, h)

  return canvas.toDataURL('image/jpeg', 0.7)
}

export function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * Convert a data URL to a ProcessedImage.
 * Loads the image, extracts ImageData, and generates a thumbnail.
 */
export async function dataUrlToProcessedImage(
  dataUrl: string,
  fileName: string,
  pageIndex?: number,
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Failed to get canvas context')); return }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const thumbnailDataUrl = makeThumbnailDataUrl(imageData)
      resolve({ fileName, pageIndex, imageData, thumbnailDataUrl })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}
