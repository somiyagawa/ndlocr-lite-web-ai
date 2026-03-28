/** OCR処理モード: auto = 自動判定, modern = 現代日本語(DEIMv2+PARSeq), koten = 古典籍/くずし字(RTMDet+PARSeq) */
export type OCRMode = 'auto' | 'modern' | 'koten'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface TextRegion extends BoundingBox {
  confidence: number
  classId: number
  charCountCategory?: number // DEIMモデルが出力する文字数カテゴリ (1, 2, 3)
}

export interface TextBlock extends TextRegion {
  text: string
  readingOrder: number
}

export interface PageBlock {
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutDetectionResult {
  lines: TextRegion[]
  blocks: PageBlock[]
}

export interface OCRResult {
  id: string
  fileName: string
  imageDataUrl: string // サムネイル用（縮小版）
  textBlocks: TextBlock[]
  fullText: string
  processingTimeMs: number
  createdAt: number // Unix timestamp (ms)
  pageBlocks?: PageBlock[] // DEIMが検出した段・カラム境界
  /** 元画像の幅（px）— textBlocks の座標はこのサイズ基準 */
  originalWidth?: number
  /** 元画像の高さ（px）— textBlocks の座標はこのサイズ基準 */
  originalHeight?: number
}

export interface ProcessedImage {
  fileName: string
  pageIndex?: number // PDFのページ番号（1始まり）
  imageData: ImageData
  thumbnailDataUrl: string // 表示用縮小版
}

export type OCRStatus =
  | 'idle'
  | 'loading_model'
  | 'processing'
  | 'done'
  | 'error'

export interface OCRJobState {
  status: OCRStatus
  currentFile: string
  currentFileIndex: number
  totalFiles: number
  stageProgress: number // 現在ステージ内の進捗 0.0-1.0
  stage: string
  message: string
  errorMessage?: string
  modelProgress?: { layout: number; rec30: number; rec50: number; rec100: number; koten_layout?: number; koten_rec?: number }
}

export interface TEIMetadata {
  title: string
  author: string
  editor: string
  publisher: string
  date: string
  sourceInstitution: string
  sourceIdno: string
  language: string
  notes: string
}
