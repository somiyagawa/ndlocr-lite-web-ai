import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import type { OCRResult, TextBlock, BoundingBox, PageBlock, ProcessedImage } from './types/ocr'
import type { DBRunEntry } from './types/db'
import { useI18n } from './hooks/useI18n'
import { L } from './i18n'
import { useOCRWorker } from './hooks/useOCRWorker'
import { useFileProcessor } from './hooks/useFileProcessor'
import { useResultCache } from './hooks/useResultCache'
import { useAISettings } from './hooks/useAISettings'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { SplitView } from './components/layout/SplitView'
import { BottomToolbar } from './components/layout/BottomToolbar'
import { FileDropZone } from './components/upload/FileDropZone'
import { DirectoryPicker } from './components/upload/DirectoryPicker'
import { CameraCapture } from './components/upload/CameraCapture'
import { SampleTileSelector } from './components/SampleTileSelector'
import { IIIFLoader } from './components/IIIFLoader'
import { ProgressBar } from './components/progress/ProgressBar'
import { ImageViewer } from './components/viewer/ImageViewer'
import { TextEditor } from './components/editor/TextEditor'
import { imageDataToDataUrl, dataUrlToProcessedImage } from './utils/imageLoader'
import type { PreprocessOptions } from './components/viewer/ImagePreprocessPanel'
import './App.css'

// Lazy-loaded modals & heavy panels (not needed at initial render)
const ImagePreprocessPanel = lazy(() => import('./components/viewer/ImagePreprocessPanel').then(m => ({ default: m.ImagePreprocessPanel })))
const HistoryPanel = lazy(() => import('./components/results/HistoryPanel').then(m => ({ default: m.HistoryPanel })))
const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then(m => ({ default: m.SettingsModal })))
const HelpPage = lazy(() => import('./components/help/HelpPage').then(m => ({ default: m.HelpPage })))
const AIConnectHelp = lazy(() => import('./components/help/AIConnectHelp').then(m => ({ default: m.AIConnectHelp })))
const BugReportModal = lazy(() => import('./components/help/BugReportModal').then(m => ({ default: m.BugReportModal })))

function cropRegion(srcDataUrl: string, bbox: BoundingBox) {
  return new Promise<{ previewDataUrl: string; imageData: ImageData }>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const w = Math.max(1, Math.round(bbox.width))
      const h = Math.max(1, Math.round(bbox.height))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, w, h)
      resolve({
        previewDataUrl: canvas.toDataURL('image/jpeg', 0.9),
        imageData: ctx.getImageData(0, 0, w, h),
      })
    }
    img.src = srcDataUrl
  })
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    // enter → hold (0.8s) → exit (1.2s later) → done (0.8s fade out)
    const t1 = setTimeout(() => setPhase('hold'), 800)
    const t2 = setTimeout(() => setPhase('exit'), 2000)
    const t3 = setTimeout(() => onDone(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div className={`splash-screen splash-${phase}`}>
      <div className="splash-content">
        <div className="splash-title">Ultra <span className="bluepond-blue-splash">Blue</span>pond</div>
        <div className="splash-subtitle">NDL(Kotenseki)OCR-lite Web AI</div>
        <div className="splash-description">国立国会図書館の縦書きに強い自動書き起こし日本語OCRソフト機能拡張版</div>
        <div className="splash-line" />
      </div>
    </div>
  )
}

