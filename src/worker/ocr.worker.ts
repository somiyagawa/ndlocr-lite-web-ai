/**
 * OCR Web Worker
 * バックグラウンドでOCR処理を実行
 * 参照実装: ndlkotenocr-worker/src/worker/ocr-worker.js
 *
 * メッセージ種別:
 *   OCR_PROCESS   : 領域OCR用（逐次認識。processRegion で使用）
 *   LAYOUT_DETECT : バッチOCR用（レイアウト検出のみ実行し LAYOUT_DONE を返す）
 *                   認識フェーズはメインスレッドが N 本の recognition.worker に並列委譲する
 *
 * カスケード文字認識:
 *   charCountCategory=3 → recognizer30 (16×256, ≤30文字)
 *   charCountCategory=2 → recognizer50 (16×384, ≤50文字)
 *   それ以外            → recognizer100 (16×768, ≤100文字)
 */

import './onnx-config'
import { loadModel } from './model-loader'
import { LayoutDetector } from './layout-detector'
import { TextRecognizer } from './text-recognizer'
import { KotenLayoutDetector } from './koten-layout-detector'
import { KotenTextRecognizer } from './koten-text-recognizer'
import { ReadingOrderProcessor } from './reading-order'
import { classifyImage } from './image-classifier'
import type { TextBlock, OCRMode } from '../types/ocr'
import type { WorkerInMessage, WorkerOutMessage } from '../types/worker'

class OCRWorker {
  // 現代日本語モデル
  private layoutDetector: LayoutDetector | null = null
  private recognizer30: TextRecognizer | null = null  // ≤30文字 [1,3,16,256]
  private recognizer50: TextRecognizer | null = null  // ≤50文字 [1,3,16,384]
  private recognizer100: TextRecognizer | null = null // ≤100文字 [1,3,16,768]
  // 古典籍モデル
  private kotenLayoutDetector: KotenLayoutDetector | null = null
  private kotenRecognizer: KotenTextRecognizer | null = null

  private readingOrderProcessor = new ReadingOrderProcessor()
  private isInitialized = false
  private layoutOnly = false
  private ocrMode: OCRMode = 'modern'
  private initializedMode: OCRMode | null = null

  private post(message: WorkerOutMessage) {
    self.postMessage(message)
  }

  /** 必要なモデルが既にロード済みかチェック */
  private hasRequiredModels(ocrMode: OCRMode, layoutOnly: boolean): boolean {
    if (ocrMode === 'koten') {
      return !!(this.kotenLayoutDetector && this.kotenRecognizer)
    }
    if (ocrMode === 'modern') {
      if (layoutOnly) return !!this.layoutDetector
      return !!(this.layoutDetector && this.recognizer100)
    }
    // auto: 両方必要
    const hasModern = layoutOnly ? !!this.layoutDetector : !!(this.layoutDetector && this.recognizer100)
    const hasKoten = !!(this.kotenLayoutDetector && this.kotenRecognizer)
    return hasModern && hasKoten
  }

