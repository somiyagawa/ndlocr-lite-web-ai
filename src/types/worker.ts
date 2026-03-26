import type { TextBlock, TextRegion, PageBlock, OCRMode } from './ocr'

// Workerへ送信するメッセージ
export type WorkerInMessage =
  | { type: 'INITIALIZE'; layoutOnly?: boolean; ocrMode?: OCRMode }
  | {
      type: 'OCR_PROCESS'
      id: string
      imageData: ImageData
      startTime: number
      ocrMode?: OCRMode
    }
  | {
      type: 'LAYOUT_DETECT'
      id: string
      imageData: ImageData
      startTime: number
      ocrMode?: OCRMode
    }
  | { type: 'TERMINATE' }

export interface ModelProgress {
  layout: number
  rec30: number
  rec50: number
  rec100: number
}

// Workerから受信するメッセージ
export type WorkerOutMessage =
  | {
      type: 'OCR_PROGRESS'
      id?: string
      stage: string
      progress: number
      message: string
      modelProgress?: ModelProgress
      /** auto モード時に画像分析で検出されたモード */
      detectedMode?: 'modern' | 'koten'
    }
  | {
      type: 'OCR_COMPLETE'
      id: string
      textBlocks: TextBlock[]
      txt: string
      processingTime: number
      /** auto モード時に実際に使用されたモード */
      detectedMode?: 'modern' | 'koten'
    }
  | {
      type: 'OCR_ERROR'
      id?: string
      error: string
      stage?: string
    }
  | {
      type: 'LAYOUT_DONE'
      id: string
      textRegions: TextRegion[]
      croppedImages: ImageData[]
      pageBlocks: PageBlock[]
      startTime: number
    }
