import type { TextBlock } from './ocr'

export interface DBModelEntry {
  name: string // 'layout' | 'recognition'
  data: ArrayBuffer
  cachedAt: number // Unix timestamp (ms)
  version: string // モデルのバージョン管理用
}

// 1回の実行に含まれる1ファイル分の結果
export interface DBRunFile {
  fileName: string
  imageDataUrl: string // 原寸画像 (base64 JPEG)。旧データは200px幅サムネイルの場合あり
  textBlocks: TextBlock[]
  fullText: string
  processingTimeMs: number
  /** 元画像の幅（ブロック座標スケーリング用） */
  originalWidth?: number
  /** 元画像の高さ（ブロック座標スケーリング用） */
  originalHeight?: number
}

// 1回の実行（複数ファイルをまとめた単位）
export interface DBRunEntry {
  id: string         // runId (UUID)
  files: DBRunFile[] // この実行で処理したファイル一覧
  createdAt: number  // Unix timestamp (ms)
}