  async initialize(layoutOnly = false, ocrMode: OCRMode = 'modern'): Promise<void> {
    this.layoutOnly = layoutOnly
    this.ocrMode = ocrMode

    // 必要なモデルが既にロード済みなら即 ready
    if (this.hasRequiredModels(ocrMode, layoutOnly)) {
      this.isInitialized = true
      this.initializedMode = ocrMode
      this.post({ type: 'OCR_PROGRESS', stage: 'initialized', progress: 1.0, message: 'Ready' })
      return
    }

    try {
      const modeLabel = ocrMode === 'koten' ? 'classical' : ocrMode === 'auto' ? 'auto (all models)' : 'modern'
      this.post({
        type: 'OCR_PROGRESS',
        stage: 'initializing',
        progress: 0.02,
        message: `Initializing ${modeLabel} OCR...`,
      })

      if (ocrMode === 'auto') {
        // === オートモード: 現代 + 古典籍の全モデルをロード ===
        // 画像分析で自動判定し、即座に適切なパイプラインを使用可能にする
        const progresses = { layout: 0, rec30: 0, rec50: 0, rec100: 0, koten_layout: 0, koten_rec: 0 }
        const reportProgress = () => {
          const vals = Object.values(progresses)
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length
          this.post({
            type: 'OCR_PROGRESS',
            stage: 'loading_models',
            progress: 0.02 + avg * 0.68,
            message: `Loading all models (auto)... ${Math.round(avg * 100)}%`,
            modelProgress: { layout: progresses.layout, rec30: progresses.rec30, rec50: progresses.rec50, rec100: progresses.rec100 },
          })
        }

        if (layoutOnly) {
          // モバイル auto: レイアウト2モデル + koten認識のみ
          const [layoutData, kotenLayoutData, rec100Data, kotenRecData] = await Promise.all([
            loadModel('layout',            (p) => { progresses.layout = p; reportProgress() }),
            loadModel('koten_layout',      (p) => { progresses.koten_layout = p; reportProgress() }),
            loadModel('recognition100',    (p) => { progresses.rec100 = p; reportProgress() }),
            loadModel('koten_recognition', (p) => { progresses.koten_rec = p; reportProgress() }),
          ])

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.72, message: 'Preparing modern layout model...' })
          this.layoutDetector = new LayoutDetector()
          await this.layoutDetector.initialize(layoutData)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.80, message: 'Preparing classical layout model...' })
          this.kotenLayoutDetector = new KotenLayoutDetector()
          await this.kotenLayoutDetector.initialize(kotenLayoutData)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.88, message: 'Preparing recognition model...' })
          this.recognizer100 = new TextRecognizer([1, 3, 16, 768])
          await this.recognizer100.initialize(rec100Data)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.96, message: 'Preparing classical recognition model...' })
          this.kotenRecognizer = new KotenTextRecognizer()
          await this.kotenRecognizer.initialize(kotenRecData)
        } else {
          // デスクトップ auto: 全6モデル
          const [layoutData, rec30Data, rec50Data, rec100Data, kotenLayoutData, kotenRecData] = await Promise.all([
            loadModel('layout',            (p) => { progresses.layout = p; reportProgress() }),
            loadModel('recognition30',     (p) => { progresses.rec30 = p; reportProgress() }),
            loadModel('recognition50',     (p) => { progresses.rec50 = p; reportProgress() }),
            loadModel('recognition100',    (p) => { progresses.rec100 = p; reportProgress() }),
            loadModel('koten_layout',      (p) => { progresses.koten_layout = p; reportProgress() }),
            loadModel('koten_recognition', (p) => { progresses.koten_rec = p; reportProgress() }),
          ])

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.72, message: 'Preparing modern layout model...' })
          this.layoutDetector = new LayoutDetector()
          await this.layoutDetector.initialize(layoutData)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.78, message: 'Preparing recognition model (30)...' })
          this.recognizer30 = new TextRecognizer([1, 3, 16, 256])
          await this.recognizer30.initialize(rec30Data)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.82, message: 'Preparing recognition model (50)...' })
          this.recognizer50 = new TextRecognizer([1, 3, 16, 384])
          await this.recognizer50.initialize(rec50Data)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.86, message: 'Preparing recognition model (100)...' })
          this.recognizer100 = new TextRecognizer([1, 3, 16, 768])
          await this.recognizer100.initialize(rec100Data)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.92, message: 'Preparing classical layout model (RTMDet)...' })
          this.kotenLayoutDetector = new KotenLayoutDetector()
          await this.kotenLayoutDetector.initialize(kotenLayoutData)

          this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.97, message: 'Preparing classical recognition model (PARSeq)...' })
          this.kotenRecognizer = new KotenTextRecognizer()
          await this.kotenRecognizer.initialize(kotenRecData)
        }
      } else if (ocrMode === 'koten') {
        // === 古典籍モード: RTMDet + PARSeq(32×384) の2モデル ===
        const progresses = { koten_layout: 0, koten_rec: 0 }
        const reportProgress = () => {
          const avg = (progresses.koten_layout + progresses.koten_rec) / 2
          this.post({
            type: 'OCR_PROGRESS',
            stage: 'loading_models',
            progress: 0.02 + avg * 0.73,
            message: `Loading classical models... ${Math.round(avg * 100)}%`,
            modelProgress: { layout: 0, rec30: 0, rec50: 0, rec100: 0, ...progresses },
          })
        }

        const [layoutData, recData] = await Promise.all([
          loadModel('koten_layout',      (p) => { progresses.koten_layout = p; reportProgress() }),
          loadModel('koten_recognition', (p) => { progresses.koten_rec = p; reportProgress() }),
        ])

        this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.80, message: 'Preparing RTMDet layout model...' })
        this.kotenLayoutDetector = new KotenLayoutDetector()
        await this.kotenLayoutDetector.initialize(layoutData)

        this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.92, message: 'Preparing classical PARSeq model...' })
        this.kotenRecognizer = new KotenTextRecognizer()
        await this.kotenRecognizer.initialize(recData)
      } else if (layoutOnly) {
        // === 現代モバイル: レイアウトモデルのみ ===
        const layoutModelData = await loadModel('layout', (p) => {
          this.post({
            type: 'OCR_PROGRESS',
            stage: 'loading_models',
            progress: 0.02 + p * 0.73,
            message: `Loading models... ${Math.round(p * 100)}%`,
            modelProgress: { layout: p, rec30: 0, rec50: 0, rec100: 0 },
          })
        })
        this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.76, message: 'Preparing layout model...' })
        this.layoutDetector = new LayoutDetector()
        await this.layoutDetector.initialize(layoutModelData)
      } else {
        // === 現代デスクトップ: 4モデル並列 ===
        const progresses = { layout: 0, rec30: 0, rec50: 0, rec100: 0 }
        const reportProgress = () => {
          const avg = (progresses.layout + progresses.rec30 + progresses.rec50 + progresses.rec100) / 4
          this.post({
            type: 'OCR_PROGRESS',
            stage: 'loading_models',
            progress: 0.02 + avg * 0.73,
            message: `Loading models... ${Math.round(avg * 100)}%`,
            modelProgress: { ...progresses },
          })
        }

        const [layoutModelData, rec30Data, rec50Data, rec100Data] = await Promise.all([
          loadModel('layout',        (p) => { progresses.layout = p; reportProgress() }),
          loadModel('recognition30', (p) => { progresses.rec30  = p; reportProgress() }),
          loadModel('recognition50', (p) => { progresses.rec50  = p; reportProgress() }),
          loadModel('recognition100',(p) => { progresses.rec100 = p; reportProgress() }),
        ])

        this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.76, message: 'Preparing layout model...' })
        this.layoutDetector = new LayoutDetector()
        await this.layoutDetector.initialize(layoutModelData)

        this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.83, message: 'Preparing recognition model (30)...' })
        this.recognizer30 = new TextRecognizer([1, 3, 16, 256])
        await this.recognizer30.initialize(rec30Data)

        this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.90, message: 'Preparing recognition model (50)...' })
        this.recognizer50 = new TextRecognizer([1, 3, 16, 384])
        await this.recognizer50.initialize(rec50Data)

        this.post({ type: 'OCR_PROGRESS', stage: 'initializing_models', progress: 0.96, message: 'Preparing recognition model (100)...' })
        this.recognizer100 = new TextRecognizer([1, 3, 16, 768])
        await this.recognizer100.initialize(rec100Data)
      }

      this.isInitialized = true
      this.initializedMode = ocrMode

      this.post({
        type: 'OCR_PROGRESS',
        stage: 'initialized',
        progress: 1.0,
        message: 'Ready',
      })
    } catch (error) {
      this.post({
        type: 'OCR_ERROR',
        error: (error as Error).message,
        stage: 'initialization',
      })
      throw error
    }
  }

  /** 認識モデルを遅延ロード（layoutOnly モードで processOCR が呼ばれた場合） */
  private async ensureRecognizers(): Promise<void> {
    if (this.ocrMode === 'auto') {
      // auto モード: 両方の認識モデルが必要
      const promises: Promise<void>[] = []
      if (!this.kotenRecognizer) {
        promises.push((async () => {
          const recData = await loadModel('koten_recognition')
          this.kotenRecognizer = new KotenTextRecognizer()
          await this.kotenRecognizer.initialize(recData)
        })())
      }
      if (!this.recognizer100) {
        promises.push((async () => {
          const rec100Data = await loadModel('recognition100')
          this.recognizer100 = new TextRecognizer([1, 3, 16, 768])
          await this.recognizer100.initialize(rec100Data)
        })())
      }
      if (promises.length > 0) await Promise.all(promises)
      return
    }

    if (this.ocrMode === 'koten') {
      if (this.kotenRecognizer) return
      const recData = await loadModel('koten_recognition')
      this.kotenRecognizer = new KotenTextRecognizer()
      await this.kotenRecognizer.initialize(recData)
      return
    }

    if (this.recognizer100) return  // rec100 があれば最低限OK

    if (this.layoutOnly) {
      const rec100Data = await loadModel('recognition100')
      this.recognizer100 = new TextRecognizer([1, 3, 16, 768])
      await this.recognizer100.initialize(rec100Data)
    } else {
      // 不足しているモデルだけをロード
      const promises: Promise<void>[] = []
      if (!this.recognizer30) {
        promises.push((async () => {
          const data = await loadModel('recognition30')
          this.recognizer30 = new TextRecognizer([1, 3, 16, 256])
          await this.recognizer30.initialize(data)
        })())
      }
      if (!this.recognizer50) {
        promises.push((async () => {
          const data = await loadModel('recognition50')
          this.recognizer50 = new TextRecognizer([1, 3, 16, 384])
          await this.recognizer50.initialize(data)
        })())
      }
      if (!this.recognizer100) {
        promises.push((async () => {
          const data = await loadModel('recognition100')
          this.recognizer100 = new TextRecognizer([1, 3, 16, 768])
          await this.recognizer100.initialize(data)
        })())
      }
      if (promises.length > 0) await Promise.all(promises)
    }
  }

  /** charCountCategory に応じたモデルを選択（null の場合はエラー） */
  private selectRecognizer(charCountCategory?: number): TextRecognizer {
    if (!this.layoutOnly) {
      if (charCountCategory === 3 && this.recognizer30) return this.recognizer30
      if (charCountCategory === 2 && this.recognizer50) return this.recognizer50
    }
    if (!this.recognizer100) throw new Error('Text recognizer (rec100) not initialized')
    return this.recognizer100
  }

  /**
   * auto モードの場合、画像を分析して最適なパイプラインを決定する
   * modern/koten が明示指定されている場合はそのまま返す
   */
  private resolveMode(requestedMode: OCRMode, imageData: ImageData): 'modern' | 'koten' {
    if (requestedMode !== 'auto') return requestedMode as 'modern' | 'koten'
    const classification = classifyImage(imageData)
    return classification.detectedMode
  }

  /** 領域OCR用: レイアウト検出 + 逐次認識 + 読み順処理 (processRegion から使用) */
  async processOCR(id: string, imageData: ImageData, startTime: number, mode?: OCRMode): Promise<void> {
    try {
      const requestedMode = mode ?? this.ocrMode
      if (!this.isInitialized || this.initializedMode !== requestedMode) {
        await this.initialize(this.layoutOnly, requestedMode)
      }
      await this.ensureRecognizers()

      // auto モード: 画像分析で最適パイプラインを決定
      const effectiveMode = this.resolveMode(requestedMode, imageData)
      const isKoten = effectiveMode === 'koten'

      if (requestedMode === 'auto') {
        this.post({
          type: 'OCR_PROGRESS',
          id,
          stage: 'auto_detection',
          progress: 0.05,
          message: isKoten ? 'Auto-detected: classical/kuzushiji text' : 'Auto-detected: modern text',
          detectedMode: effectiveMode,
        })
      }

      // Stage 1: レイアウト検出
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'layout_detection',
        progress: 0.1,
        message: isKoten ? 'Detecting text regions (classical)...' : 'Detecting text regions...',
        detectedMode: requestedMode === 'auto' ? effectiveMode : undefined,
      })

      const detector = isKoten ? this.kotenLayoutDetector : this.layoutDetector
      if (!detector) throw new Error(`${isKoten ? 'Koten' : 'Modern'} layout detector not initialized`)
      const { lines: textRegions, blocks: pageBlocks } = await detector.detect(
        imageData,
        (progress) => {
          this.post({
            type: 'OCR_PROGRESS',
            id,
            stage: 'layout_detection',
            progress: 0.1 + progress * 0.3,
            message: `Detecting regions... ${Math.round(progress * 100)}%`,
          })
        }
      )

      // Stage 2: 逐次文字認識
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'text_recognition',
        progress: 0.4,
        message: `Recognizing text in ${textRegions.length} regions...`,
      })

      const croppedImages = isKoten
        ? KotenTextRecognizer.cropImageDataBatch(imageData, textRegions)
        : TextRecognizer.cropImageDataBatch(imageData, textRegions)
      const recognitionResults: TextBlock[] = []
      for (let i = 0; i < textRegions.length; i++) {
        const region = textRegions[i]
        let result: { text: string; confidence: number }
        if (isKoten) {
          if (!this.kotenRecognizer) throw new Error('Koten recognizer not initialized')
          result = await this.kotenRecognizer.recognizeCropped(croppedImages[i])
        } else {
          const recognizer = this.selectRecognizer(region.charCountCategory)
          result = await recognizer.recognizeCropped(croppedImages[i])
        }

        recognitionResults.push({
          ...region,
          text: result.text,
          readingOrder: i + 1,
        })

        this.post({
          type: 'OCR_PROGRESS',
          id,
          stage: 'text_recognition',
          progress: 0.4 + ((i + 1) / textRegions.length) * 0.4,
          message: `Recognized ${i + 1}/${textRegions.length} regions`,
        })
      }

      // Stage 3: 読み順処理
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'reading_order',
        progress: 0.8,
        message: 'Processing reading order...',
      })

      const orderedResults = this.readingOrderProcessor.process(recognitionResults, pageBlocks)

      // Stage 4: 出力生成
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'generating_output',
        progress: 0.9,
        message: 'Generating output...',
      })

      const txt = orderedResults
        .filter((b) => b.text)
        .map((b) => b.text)
        .join('\n')

      this.post({
        type: 'OCR_COMPLETE',
        id,
        textBlocks: orderedResults,
        txt,
        processingTime: Date.now() - startTime,
        detectedMode: requestedMode === 'auto' ? effectiveMode : undefined,
      })
    } catch (error) {
      this.post({
        type: 'OCR_ERROR',
        id,
        error: (error as Error).message,
      })
    }
  }

  /** バッチOCR用: レイアウト検出のみ実行し LAYOUT_DONE を返す (processImage から使用) */
  async detectLayout(id: string, imageData: ImageData, startTime: number, mode?: OCRMode): Promise<void> {
    try {
      const requestedMode = mode ?? this.ocrMode
      if (!this.isInitialized || this.initializedMode !== requestedMode) {
        await this.initialize(this.layoutOnly, requestedMode)
      }

      // auto モード: 画像分析で最適パイプラインを決定
      const effectiveMode = this.resolveMode(requestedMode, imageData)
      const isKoten = effectiveMode === 'koten'

      if (requestedMode === 'auto') {
        this.post({
          type: 'OCR_PROGRESS',
          id,
          stage: 'auto_detection',
          progress: 0.05,
          message: isKoten ? 'Auto-detected: classical/kuzushiji text' : 'Auto-detected: modern text',
          detectedMode: effectiveMode,
        })
      }

      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'layout_detection',
        progress: 0.1,
        message: isKoten ? 'Detecting text regions (classical)...' : 'Detecting text regions...',
        detectedMode: requestedMode === 'auto' ? effectiveMode : undefined,
      })

      const detector = isKoten ? this.kotenLayoutDetector : this.layoutDetector
      if (!detector) throw new Error(`${isKoten ? 'Koten' : 'Modern'} layout detector not initialized`)
      const { lines: textRegions, blocks: pageBlocks } = await detector.detect(
        imageData,
        (progress) => {
          this.post({
            type: 'OCR_PROGRESS',
            id,
            stage: 'layout_detection',
            progress: 0.1 + progress * 0.3,
            message: `Detecting regions... ${Math.round(progress * 100)}%`,
          })
        }
      )

      // 各領域を事前クロップ
      const croppedImages = isKoten
        ? KotenTextRecognizer.cropImageDataBatch(imageData, textRegions)
        : TextRecognizer.cropImageDataBatch(imageData, textRegions)
      const transferables = croppedImages.map(img => img.data.buffer)

      self.postMessage(
        { type: 'LAYOUT_DONE', id, textRegions, croppedImages, pageBlocks, startTime } satisfies WorkerOutMessage,
        { transfer: transferables }
      )
    } catch (error) {
      this.post({
        type: 'OCR_ERROR',
        id,
        error: (error as Error).message,
      })
    }
  }
}

const ocrWorker = new OCRWorker()

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const message = event.data

  switch (message.type) {
    case 'INITIALIZE':
      await ocrWorker.initialize(message.layoutOnly, message.ocrMode)
      break

    case 'OCR_PROCESS':
      await ocrWorker.processOCR(message.id, message.imageData, message.startTime, message.ocrMode)
      break

    case 'LAYOUT_DETECT':
      await ocrWorker.detectLayout(message.id, message.imageData, message.startTime, message.ocrMode)
      break

    case 'TERMINATE':
      self.close()
      break
  }
}

self.onerror = (error) => {
  const message = typeof error === 'string' ? error : (error as ErrorEvent).message ?? 'Unknown error'
  self.postMessage({
    type: 'OCR_ERROR',
    error: message,
  } satisfies WorkerOutMessage)
}
