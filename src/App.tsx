import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import type { OCRResult, TextBlock, BoundingBox, PageBlock } from './types/ocr'
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
import { ProgressBar } from './components/progress/ProgressBar'
import { ImageViewer } from './components/viewer/ImageViewer'
import { TextEditor } from './components/editor/TextEditor'
import { imageDataToDataUrl } from './utils/imageLoader'
import './App.css'

// Lazy-loaded modals & heavy panels (not needed at initial render)
const ImagePreprocessPanel = lazy(() => import('./components/viewer/ImagePreprocessPanel').then(m => ({ default: m.ImagePreprocessPanel })))
const HistoryPanel = lazy(() => import('./components/results/HistoryPanel').then(m => ({ default: m.HistoryPanel })))
const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then(m => ({ default: m.SettingsModal })))
const HelpPage = lazy(() => import('./components/help/HelpPage').then(m => ({ default: m.HelpPage })))
const AIConnectHelp = lazy(() => import('./components/help/AIConnectHelp').then(m => ({ default: m.AIConnectHelp })))

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
        <div className="splash-title">Model BLUEPOND</div>
        <div className="splash-subtitle">NDLOCR-lite Web AI</div>
        <div className="splash-description">国立国会図書館の日本語自動書き起こしソフトを使いやすくしたもの</div>
        <div className="splash-line" />
      </div>
    </div>
  )
}

