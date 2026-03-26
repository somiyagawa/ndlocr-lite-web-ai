/**
 * 古典籍レイアウト検出モジュール（RTMDetモデル）
 * 参照実装: ndlkotenocr-lite-master/src/rtmdet.py
 *
 * RTMDetモデルの入出力:
 *   入力: 画像テンソル [1, 3, 1280, 1280] (BGR順 + mean/std正規化)
 *   出力[0]: bboxes [1, N, 5] (x1,y1,x2,y2,score — 入力空間座標)
 *   出力[1]: class_ids [1, N]
 */

import type * as OrtType from 'onnxruntime-web'
import { ort, createSession } from './onnx-config'
import type { TextRegion, PageBlock, LayoutDetectionResult } from '../types/ocr'

interface PreprocessResult {
  tensor: OrtType.Tensor
  metadata: {
    originalWidth: number
    originalHeight: number
    maxWH: number
    inputWidth: number
    inputHeight: number
  }
}

export class KotenLayoutDetector {
  private session: OrtType.InferenceSession | null = null
  private inputSize = { width: 1024, height: 1024 }
  private initialized = false

  async initialize(modelData: ArrayBuffer): Promise<void> {
    if (this.initialized) return

    try {
      this.session = await createSession(modelData)
      this.initialized = true
      // モデルの実際の入力サイズを取得して使用
      const inputNames = this.session.inputNames
      if (inputNames.length > 0) {
        // ONNX セッションから実際の入力形状を取得
        // onnxruntime-web のInputMetadataからdimensionsを読む方法は限定的なので、
        // モデルファイル名とセッション情報からサイズを確認
        console.log(`[KotenLayout] RTMDet initialized: input ${this.inputSize.width}×${this.inputSize.height}, inputNames: [${inputNames.join(', ')}]`)
      } else {
        console.log(`[KotenLayout] RTMDet initialized: input ${this.inputSize.width}×${this.inputSize.height}`)
      }
    } catch (error) {
      console.error('[KotenLayout] Failed to initialize:', error)
      throw error
    }
  }

  async detect(
    imageData: ImageData,
    onProgress?: (progress: number) => void
  ): Promise<LayoutDetectionResult> {
    if (!this.initialized || !this.session) {
      throw new Error('Koten layout detector not initialized')
    }

    if (onProgress) onProgress(0.1)
    const { tensor, metadata } = await this.preprocessImage(imageData)

    if (onProgress) onProgress(0.5)
    const output = await this.session.run({
      [this.session.inputNames[0]]: tensor,
    })

    if (onProgress) onProgress(0.8)
    const { lines, blocks } = this.postprocessOutput(output, metadata)

    if (onProgress) onProgress(1.0)
    console.log(`[KotenLayout] ${lines.length} line regions detected`)
    return { lines, blocks }
  }