export default function App() {
  const { lang, toggleLanguage } = useI18n()
  const [showSplash, setShowSplash] = useState(true)
  const handleSplashDone = useCallback(() => setShowSplash(false), [])
  const { isReady, jobState, ocrMode, processImage, processRegion, resetState, switchOcrMode } = useOCRWorker()
  const { processedImages, setProcessedImages, isLoading: isLoadingFiles, processFiles, clearImages, fileLoadingState } = useFileProcessor()
  const { runs: historyRuns, saveRun, clearResults } = useResultCache()
  const {
    settings: aiSettings,
    updateSettings: updateAISettings,
    switchProvider,
    connectionStatus: aiConnectionStatus,
    testAndConnect,
    getConnector,
  } = useAISettings()

  const { theme, toggleTheme } = useTheme()

  const [sessionResults, setSessionResults] = useState<OCRResult[]>([])
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [selectedBlock, setSelectedBlock] = useState<TextBlock | null>(null)
  const [selectedPageBlock, setSelectedPageBlock] = useState<PageBlock | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showAIConnectHelp, setShowAIConnectHelp] = useState(false)
  const [showBugReport, setShowBugReport] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReadyToProcess, setIsReadyToProcess] = useState(false)
  const cancelRef = useRef(false)
  const [pendingImageIndex, setPendingImageIndex] = useState(0)

  // 領域選択状態
  const [selectedRegion, setSelectedRegion] = useState<BoundingBox | null>(null)

  // 前処理パネル表示状態
  const [showPreprocessPanel, setShowPreprocessPanel] = useState(false)

  // 画像前処理状態
  const [preprocessedUrls, setPreprocessedUrls] = useState<Record<number, string>>({})

  // 分割前の processedImages を保存（リセットで復元するため）
  const [preSplitImages, setPreSplitImages] = useState<ProcessedImage[] | null>(null)

  // 四隅指定切り出し（perspective crop）状態 — ImageViewer と ImagePreprocessPanel の間で共有
  const [perspectiveActive, setPerspectiveActive] = useState(false)
  const [perspectiveCorners, setPerspectiveCorners] = useState<{topLeft:{x:number,y:number},topRight:{x:number,y:number},bottomRight:{x:number,y:number},bottomLeft:{x:number,y:number}} | null>(null)

  // 読み順編集モード
  const [readingOrderEditMode, setReadingOrderEditMode] = useState(false)

  // ドラッグ&ドロップ状態（結果ページの並び替え用）
  const [draggedPage, setDraggedPage] = useState<number | null>(null)
  const [dragOverPage, setDragOverPage] = useState<number | null>(null)

  const handlePreprocessed = useCallback((index: number, dataUrl: string) => {
    setPreprocessedUrls(prev => ({ ...prev, [index]: dataUrl }))
  }, [])

  const handlePreprocessReset = useCallback((index: number) => {
    // 分割前の状態がある場合は復元する（pending画像のみ、結果ビュー index>=10000 では不適用）
    if (preSplitImages && index < 10000) {
      setProcessedImages(preSplitImages)
      setPreSplitImages(null)
      setPreprocessedUrls({})
      return
    }
    setPreprocessedUrls(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }, [preSplitImages, setProcessedImages])

  // pending 状態での ImageViewer 表示用（全解像度 DataUrl）
  const pendingDataUrls = useMemo(
    () => processedImages.map((img) => imageDataToDataUrl(img.imageData)),
    [processedImages]
  )

  const handlePerspectiveToggle = useCallback(() => {
    if (perspectiveActive) {
      setPerspectiveActive(false)
      setPerspectiveCorners(null)
    } else {
      // Initialize corners at 8% margins; need image dimensions
      const currentUrl = preprocessedUrls[pendingImageIndex] ?? pendingDataUrls[pendingImageIndex]
        ?? (sessionResults[selectedResultIndex]?.imageDataUrl)
      if (!currentUrl) return
      setPerspectiveActive(true)
      const img = new Image()
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight
        const m = 0.08
        setPerspectiveCorners({
          topLeft: { x: Math.round(w * m), y: Math.round(h * m) },
          topRight: { x: Math.round(w * (1 - m)), y: Math.round(h * m) },
          bottomRight: { x: Math.round(w * (1 - m)), y: Math.round(h * (1 - m)) },
          bottomLeft: { x: Math.round(w * m), y: Math.round(h * (1 - m)) },
        })
      }
      img.src = currentUrl
    }
  }, [perspectiveActive, preprocessedUrls, pendingImageIndex, pendingDataUrls, sessionResults, selectedResultIndex])

  // 全画像に一括で前処理を適用
  const handlePreprocessAll = useCallback(async (opts: PreprocessOptions) => {
    const { applyPreprocess } = await import('./components/viewer/ImagePreprocessPanel')
    const results: Record<number, string> = {}
    for (let i = 0; i < pendingDataUrls.length; i++) {
      const url = pendingDataUrls[i]
      if (url) {
        try {
          results[i] = await applyPreprocess(url, opts)
        } catch (err) {
          console.error(`Batch preprocess error on image ${i}:`, err)
        }
      }
    }
    setPreprocessedUrls(prev => ({ ...prev, ...results }))
  }, [pendingDataUrls])

  // ページ分割ハンドラ（pending用）：現在の画像を分割ページで差し替え
  const handleSplitPages = useCallback(async (pages: string[]) => {
    if (pages.length < 2) return
    const currentImg = processedImages[pendingImageIndex]
    if (!currentImg) return
    try {
      // 分割前の状態を保存（リセットで復元可能にする）
      setPreSplitImages([...processedImages])
      setPreprocessedUrls({})
      const newImages = await Promise.all(
        pages.map((url, i) =>
          dataUrlToProcessedImage(url, `${currentImg.fileName}_p${i + 1}`, i)
        )
      )
      setProcessedImages(prev => {
        const next = [...prev]
        next.splice(pendingImageIndex, 1, ...newImages)
        return next
      })
    } catch (err) {
      console.error('Split pages error:', err)
    }
  }, [processedImages, pendingImageIndex, setProcessedImages])

  // 結果ページ並び替えハンドラ（ドラッグ&ドロップ用）
  const handleReorderResults = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setSessionResults(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    // 選択されたページが移動した場合は追従
    if (selectedResultIndex === fromIndex) {
      setSelectedResultIndex(toIndex)
    } else if (fromIndex < selectedResultIndex && toIndex >= selectedResultIndex) {
      setSelectedResultIndex(prev => prev - 1)
    } else if (fromIndex > selectedResultIndex && toIndex <= selectedResultIndex) {
      setSelectedResultIndex(prev => prev + 1)
    }
  }, [selectedResultIndex])

  // processedImages が差し替わったらインデックスをリセット
  useEffect(() => { setPendingImageIndex(0) }, [processedImages])

  const currentResult = sessionResults[selectedResultIndex] ?? null

  const selectedPageBlockText = useMemo(() => {
    if (!selectedPageBlock || !currentResult) return null
    const cx = (b: TextBlock) => b.x + b.width / 2
    const cy = (b: TextBlock) => b.y + b.height / 2
    return currentResult.textBlocks
      .filter(b =>
        cx(b) >= selectedPageBlock.x && cx(b) <= selectedPageBlock.x + selectedPageBlock.width &&
        cy(b) >= selectedPageBlock.y && cy(b) <= selectedPageBlock.y + selectedPageBlock.height
      )
      .sort((a, b) => a.readingOrder - b.readingOrder)
      .map(b => b.text)
      .join('\n')
  }, [selectedPageBlock, currentResult])

  const handleFilesSelected = useCallback(async (files: File[]) => {
    await processFiles(files)
  }, [processFiles])

  // Ctrl+V / Cmd+V でクリップボードの画像を貼り付け（アップロード画面表示中のみ）
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (sessionResults.length > 0 || isLoadingFiles || isProcessing) return
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) handleFilesSelected(files)
    }
    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  }, [sessionResults.length, isLoadingFiles, isProcessing, handleFilesSelected])

  const handleSampleLoad = useCallback(async (files: File[]) => {
    await processFiles(files)
  }, [processFiles])

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read()
      const files: File[] = []
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const ext = type.split('/')[1] || 'png'
            files.push(new File([blob], `clipboard.${ext}`, { type }))
          }
        }
      }
      if (files.length > 0) await processFiles(files)
    } catch {
      // permission denied or no image in clipboard — ignore silently
    }
  }, [processFiles])

  // 「OCRを開始」が押されたら OCR 実行（全体 or 領域）
  useEffect(() => {
    if (!isReadyToProcess || processedImages.length === 0 || isProcessing) return

    const runOCR = async () => {
      setIsProcessing(true)

      // 領域選択がある場合 → その領域だけOCR
      if (selectedRegion) {
        const regionBbox = selectedRegion
        // 結果表示中の場合は現在の画像、pending中は pendingDataUrls を使う
        const srcDataUrl = currentResult
          ? currentResult.imageDataUrl
          : pendingDataUrls[pendingImageIndex] ?? ''
        const fileName = currentResult
          ? currentResult.fileName
          : processedImages[pendingImageIndex]?.fileName ?? 'region'

        try {
          const { previewDataUrl, imageData } = await cropRegion(srcDataUrl, regionBbox)
          const result = await processRegion(imageData)
          const regionResult: OCRResult = {
            id: `region-${Date.now()}`,
            fileName: `${fileName} (region)`,
            imageDataUrl: previewDataUrl,
            textBlocks: result.textBlocks,
            fullText: result.fullText,
            processingTimeMs: 0,
            createdAt: Date.now(),
          }
          setSessionResults((prev) => [...prev, regionResult])
          setSelectedResultIndex((prev) => prev + 1 > 0 ? sessionResults.length : 0)
        } catch (err) {
          console.error('Region OCR failed:', err)
        }

        setSelectedRegion(null)
        setIsProcessing(false)
        setIsReadyToProcess(false)
        return
      }

      // 全体OCR
      cancelRef.current = false
      setSessionResults([])
      setSelectedResultIndex(0)
      resetState()

      const runId = crypto.randomUUID()
      const runCreatedAt = Date.now()
      const successItems: Array<{ result: OCRResult; thumbnailDataUrl: string; originalWidth: number; originalHeight: number }> = []
      const sessionResultsAccum: OCRResult[] = []

      for (let i = 0; i < processedImages.length; i++) {
        if (cancelRef.current) break
        const image = processedImages[i]
        try {
          const result = await processImage(image, i, processedImages.length)
          successItems.push({
            result,
            thumbnailDataUrl: image.thumbnailDataUrl,
            originalWidth: image.imageData.width,
            originalHeight: image.imageData.height,
          })
          sessionResultsAccum.push(result)
          setSessionResults([...sessionResultsAccum])
          setSelectedResultIndex(sessionResultsAccum.length - 1)
        } catch (err) {
          console.error(`OCR failed for ${image.fileName}:`, err)
        }
      }

      if (successItems.length > 0) {
        const runEntry: DBRunEntry = {
          id: runId,
          files: successItems.map(({ result, thumbnailDataUrl, originalWidth, originalHeight }) => ({
            fileName: result.fileName,
            imageDataUrl: thumbnailDataUrl,
            textBlocks: result.textBlocks,
            fullText: result.fullText,
            processingTimeMs: result.processingTimeMs,
            originalWidth,
            originalHeight,
          })),
          createdAt: runCreatedAt,
        }
        await saveRun(runEntry)
      }

      setIsProcessing(false)
      setIsReadyToProcess(false)
      cancelRef.current = false
    }

    runOCR()
  }, [isReadyToProcess]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStopProcessing = useCallback(() => {
    cancelRef.current = true
  }, [])

  const handleClear = () => {
    if (sessionResults.length > 0) {
      const msg = L(lang, {
        ja: '現在のOCR結果は破棄されます。よろしいですか？',
        en: 'Current OCR results will be discarded. Continue?',
        'zh-CN': '当前OCR结果将被丢弃。是否继续？',
        'zh-TW': '目前的OCR結果將被捨棄。是否繼續？',
        ko: '현재 OCR 결과가 삭제됩니다. 계속하시겠습니까?',
        la: 'Eventus OCR praesentes delentur. Visne procedere?',
        eo: 'Nuna OCR-rezulto estos forĵetita. Ĉu daŭrigi?',
      es: 'Los resultados OCR actuales se descartarán. ¿Continuar?',
      de: 'Aktuelle OCR-Ergebnisse werden verworfen. Fortfahren?',
      ar: 'سيتم تجاهل نتائج OCR الحالية. هل تريد المتابعة؟',
      hi: 'वर्तमान OCR परिणाम हटा दिए जाएँगे। जारी रखें?',
      ru: 'Текущие результаты OCR будут удалены. Продолжить?',
      el: 'Τα τρέχοντα αποτελέσματα OCR θα διαγραφούν. Συνέχεια;',
      syc: 'ܦܠ̈ܛܐ ܕ OCR ܗܠܝܢ ܢܬܫܕܘܢ. ܬܫܪ؟'
      })
      if (!window.confirm(msg)) return
    }
    clearImages()
    setSessionResults([])
    setSelectedResultIndex(0)
    setSelectedBlock(null)
    setSelectedPageBlock(null)
    setSelectedRegion(null)
    setPreprocessedUrls({})
    resetState()
    setIsProcessing(false)
    setIsReadyToProcess(false)
    setPendingImageIndex(0)
  }

  // 領域選択ハンドラ（選択範囲を保持するだけ、即座にOCRしない）
  const handleRegionSelect = useCallback((bbox: BoundingBox) => {
    setSelectedRegion(bbox)
    setSelectedBlock(null)
    setSelectedPageBlock(null)
  }, [])

  // 領域選択をクリア
  const handleClearRegion = useCallback(() => {
    setSelectedRegion(null)
  }, [])

  // ページ再OCR（結果ビューで画像補正後に現在のページだけOCRをやり直す）
  const [isReOCRing, setIsReOCRing] = useState(false)
  const handleReOCRPage = useCallback(async () => {
    const result = currentResult
    if (!result || isReOCRing) return
    setIsReOCRing(true)
    try {
      // 補正済み画像があればそれを使う、なければ元画像
      const imgUrl = preprocessedUrls[selectedResultIndex + 10000] ?? result.imageDataUrl
      const procImg = await dataUrlToProcessedImage(imgUrl, result.fileName)
      const ocrResult = await processImage(procImg, 0, 1)
      // 結果を差し替え（imageDataUrl は補正済み画像を使う）
      setSessionResults(prev => {
        const next = [...prev]
        next[selectedResultIndex] = {
          ...ocrResult,
          imageDataUrl: imgUrl,
        }
        return next
      })
      // 補正済みURLをクリア（画像はもう結果に組み込まれたため）
      setPreprocessedUrls(prev => {
        const next = { ...prev }
        delete next[selectedResultIndex + 10000]
        return next
      })
      setSelectedBlock(null)
      setSelectedPageBlock(null)
    } catch (err) {
      console.error('Re-OCR failed:', err)
    } finally {
      setIsReOCRing(false)
    }
  }, [currentResult, selectedResultIndex, preprocessedUrls, processImage, isReOCRing])

  // 読み順編集完了ハンドラ
  const handleReadingOrderChange = useCallback((newBlocks: TextBlock[]) => {
    setSessionResults(prev => {
      const next = [...prev]
      next[selectedResultIndex] = {
        ...next[selectedResultIndex],
        textBlocks: newBlocks,
        fullText: newBlocks
          .sort((a, b) => a.readingOrder - b.readingOrder)
          .map(b => b.text)
          .join('\n'),
      }
      return next
    })
    setSelectedBlock(null)
    setReadingOrderEditMode(false)
  }, [selectedResultIndex])

  // バッチAI校正の結果を適用（各ページのfullTextを更新）
  const handleBatchProofread = useCallback((correctedTextsMap: Map<number, string>) => {
    setSessionResults(prev => {
      const next = [...prev]
      for (const [pageIndex, correctedText] of correctedTextsMap.entries()) {
        if (pageIndex >= 0 && pageIndex < next.length) {
          next[pageIndex] = {
            ...next[pageIndex],
            fullText: correctedText,
          }
        }
      }
      return next
    })
  }, [])

  const handleHistorySelect = useCallback(async (run: DBRunEntry) => {
    // サムネイル画像の実サイズを取得し、ブロック座標をスケーリング
    const restoredResults: OCRResult[] = await Promise.all(
      run.files.map(async (file, i) => {
        let textBlocks = file.textBlocks
        // 元画像サイズが記録されている場合、サムネイルとの比率でブロック座標を変換
        if (file.originalWidth && file.originalHeight && file.originalWidth > 0) {
          const thumbSize = await new Promise<{ w: number; h: number }>((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
            img.onerror = () => resolve({ w: file.originalWidth!, h: file.originalHeight! })
            img.src = file.imageDataUrl
          })
          const scaleX = thumbSize.w / file.originalWidth
          const scaleY = thumbSize.h / file.originalHeight
          if (Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
            textBlocks = file.textBlocks.map(b => ({
              ...b,
              x: b.x * scaleX,
              y: b.y * scaleY,
              width: b.width * scaleX,
              height: b.height * scaleY,
            }))
          }
        }
        return {
          id: `${run.id}-${i}`,
          fileName: file.fileName,
          imageDataUrl: file.imageDataUrl,
          textBlocks,
          fullText: file.fullText,
          processingTimeMs: file.processingTimeMs,
          createdAt: run.createdAt,
        }
      })
    )
    setSessionResults(restoredResults)
    setSelectedResultIndex(0)
    setSelectedBlock(null)
    setSelectedPageBlock(null)
    setSelectedRegion(null)
    setShowHistory(false)
  }, [])

  const isModelLoading = jobState.status === 'loading_model'
  const isWorking = isLoadingFiles || isProcessing
  const hasResults = sessionResults.length > 0
  const hasPendingImages = processedImages.length > 0 && !isWorking && !hasResults

  // ページナビゲーション（結果表示時）— ページ番号付きパジネーション
  const renderPageNav = (
    index: number,
    setIndex: (fn: (prev: number) => number) => void,
    total: number,
    maxIndex: number,
    draggable: boolean = false,
  ) => {
    const goTo = (i: number) => {
      setIndex(() => i)
      setSelectedBlock(null)
      setSelectedPageBlock(null)
      setSelectedRegion(null)
    }

    // ページ番号リスト生成（省略記号付き）
    const getPageNumbers = (): (number | '...')[] => {
      if (total <= 9) {
        return Array.from({ length: total }, (_, i) => i)
      }
      const pages: (number | '...')[] = []
      // 常に最初のページ
      pages.push(0)
      // 現在ページ周辺
      const start = Math.max(1, index - 2)
      const end = Math.min(total - 2, index + 2)
      if (start > 1) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < total - 2) pages.push('...')
      // 常に最後のページ
      pages.push(total - 1)
      return pages
    }

    const currentImg = processedImages[index]
    const currentLabel = currentImg
      ? (currentImg.pageIndex ? `${currentImg.fileName} (p.${currentImg.pageIndex})` : currentImg.fileName)
      : ''

    return (
      <div className="result-page-nav">
        <button
          className="btn-page-arrow"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          title={L(lang, { ja: '前のファイル', en: 'Previous', 'zh-CN': '上一个', 'zh-TW': '上一個', ko: '이전', la: 'Prior', eo: 'Antaŭa', es: 'Anterior', de: 'Zurück', ar: 'السابق', hi: 'पिछला', ru: 'Назад', el: 'Προηγούμενο', syc: 'ܕܩܕܡ' })}
        >‹</button>
        <div className="page-numbers">
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`btn-page-num${p === index ? ' btn-page-active' : ''}${draggedPage === p ? ' page-dragging' : ''}${dragOverPage === p ? ' page-drag-over' : ''}`}
                onClick={() => goTo(p)}
                disabled={p > maxIndex}
                draggable={draggable}
                onDragStart={() => {
                  if (draggable) setDraggedPage(p)
                }}
                onDragOver={(e) => {
                  if (draggable) {
                    e.preventDefault()
                    setDragOverPage(p)
                  }
                }}
                onDragEnd={() => {
                  if (draggable) {
                    setDraggedPage(null)
                    setDragOverPage(null)
                  }
                }}
                onDrop={(e) => {
                  if (draggable && draggedPage !== null && draggedPage !== p) {
                    e.preventDefault()
                    handleReorderResults(draggedPage, p)
                    setDraggedPage(null)
                    setDragOverPage(null)
                  }
                }}
                title={draggable && p <= maxIndex ? L(lang, { ja: 'ドラッグして並び替え可能', en: 'Drag to reorder', 'zh-CN': '拖动重新排列', 'zh-TW': '拖動重新排列', ko: '끌어서 재정렬', la: 'Trahere ut reordinare', eo: 'Treni por reordigi', es: 'Arrastrar para reordenar', de: 'Ziehen zum Neuordnen', ar: 'اسحب لإعادة الترتيب', hi: 'पुनः व्यवस्थित करने के लिए खींचें', ru: 'Перетащите для переупорядочения', el: 'Σύρετε για αναδιάταξη', syc: 'ܥܛܘܦ ܠܬܘܟܡܐ ܕܪܗܝܛܐ', cop: 'ⲟⲣ ⲉⲡⲓⲥⲧⲁⲙⲱⲣⲓ', sa: 'अन्यथा कर्तव्यं विषय्यते' }) : ''}
              >
                {p + 1}
              </button>
            )
          )}
        </div>
        <button
          className="btn-page-arrow"
          onClick={() => goTo(index + 1)}
          disabled={index >= maxIndex}
          title={L(lang, { ja: '次のファイル', en: 'Next', 'zh-CN': '下一个', 'zh-TW': '下一個', ko: '다음', la: 'Proximus', eo: 'Sekva', es: 'Siguiente', de: 'Weiter', ar: 'التالي', hi: 'अगला', ru: 'Далее', el: 'Επόμενο', syc: 'ܕܒܬܪ' })}
        >›</button>
        {total > 1 && (
          <span className="page-current-label" title={currentLabel}>
            {currentLabel}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      <Header
        lang={lang}
        onToggleLanguage={toggleLanguage}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenHelp={() => setShowHelp(true)}
        onAIStatusClick={() => setShowAIConnectHelp(true)}
        onLogoClick={handleClear}
        aiConnectionStatus={aiConnectionStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        ocrMode={ocrMode}
        onSwitchOcrMode={switchOcrMode}
      />

      <main className="main">
        {/* ===== アップロード画面 ===== */}
        {!hasResults && !isWorking && !isModelLoading && !hasPendingImages && (
          <section className="upload-section">
            <div className="landing-title">
              <h1 className="landing-title-main">Ultra <span className="bluepond-blue">Blue</span>pond</h1>
              <p className="landing-title-sub">NDL(Kotenseki)OCR-lite Web AI</p>
              <p className="landing-title-desc">{L(lang, {
                ja: '国立国会図書館の縦書きに強い自動書き起こし日本語OCRソフト機能拡張版',
                en: 'A user-friendly adaptation of the National Diet Library\'s Japanese automatic transcription software',
                'zh-CN': '基于日本国立国会图书馆日语自动转录软件的易用版本',
                'zh-TW': '基於日本國立國會圖書館日語自動轉錄軟體的易用版本',
                ko: '일본 국립국회도서관의 일본어 자동 전사 소프트웨어를 사용하기 쉽게 개선한 것',
                la: 'Instrumentum transcriptionis Iaponicae automaticae Bibliothecae Diaetae Nationalis facilius redditum',
                eo: 'Pli facile uzebla versio de la aŭtomata japana transskriba programo de la Nacia Dieta Biblioteko',
                es: 'Una versión más accesible del software de transcripción automática japonesa de la Biblioteca Nacional de la Dieta',
                de: 'Eine benutzerfreundliche Anpassung der automatischen japanischen Transkriptionssoftware der Nationalen Parlamentsbibliothek',
                ar: 'نسخة سهلة الاستخدام من برنامج النسخ التلقائي الياباني لمكتبة البرلمان الوطني',
                hi: 'राष्ट्रीय डाइट पुस्तकालय के जापानी स्वचालित प्रतिलेखन सॉफ़्टवेयर का उपयोग में आसान संस्करण',
                ru: 'Удобная версия ПО автоматической транскрипции японского языка Национальной парламентской библиотеки',
                el: 'Μια εύχρηστη έκδοση του λογισμικού αυτόματης μεταγραφής ιαπωνικών της Εθνικής Κοινοβουλευτικής Βιβλιοθήκης',
                syc: 'ܛܘܦܣ ܦܫܝܩ ܕܬܘܩܢ ܟܬܒ̈ܬ ܝܦܘ̈ܢܝܬܐ ܐܘ̈ܛܘ̈ܡܛܝܬܐ ܕܒܝܬ ܟ̈ܬܒܐ ܕܟܢܘܫܬ ܐܘ̈ܡܬܐ',
                cop: 'ⲟⲩⲙⲉⲧⲣⲉϥⲭⲣⲱ ⲉⲥⲙⲟⲧⲛ ⲛⲧⲉ ⲡⲓⲥⲟϥⲧⲱⲉⲣ ⲛⲧⲉ ⲡⲓⲥϧⲁⲓ ⲁⲩⲧⲟⲙⲁⲧⲟⲛ ⲙⲡⲓⲁⲥⲡⲓ ⲛ ⲓⲁⲡⲁⲛ ⲛⲧⲉ NDL',
                sa: 'राष्ट्रीय-संसद्-पुस्तकालयस्य जापानीय-स्वचालित-लिप्यन्तरण-तन्त्रांशस्य सुलभ-संस्करणम्'
              })}</p>
            </div>
            <FileDropZone onFilesSelected={handleFilesSelected} lang={lang} disabled={isWorking} />
            <div className="upload-actions">
              <DirectoryPicker onFilesSelected={handleFilesSelected} lang={lang} disabled={isWorking} />
              <CameraCapture
                onCapture={(file) => handleFilesSelected([file])}
                lang={lang}
                disabled={isWorking}
              />
              <button className="btn btn-secondary" onClick={handlePasteFromClipboard} disabled={isWorking}>
                {L(lang, { ja: 'クリップボードから貼り付け', en: 'Paste from Clipboard', 'zh-CN': '从剪贴板粘贴', 'zh-TW': '從剪貼簿貼上', ko: '클립보드에서 붙여넣기', la: 'Glutinare ex tabulā', eo: 'Alglui el tondujo', es: 'Pegar desde portapapeles', de: 'Aus Zwischenablage einfügen', ar: 'لصق من الحافظة', hi: 'क्लिपबोर्ड से पेस्ट करें', ru: 'Вставить из буфера обмена', el: 'Επικόλληση από πρόχειρο', syc: 'ܐܠܨܘܩ ܡܢ ܠܘ̈ܚܐ ܕܢܣ̈ܚܐ' })}
              </button>
              <IIIFLoader
                onImagesLoaded={handleFilesSelected}
                lang={lang}
                disabled={isWorking}
              />
            </div>
            <SampleTileSelector
              ocrMode={ocrMode}
              lang={lang}
              disabled={isWorking}
              onSampleSelected={handleSampleLoad}
            />
            <span className="bluepond-credit">
              {L(lang, {
                ja: '背景写真: 美瑛・青い池 — MaedaAkihiko, CC BY-SA 4.0',
                en: 'Background: Blue Pond, Biei — MaedaAkihiko, CC BY-SA 4.0',
                'zh-CN': '背景照片：美瑛·青池 — MaedaAkihiko, CC BY-SA 4.0',
                'zh-TW': '背景照片：美瑛·青池 — MaedaAkihiko, CC BY-SA 4.0',
                ko: '배경 사진: 비에이·아오이이케 — MaedaAkihiko, CC BY-SA 4.0',
                la: 'Imago: Lacus Caeruleus, Biei — MaedaAkihiko, CC BY-SA 4.0',
                eo: 'Fono: Blua Lageto, Biei — MaedaAkihiko, CC BY-SA 4.0',
              es: 'Fondo: Estanque Azul, Biei — MaedaAkihiko, CC BY-SA 4.0',
              de: 'Hintergrund: Blauer Teich, Biei — MaedaAkihiko, CC BY-SA 4.0',
              ar: 'الخلفية: البركة الزرقاء، بيئي — MaedaAkihiko, CC BY-SA 4.0',
              hi: 'पृष्ठभूमि: ब्लू पॉन्ड, बिएई — MaedaAkihiko, CC BY-SA 4.0',
              ru: 'Фон: Голубой пруд, Биэй — MaedaAkihiko, CC BY-SA 4.0',
              el: 'Φόντο: Μπλε Λίμνη, Μπιέι — MaedaAkihiko, CC BY-SA 4.0',
              syc: 'ܨܘܪܬ ܐܦ̈ܐ: ܝܡܬ ܙܪ̈ܩܬܐ، ܒܝܐܝ — MaedaAkihiko, CC BY-SA 4.0'
              })}
            </span>
          </section>
        )}

        {/* ===== Pending 画面（認識前） ===== */}
        {hasPendingImages && (
          <section className="result-section">

            <div className="result-content">
              {processedImages.length > 1 &&
                renderPageNav(pendingImageIndex, setPendingImageIndex, processedImages.length, processedImages.length - 1)
              }

              <div className="pending-viewer">
                <div className="pending-viewer-buttons">
                  <button className="btn btn-primary" onClick={() => setIsReadyToProcess(true)}>
                    {selectedRegion
                      ? L(lang, { ja: '選択領域のOCRを開始', en: 'OCR Selected Region', 'zh-CN': '对选定区域执行OCR', 'zh-TW': '對選取區域執行OCR', ko: '선택 영역 OCR 실행', la: 'OCR regionis selectae', eo: 'OCR de elektita regiono', es: 'OCR de región seleccionada', de: 'OCR des ausgewählten Bereichs', ar: 'OCR للمنطقة المحددة', hi: 'चयनित क्षेत्र का OCR', ru: 'OCR выделенной области', el: 'OCR επιλεγμένης περιοχής', syc: 'OCR ܕܐܬܪ ܓܒܝܐ' })
                      : L(lang, { ja: 'OCRを開始', en: 'Start OCR', 'zh-CN': '开始OCR', 'zh-TW': '開始OCR', ko: 'OCR 시작', la: 'OCR incipere', eo: 'Komenci OCR', es: 'Iniciar OCR', de: 'OCR starten', ar: 'بدء OCR', hi: 'OCR शुरू करें', ru: 'Начать OCR', el: 'Έναρξη OCR', syc: 'ܫܪܝ OCR' })}
                  </button>
                  {selectedRegion && (
                    <button className="btn btn-secondary" onClick={handleClearRegion}>
                      {L(lang, { ja: '選択解除', en: 'Clear Selection', 'zh-CN': '取消选择', 'zh-TW': '取消選取', ko: '선택 해제', la: 'Selectionem delere', eo: 'Malselekti', es: 'Borrar selección', de: 'Auswahl aufheben', ar: 'إلغاء التحديد', hi: 'चयन साफ़ करें', ru: 'Снять выделение', el: 'Εκκαθάριση επιλογής', syc: 'ܫܪܝ ܓܒܝܬܐ' })}
                    </button>
                  )}
                </div>
                <div className="image-with-preprocess">
                  <div className="image-with-preprocess-main">
                    <ImageViewer
                      imageDataUrl={preprocessedUrls[pendingImageIndex] ?? pendingDataUrls[pendingImageIndex] ?? ''}
                      textBlocks={[]}
                      selectedBlock={null}
                      onBlockSelect={() => {}}
                      onRegionSelect={handleRegionSelect}
                      selectedRegion={selectedRegion}
                      perspectiveMode={perspectiveActive}
                      perspectiveCorners={perspectiveCorners}
                      onPerspectiveCornersChange={setPerspectiveCorners}
                      showAdjustButton
                      adjustActive={showPreprocessPanel}
                      onAdjustToggle={() => setShowPreprocessPanel(!showPreprocessPanel)}
                      adjustLabel={L(lang, { ja: '画像補正', en: 'Adjust', 'zh-CN': '图像校正', 'zh-TW': '影像校正', ko: '이미지 보정', la: 'Imaginem corrigere', eo: 'Korekti bildon', es: 'Ajustar', de: 'Anpassen', ar: 'ضبط', hi: 'समायोजन', ru: 'Коррекция', el: 'Ρύθμιση', syc: 'ܬܘܪܨ' })}
                      lang={lang}
                    />
                    <p className="region-select-hint">
                      {L(lang, {
                        ja: 'マウスで領域をドラッグして選択し、「OCRを開始」で認識できます',
                        en: 'Drag to select a region, then click "Start OCR" to recognize',
                        'zh-CN': '拖动鼠标选择区域，然后点击"开始OCR"进行识别',
                        'zh-TW': '拖曳滑鼠選取區域，然後點擊「開始OCR」進行辨識',
                        ko: '마우스로 영역을 드래그하여 선택하고 "OCR 시작"으로 인식합니다',
                        la: 'Trahe murem ad regionem seligendam, deinde "OCR incipere" preme',
                        eo: 'Trenu por elekti regionon, poste alklaku "Komenci OCR" por rekoni',
                        es: 'Arrastra para seleccionar una región, luego haz clic en "Iniciar OCR"',
                        de: 'Ziehen Sie, um einen Bereich auszuwählen, dann klicken Sie auf "OCR starten"',
                        ar: 'اسحب لتحديد منطقة، ثم انقر على "بدء OCR" للتعرف',
                        hi: 'क्षेत्र चुनने के लिए खींचें, फिर "OCR शुरू करें" पर क्लिक करें',
                        ru: 'Перетащите мышь для выбора области, затем нажмите «Начать OCR»',
                        el: 'Σύρετε για να επιλέξετε μια περιοχή, μετά κάντε κλικ στο «Έναρξη OCR»',
                        syc: 'ܓܪܘܪ ܠܓܒܝ ܐܬܪ، ܘܕܘܨ «ܫܪܝ OCR»'
                      })}
                    </p>
                  </div>
                  {showPreprocessPanel && (
                    <Suspense fallback={null}>
                      <ImagePreprocessPanel
                        lang={lang}
                        imageDataUrl={pendingDataUrls[pendingImageIndex] ?? ''}
                        onProcessed={(url) => handlePreprocessed(pendingImageIndex, url)}
                        onSplitPages={handleSplitPages}
                        onReset={() => handlePreprocessReset(pendingImageIndex)}
                        sidePanel
                        totalImages={processedImages.length}
                        onApplyAll={handlePreprocessAll}
                        perspectiveActive={perspectiveActive}
                        onPerspectiveToggle={handlePerspectiveToggle}
                        perspectiveCorners={perspectiveCorners}
                        onPerspectiveCornersChange={setPerspectiveCorners}
                      />
                    </Suspense>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== ローディング画面 ===== */}
        {(isLoadingFiles || isModelLoading) && (
          <div className="processing-section">
            <div className="processing-bluepond-title">
              <span className="processing-bluepond-main">Ultra <span className="bluepond-blue">Blue</span>pond</span>
              <span className="processing-bluepond-sub">NDL(Kotenseki)OCR-lite Web AI</span>
              <span className="processing-bluepond-desc">国立国会図書館の縦書きに強い自動書き起こし日本語OCRソフト機能拡張版</span>
            </div>
            {isLoadingFiles && fileLoadingState && (
              <div className="file-loading-status">
                <div className="file-loading-spinner" />
                <span className="file-loading-message">
                  {fileLoadingState.currentPage != null && fileLoadingState.totalPages != null
                    ? L(lang, {
                        ja: `${fileLoadingState.fileName} をレンダリング中... (${fileLoadingState.currentPage} / ${fileLoadingState.totalPages} ページ)`,
                        en: `Rendering ${fileLoadingState.fileName}... (page ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        'zh-CN': `正在渲染 ${fileLoadingState.fileName}... (${fileLoadingState.currentPage} / ${fileLoadingState.totalPages} 页)`,
                        'zh-TW': `正在轉譯 ${fileLoadingState.fileName}... (${fileLoadingState.currentPage} / ${fileLoadingState.totalPages} 頁)`,
                        ko: `${fileLoadingState.fileName} 렌더링 중... (${fileLoadingState.currentPage} / ${fileLoadingState.totalPages} 페이지)`,
                        la: `Reddens ${fileLoadingState.fileName}... (${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        eo: `Bildas ${fileLoadingState.fileName}... (paĝo ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        es: `Renderizando ${fileLoadingState.fileName}... (página ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        de: `Rendere ${fileLoadingState.fileName}... (Seite ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        ar: `جارٍ عرض ${fileLoadingState.fileName}... (صفحة ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        hi: `${fileLoadingState.fileName} रेंडर हो रहा है... (पृष्ठ ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        ru: `Рендеринг ${fileLoadingState.fileName}... (стр. ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        el: `Απόδοση ${fileLoadingState.fileName}... (σελ. ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`,
                        syc: `ܡܣܪܛ ${fileLoadingState.fileName}... (${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`
                      })
                    : L(lang, {
                        ja: `${fileLoadingState.fileName} を読み込み中...`,
                        en: `Loading ${fileLoadingState.fileName}...`,
                        'zh-CN': `正在加载 ${fileLoadingState.fileName}...`,
                        'zh-TW': `正在載入 ${fileLoadingState.fileName}...`,
                        ko: `${fileLoadingState.fileName} 로드 중...`,
                        la: `Legens ${fileLoadingState.fileName}...`,
                        eo: `Ŝarĝas ${fileLoadingState.fileName}...`,
                        es: `Cargando ${fileLoadingState.fileName}...`,
                        de: `Lade ${fileLoadingState.fileName}...`,
                        ar: `جارٍ تحميل ${fileLoadingState.fileName}...`,
                        hi: `${fileLoadingState.fileName} लोड हो रहा है...`,
                        ru: `Загрузка ${fileLoadingState.fileName}...`,
                        el: `Φόρτωση ${fileLoadingState.fileName}...`,
                        syc: `ܛܥܢ ${fileLoadingState.fileName}...`
                      })}
                </span>
              </div>
            )}
            <ProgressBar jobState={jobState} lang={lang} />
            {!isReady && !isModelLoading && (
              <p className="model-loading-note">
                {L(lang, {
                  ja: '初回起動時はモデルのダウンロードに時間がかかります（数分程度）。次回以降はキャッシュから高速起動します。',
                  en: 'First run requires model download (may take a few minutes). Subsequent runs will use the cached model.',
                  'zh-CN': '首次启动需要下载模型（可能需要几分钟）。之后将使用缓存模型快速启动。',
                  'zh-TW': '首次啟動需要下載模型（可能需要幾分鐘）。之後將使用快取模型快速啟動。',
                  ko: '첫 실행 시 모델 다운로드가 필요합니다(몇 분 소요). 이후에는 캐시된 모델로 빠르게 시작합니다.',
                  la: 'Primo usu exemplaria descarganda sunt (paucas minutas). Postea ex memoria celeri incipiet.',
                  eo: 'Unua uzo postulas modelŝarĝon (kelkaj minutoj). Sekvaj uzoj uzos la kaŝmemorigitan modelon.',
                es: 'La primera ejecución requiere descargar el modelo (puede tardar unos minutos). Las siguientes ejecuciones usarán el modelo en caché.',
                de: 'Beim ersten Start wird das Modell heruntergeladen (kann einige Minuten dauern). Nachfolgende Starts verwenden das zwischengespeicherte Modell.',
                ar: 'يتطلب التشغيل الأول تنزيل النموذج (قد يستغرق بضع دقائق). ستستخدم عمليات التشغيل اللاحقة النموذج المخزن.',
                hi: 'पहले रन में मॉडल डाउनलोड करना होगा (कुछ मिनट लग सकते हैं)। बाद के रन कैश्ड मॉडल का उपयोग करेंगे।',
                ru: 'При первом запуске требуется загрузка модели (может занять несколько минут). Последующие запуски будут использовать кэшированную модель.',
                el: 'Το πρώτο τρέξιμο απαιτεί λήψη μοντέλου (μπορεί να διαρκέσει μερικά λεπτά). Τα επόμενα τρεξίματα θα χρησιμοποιούν το μοντέλο στην κρυφή μνήμη.',
                syc: 'ܩܛܢܐ ܚܕܬܐ ܢܬܠܚܡ ܡܢܦܘܩܐ ܕܢܡܘܣܐ (ܡܢܦܘܩܐ ܩܠܝܠܐ). ܩܛܢܐ ܒܬܪܐ ܬܫܬܡܫ ܠܠܘ̈ܚܐ ܕܪܡܐ.'
                })}
              </p>
            )}
          </div>
        )}

        {/* ===== 結果表示（SplitView） ===== */}
        {(hasResults || (isProcessing && processedImages.length > 0)) && (
          <section className="result-section result-section-split">
            {/* メインコンテンツ: SplitView */}
            <div className="result-content">
              {/* 処理中プログレス */}
              {isProcessing && (
                <div className="result-progress-inline">
                  <ProgressBar jobState={jobState} lang={lang} />
                  <button className="btn btn-stop" onClick={handleStopProcessing} title={L(lang, { ja: '処理を中止', en: 'Stop', 'zh-CN': '停止', 'zh-TW': '停止', ko: '중지', la: 'Sistere', eo: 'Halti', es: 'Detener', de: 'Stopp', ar: 'إيقاف', hi: 'रोकें', ru: 'Стоп', el: 'Διακοπή', syc: 'ܟܠܝ' })}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="3" y="3" width="10" height="10" rx="1.5" />
                    </svg>
                    {L(lang, { ja: '中止', en: 'Stop', 'zh-CN': '停止', 'zh-TW': '停止', ko: '중지', la: 'Sistere', eo: 'Halti', es: 'Detener', de: 'Stopp', ar: 'إيقاف', hi: 'रोकें', ru: 'Стоп', el: 'Διακοπή', syc: 'ܟܠܝ' })}
                  </button>
                </div>
              )}

              {/* ページナビ + 新規処理ボタン */}
              <div className="result-toolbar">
                {renderPageNav(selectedResultIndex, setSelectedResultIndex, sessionResults.length, sessionResults.length - 1, true)}
                {!isProcessing && !readingOrderEditMode && (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setReadingOrderEditMode(true)}
                      title={L(lang, {
                        ja: '読み順を手動で編集',
                        en: 'Edit reading order',
                        'zh-CN': '编辑阅读顺序',
                        'zh-TW': '編輯閱讀順序',
                        ko: '읽기 순서 편집',
                        la: 'Ordinem legendi mutare',
                        eo: 'Redakti legordon',
                        es: 'Editar orden de lectura',
                        de: 'Lesereihenfolge bearbeiten',
                        ar: 'تحرير ترتيب القراءة',
                        hi: 'पढ़ने का क्रम संपादित करें',
                        ru: 'Редактировать порядок чтения',
                        el: 'Επεξεργασία σειράς ανάγνωσης',
                        syc: 'ܫܠܦ ܣܕܪ ܩܪܝܢܐ',
                      })}
                    >
                      {L(lang, {
                        ja: '読み順編集',
                        en: 'Edit Reading Order',
                        'zh-CN': '编辑读序',
                        'zh-TW': '編輯讀序',
                        ko: '읽기 순서',
                        la: 'Ordo legendi',
                        eo: 'Legordo',
                        es: 'Orden',
                        de: 'Reihenfolge',
                        ar: 'الترتيب',
                        hi: 'क्रम',
                        ru: 'Порядок',
                        el: 'Σειρά',
                        syc: 'ܣܕܪ',
                      })}
                    </button>
                    <button className="btn btn-secondary btn-new-file" onClick={handleClear}>
                      {L(lang, { ja: '新しいファイルを処理', en: 'Process New Files', 'zh-CN': '处理新文件', 'zh-TW': '處理新檔案', ko: '새 파일 처리', la: 'Fasciculos novos tractare', eo: 'Prilabori novajn dosierojn', es: 'Procesar nuevos archivos', de: 'Neue Dateien verarbeiten', ar: 'معالجة ملفات جديدة', hi: 'नई फ़ाइलें प्रोसेस करें', ru: 'Обработать новые файлы', el: 'Επεξεργασία νέων αρχείων', syc: 'ܦܠܘܚ ܩ̈ܛܝܡܐ ܚܕ̈ܬܐ' })}
                    </button>
                    <button className="btn btn-secondary btn-bug-report-inline" onClick={() => setShowBugReport(true)}>
                      {L(lang, { ja: 'バグ報告・要望', en: 'Bug Report', 'zh-CN': '反馈', 'zh-TW': '回饋', ko: '버그 보고', la: 'Nuntia', eo: 'Raporti', es: 'Reportar', de: 'Melden', ar: 'إبلاغ', hi: 'रिपोर्ट', ru: 'Отчёт', el: 'Αναφορά', syc: 'ܡܘܕܥܢܘܬ', cop: 'ⲙⲉⲧⲙⲉⲑⲣⲉ', sa: 'निवेदनम्' })}
                    </button>
                  </>
                )}
              </div>

              {/* 左右分割ビュー */}
              <SplitView
                lang={lang}
                left={
                  <div className="split-image-panel">
                    {currentResult && (
                      <>
                        <div className="image-with-preprocess">
                          <div className="image-with-preprocess-main">
                            <ImageViewer
                              imageDataUrl={preprocessedUrls[selectedResultIndex + 10000] ?? currentResult.imageDataUrl}
                              textBlocks={preprocessedUrls[selectedResultIndex + 10000] ? [] : currentResult.textBlocks}
                              selectedBlock={preprocessedUrls[selectedResultIndex + 10000] ? null : selectedBlock}
                              onBlockSelect={(block) => { setSelectedBlock(block); setSelectedPageBlock(null) }}
                              onRegionSelect={handleRegionSelect}
                              selectedRegion={selectedRegion}
                              pageBlocks={preprocessedUrls[selectedResultIndex + 10000] ? undefined : currentResult.pageBlocks}
                              selectedPageBlock={preprocessedUrls[selectedResultIndex + 10000] ? null : selectedPageBlock}
                              onPageBlockSelect={(block) => { setSelectedPageBlock(block); setSelectedBlock(null) }}
                              pageIndex={selectedResultIndex}
                              totalPages={sessionResults.length}
                              perspectiveMode={perspectiveActive}
                              perspectiveCorners={perspectiveCorners}
                              onPerspectiveCornersChange={setPerspectiveCorners}
                              showAdjustButton
                              adjustActive={showPreprocessPanel}
                              onAdjustToggle={() => setShowPreprocessPanel(!showPreprocessPanel)}
                              adjustLabel={L(lang, { ja: '画像補正', en: 'Adjust', 'zh-CN': '图像校正', 'zh-TW': '影像校正', ko: '이미지 보정', la: 'Imaginem corrigere', eo: 'Korekti bildon', es: 'Ajustar', de: 'Anpassen', ar: 'ضبط', hi: 'समायोजन', ru: 'Коррекция', el: 'Ρύθμιση', syc: 'ܬܘܪܨ' })}
                              lang={lang}
                              readingOrderEditMode={readingOrderEditMode}
                              onReadingOrderCancel={() => setReadingOrderEditMode(false)}
                              onReadingOrderChange={handleReadingOrderChange}
                            />
                            {preprocessedUrls[selectedResultIndex + 10000] && (
                              <div className="region-action-bar" style={{ flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                <p className="region-select-hint" style={{ color: 'var(--color-warning, #e67700)', fontWeight: 500, margin: 0, textAlign: 'center' }}>
                                  {L(lang, {
                                    ja: '画像補正済み — ページ全体を再OCRするか、領域を選択して再認識してください',
                                    en: 'Image adjusted — re-OCR the full page or select a region to re-recognize',
                                    'zh-CN': '图像已校正 — 重新OCR整页或选择区域重新识别',
                                    'zh-TW': '影像已校正 — 重新OCR整頁或選取區域重新辨識',
                                    ko: '이미지 보정됨 — 전체 페이지를 재OCR하거나 영역을 선택하여 재인식하세요',
                                  })}
                                </p>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={handleReOCRPage}
                                  disabled={isReOCRing}
                                >
                                  {isReOCRing
                                    ? L(lang, { ja: '再OCR中…', en: 'Re-OCR in progress…', 'zh-CN': '重新OCR中…', 'zh-TW': '重新OCR中…', ko: '재OCR 중…', la: 'Re-OCR in cursu…', eo: 'Re-OCR progesas…', es: 'Re-OCR en curso…', de: 'Re-OCR läuft…', ar: '…إعادة OCR جارية', hi: 'पुनः OCR चल रहा है…', ru: 'Повторное OCR…', el: 'Επανάληψη OCR…', syc: '…OCR ܡܢ ܕܪܝܫ' })
                                    : L(lang, { ja: 'ページを再OCR', en: 'Re-OCR Page', 'zh-CN': '重新OCR此页', 'zh-TW': '重新OCR此頁', ko: '페이지 재OCR', la: 'Paginam re-OCR', eo: 'Re-OCR paĝon', es: 'Re-OCR página', de: 'Seite erneut OCR', ar: 'إعادة OCR للصفحة', hi: 'पृष्ठ पुनः OCR', ru: 'Повторное OCR страницы', el: 'Επανάληψη OCR σελίδας', syc: 'OCR ܕܦܐ ܡܢ ܕܪܝܫ' })
                                  }
                                </button>
                              </div>
                            )}
                            {selectedRegion && (
                              <div className="region-action-bar">
                                <button className="btn btn-primary btn-sm" onClick={() => setIsReadyToProcess(true)}>
                                  {L(lang, { ja: '選択領域のOCRを開始', en: 'OCR Selected Region', 'zh-CN': '对选定区域执行OCR', 'zh-TW': '對選取區域執行OCR', ko: '선택 영역 OCR 실행', la: 'OCR regionis selectae', eo: 'OCR de elektita regiono', es: 'OCR de región seleccionada', de: 'OCR des ausgewählten Bereichs', ar: 'OCR للمنطقة المحددة', hi: 'चयنित क्षेत्र का OCR', ru: 'OCR выделенной области', el: 'OCR επιλεγμένης περιοχής', syc: 'OCR ܕܐܬܪ ܓܒܝܐ' })}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={handleClearRegion}>
                                  {L(lang, { ja: '選択解除', en: 'Clear Selection', 'zh-CN': '取消选择', 'zh-TW': '取消選取', ko: '선택 해제', la: 'Selectionem delere', eo: 'Malselekti', es: 'Borrar selección', de: 'Auswahl aufheben', ar: 'إلغاء التحديد', hi: 'चयन साफ़ करें', ru: 'Снять выделение', el: 'Εκκαθάριση επιλογής', syc: 'ܫܪܝ ܓܒܝܬܐ' })}
                                </button>
                              </div>
                            )}
                            <p className="region-select-hint">
                              {L(lang, {
                                ja: 'マウスで領域をドラッグして選択し、「選択領域のOCRを開始」で再認識できます',
                                en: 'Drag to select a region, then click "OCR Selected Region" to re-recognize',
                                'zh-CN': '拖动鼠标选择区域，然后点击"对选定区域执行OCR"重新识别',
                                'zh-TW': '拖曳滑鼠選取區域，然後點擊「對選取區域執行OCR」重新辨識',
                                ko: '마우스로 영역을 드래그하여 선택하고 "선택 영역 OCR 실행"으로 재인식합니다',
                                la: 'Trahe murem ad regionem seligendam, deinde "OCR regionis selectae" preme',
                                eo: 'Trenu por elekti regionon, poste alklaku "OCR de elektita regiono" por rerekoni',
                                es: 'Arrastra para seleccionar una región, luego haz clic en "OCR de región seleccionada"',
                                de: 'Ziehen Sie, um einen Bereich auszuwählen, dann klicken Sie auf "OCR des ausgewählten Bereichs"',
                                ar: 'اسحب لتحديد منطقة، ثم انقر على "OCR للمنطقة المحددة" لإعادة التعرف',
                                hi: 'क्षेत्र चुनने के लिए खींचें, फिर "चयनित क्षेत्र का OCR" पर क्लिक करें',
                                ru: 'Перетащите мышь для выбора области, затем нажмите «OCR выделенной области» для переопознания',
                                el: 'Σύρετε για να επιλέξετε μια περιοχή, μετά κάντε κλικ στο «OCR επιλεγμένης περιοχής» για επανα-αναγνώριση',
                                syc: 'ܓܪܘܪ ܠܓܒܝ ܐܬܪ، ܘܕܘܨ «OCR ܕܐܬܪ ܓܒܝܐ» ܠܡܓܒܝܬܐ ܓܒܝܬܐ'
                              })}
                            </p>
                          </div>
                          {showPreprocessPanel && (
                            <Suspense fallback={null}>
                              <ImagePreprocessPanel
                                lang={lang}
                                imageDataUrl={preprocessedUrls[selectedResultIndex + 10000] ?? currentResult.imageDataUrl}
                                onProcessed={(url) => handlePreprocessed(selectedResultIndex + 10000, url)}
                                onReset={() => handlePreprocessReset(selectedResultIndex + 10000)}
                                sidePanel
                                totalImages={sessionResults.length}
                                perspectiveActive={perspectiveActive}
                                onPerspectiveToggle={handlePerspectiveToggle}
                                perspectiveCorners={perspectiveCorners}
                                onPerspectiveCornersChange={setPerspectiveCorners}
                              />
                            </Suspense>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                }
                right={
                  <TextEditor
                    result={currentResult}
                    allResults={sessionResults}
                    selectedBlock={selectedBlock}
                    selectedPageBlockText={selectedPageBlockText}
                    lang={lang}
                    aiConnector={getConnector()}
                    aiConnectionStatus={aiConnectionStatus}
                    imageDataUrl={currentResult?.imageDataUrl}
                    onBatchProofread={handleBatchProofread}
                  />
                }
              />
            </div>
          </section>
        )}
        {/* FAB - mobile upload button */}
        {sessionResults.length > 0 && (
          <button
            className="fab"
            onClick={() => {
              // Trigger the same upload flow
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = 'image/jpeg,image/png,image/tiff,image/heic,image/heif,.tif,.tiff,.heic,.heif,application/pdf'
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files
                if (files && files.length > 0) {
                  handleFilesSelected(Array.from(files).filter(f =>
                    f.type === 'application/pdf' || f.type.startsWith('image/') ||
                    ['tif', 'tiff', 'heic', 'heif'].includes(f.name.toLowerCase().split('.').pop() ?? '')
                  ))
                }
              }
              input.click()
            }}
            title={L(lang, {
              ja: '新しいファイルをアップロード', en: 'Upload new files',
              'zh-CN': '上传新文件', 'zh-TW': '上傳新檔案',
              ko: '새 파일 업로드', la: 'Fasciculos novos imponere',
              eo: 'Alŝuti novajn dosierojn', es: 'Subir nuevos archivos',
              de: 'Neue Dateien hochladen', ar: 'رفع ملفات جديدة', hi: 'नई फ़ाइलें अपलोड करें',
              ru: 'Загрузить новые файлы', el: 'Ανέβασμα νέων αρχείων', syc: 'ܡܫܠܓ ܩܛܝܡܐ ܚܕ̈ܬܐ'
            })}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </main>

      <BottomToolbar
        lang={lang}
        onUpload={handleClear}
        ocrTimeMs={currentResult?.processingTimeMs}
        hasResults={hasResults}
      />

      <Footer lang={lang} />

      <Suspense fallback={null}>
        {showHistory && (
          <HistoryPanel
            runs={historyRuns}
            onSelect={handleHistorySelect}
            onClear={clearResults}
            onClose={() => setShowHistory(false)}
            lang={lang}
          />
        )}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            lang={lang}
            aiSettings={aiSettings}
            onUpdateAISettings={updateAISettings}
            onSwitchProvider={switchProvider}
            connectionStatus={aiConnectionStatus}
            onTestConnection={testAndConnect}
          />
        )}
        {showHelp && (
          <HelpPage
            lang={lang}
            onClose={() => setShowHelp(false)}
          />
        )}
        {showAIConnectHelp && (
          <AIConnectHelp
            lang={lang}
            onClose={() => setShowAIConnectHelp(false)}
            onOpenSettings={() => { setShowAIConnectHelp(false); setShowSettings(true) }}
          />
        )}
        {showBugReport && (
          <BugReportModal
            lang={lang}
            onClose={() => setShowBugReport(false)}
          />
        )}
      </Suspense>
      <Analytics />
      <SpeedInsights />
    </div>
  )
}