export default function App() {
  const { lang, toggleLanguage } = useI18n()
  const [showSplash, setShowSplash] = useState(true)
  const handleSplashDone = useCallback(() => setShowSplash(false), [])
  const { isReady, jobState, processImage, processRegion, resetState } = useOCRWorker()
  const { processedImages, isLoading: isLoadingFiles, processFiles, clearImages, fileLoadingState } = useFileProcessor()
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

  const handlePreprocessed = useCallback((index: number, dataUrl: string) => {
    setPreprocessedUrls(prev => ({ ...prev, [index]: dataUrl }))
  }, [])

  const handlePreprocessReset = useCallback((index: number) => {
    setPreprocessedUrls(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }, [])

  // pending 状態での ImageViewer 表示用（全解像度 DataUrl）
  const pendingDataUrls = useMemo(
    () => processedImages.map((img) => imageDataToDataUrl(img.imageData)),
    [processedImages]
  )

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

  const handleSampleLoad = useCallback(async () => {
    const res = await fetch('/kumonoito.png')
    const blob = await res.blob()
    const file = new File([blob], 'kumonoito.png', { type: 'image/png' })
    await processFiles([file])
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
      const successItems: Array<{ result: OCRResult; thumbnailDataUrl: string }> = []
      const sessionResultsAccum: OCRResult[] = []

      for (let i = 0; i < processedImages.length; i++) {
        if (cancelRef.current) break
        const image = processedImages[i]
        try {
          const result = await processImage(image, i, processedImages.length)
          successItems.push({ result, thumbnailDataUrl: image.thumbnailDataUrl })
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
          files: successItems.map(({ result, thumbnailDataUrl }) => {
            // 元画像サイズを取得（ブロック座標のスケーリング基準）
            const img = new Image()
            img.src = result.imageDataUrl
            return {
              fileName: result.fileName,
              imageDataUrl: thumbnailDataUrl,
              textBlocks: result.textBlocks,
              fullText: result.fullText,
              processingTimeMs: result.processingTimeMs,
              originalWidth: img.naturalWidth || img.width || 0,
              originalHeight: img.naturalHeight || img.height || 0,
            }
          }),
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
      hi: 'वर्तमान OCR परिणाम हटा दिए जाएँगे। जारी रखें?'
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
          title={L(lang, { ja: '前のファイル', en: 'Previous', 'zh-CN': '上一个', 'zh-TW': '上一個', ko: '이전', la: 'Prior', eo: 'Antaŭa', es: 'Anterior', de: 'Zurück', ar: 'السابق', hi: 'पिछला' })}
        >‹</button>
        <div className="page-numbers">
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`btn-page-num${p === index ? ' btn-page-active' : ''}`}
                onClick={() => goTo(p)}
                disabled={p > maxIndex}
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
          title={L(lang, { ja: '次のファイル', en: 'Next', 'zh-CN': '下一个', 'zh-TW': '下一個', ko: '다음', la: 'Proximus', eo: 'Sekva', es: 'Siguiente', de: 'Weiter', ar: 'التالي', hi: 'अगला' })}
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
      />

      <main className="main">
        {/* ===== アップロード画面 ===== */}
        {!hasResults && !isWorking && !isModelLoading && !hasPendingImages && (
          <section className="upload-section">
            <div className="landing-title">
              <h1 className="landing-title-main">Model BLUEPOND</h1>
              <p className="landing-title-sub">NDLOCR-lite Web AI</p>
              <p className="landing-title-desc">{L(lang, {
                ja: '国立国会図書館の日本語自動書き起こしソフトを使いやすくしたもの',
                en: 'A user-friendly adaptation of the National Diet Library\'s Japanese automatic transcription software',
                'zh-CN': '基于日本国立国会图书馆日语自动转录软件的易用版本',
                'zh-TW': '基於日本國立國會圖書館日語自動轉錄軟體的易用版本',
                ko: '일본 국립국회도서관의 일본어 자동 전사 소프트웨어를 사용하기 쉽게 개선한 것',
                la: 'Instrumentum transcriptionis Iaponicae automaticae Bibliothecae Diaetae Nationalis facilius redditum',
                eo: 'Pli facile uzebla versio de la aŭtomata japana transskriba programo de la Nacia Dieta Biblioteko',
                es: 'Una versión más accesible del software de transcripción automática japonesa de la Biblioteca Nacional de la Dieta',
                de: 'Eine benutzerfreundliche Anpassung der automatischen japanischen Transkriptionssoftware der Nationalen Parlamentsbibliothek',
                ar: 'نسخة سهلة الاستخدام من برنامج النسخ التلقائي الياباني لمكتبة البرلمان الوطني',
                hi: 'राष्ट्रीय डाइट पुस्तकालय के जापानी स्वचालित प्रतिलेखन सॉफ़्टवेयर का उपयोग में आसान संस्करण'
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
                {L(lang, { ja: 'クリップボードから貼り付け', en: 'Paste from Clipboard', 'zh-CN': '从剪贴板粘贴', 'zh-TW': '從剪貼簿貼上', ko: '클립보드에서 붙여넣기', la: 'Glutinare ex tabulā', eo: 'Alglui el tondujo', es: 'Pegar desde portapapeles', de: 'Aus Zwischenablage einfügen', ar: 'لصق من الحافظة', hi: 'क्लिपबोर्ड से पेस्ट करें' })}
              </button>
              <button className="btn btn-secondary" onClick={handleSampleLoad} disabled={isWorking}>
                {L(lang, { ja: 'サンプルを試す', en: 'Try Sample', 'zh-CN': '试用示例', 'zh-TW': '試用範例', ko: '샘플 사용해보기', la: 'Exemplum temptare', eo: 'Provi ekzemplon', es: 'Probar ejemplo', de: 'Beispiel ausprobieren', ar: 'تجربة عينة', hi: 'नमूना आज़माएँ' })}
              </button>
            </div>
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
              hi: 'पृष्ठभूमि: ब्लू पॉन्ड, बिएई — MaedaAkihiko, CC BY-SA 4.0'
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
                      ? L(lang, { ja: '選択領域のOCRを開始', en: 'OCR Selected Region', 'zh-CN': '对选定区域执行OCR', 'zh-TW': '對選取區域執行OCR', ko: '선택 영역 OCR 실행', la: 'OCR regionis selectae', eo: 'OCR de elektita regiono', es: 'OCR de región seleccionada', de: 'OCR des ausgewählten Bereichs', ar: 'OCR للمنطقة المحددة', hi: 'चयनित क्षेत्र का OCR' })
                      : L(lang, { ja: 'OCRを開始', en: 'Start OCR', 'zh-CN': '开始OCR', 'zh-TW': '開始OCR', ko: 'OCR 시작', la: 'OCR incipere', eo: 'Komenci OCR', es: 'Iniciar OCR', de: 'OCR starten', ar: 'بدء OCR', hi: 'OCR शुरू करें' })}
                  </button>
                  {selectedRegion && (
                    <button className="btn btn-secondary" onClick={handleClearRegion}>
                      {L(lang, { ja: '選択解除', en: 'Clear Selection', 'zh-CN': '取消选择', 'zh-TW': '取消選取', ko: '선택 해제', la: 'Selectionem delere', eo: 'Malselekti', es: 'Borrar selección', de: 'Auswahl aufheben', ar: 'إلغاء التحديد', hi: 'चयन साफ़ करें' })}
                    </button>
                  )}
                  <button
                    className={`btn btn-secondary btn-preprocess-toggle${showPreprocessPanel ? ' active' : ''}`}
                    onClick={() => setShowPreprocessPanel(!showPreprocessPanel)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="14.5 2 18 6 7.5 16.5 4 17 4.5 13.5 14.5 2" />
                    </svg>
                    {L(lang, { ja: '画像補正', en: 'Adjust', 'zh-CN': '图像校正', 'zh-TW': '影像校正', ko: '이미지 보정', la: 'Imaginem corrigere', eo: 'Korekti bildon', es: 'Ajustar', de: 'Anpassen', ar: 'ضبط', hi: 'समायोजन' })}
                  </button>
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
                        hi: 'क्षेत्र चुनने के लिए खींचें, फिर "OCR शुरू करें" पर क्लिक करें'
                      })}
                    </p>
                  </div>
                  {showPreprocessPanel && (
                    <Suspense fallback={null}>
                      <ImagePreprocessPanel
                        lang={lang}
                        imageDataUrl={pendingDataUrls[pendingImageIndex] ?? ''}
                        onProcessed={(url) => handlePreprocessed(pendingImageIndex, url)}
                        onReset={() => handlePreprocessReset(pendingImageIndex)}
                        sidePanel
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
              <span className="processing-bluepond-main">Model BLUEPOND</span>
              <span className="processing-bluepond-sub">NDLOCR-lite Web AI</span>
              <span className="processing-bluepond-desc">国立国会図書館の日本語自動書き起こしソフトを使いやすくしたもの</span>
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
                        hi: `${fileLoadingState.fileName} रेंडर हो रहा है... (पृष्ठ ${fileLoadingState.currentPage} / ${fileLoadingState.totalPages})`
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
                        hi: `${fileLoadingState.fileName} लोड हो रहा है...`
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
                hi: 'पहले रन में मॉडल डाउनलोड करना होगा (कुछ मिनट लग सकते हैं)। बाद के रन कैश्ड मॉडल का उपयोग करेंगे।'
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
                  <button className="btn btn-stop" onClick={handleStopProcessing} title={L(lang, { ja: '処理を中止', en: 'Stop', 'zh-CN': '停止', 'zh-TW': '停止', ko: '중지', la: 'Sistere', eo: 'Halti', es: 'Detener', de: 'Stopp', ar: 'إيقاف', hi: 'रोकें' })}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="3" y="3" width="10" height="10" rx="1.5" />
                    </svg>
                    {L(lang, { ja: '中止', en: 'Stop', 'zh-CN': '停止', 'zh-TW': '停止', ko: '중지', la: 'Sistere', eo: 'Halti', es: 'Detener', de: 'Stopp', ar: 'إيقاف', hi: 'रोकें' })}
                  </button>
                </div>
              )}

              {/* ページナビ + 新規処理ボタン */}
              <div className="result-toolbar">
                {renderPageNav(selectedResultIndex, setSelectedResultIndex, sessionResults.length, sessionResults.length - 1)}
                {!isProcessing && (
                  <button className="btn btn-secondary btn-new-file" onClick={handleClear}>
                    {L(lang, { ja: '新しいファイルを処理', en: 'Process New Files', 'zh-CN': '处理新文件', 'zh-TW': '處理新檔案', ko: '새 파일 처리', la: 'Fasciculos novos tractare', eo: 'Prilabori novajn dosierojn', es: 'Procesar nuevos archivos', de: 'Neue Dateien verarbeiten', ar: 'معالجة ملفات جديدة', hi: 'नई फ़ाइलें प्रोसेस करें' })}
                  </button>
                )}
              </div>

              {/* 左右分割ビュー */}
              <SplitView
                lang={lang}
                left={
                  <div className="split-image-panel">
                    {currentResult && (
                      <>
                        <div className="split-image-toolbar">
                          <button
                            className={`btn btn-secondary btn-sm btn-preprocess-toggle${showPreprocessPanel ? ' active' : ''}`}
                            onClick={() => setShowPreprocessPanel(!showPreprocessPanel)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="14.5 2 18 6 7.5 16.5 4 17 4.5 13.5 14.5 2" />
                            </svg>
                            {L(lang, { ja: '画像補正', en: 'Adjust', 'zh-CN': '图像校正', 'zh-TW': '影像校正', ko: '이미지 보정', la: 'Imaginem corrigere', eo: 'Korekti bildon', es: 'Ajustar', de: 'Anpassen', ar: 'ضبط', hi: 'समायोजन' })}
                          </button>
                        </div>
                        <div className="image-with-preprocess">
                          <div className="image-with-preprocess-main">
                            <ImageViewer
                              imageDataUrl={preprocessedUrls[selectedResultIndex + 10000] ?? currentResult.imageDataUrl}
                              textBlocks={currentResult.textBlocks}
                              selectedBlock={selectedBlock}
                              onBlockSelect={(block) => { setSelectedBlock(block); setSelectedPageBlock(null) }}
                              onRegionSelect={handleRegionSelect}
                              selectedRegion={selectedRegion}
                              pageBlocks={currentResult.pageBlocks}
                              selectedPageBlock={selectedPageBlock}
                              onPageBlockSelect={(block) => { setSelectedPageBlock(block); setSelectedBlock(null) }}
                              pageIndex={selectedResultIndex}
                              totalPages={sessionResults.length}
                            />
                            {selectedRegion && (
                              <div className="region-action-bar">
                                <button className="btn btn-primary btn-sm" onClick={() => setIsReadyToProcess(true)}>
                                  {L(lang, { ja: '選択領域のOCRを開始', en: 'OCR Selected Region', 'zh-CN': '对选定区域执行OCR', 'zh-TW': '對選取區域執行OCR', ko: '선택 영역 OCR 실행', la: 'OCR regionis selectae', eo: 'OCR de elektita regiono', es: 'OCR de región seleccionada', de: 'OCR des ausgewählten Bereichs', ar: 'OCR للمنطقة المحددة', hi: 'चयनित क्षेत्र का OCR' })}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={handleClearRegion}>
                                  {L(lang, { ja: '選択解除', en: 'Clear Selection', 'zh-CN': '取消选择', 'zh-TW': '取消選取', ko: '선택 해제', la: 'Selectionem delere', eo: 'Malselekti', es: 'Borrar selección', de: 'Auswahl aufheben', ar: 'إلغاء التحديد', hi: 'चयन साफ़ करें' })}
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
                                hi: 'क्षेत्र चुनने के लिए खींचें, फिर "चयनित क्षेत्र का OCR" पर क्लिक करें'
                              })}
                            </p>
                          </div>
                          {showPreprocessPanel && (
                            <Suspense fallback={null}>
                              <ImagePreprocessPanel
                                lang={lang}
                                imageDataUrl={currentResult.imageDataUrl}
                                onProcessed={(url) => handlePreprocessed(selectedResultIndex + 10000, url)}
                                onReset={() => handlePreprocessReset(selectedResultIndex + 10000)}
                                sidePanel
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
              de: 'Neue Dateien hochladen', ar: 'رفع ملفات جديدة', hi: 'नई फ़ाइलें अपलोड करें'
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
      </Suspense>
    </div>
  )
}