  private async preprocessImage(imageData: ImageData): Promise<PreprocessResult> {
    return new Promise((resolve, reject) => {
      try {
        const originalSize = { width: imageData.width, height: imageData.height }
        const maxWH = Math.max(originalSize.width, originalSize.height)

        // 元画像をOffscreenCanvasに描画
        const imageCanvas = new OffscreenCanvas(imageData.width, imageData.height)
        const imageCtx = imageCanvas.getContext('2d')!
        imageCtx.putImageData(imageData, 0, 0)

        // 正方形パディング + 1280×1280にリサイズ
        const scale = this.inputSize.width / maxWH
        const canvas = new OffscreenCanvas(this.inputSize.width, this.inputSize.height)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = 'rgb(0, 0, 0)'
        ctx.fillRect(0, 0, this.inputSize.width, this.inputSize.height)
        ctx.drawImage(
          imageCanvas, 0, 0, imageData.width, imageData.height,
          0, 0, Math.round(imageData.width * scale), Math.round(imageData.height * scale)
        )

        const resizedImageData = ctx.getImageData(0, 0, this.inputSize.width, this.inputSize.height)
        const { data } = resizedImageData

        // NCHW形式 + BGR順 + mean/std正規化
        // rtmdet.py: resized[:,:,::-1] → BGR, mean=[103.53,116.28,123.675], std=[57.375,57.12,58.395]
        const tensorData = new Float32Array(1 * 3 * this.inputSize.height * this.inputSize.width)
        // Canvas は RGBA (R=0, G=1, B=2) だが、RTMDet は BGR 順で正規化
        // チャネル0=B, チャネル1=G, チャネル2=R
        const mean = [103.53, 116.28, 123.675] // BGR
        const std = [57.375, 57.12, 58.395]    // BGR

        for (let h = 0; h < this.inputSize.height; h++) {
          for (let w = 0; w < this.inputSize.width; w++) {
            const pixelOffset = (h * this.inputSize.width + w) * 4
            const r = data[pixelOffset + 0]
            const g = data[pixelOffset + 1]
            const b = data[pixelOffset + 2]
            // BGR順に配置
            const hw = h * this.inputSize.width + w
            tensorData[0 * this.inputSize.height * this.inputSize.width + hw] = (b - mean[0]) / std[0]
            tensorData[1 * this.inputSize.height * this.inputSize.width + hw] = (g - mean[1]) / std[1]
            tensorData[2 * this.inputSize.height * this.inputSize.width + hw] = (r - mean[2]) / std[2]
          }
        }

        const inputTensor = new ort.Tensor('float32', tensorData, [
          1, 3, this.inputSize.height, this.inputSize.width,
        ])

        resolve({
          tensor: inputTensor,
          metadata: {
            originalWidth: originalSize.width,
            originalHeight: originalSize.height,
            maxWH,
            inputWidth: this.inputSize.width,
            inputHeight: this.inputSize.height,
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  private postprocessOutput(
    output: Record<string, OrtType.Tensor>,
    metadata: PreprocessResult['metadata']
  ): { lines: TextRegion[], blocks: PageBlock[] } {
    const lineDetections: TextRegion[] = []

    try {
      const outputNames = this.session!.outputNames

      // RTMDet出力: bboxes [1, N, 5] (x1,y1,x2,y2,score), class_ids [1, N]
      const bboxesData = output[outputNames[0]].data as Float32Array
      const bboxesDims = output[outputNames[0]].dims
      const numDetections = bboxesDims[1] as number
      const bboxStride = 5 // x1, y1, x2, y2, score

      const confThreshold = 0.1
      const scaleX = metadata.maxWH / this.inputSize.width
      const scaleY = metadata.maxWH / this.inputSize.height

      for (let i = 0; i < numDetections; i++) {
        const score = bboxesData[i * bboxStride + 4]
        if (score < confThreshold) continue

        // 入力空間座標 → 元画像空間座標
        let x1 = bboxesData[i * bboxStride + 0] * scaleX
        let y1 = bboxesData[i * bboxStride + 1] * scaleY
        let x2 = bboxesData[i * bboxStride + 2] * scaleX
        let y2 = bboxesData[i * bboxStride + 3] * scaleY

        // 上下2%拡張
        const boxHeight = y2 - y1
        const deltaH = boxHeight * 0.02
        y1 -= deltaH
        y2 += deltaH

        const finalX1 = Math.max(0, Math.round(x1))
        const finalY1 = Math.max(0, Math.round(y1))
        const finalX2 = Math.min(metadata.originalWidth, Math.round(x2))
        const finalY2 = Math.min(metadata.originalHeight, Math.round(y2))
        const width = finalX2 - finalX1
        const height = finalY2 - finalY1

        if (width >= 5 && height >= 5) {
          lineDetections.push({
            x: finalX1,
            y: finalY1,
            width,
            height,
            confidence: score,
            classId: 1, // line_main
            charCountCategory: 100, // 古典籍は単一モデルなのでカテゴリ不要
          })
        }
      }

      return { lines: this.nms(lineDetections), blocks: [] }
    } catch (error) {
      console.error('[KotenLayout] Error in postprocessing:', error)
      return { lines: [], blocks: [] }
    }
  }

  private nms(detections: TextRegion[], iouThreshold = 0.4): TextRegion[] {
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence)
    const keep: TextRegion[] = []
    for (const d of sorted) {
      if (keep.every((k) => this.iou(k, d) < iouThreshold)) keep.push(d)
    }
    return keep
  }

  private iou(a: TextRegion, b: TextRegion): number {
    const ax2 = a.x + a.width, ay2 = a.y + a.height
    const bx2 = b.x + b.width, by2 = b.y + b.height
    const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x))
    const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y))
    const inter = ix * iy
    if (inter === 0) return 0
    return inter / (a.width * a.height + b.width * b.height - inter)
  }

  dispose(): void {
    if (this.session) {
      this.session.release()
      this.session = null
    }
    this.initialized = false
  }
}
