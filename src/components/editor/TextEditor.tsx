import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import type { OCRResult, TextBlock, TEIMetadata } from '../../types/ocr'
import type { AIConnector } from '../../types/ai'
import type { AIConnectionStatus } from '../../hooks/useAISettings'
import { downloadText, copyToClipboard, triggerBlobDownload } from '../../utils/textExport'
import { downloadTEI, downloadBatchTEI } from '../../utils/exportTEI'
import { downloadHOCR, downloadBatchHOCR } from '../../utils/exportHOCR'
import { downloadPDF, downloadBatchPDF } from '../../utils/exportPDF'
import { downloadDOCX } from '../../utils/exportDOCX'
import { DiffView } from './DiffView'
import type { Language } from '../../i18n'
import { L } from '../../i18n'

const TEIMetadataModal = lazy(() => import('../settings/TEIMetadataModal').then(m => ({ default: m.TEIMetadataModal })))

interface TextEditorProps {
  result: OCRResult | null
  allResults?: OCRResult[]
  selectedBlock: TextBlock | null
  selectedPageBlockText: string | null
  lang: Language
  onTextChange?: (text: string) => void
  aiConnector: AIConnector | null
  aiConnectionStatus?: AIConnectionStatus
  imageDataUrl?: string
  onBatchProofread?: (results: Map<number, string>) => void
}

type ProofreadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; originalText: string; correctedText: string }
  | { status: 'error'; message: string }

type BatchProofreadState =
  | { status: 'idle' }
  | { status: 'loading'; current: number; total: number; message?: string }
  | { status: 'done'; results: Map<number, { original: string; corrected: string }>; message?: string }
  | { status: 'error'; message: string }

interface SearchMatch {
  start: number
  end: number
}

interface UndoRedoEntry {
  text: string
  cursorPos?: number
}

export function TextEditor({
  result,
  allResults = [],
  selectedBlock,
  selectedPageBlockText,
  lang,
  onTextChange,
  aiConnector,
  aiConnectionStatus = 'disconnected',
  imageDataUrl,
  onBatchProofread,
}: TextEditorProps) {
  const [editedText, setEditedText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [includeFileName, setIncludeFileName] = useState(false)
  const [ignoreNewlines, setIgnoreNewlines] = useState(false)
  const [proofreadState, setProofreadState] = useState<ProofreadState>({ status: 'idle' })
  const [batchProofreadState, setBatchProofreadState] = useState<BatchProofreadState>({ status: 'idle' })
  const [fontSize, setFontSize] = useState(14)
  const [lineSpacing, setLineSpacing] = useState(1.9)
  const [fontFamily, setFontFamily] = useState<string>('serif')
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [isVertical, setIsVertical] = useState(false)
  const [verticalAutoDetected, setVerticalAutoDetected] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [undoStack, setUndoStack] = useState<UndoRedoEntry[]>([])
  const [redoStack, setRedoStack] = useState<UndoRedoEntry[]>([])
  const [saved, setSaved] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(null)
  const [computedLineHeight, setComputedLineHeight] = useState<number>(0)
  const [showTEIMetadataModal, setShowTEIMetadataModal] = useState(false)
  const [teiMetadataMode, setTeiMetadataMode] = useState<'single' | 'batch'>('single')
  const [lastTEIMetadata, setLastTEIMetadata] = useState<TEIMetadata | undefined>(undefined)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // editedText が null なら result.fullText を使う
  const displayText = editedText ?? result?.fullText ?? ''

  // Determine if we should show diff view
  const shouldShowDiff = proofreadState.status === 'done'

  // OCR結果のテキストブロック形状から縦書き/横書きを自動判定
  // テキストブロックの過半数が縦長 (height > width * 1.3) なら縦書きと判定
  useEffect(() => {
    if (!result?.textBlocks || result.textBlocks.length === 0) return
    // 手動で切り替え済みなら自動判定しない（同じ result.id に対して1回だけ）
    const blocks = result.textBlocks
    let vertCount = 0
    for (const b of blocks) {
      if (b.height > b.width * 1.3) vertCount++
    }
    const shouldBeVertical = vertCount > blocks.length * 0.5
    if (shouldBeVertical !== verticalAutoDetected || !verticalAutoDetected) {
      setIsVertical(shouldBeVertical)
      setVerticalAutoDetected(shouldBeVertical)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.id])

  // テキストエリアの実際の lineHeight を計測して行番号と同期する
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    const style = window.getComputedStyle(ta)
    const lh = parseFloat(style.lineHeight)
    if (!isNaN(lh) && lh > 0) {
      setComputedLineHeight(lh)
    } else {
      // fallback: fontSize × line-height ratio
      setComputedLineHeight(fontSize * lineSpacing)
    }
  }, [fontSize, lineSpacing, isVertical])

  // Auto-fit: テキストの最長行に合わせてフォントサイズを自動拡大
  const handleAutoFitFont = useCallback(() => {
    const ta = textareaRef.current
    if (!ta || !displayText) return
    const lines = displayText.split('\n').filter(l => l.length > 0)
    if (lines.length === 0) return

    const style = window.getComputedStyle(ta)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const refSize = fontSize
    const families = style.fontFamily
    ctx.font = `${refSize}px ${families}`

    if (isVertical) {
      // 縦書き: コンテナの高さに対して最長行（文字数）をフィット
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      const availableHeight = ta.clientHeight - padding
      if (availableHeight <= 0) return
      // 縦書きの1行の高さ ≈ 文字数 × fontSize（lineSpacing含む）
      const maxChars = Math.max(...lines.map(l => l.length))
      const currentLineH = maxChars * refSize * lineSpacing
      if (currentLineH <= 0) return
      const scale = availableHeight / currentLineH
      const newSize = Math.min(48, Math.max(10, Math.floor(refSize * scale)))
      setFontSize(newSize)
    } else {
      // 横書き: コンテナの幅に対して最長行の文字幅をフィット
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      const availableWidth = ta.clientWidth - padding
      if (availableWidth <= 0) return
      let maxWidth = 0
      for (const line of lines) {
        const w = ctx.measureText(line).width
        if (w > maxWidth) maxWidth = w
      }
      if (maxWidth <= 0) return
      const scale = availableWidth / maxWidth
      const newSize = Math.min(48, Math.max(10, Math.floor(refSize * scale)))
      setFontSize(newSize)
    }
  }, [displayText, fontSize, lineSpacing, isVertical])

  // Search matches calculation
  const searchMatches = useMemo<SearchMatch[]>(() => {
    if (!searchQuery || shouldShowDiff) return []
    const query = searchQuery
    const matches: SearchMatch[] = []
    let index = 0
    const text = displayText
    while ((index = text.indexOf(query, index)) !== -1) {
      matches.push({ start: index, end: index + query.length })
      index += 1
    }
    return matches
  }, [searchQuery, displayText, shouldShowDiff])

  // Line numbers — count newlines without creating a temporary array
  const lineCount = useMemo(() => {
    let count = 1
    for (let i = 0; i < displayText.length; i++) {
      if (displayText.charCodeAt(i) === 10) count++
    }
    return count
  }, [displayText])

  // Character count
  const charCount = displayText.length

  const prevDisplayTextRef = useRef(displayText)
  prevDisplayTextRef.current = displayText

  // Debounced undo: batch rapid keystrokes into one undo entry (500ms idle)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUndoRef = useRef<string | null>(null)

  const flushUndo = useCallback(() => {
    if (pendingUndoRef.current !== null) {
      const text = pendingUndoRef.current
      setUndoStack(prev => [...prev, { text, cursorPos: textareaRef.current?.selectionStart }])
      pendingUndoRef.current = null
    }
  }, [])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value
      const currentText = prevDisplayTextRef.current

      if (currentText !== newText) {
        // Only record the first snapshot of a burst of keystrokes
        if (pendingUndoRef.current === null) {
          pendingUndoRef.current = currentText
        }
        // Reset the timer on each keystroke; flush after 500ms idle
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        undoTimerRef.current = setTimeout(flushUndo, 500)

        setRedoStack([])
        setSaved(false)
      }

      setEditedText(newText)
      onTextChange?.(newText)
    },
    [onTextChange, flushUndo],
  )

  // Scroll sync for line numbers
  const handleTextareaScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      if (isVertical) {
        // 縦書きモード: 横スクロール同期
        gutterRef.current.scrollLeft = textareaRef.current.scrollLeft
      } else {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop
      }
    }
  }, [isVertical])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier && e.key === 'f') {
        e.preventDefault()
        setShowSearchBar(!showSearchBar)
      } else if (modifier && e.key === 's') {
        e.preventDefault()
        setShowExportMenu(prev => !prev)
      } else if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((modifier && e.shiftKey && e.key === 'z') || (modifier && e.shiftKey && e.key === 'Z')) {
        e.preventDefault()
        handleRedo()
      } else if (e.key === 'Escape' && showSearchBar) {
        setShowSearchBar(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearchBar, displayText, undoStack, redoStack]) // eslint-disable-line react-hooks/exhaustive-deps

  // result が変わったら編集状態・校正状態をリセット
  const [prevResultId, setPrevResultId] = useState<string | null>(null)
  if (result && result.id !== prevResultId) {
    setPrevResultId(result.id)
    setEditedText(null)
    setProofreadState({ status: 'idle' })
    setBatchProofreadState({ status: 'idle' })
    setUndoStack([])
    setRedoStack([])
    setSaved(true)
  }

  // ブロック選択時のハイライト＆中央スクロール
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta || !displayText) return

    // 選択されたテキストを取得
    let targetText: string | null = null
    if (selectedPageBlockText != null) {
      targetText = selectedPageBlockText
    } else if (selectedBlock) {
      targetText = selectedBlock.text
    }

    if (!targetText || !targetText.trim()) {
      setHighlightRange(null)
      return
    }

    // displayText 内でターゲットテキストの位置を探す
    let start = displayText.indexOf(targetText)
    if (start === -1) {
      const firstLine = targetText.split('\n')[0].trim()
      if (firstLine) {
        start = displayText.indexOf(firstLine)
      }
    }

    if (start === -1) {
      setHighlightRange(null)
      return
    }

    const end = start + targetText.length

    // ハイライト範囲を設定
    setHighlightRange({ start, end })

    // モバイル判定（SplitView のモバイルモードと同じ閾値）
    const isMobile = window.innerWidth <= 768

    if (isMobile) {
      // モバイル: readOnly を一時的に設定してキーボード表示を防ぐ
      const wasReadOnly = ta.readOnly
      ta.readOnly = true
      ta.focus({ preventScroll: true })
      ta.setSelectionRange(start, end)
      // readOnly を元に戻す（次のユーザー入力に備えて）
      setTimeout(() => { ta.readOnly = wasReadOnly }, 150)

      // エディタペイン（モバイルでは上部）にスムーズスクロール
      const editorPane = ta.closest('.split-pane-mobile-top')
      if (editorPane) {
        editorPane.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // デスクトップ: 通常通りフォーカス＆選択
      ta.focus()
      ta.setSelectionRange(start, end)
    }

    // 対象箇所がビューポート中央に来るようスクロール
    // テキストの行番号を計算し、その行が中央に来るようにする
    const textBefore = displayText.slice(0, start)
    const lineIndex = textBefore.split('\n').length - 1
    const computedStyle = window.getComputedStyle(ta)
    const lineHeight = parseFloat(computedStyle.lineHeight) || (parseFloat(computedStyle.fontSize) * 1.9)

    if (isVertical) {
      // 縦書き: 横スクロールで中央に寄せる
      // 行は右→左に並ぶので、scrollLeft を調整
      const colOffset = lineIndex * lineHeight
      const targetScrollLeft = ta.scrollWidth - colOffset - ta.clientWidth / 2
      ta.scrollLeft = Math.max(0, targetScrollLeft)
    } else {
      // 横書き: 縦スクロールで中央に寄せる
      const targetY = lineIndex * lineHeight
      const centerOffset = ta.clientHeight / 2
      ta.scrollTop = Math.max(0, targetY - centerOffset)
    }

    // 自動消去タイマー
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightRange(null)
    }, 4000)

    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [selectedBlock, selectedPageBlockText]) // eslint-disable-line react-hooks/exhaustive-deps

  // 検索マッチへのスクロール＆ハイライト
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta || searchMatches.length === 0) return

    const match = searchMatches[currentMatchIndex]
    if (!match) return

    // テキストエリアにフォーカスして選択範囲を設定
    ta.focus()
    ta.setSelectionRange(match.start, match.end)

    // 対象箇所がビューポート中央に来るようスクロール
    const textBefore = displayText.slice(0, match.start)
    const lineIndex = textBefore.split('\n').length - 1
    const computedStyle = window.getComputedStyle(ta)
    const lineHeight = parseFloat(computedStyle.lineHeight) || (parseFloat(computedStyle.fontSize) * 1.9)

    if (isVertical) {
      const colOffset = lineIndex * lineHeight
      const targetScrollLeft = ta.scrollWidth - colOffset - ta.clientWidth / 2
      ta.scrollLeft = Math.max(0, targetScrollLeft)
    } else {
      const targetY = lineIndex * lineHeight
      const centerOffset = ta.clientHeight / 2
      ta.scrollTop = Math.max(0, targetY - centerOffset)
    }
  }, [currentMatchIndex, searchMatches, displayText, isVertical])

  const applyOptions = (text: string) =>
    ignoreNewlines ? text.replace(/\n/g, '') : text

  const handleCopy = async () => {
    const text = applyOptions(displayText)
    try {
      await copyToClipboard(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleUndo = useCallback(() => {
    // Flush any pending debounced undo entry first
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null }
    flushUndo()

    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const newStack = [...prev]
      const prevEntry = newStack.pop()!

      // 現在のテキストを redo に保存
      const currentText = textareaRef.current?.value ?? ''
      setRedoStack(r => [...r, { text: currentText, cursorPos: textareaRef.current?.selectionStart }])
      setEditedText(prevEntry.text)
      onTextChange?.(prevEntry.text)
      setSaved(false)

      setTimeout(() => {
        if (textareaRef.current && prevEntry.cursorPos !== undefined) {
          textareaRef.current.selectionStart = prevEntry.cursorPos
          textareaRef.current.selectionEnd = prevEntry.cursorPos
        }
      }, 0)

      return newStack
    })
  }, [onTextChange, flushUndo])

  const handleRedo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const newStack = [...prev]
      const nextEntry = newStack.pop()!

      const currentText = textareaRef.current?.value ?? ''
      setUndoStack(u => [...u, { text: currentText, cursorPos: textareaRef.current?.selectionStart }])
      setEditedText(nextEntry.text)
      onTextChange?.(nextEntry.text)
      setSaved(false)

      setTimeout(() => {
        if (textareaRef.current && nextEntry.cursorPos !== undefined) {
          textareaRef.current.selectionStart = nextEntry.cursorPos
          textareaRef.current.selectionEnd = nextEntry.cursorPos
        }
      }, 0)

      return newStack
    })
  }, [onTextChange])

  // テキスト変換ヘルパー（undo stack に保存してから変換を適用）
  const applyTextTransform = useCallback((transform: (text: string) => string) => {
    const currentText = textareaRef.current?.value ?? displayText
    const newText = transform(currentText)
    if (newText === currentText) return
    setUndoStack(prev => [...prev, { text: currentText, cursorPos: textareaRef.current?.selectionStart }])
    setRedoStack([])
    setEditedText(newText)
    onTextChange?.(newText)
    setSaved(false)
  }, [displayText, onTextChange])

  const handleRemoveEmptyLines = useCallback(() => {
    applyTextTransform(text =>
      text.split('\n').filter(line => line.trim().length > 0).join('\n')
    )
  }, [applyTextTransform])

  const handleJoinLines = useCallback(() => {
    applyTextTransform(text =>
      text.split('\n').map(line => line.trim()).filter(line => line.length > 0).join(' ')
    )
  }, [applyTextTransform])

  const handleRestoreNewlines = useCallback(() => {
    // スペース区切りの結合テキストを、句読点・段落構造を手がかりに改行を復元
    // 簡易的に実装：直前の undo 操作（元に戻す）で対応
    handleUndo()
  }, [handleUndo])

  // Export menu: close on click outside (mousedown + touchstart for mobile)
  useEffect(() => {
    if (!showExportMenu) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showExportMenu])

  const handleExport = useCallback((format: 'txt' | 'tei' | 'hocr' | 'pdf' | 'docx') => {
    if (!result) return
    setShowExportMenu(false)
    const text = applyOptions(editedText ?? result.fullText)
    if (format === 'txt') {
      downloadText(
        includeFileName ? `=== ${result.fileName} ===\n${text}` : text,
        result.fileName,
      )
    } else if (format === 'tei') {
      setTeiMetadataMode('single')
      setShowTEIMetadataModal(true)
    } else if (format === 'hocr') {
      downloadHOCR(result)
    } else if (format === 'pdf') {
      downloadPDF(result, imageDataUrl)
    } else if (format === 'docx') {
      downloadDOCX(result, { includeFileName, ignoreNewlines })
    }
    setSaved(true)
  }, [result, editedText, imageDataUrl, includeFileName, ignoreNewlines]) // eslint-disable-line react-hooks/exhaustive-deps

  // TEI Metadata Modal handlers
  const handleTEIMetadataSave = useCallback((metadata: TEIMetadata) => {
    setLastTEIMetadata(metadata)
    setShowTEIMetadataModal(false)

    if (teiMetadataMode === 'single' && result) {
      downloadTEI(result, metadata)
    } else if (teiMetadataMode === 'batch' && allResults.length > 0) {
      downloadBatchTEI(allResults, metadata)
    }
  }, [result, allResults, teiMetadataMode])

  // 全ページ一括エクスポート
  const handleBatchExport = useCallback((format: 'txt' | 'tei' | 'hocr' | 'pdf' | 'docx') => {
    if (allResults.length === 0) return
    setShowExportMenu(false)
    if (format === 'txt') {
      const combined = allResults.map((r, i) => {
        const text = r.fullText
        return includeFileName
          ? `=== [${i + 1}] ${r.fileName} ===\n${ignoreNewlines ? text.replace(/\n/g, '') : text}`
          : (ignoreNewlines ? text.replace(/\n/g, '') : text)
      }).join('\n\n')
      const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      triggerBlobDownload(url, 'ocr_all_pages.txt')
    } else if (format === 'tei') {
      setTeiMetadataMode('batch')
      setShowTEIMetadataModal(true)
    } else if (format === 'hocr') {
      downloadBatchHOCR(allResults)
    } else if (format === 'pdf') {
      downloadBatchPDF(allResults)
    } else if (format === 'docx') {
      const combined: OCRResult = {
        id: 'batch',
        fileName: 'all_pages',
        imageDataUrl: '',
        textBlocks: allResults.flatMap(r => r.textBlocks),
        fullText: allResults.map((r, i) => {
          const header = includeFileName ? `=== [${i + 1}] ${r.fileName} ===\n` : ''
          return header + r.fullText
        }).join('\n\n'),
        processingTimeMs: 0,
        createdAt: Date.now(),
      }
      downloadDOCX(combined, { includeFileName: false, ignoreNewlines })
    }
    setSaved(true)
  }, [allResults, includeFileName, ignoreNewlines])

  // AI校正実行
  const handleProofread = useCallback(async () => {
    if (!aiConnector || !result) return

    // AI未接続（接続テスト未実施）の場合、警告を表示
    if (aiConnectionStatus !== 'connected') {
      const msg = L(lang, {
        ja: 'AI接続が確認されていません。設定画面で接続テストを実行してください。続行しますか？',
        en: 'AI connection has not been verified. Please run a connection test in Settings. Continue anyway?',
        'zh-CN': 'AI连接未验证。请在设置中运行连接测试。是否继续？',
        'zh-TW': 'AI連接未驗證。請在設定中執行連接測試。是否繼續？',
        ko: 'AI 연결이 확인되지 않았습니다. 설정에서 연결 테스트를 실행하십시오. 계속 진행하시겠습니까?',
        la: 'Connexio AI non verificata est. Testem connexionis in Apparatibus praecipe. Pergere tamen?',
        eo: 'AI-konekto ne estas verifikita. Bonvolu ruli ligpruvon en Agordoj. Ĉu daŭrigi?',
      es: 'La conexión AI no ha sido verificada. Ejecute una prueba de conexión en Configuración. ¿Continuar de todos modos?',
      de: 'Die KI-Verbindung wurde nicht überprüft. Bitte führen Sie einen Verbindungstest in den Einstellungen durch. Trotzdem fortfahren?',
      ar: 'لم يتم التحقق من اتصال AI. يرجى إجراء اختبار الاتصال في الإعدادات. هل تريد المتابعة على أي حال؟',
      hi: 'AI कनेक्शन सत्यापित नहीं हुआ है। कृपया सेटिंग्स में कनेक्शन टेस्ट चलाएँ। फिर भी जारी रखें?',
      ru: 'AI-подключение не проверено. Выполните тест подключения в настройках. Продолжить?',
      el: 'Η σύνδεση AI δεν έχει επαληθευτεί. Εκτελέστε δοκιμή σύνδεσης στις Ρυθμίσεις. Συνέχεια;',
      syc: 'ܩܛܝܪܘܬ AI ܠܐ ܐܬܫܪܪܬ. ܦܪܘܣ ܒܘ̈ܚܢ ܩܛܝܪ̈ܬܐ ܒܛܘ̈ܟܣܐ. ܬܫܪ؟'
      })
      if (!window.confirm(msg)) return
    }

    const textToProofread = editedText ?? result.fullText
    setProofreadState({ status: 'loading' })
    try {
      const proofResult = await aiConnector.proofread(textToProofread, imageDataUrl ?? '')
      setProofreadState({
        status: 'done',
        originalText: textToProofread,
        correctedText: proofResult.correctedText,
      })
    } catch (err) {
      setProofreadState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }, [aiConnector, aiConnectionStatus, lang, result, editedText, imageDataUrl])

  // 校正結果を全て適用
  const handleAcceptAll = useCallback(() => {
    if (proofreadState.status !== 'done') return
    setEditedText(proofreadState.correctedText)
    onTextChange?.(proofreadState.correctedText)
    setProofreadState({ status: 'idle' })
  }, [proofreadState, onTextChange])

  // 校正結果を全て却下
  const handleRejectAll = useCallback(() => {
    setProofreadState({ status: 'idle' })
  }, [])

  // バッチAI校正実行
  const handleBatchProofread = useCallback(async () => {
    if (!aiConnector || allResults.length <= 1) return

    // AI未接続（接続テスト未実施）の場合、警告を表示
    if (aiConnectionStatus !== 'connected') {
      const msg = L(lang, {
        ja: 'AI接続が確認されていません。設定画面で接続テストを実行してください。続行しますか？',
        en: 'AI connection has not been verified. Please run a connection test in Settings. Continue anyway?',
        'zh-CN': 'AI连接未验证。请在设置中运行连接测试。是否继续？',
        'zh-TW': 'AI連接未驗證。請在設定中執行連接測試。是否繼續？',
        ko: 'AI 연결이 확인되지 않았습니다. 설정에서 연결 테스트를 실행하십시오. 계속 진행하시겠습니까?',
        la: 'Connexio AI non verificata est. Testem connexionis in Apparatibus praecipe. Pergere tamen?',
        eo: 'AI-konekto ne estas verifikita. Bonvolu ruli ligpruvon en Agordoj. Ĉu daŭrigi?',
        es: 'La conexión AI no ha sido verificada. Ejecute una prueba de conexión en Configuración. ¿Continuar de todos modos?',
        de: 'Die KI-Verbindung wurde nicht überprüft. Bitte führen Sie einen Verbindungstest in den Einstellungen durch. Trotzdem fortfahren?',
        ar: 'لم يتم التحقق من اتصال AI. يرجى إجراء اختبار الاتصال في الإعدادات. هل تريد المتابعة على أي حال؟',
        hi: 'AI कनेक्शन सत्यापित नहीं हुआ है। कृपया सेटिंग्स में कनेक्शन टेस्ट चलाएँ। फिर भी जारी रखें?',
        ru: 'AI-подключение не проверено. Выполните тест подключения в настройках. Продолжить?',
        el: 'Η σύνδεση AI δεν έχει επαληθευτεί. Εκτελέστε δοκιμή σύνδεσης στις Ρυθμίσεις. Συνέχεια;',
        syc: 'ܩܛܝܪܘܬ AI ܠܐ ܐܬܫܪܪܬ. ܦܪܘܣ ܒܘ̈ܚܢ ܩܛܝܪ̈ܬܐ ܒܛܘ̈ܟܣܐ. ܬܫܪ؟'
      })
      if (!window.confirm(msg)) return
    }

    const confirmMsg = L(lang, {
      ja: `全${allResults.length}ページのAI校正を実行します。よろしいですか？`,
      en: `Run AI proofreading for all ${allResults.length} pages. Continue?`,
      'zh-CN': `对全部${allResults.length}页执行AI校正。是否继续？`,
      'zh-TW': `對全部${allResults.length}頁執行AI校正。是否繼續？`,
      ko: `전체 ${allResults.length}페이지에 대해 AI 교정을 실행합니다. 계속하시겠습니까?`,
      la: `AI correctionem in omnibus ${allResults.length} paginis exsequi vis?`,
      eo: `Ruli AI-korektadon por ĉiuj ${allResults.length} paĝoj. Ĉu daŭrigi?`,
      es: `Ejecutar corrección AI para todas las ${allResults.length} páginas. ¿Continuar?`,
      de: `KI-Korrektur für alle ${allResults.length} Seiten durchführen. Fortfahren?`,
      ar: `تشغيل تصحيح AI لجميع ${allResults.length} صفحة. هل تريد المتابعة؟`,
      hi: `सभी ${allResults.length} पृष्ठों के लिए AI प्रूफ़रीडिंग चलाएँ। जारी रखें?`,
      ru: `Запустить корректуру AI для всех ${allResults.length} стр. Продолжить?`,
      el: `Εκτέλεση διόρθωσης AI για όλες τις ${allResults.length} σελίδες. Συνέχεια;`,
      syc: `ܪܨ AI ܠܟܠ ${allResults.length} ܕ̈ܦܐ. ܬܫܪ؟`
    })
    if (!window.confirm(confirmMsg)) return

    setBatchProofreadState({ status: 'loading', current: 0, total: allResults.length })

    const results = new Map<number, { original: string; corrected: string }>()

    try {
      for (let i = 0; i < allResults.length; i++) {
        const ocrResult = allResults[i]
        const progressMsg = L(lang, {
          ja: `${i + 1}/${allResults.length} ページを処理中...`,
          en: `Processing page ${i + 1}/${allResults.length}...`,
          'zh-CN': `正在处理第 ${i + 1}/${allResults.length} 页...`,
          'zh-TW': `正在處理第 ${i + 1}/${allResults.length} 頁...`,
          ko: `${i + 1}/${allResults.length} 페이지 처리 중...`,
          la: `Pagina ${i + 1}/${allResults.length} tractando...`,
          eo: `Prilaborado de paĝo ${i + 1}/${allResults.length}...`,
          es: `Procesando página ${i + 1}/${allResults.length}...`,
          de: `Seite ${i + 1}/${allResults.length} wird verarbeitet...`,
          ar: `جاري معالجة الصفحة ${i + 1}/${allResults.length}...`,
          hi: `पृष्ठ ${i + 1}/${allResults.length} को संसाधित किया जा रहा है...`,
          ru: `Обработка стр. ${i + 1}/${allResults.length}...`,
          el: `Επεξεργασία σελίδας ${i + 1}/${allResults.length}...`,
          syc: `ܦܠܚܢܐ ܕܦܦܐ ${i + 1}/${allResults.length}...`
        })
        setBatchProofreadState({ status: 'loading', current: i + 1, total: allResults.length, message: progressMsg })

        const proofResult = await aiConnector.proofread(ocrResult.fullText, ocrResult.imageDataUrl ?? '')
        results.set(i, {
          original: ocrResult.fullText,
          corrected: proofResult.correctedText,
        })

        // 控制速率，避免过度请求
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const successMsg = L(lang, {
        ja: `全${allResults.length}ページのAI校正が完了しました。`,
        en: `AI proofreading completed for all ${allResults.length} pages.`,
        'zh-CN': `全部${allResults.length}页的AI校正已完成。`,
        'zh-TW': `全部${allResults.length}頁的AI校正已完成。`,
        ko: `전체 ${allResults.length}페이지에 대한 AI 교정이 완료되었습니다.`,
        la: `Correctio AI in omnibus ${allResults.length} paginis consumpta est.`,
        eo: `AI-korektado por ĉiuj ${allResults.length} paĝoj estas kompleta.`,
        es: `Corrección AI completada para todas las ${allResults.length} páginas.`,
        de: `KI-Korrektur für alle ${allResults.length} Seiten abgeschlossen.`,
        ar: `اكتمل تصحيح AI لجميع ${allResults.length} صفحة.`,
        hi: `सभी ${allResults.length} पृष्ठों के लिए AI प्रूफ़रीडिंग पूरी हुई।`,
        ru: `Корректура AI для всех ${allResults.length} стр. завершена.`,
        el: `Η διόρθωση AI για όλες τις ${allResults.length} σελίδες ολοκληρώθηκε.`,
        syc: `ܬܘܪܨ AI ܠܟܠ ${allResults.length} ܕ̈ܦܐ ܫܠܡܐ.`
      })
      setBatchProofreadState({ status: 'done', results, message: successMsg })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setBatchProofreadState({
        status: 'error',
        message: errorMsg,
      })
    }
  }, [aiConnector, aiConnectionStatus, lang, allResults])

  // バッチ校正結果を全て適用
  const handleBatchAcceptAll = useCallback(() => {
    if (batchProofreadState.status !== 'done') return
    const correctedMap = new Map<number, string>()
    for (const [idx, data] of batchProofreadState.results.entries()) {
      correctedMap.set(idx, data.corrected)
    }
    onBatchProofread?.(correctedMap)
    setBatchProofreadState({ status: 'idle' })
  }, [batchProofreadState, onBatchProofread])

  // バッチ校正結果を却下
  const handleBatchRejectAll = useCallback(() => {
    setBatchProofreadState({ status: 'idle' })
  }, [])

  // Search and Replace handlers
  const handlePreviousMatch = useCallback(() => {
    if (searchMatches.length === 0) return
    setCurrentMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length)
  }, [searchMatches])

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return
    setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length)
  }, [searchMatches])

  const handleReplace = useCallback(() => {
    if (searchMatches.length === 0 || !textareaRef.current) return
    const match = searchMatches[currentMatchIndex]
    const before = displayText.slice(0, match.start)
    const after = displayText.slice(match.end)
    const newText = before + replaceQuery + after
    setEditedText(newText)
    onTextChange?.(newText)
  }, [searchMatches, currentMatchIndex, displayText, replaceQuery, onTextChange])

  const handleReplaceAll = useCallback(() => {
    if (searchMatches.length === 0) return
    let newText = displayText
    const offset = replaceQuery.length - searchQuery.length
    searchMatches.forEach((match, idx) => {
      const adjustedStart = match.start + offset * idx
      const adjustedEnd = adjustedStart + searchQuery.length
      newText = newText.slice(0, adjustedStart) + replaceQuery + newText.slice(adjustedEnd)
    })
    setEditedText(newText)
    onTextChange?.(newText)
    setCurrentMatchIndex(0)
  }, [searchMatches, displayText, searchQuery, replaceQuery, onTextChange])

  if (!result) {
    return (
      <div className="text-editor empty">
        <p>{L(lang, { ja: '結果なし', en: 'No results', 'zh-CN': '无结果', 'zh-TW': '無結果', ko: '결과 없음', la: 'Nulla eventus', eo: 'Neniuj rezultoj', es: 'Sin resultados', de: 'Keine Ergebnisse', ar: 'لا توجد نتائج', hi: 'कोई परिणाम नहीं', ru: 'Нет результатов', el: 'Χωρίς αποτελέσματα', syc: 'ܠܐ ܦܘܪܣ̈ܐ' })}</p>
      </div>
    )
  }

  return (
    <div className="text-editor">
      {/* ── Row 1: Title bar with AI proofread ── */}
      <div className="text-editor-header">
        <div className="text-editor-header-left">
          <span className="text-editor-label">
            {L(lang, { ja: 'OCR結果', en: 'OCR Result', 'zh-CN': 'OCR结果', 'zh-TW': 'OCR結果', ko: 'OCR 결과', la: 'Eventus OCR', eo: 'OCR-rezulto', es: 'Resultado OCR', de: 'OCR-Ergebnis', ar: 'نتيجة OCR', hi: 'OCR परिणाम', ru: 'Результат OCR', el: 'Αποτέλεσμα OCR', syc: 'ܦܘܪܣ OCR' })}
            {!saved && <span className="text-editor-unsaved-indicator" title={L(lang, { ja: '未保存', en: 'Unsaved', 'zh-CN': '未保存', 'zh-TW': '未保存', ko: '저장되지 않음', la: 'Asservatione carens', eo: 'Nekonservita', es: 'Sin guardar', de: 'Ungespeichert', ar: 'غير محفوظ', hi: 'असुरक्षित', ru: 'Не сохранено', el: 'Μη αποθηκευμένο', syc: 'ܠܐ ܐܬܢܛܪ' })} />}
          </span>
          <span className="text-editor-stats">
            {result.textBlocks.length}
            {L(lang, { ja: '領域', en: ' regions', 'zh-CN': ' 个区域', 'zh-TW': ' 個區域', ko: ' 영역', la: ' regiones', eo: ' regionoj', es: ' regiones', de: ' Bereiche', ar: ' مناطق', hi: ' क्षेत्र', ru: ' области', el: ' περιοχές', syc: ' ܛܝܒ̈ܬܐ' })}
            {' · '}
            {(result.processingTimeMs / 1000).toFixed(1)}s
          </span>
        </div>
        <div className="text-editor-header-buttons">
          <button
            className="btn btn-ai"
            onClick={handleProofread}
            disabled={!aiConnector || proofreadState.status === 'loading' || result.textBlocks.length === 0}
            title={!aiConnector ? L(lang, { ja: '設定でAI接続を構成してください', en: 'Configure AI connection in Settings', 'zh-CN': '在设置中配置 AI 连接', 'zh-TW': '在設定中設定 AI 連接', ko: '설정에서 AI 연결 구성', la: 'In Apparatibus connexionem AI configura', eo: 'Agordu AI-konekton en Agordoj', es: 'Configure la conexión AI en Configuración', de: 'KI-Verbindung in Einstellungen konfigurieren', ar: 'قم بتكوين اتصال AI في الإعدادات', hi: 'सेटिंग्स में AI कनेक्शन कॉन्फ़िगर करें', ru: 'Настройте подключение AI в настройках', el: 'Ρυθμίστε σύνδεση AI στις Ρυθμίσεις', syc: 'ܐܪܕ ܩܛܝܪܘܬ AI ܒܛܘ̈ܟܣܐ' }) : ''}
          >
            {proofreadState.status === 'loading' ? (
              <>
                <span className="btn-ai-spinner" />
                {L(lang, { ja: 'AI校正中...', en: 'Proofreading...', 'zh-CN': '正在进行AI校正...', 'zh-TW': '正在進行AI校正...', ko: 'AI 교정 중...', la: 'AI corrigens...', eo: 'AI-korektado en progreso...', es: 'Corrigiendo...', de: 'Korrektur läuft...', ar: 'جارٍ التصحيح...', hi: 'प्रूफ़रीडिंग...', ru: 'Корректура...', el: 'Διόρθωση...', syc: 'ܡܬܪܨ...' })}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2l2 6h6l-5 3.5 2 6.5L8 14l-5 4 2-6.5L0 8h6z" />
                </svg>
                {L(lang, { ja: 'AI校正', en: 'AI Proofread', 'zh-CN': 'AI校正', 'zh-TW': 'AI校正', ko: 'AI 교정', la: 'Correctio AI', eo: 'AI-korektado', es: 'Corrección AI', de: 'KI-Korrektur', ar: 'تصحيح AI', hi: 'AI प्रूफ़रीडिंग', ru: 'AI-корректура', el: 'Διόρθωση AI', syc: 'ܬܘܪܨ AI' })}
              </>
            )}
          </button>
          {allResults.length > 1 && (
            <button
              className="btn btn-ai"
              onClick={handleBatchProofread}
              disabled={!aiConnector || batchProofreadState.status === 'loading' || allResults.some(r => r.textBlocks.length === 0)}
              title={!aiConnector ? L(lang, { ja: '設定でAI接続を構成してください', en: 'Configure AI connection in Settings', 'zh-CN': '在设置中配置 AI 连接', 'zh-TW': '在設定中設定 AI 連接', ko: '설정에서 AI 연결 구성', la: 'In Apparatibus connexionem AI configura', eo: 'Agordu AI-konekton en Agordoj', es: 'Configure la conexión AI en Configuración', de: 'KI-Verbindung in Einstellungen konfigurieren', ar: 'قم بتكوين اتصال AI في الإعدادات', hi: 'सेटिंग्स में AI कनेक्शन कॉन्फ़िगर करें', ru: 'Настройте подключение AI в настройках', el: 'Ρυθμίστε σύνδεση AI στις Ρυθμίσεις', syc: 'ܐܪܕ ܩܛܝܪܘܬ AI ܒܛܘ̈ܟܣܐ' }) : ''}
              style={{ marginLeft: '6px' }}
            >
              {batchProofreadState.status === 'loading' ? (
                <>
                  <span className="btn-ai-spinner" />
                  {L(lang, { ja: `バッチ中... (${batchProofreadState.current}/${batchProofreadState.total})`, en: `Batch... (${batchProofreadState.current}/${batchProofreadState.total})`, 'zh-CN': `批处理中... (${batchProofreadState.current}/${batchProofreadState.total})`, 'zh-TW': `批處理中... (${batchProofreadState.current}/${batchProofreadState.total})`, ko: `배치 중... (${batchProofreadState.current}/${batchProofreadState.total})`, la: `Proletis... (${batchProofreadState.current}/${batchProofreadState.total})`, eo: `Aro... (${batchProofreadState.current}/${batchProofreadState.total})`, es: `Lote... (${batchProofreadState.current}/${batchProofreadState.total})`, de: `Stapel... (${batchProofreadState.current}/${batchProofreadState.total})`, ar: `الدفعة... (${batchProofreadState.current}/${batchProofreadState.total})`, hi: `बैच... (${batchProofreadState.current}/${batchProofreadState.total})`, ru: `Пакет... (${batchProofreadState.current}/${batchProofreadState.total})`, el: `Παρτίδα... (${batchProofreadState.current}/${batchProofreadState.total})`, syc: `ܟܘܡܐ... (${batchProofreadState.current}/${batchProofreadState.total})` })}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3h12v10H2zm1 1v8" />
                    <line x1="4" y1="3" x2="4" y2="13" />
                    <line x1="6" y1="3" x2="6" y2="13" />
                    <line x1="8" y1="3" x2="8" y2="13" />
                    <line x1="10" y1="3" x2="10" y2="13" />
                  </svg>
                  {L(lang, { ja: '全ページ校正', en: 'Batch Proofread', 'zh-CN': '全页校正', 'zh-TW': '全頁校正', ko: '배치 교정', la: 'Proletis Correctio', eo: 'Aro-Korektado', es: 'Corrección por lote', de: 'Stapel-Korrektur', ar: 'تصحيح دفعي', hi: 'बैच प्रूफ़रीडिंग', ru: 'Пакетная корректура', el: 'Διόρθωση Παρτίδας', syc: 'ܬܘܪܨ ܟܘܡܐ' })}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Row 2: Toolbar ── */}
      <div className="text-editor-toolbar" style={showExportMenu ? { overflow: 'visible' } : undefined}>
        {/* Left: edit tools */}
        <div className="text-editor-toolbar-group">
          <button
            className="btn btn-icon btn-sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title={L(lang, { ja: '戻す (Ctrl+Z)', en: 'Undo (Ctrl+Z)', 'zh-CN': '撤销 (Ctrl+Z)', 'zh-TW': '復原 (Ctrl+Z)', ko: '실행 취소 (Ctrl+Z)', la: 'Revocare (Ctrl+Z)', eo: 'Malfari (Ctrl+Z)', es: 'Deshacer (Ctrl+Z)', de: 'Rückgängig (Ctrl+Z)', ar: 'تراجع (Ctrl+Z)', hi: 'पूर्ववत (Ctrl+Z)', ru: 'Отменить (Ctrl+Z)', el: 'Αναίρεση (Ctrl+Z)', syc: 'ܐܗܦܟ (Ctrl+Z)' })}
            aria-label="Undo"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h6a3 3 0 0 1 0 6H8" />
              <polyline points="7 4 4 7 7 10" fill="none" />
            </svg>
          </button>
          <button
            className="btn btn-icon btn-sm"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title={L(lang, { ja: 'やり直す (Ctrl+Shift+Z)', en: 'Redo (Ctrl+Shift+Z)', 'zh-CN': '重做 (Ctrl+Shift+Z)', 'zh-TW': '重做 (Ctrl+Shift+Z)', ko: '다시 실행 (Ctrl+Shift+Z)', la: 'Reficere (Ctrl+Shift+Z)', eo: 'Refari (Ctrl+Shift+Z)', es: 'Rehacer (Ctrl+Shift+Z)', de: 'Wiederholen (Ctrl+Shift+Z)', ar: 'إعادة (Ctrl+Shift+Z)', hi: 'फिर से करें (Ctrl+Shift+Z)', ru: 'Повторить (Ctrl+Shift+Z)', el: 'Επανάληψη (Ctrl+Shift+Z)', syc: 'ܥܒܕ ܬܘܒ (Ctrl+Shift+Z)' })}
            aria-label="Redo"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 7H6a3 3 0 0 0 0 6h2" />
              <polyline points="9 4 12 7 9 10" fill="none" />
            </svg>
          </button>

          <span className="text-editor-toolbar-sep" />

          <button
            className="btn btn-icon btn-sm"
            onClick={() => setShowSearchBar(!showSearchBar)}
            title={L(lang, { ja: '検索と置換 (Ctrl+F)', en: 'Find & Replace (Ctrl+F)', 'zh-CN': '查找与替换 (Ctrl+F)', 'zh-TW': '尋找與取代 (Ctrl+F)', ko: '찾기 및 바꾸기 (Ctrl+F)', la: 'Quaerere et substituere (Ctrl+F)', eo: 'Serĉi kaj anstataŭigi (Ctrl+F)', es: 'Buscar y reemplazar (Ctrl+F)', de: 'Suchen & Ersetzen (Ctrl+F)', ar: 'بحث واستبدال (Ctrl+F)', hi: 'खोजें और बदलें (Ctrl+F)', ru: 'Поиск и замена (Ctrl+F)', el: 'Εύρεση και αντικατάσταση (Ctrl+F)', syc: 'ܒܨܝ ܘܚܠܦ (Ctrl+F)' })}
            aria-label="Search"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6.5" cy="6.5" r="4" />
              <path d="m10 10 4 4" />
            </svg>
          </button>

          <button
            className={`btn btn-icon btn-sm${showLineNumbers ? ' btn-icon-active' : ''}`}
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            title={L(lang, { ja: '行番号', en: 'Line numbers', 'zh-CN': '行号', 'zh-TW': '行號', ko: '행 번호', la: 'Numeri versuum', eo: 'Lininumeroj', es: 'Números de línea', de: 'Zeilennummern', ar: 'أرقام الأسطر', hi: 'पंक्ति संख्या', ru: 'Номера строк', el: 'Αριθμοί γραμμών', syc: 'ܡܢܝܢ̈ܐ ܕ̈ܣܛܪܐ' })}
            aria-label="Toggle line numbers"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <text x="0" y="5.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="700" fontFamily="sans-serif">1</text>
              <line x1="5" y1="3.5" x2="15" y2="3.5" />
              <text x="0" y="10.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="700" fontFamily="sans-serif">2</text>
              <line x1="5" y1="8.5" x2="15" y2="8.5" />
              <text x="0" y="15.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="700" fontFamily="sans-serif">3</text>
              <line x1="5" y1="13.5" x2="15" y2="13.5" />
            </svg>
          </button>

          <button
            className={`btn btn-sm btn-text-toggle${isVertical ? ' btn-text-toggle-active' : ''}`}
            onClick={() => setIsVertical(!isVertical)}
            title={isVertical
              ? L(lang, { ja: '横書きに切替', en: 'Switch to horizontal', 'zh-CN': '切换为横排', 'zh-TW': '切換為橫書', ko: '가로쓰기로 전환', la: 'Ad horizontalem mutare', eo: 'Ŝanĝi al horizontala', es: 'Cambiar a horizontal', de: 'Zu horizontal wechseln', ar: 'التبديل إلى أفقي', hi: 'क्षैतिज में बदलें', ru: 'Переключиться на горизонтальное', el: 'Μετάβαση σε οριζόντια', syc: 'ܫܢܐ ܠܓܘܪܒܐ' })
              : L(lang, { ja: '縦書きに切替', en: 'Switch to vertical', 'zh-CN': '切换为竖排', 'zh-TW': '切換為直書', ko: '세로쓰기로 전환', la: 'Ad verticalem mutare', eo: 'Ŝanĝi al vertikala', es: 'Cambiar a vertical', de: 'Zu vertikal wechseln', ar: 'التبديل إلى عمودي', hi: 'लंबवत में बदलें', ru: 'Переключиться на вертикальное', el: 'Μετάβαση σε κατακόρυφα', syc: 'ܫܢܐ ܠܩܘܦܐ' })
            }
            aria-label="Toggle vertical text"
            aria-pressed={isVertical}
          >
            {L(lang, { ja: '縦書き', en: 'Vertical', 'zh-CN': '竖排', 'zh-TW': '直書', ko: '세로쓰기', la: 'Verticalis', eo: 'Vertikala', es: 'Vertical', de: 'Vertikal', ar: 'عمودي', hi: 'लंबवत', ru: 'Вертикальный', el: 'Κατακόρυφα', syc: 'ܩܘܦܐ' })}
          </button>

          <span className="text-editor-toolbar-sep" />

          <button
            className="btn btn-sm btn-text-toggle"
            onClick={handleRemoveEmptyLines}
            title={L(lang, { ja: '空行を削除', en: 'Remove empty lines', 'zh-CN': '删除空行', 'zh-TW': '刪除空行', ko: '빈 줄 삭제', la: 'Versus vacuos delere', eo: 'Forigi malplenajn liniojn', es: 'Eliminar líneas vacías', de: 'Leerzeilen entfernen', ar: 'حذف الأسطر الفارغة', hi: 'खाली पंक्तियाँ हटाएँ', ru: 'Удалить пустые строки', el: 'Αφαίρεση κενών γραμμών', syc: 'ܚܕܐ ̈ܣܛܪ̈ܐ ܠܐ ܗܘܕ̈ܐ' })}
            aria-label="Remove empty lines"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '2px' }}>
              <line x1="2" y1="3" x2="14" y2="3" />
              <line x1="5" y1="8" x2="11" y2="8" strokeDasharray="2 2" opacity="0.4" />
              <path d="M7 7l2 2M9 7l-2 2" strokeWidth="1.2" />
              <line x1="2" y1="13" x2="14" y2="13" />
            </svg>
            {L(lang, { ja: '空行削除', en: 'Del blank', 'zh-CN': '删空行', 'zh-TW': '刪空行', ko: '빈줄삭제', la: 'Del. vac.', eo: 'For. malplen.', es: 'Borrar vacías', de: 'Leer lösch.', ar: 'حذف فارغ', hi: 'खाली हटाएँ', ru: 'Уд. пусто', el: 'Διαγр. κενό', syc: 'ܚܕ ܠܐ ܗܘܕ' })}
          </button>

          <button
            className="btn btn-sm btn-text-toggle"
            onClick={handleJoinLines}
            title={L(lang, { ja: '改行を削除して結合', en: 'Join lines', 'zh-CN': '合并行', 'zh-TW': '合併行', ko: '행 합치기', la: 'Versus coniungere', eo: 'Kunigi liniojn', es: 'Unir líneas', de: 'Zeilen verbinden', ar: 'دمج الأسطر', hi: 'पंक्तियाँ जोड़ें', ru: 'Объединить строки', el: 'Συγχώνευση γραμμών', syc: 'ܚܒܪ ̈ܣܛܪܐ' })}
            aria-label="Join lines"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '2px' }}>
              <line x1="2" y1="8" x2="14" y2="8" />
              <polyline points="5 5 2 8 5 11" fill="none" />
              <polyline points="11 5 14 8 11 11" fill="none" />
            </svg>
            {L(lang, { ja: '行結合', en: 'Join', 'zh-CN': '合并', 'zh-TW': '合併', ko: '합치기', la: 'Coniung.', eo: 'Kunigi', es: 'Unir', de: 'Verb.', ar: 'دمج', hi: 'जोड़ें', ru: 'Объедн.', el: 'Συγχώ.', syc: 'ܚܒܪ' })}
          </button>

          <button
            className="btn btn-sm btn-text-toggle"
            onClick={handleRestoreNewlines}
            disabled={undoStack.length === 0}
            title={L(lang, { ja: '直前の操作を元に戻す（改行の復元等）', en: 'Undo last operation (restore newlines, etc.)', 'zh-CN': '撤销上一次操作（恢复换行等）', 'zh-TW': '復原上次操作（恢復換行等）', ko: '마지막 작업 취소 (줄바꿈 복원 등)', la: 'Ultimam operationem revocare', eo: 'Malfari lastan operacion', es: 'Deshacer la última operación (restaurar saltos de línea, etc.)', de: 'Letzte Operation rückgängig machen (Zeilenumbrüche wiederherstellen usw.)', ar: 'التراجع عن العملية الأخيرة (استعادة فواصل الأسطر، إلخ)', hi: 'अंतिम क्रिया पूर्ववत करें (नई पंक्तियाँ पुनर्स्थापित करें, आदि)', ru: 'Отменить последнюю операцию (восстановить переносы строк и т.д.)', el: 'Αναίρεση τελευταίας ενέργειας (επαναφορά αλλαγών γραμμής, κ.ο.)', syc: 'ܐܗܦܟ ܦܥܠܬܐ ܐܚܪܝܬܐ (ܬܘܒ ܫ̈ܘܚܠܦ̈ܐ ܘܫܪܟܐ)' })}
            aria-label="Restore"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '2px' }}>
              <path d="M4 7h6a3 3 0 0 1 0 6H8" />
              <polyline points="7 4 4 7 7 10" fill="none" />
            </svg>
            {L(lang, { ja: '元に戻す', en: 'Undo', 'zh-CN': '撤销', 'zh-TW': '復原', ko: '실행 취소', la: 'Revocare', eo: 'Malfari', es: 'Deshacer', de: 'Rückgängig', ar: 'تراجع', hi: 'पूर्ववत', ru: 'Отменить', el: 'Αναίρεση', syc: 'ܐܗܦܟ' })}
          </button>
        </div>

        {/* Right: output actions */}
        <div className="text-editor-toolbar-group">
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '3px' }}>
              <rect x="5" y="5" width="9" height="9" rx="1" />
              <path d="M3 11V3a1 1 0 0 1 1-1h8" />
            </svg>
            {copied
              ? L(lang, { ja: 'OK!', en: 'OK!', 'zh-CN': '已复制！', 'zh-TW': '已複製！', ko: '복사됨!', la: 'Transcriptum!', eo: 'Kopiita!', es: '¡OK!', de: 'OK!', ar: 'تم!', hi: 'ठीक!', ru: 'OK!', el: 'OK!', syc: 'OK!' })
              : L(lang, { ja: 'コピー', en: 'Copy', 'zh-CN': '复制', 'zh-TW': '複製', ko: '복사', la: 'Transcribere', eo: 'Kopii', es: 'Copiar', de: 'Kopieren', ar: 'نسخ', hi: 'कॉपी', ru: 'Копировать', el: 'Αντιγραφή', syc: 'ܢܣܚ' })}
          </button>
          <div className="export-dropdown-wrapper" ref={exportMenuRef}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowExportMenu(!showExportMenu)} title="Ctrl+S">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '3px' }}>
                <path d="M2 2v12h12V5l-3-3H2z" />
                <path d="M5 2v4h5V2" />
                <rect x="4" y="9" width="8" height="5" rx="0.5" />
              </svg>
              {L(lang, { ja: '保存', en: 'Save', 'zh-CN': '保存', 'zh-TW': '儲存', ko: '저장', la: 'Servare', eo: 'Konservi', es: 'Guardar', de: 'Speichern', ar: 'حفظ', hi: 'सहेजें', ru: 'Сохранить', el: 'Αποθήκευση', syc: 'ܢܛܪ' })}
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '2px' }}>
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="export-dropdown-menu">
                <button className="export-dropdown-item" onClick={() => handleExport('txt')}>
                  <span className="export-dropdown-icon">TXT</span>
                  <span>{L(lang, { ja: 'プレーンテキスト (.txt)', en: 'Plain Text (.txt)', 'zh-CN': '纯文本 (.txt)', 'zh-TW': '純文字 (.txt)', ko: '일반 텍스트 (.txt)', la: 'Textus simplex (.txt)', eo: 'Simpla teksto (.txt)', es: 'Texto plano (.txt)', de: 'Klartext (.txt)', ar: 'نص عادي (.txt)', hi: 'सादا पाठ (.txt)', ru: 'Текстовый файл (.txt)', el: 'Απλό κείμενο (.txt)', syc: 'ܟܬܒ̈ܬ ܦܫ̈ܝܛܬܐ (.txt)' })}</span>
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('tei')}>
                  <span className="export-dropdown-icon">TEI</span>
                  <span>{L(lang, { ja: 'TEI XML (.xml)', en: 'TEI XML (.xml)', 'zh-CN': 'TEI XML (.xml)', 'zh-TW': 'TEI XML (.xml)', ko: 'TEI XML (.xml)', la: 'TEI XML (.xml)', eo: 'TEI XML (.xml)', es: 'TEI XML (.xml)', de: 'TEI XML (.xml)', ar: 'TEI XML (.xml)', hi: 'TEI XML (.xml)', ru: 'TEI XML (.xml)', el: 'TEI XML (.xml)', syc: 'TEI XML (.xml)' })}</span>
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('hocr')}>
                  <span className="export-dropdown-icon">hOCR</span>
                  <span>{L(lang, { ja: 'hOCR (.hocr)', en: 'hOCR (.hocr)', 'zh-CN': 'hOCR (.hocr)', 'zh-TW': 'hOCR (.hocr)', ko: 'hOCR (.hocr)', la: 'hOCR (.hocr)', eo: 'hOCR (.hocr)', es: 'hOCR (.hocr)', de: 'hOCR (.hocr)', ar: 'hOCR (.hocr)', hi: 'hOCR (.hocr)', ru: 'hOCR (.hocr)', el: 'hOCR (.hocr)', syc: 'hOCR (.hocr)' })}</span>
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('pdf')}>
                  <span className="export-dropdown-icon">PDF</span>
                  <span>{L(lang, { ja: 'テキスト付きPDF (.pdf)', en: 'Text-embedded PDF (.pdf)', 'zh-CN': '带文字图层的PDF (.pdf)', 'zh-TW': '含文字圖層的PDF (.pdf)', ko: '텍스트 오버레이 PDF (.pdf)', la: 'PDF cum textu (.pdf)', eo: 'PDF kun teksto (.pdf)', es: 'PDF con texto (.pdf)', de: 'PDF mit Text (.pdf)', ar: 'PDF مع نص (.pdf)', hi: 'टेक्स्ट-एम्बेडेड PDF (.pdf)', ru: 'PDF с текстом (.pdf)', el: 'PDF με κείμενο (.pdf)', syc: 'PDF ܥܡ ܟܬܒ̈ܬ (.pdf)' })}</span>
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('docx')}>
                  <span className="export-dropdown-icon">DOCX</span>
                  <span>{L(lang, { ja: 'Word文書 (.docx)', en: 'Word Document (.docx)', 'zh-CN': 'Word文档 (.docx)', 'zh-TW': 'Word文件 (.docx)', ko: 'Word 문서 (.docx)', la: 'Documentum Word (.docx)', eo: 'Word-dokumento (.docx)', es: 'Documento Word (.docx)', de: 'Word-Dokument (.docx)', ar: 'مستند Word (.docx)', hi: 'Word दस्तावेज़ (.docx)', ru: 'Документ Word (.docx)', el: 'Έγγραφο Word (.docx)', syc: 'ܟܬܒ Word (.docx)' })}</span>
                </button>
                {allResults.length > 1 && (
                  <>
                    <div className="export-dropdown-separator" />
                    <div className="export-dropdown-section-label">
                      {L(lang, { ja: `全${allResults.length}ページ一括`, en: `All ${allResults.length} pages`, 'zh-CN': `全部${allResults.length}页`, 'zh-TW': `全部${allResults.length}頁`, ko: `전체 ${allResults.length}페이지`, la: `Omnes ${allResults.length} paginae`, eo: `Ĉiuj ${allResults.length} paĝoj`, es: `Todas ${allResults.length} páginas`, de: `Alle ${allResults.length} Seiten`, ar: `جميع ${allResults.length} صفحات`, hi: `सभी ${allResults.length} पृष्ठ`, ru: `Все ${allResults.length} стр. целиком`, el: `Όλες ${allResults.length} σελίδες`, syc: `ܟܠ ${allResults.length} ܕ̈ܦܐ` })}
                    </div>
                    <button className="export-dropdown-item" onClick={() => handleBatchExport('txt')}>
                      <span className="export-dropdown-icon">TXT</span>
                      <span>{L(lang, { ja: '全ページ結合 (.txt)', en: 'All pages combined (.txt)', 'zh-CN': '全部页面合并 (.txt)', 'zh-TW': '全部頁面合併 (.txt)', ko: '전체 페이지 결합 (.txt)', la: 'Omnes paginae coniunctae (.txt)', eo: 'Ĉiuj paĝoj kunigitaj (.txt)', es: 'Todas las páginas combinadas (.txt)', de: 'Alle Seiten zusammen (.txt)', ar: 'جميع الصفحات مجتمعة (.txt)', hi: 'सभी पृष्ठ संयुक्त (.txt)', ru: 'Все страницы (.txt)', el: 'Όλες οι σελίδες (.txt)', syc: 'ܟܠ ܕ̈ܦܐ (.txt)' })}</span>
                    </button>
                    <button className="export-dropdown-item" onClick={() => handleBatchExport('tei')}>
                      <span className="export-dropdown-icon">TEI</span>
                      <span>{L(lang, { ja: '全ページ結合 (.xml)', en: 'All pages combined (.xml)', 'zh-CN': '全部页面合并 (.xml)', 'zh-TW': '全部頁面合併 (.xml)', ko: '전체 페이지 결합 (.xml)', la: 'Omnes paginae coniunctae (.xml)', eo: 'Ĉiuj paĝoj kunigitaj (.xml)', es: 'Todas las páginas combinadas (.xml)', de: 'Alle Seiten zusammen (.xml)', ar: 'جميع الصفحات مجتمعة (.xml)', hi: 'सभी पृष्ठ संयुक्त (.xml)', ru: 'Все страницы (.xml)', el: 'Όλες οι σελίδες (.xml)', syc: 'ܟܠ ܕ̈ܦܐ (.xml)' })}</span>
                    </button>
                    <button className="export-dropdown-item" onClick={() => handleBatchExport('hocr')}>
                      <span className="export-dropdown-icon">hOCR</span>
                      <span>{L(lang, { ja: '全ページ結合 (.hocr)', en: 'All pages combined (.hocr)', 'zh-CN': '全部页面合并 (.hocr)', 'zh-TW': '全部頁面合併 (.hocr)', ko: '전체 페이지 결합 (.hocr)', la: 'Omnes paginae coniunctae (.hocr)', eo: 'Ĉiuj paĝoj kunigitaj (.hocr)', es: 'Todas las páginas combinadas (.hocr)', de: 'Alle Seiten zusammen (.hocr)', ar: 'جميع الصفحات مجتمعة (.hocr)', hi: 'सभी पृष्ठ संयुक्त (.hocr)', ru: 'Все страницы (.hocr)', el: 'Όλες οι σελίδες (.hocr)', syc: 'ܟܠ ܕ̈ܦܐ (.hocr)' })}</span>
                    </button>
                    <button className="export-dropdown-item" onClick={() => handleBatchExport('pdf')}>
                      <span className="export-dropdown-icon">PDF</span>
                      <span>{L(lang, { ja: '全ページ結合 (.pdf)', en: 'All pages combined (.pdf)', 'zh-CN': '全部页面合并 (.pdf)', 'zh-TW': '全部頁面合併 (.pdf)', ko: '전체 페이지 결합 (.pdf)', la: 'Omnes paginae coniunctae (.pdf)', eo: 'Ĉiuj paĝoj kunigitaj (.pdf)', es: 'Todas las páginas combinadas (.pdf)', de: 'Alle Seiten zusammen (.pdf)', ar: 'جميع الصفحات مجتمعة (.pdf)', hi: 'सभी पृष्ठ संयुक्त (.pdf)', ru: 'Все страницы (.pdf)', el: 'Όλες οι σελίδες (.pdf)', syc: 'ܟܠ ܕ̈ܦܐ (.pdf)' })}</span>
                    </button>
                    <button className="export-dropdown-item" onClick={() => handleBatchExport('docx')}>
                      <span className="export-dropdown-icon">DOCX</span>
                      <span>{L(lang, { ja: '全ページ結合 (.docx)', en: 'All pages combined (.docx)', 'zh-CN': '全部页面合并 (.docx)', 'zh-TW': '全部頁面合併 (.docx)', ko: '전체 페이지 결합 (.docx)', la: 'Omnes paginae coniunctae (.docx)', eo: 'Ĉiuj paĝoj kunigitaj (.docx)', es: 'Todas las páginas combinadas (.docx)', de: 'Alle Seiten zusammen (.docx)', ar: 'جميع الصفحات مجتمعة (.docx)', hi: 'सभी पृष्ठ संयुक्त (.docx)', ru: 'Все страницы (.docx)', el: 'Όλες οι σελίδες (.docx)', syc: 'ܟܠ ܕ̈ܦܐ (.docx)' })}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Replace bar */}
      {showSearchBar && (
        <div className="text-editor-search-bar">
          <div className="text-editor-search-controls">
            <input
              type="text"
              className="text-editor-search-input"
              placeholder={L(lang, { ja: '検索...', en: 'Find...', 'zh-CN': '搜索...', 'zh-TW': '搜尋...', ko: '검색...', la: 'Quaerere...', eo: 'Serĉi...', es: 'Buscar...', de: 'Suchen...', ar: 'بحث...', hi: 'खोजें...', ru: 'Поиск...', el: 'Εύρεση...', syc: 'ܒܨܝ...' })}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentMatchIndex(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNextMatch()
                else if (e.key === 'Escape') setShowSearchBar(false)
              }}
              autoFocus
            />
            <span className="text-editor-search-count">
              {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : L(lang, { ja: '0件', en: '0', 'zh-CN': '0个', 'zh-TW': '0個', ko: '0개', la: '0', eo: '0', es: '0', de: '0', ar: '0', hi: '0', ru: '0', el: '0', syc: '0' })}
            </span>
            <button
              className="btn btn-sm btn-icon"
              onClick={handlePreviousMatch}
              disabled={searchMatches.length === 0}
              title={L(lang, { ja: '前へ', en: 'Previous', 'zh-CN': '上一个', 'zh-TW': '上一個', ko: '이전', la: 'Prior', eo: 'Antaŭa', es: 'Anterior', de: 'Vorherige', ar: 'السابق', hi: 'पिछला', ru: 'Предыдущий', el: 'Προηγούμενο', syc: 'ܟܕܡܐ' })}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12l-4-4 4-4" />
              </svg>
            </button>
            <button
              className="btn btn-sm btn-icon"
              onClick={handleNextMatch}
              disabled={searchMatches.length === 0}
              title={L(lang, { ja: '次へ', en: 'Next', 'zh-CN': '下一个', 'zh-TW': '下一個', ko: '다음', la: 'Sequens', eo: 'Sekvanta', es: 'Siguiente', de: 'Nächste', ar: 'التالي', hi: 'अगला', ru: 'Следующий', el: 'Επόμενο', syc: 'ܒܬܪܐ' })}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          </div>
          <div className="text-editor-replace-controls">
            <input
              type="text"
              className="text-editor-replace-input"
              placeholder={L(lang, { ja: '置換...', en: 'Replace...', 'zh-CN': '替换...', 'zh-TW': '取代...', ko: '바꾸기...', la: 'Substituere...', eo: 'Anstataŭigi...', es: 'Reemplazar...', de: 'Ersetzen...', ar: 'استبدال...', hi: 'बदलें...', ru: 'Замена:', el: 'Αντικατάσταση:', syc: 'ܚܠܦ:' })}
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleReplace()
                else if (e.key === 'Escape') setShowSearchBar(false)
              }}
            />
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleReplace}
              disabled={searchMatches.length === 0}
            >
              {L(lang, { ja: '置換', en: 'Replace', 'zh-CN': '替换', 'zh-TW': '取代', ko: '바꾸기', la: 'Substituere', eo: 'Anstataŭigi', es: 'Reemplazar', de: 'Ersetzen', ar: 'استبدال', hi: 'बदलें', ru: 'Замена', el: 'Αντικατάσταση', syc: 'ܚܠܦ' })}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleReplaceAll}
              disabled={searchMatches.length === 0}
            >
              {L(lang, { ja: '全置換', en: 'All', 'zh-CN': '全部替换', 'zh-TW': '全部取代', ko: '모두 바꾸기', la: 'Omnia', eo: 'Ĉiuj', es: 'Todo', de: 'Alle', ar: 'الكل', hi: 'सभी', ru: 'Все', el: 'Όλα', syc: 'ܟܠ' })}
            </button>
            <button
              className="btn btn-sm btn-icon"
              onClick={() => setShowSearchBar(false)}
              title={L(lang, { ja: '閉じる', en: 'Close', 'zh-CN': '关闭', 'zh-TW': '關閉', ko: '닫기', la: 'Claudere', eo: 'Fermi', es: 'Cerrar', de: 'Schließen', ar: 'إغلاق', hi: 'बंद करें', ru: 'Закрыть', el: 'Κλείσιμο', syc: 'ܣܓܘܪ' })}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4L4 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* AI校正ステータス表示 */}
      {(proofreadState.status === 'loading' || proofreadState.status === 'error') && (
        <div className="text-editor-ai-status">
          {proofreadState.status === 'loading' && (
            <>
              <span className="ai-bar-spinner" />
              <span className="ai-bar-hint">{L(lang, { ja: 'AIが画像とテキストを比較中...', en: 'AI is comparing image and text...', 'zh-CN': 'AI正在比较图像和文本...', 'zh-TW': 'AI正在比較圖像和文字...', ko: 'AI가 이미지와 텍스트를 비교 중...', la: 'AI imaginem et textum comparabit...', eo: 'AI komparas bildon kaj tekston...', es: 'AI está comparando imagen y texto...', de: 'KI vergleicht Bild und Text...', ar: 'AI يقارن الصورة والنص...', hi: 'AI छवि और पाठ की तुलना कर रहा है...', ru: 'AI сравнивает изображение и текст...', el: 'Το AI συγκρίνει εικόνα και κείμενο...', syc: 'AI ܒܥܐ ܨܘܪܬܐ ܘܟܬܒ̈ܬ...' })}</span>
            </>
          )}
          {proofreadState.status === 'error' && (
            <span className="ai-bar-error" title={proofreadState.message}>
              {L(lang, { ja: '校正エラー: ', en: 'Error: ', 'zh-CN': '校正错误: ', 'zh-TW': '校正錯誤: ', ko: '교정 오류: ', la: 'Error: ', eo: 'Eraro: ', es: 'Error: ', de: 'Fehler: ', ar: 'خطأ: ', hi: 'त्रुटि: ', ru: 'Ошибка: ', el: 'Σφάλμα: ', syc: 'ܦܘܪܫܢܐ: ' })}{proofreadState.message?.slice(0, 80)}
            </span>
          )}
        </div>
      )}

      {/* バッチAI校正ステータス表示 */}
      {batchProofreadState.status === 'loading' && (
        <div className="text-editor-ai-status">
          <span className="ai-bar-spinner" />
          <span className="ai-bar-hint">{batchProofreadState.message || L(lang, { ja: 'バッチ校正実行中...', en: 'Running batch proofread...', 'zh-CN': '批量校正中...', 'zh-TW': '批量校正中...', ko: '배치 교정 실행 중...', la: 'Proletis correctio...', eo: 'Ruli aro-korektadon...', es: 'Ejecutando corrección por lote...', de: 'Stapel-Korrektur läuft...', ar: 'جارٍ تصحيح دفعي...', hi: 'बैच प्रूफ़रीडिंग चल रही है...', ru: 'Пакетная корректура...', el: 'Εκτέλεση διόρθωσης παρτίδας...', syc: 'ܪܨ ܬܘܪܨ ܟܘܡܐ...' })}</span>
        </div>
      )}

      {/* バッチAI校正完了メッセージ＆操作ボタン */}
      {batchProofreadState.status === 'done' && (
        <div className="text-editor-ai-status" style={{ backgroundColor: 'var(--batch-success-bg, rgba(34, 197, 94, 0.1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13.5 3.5L6 11 2.5 7.5" />
            </svg>
            <span className="ai-bar-hint" style={{ flex: 1 }}>{batchProofreadState.message}</span>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleBatchAcceptAll}
              style={{ whiteSpace: 'nowrap', marginRight: '4px' }}
            >
              {L(lang, { ja: '全て適用', en: 'Apply All', 'zh-CN': '全部应用', 'zh-TW': '全部套用', ko: '모두 적용', la: 'Omnes applicare', eo: 'Apliki ĉiujn', es: 'Aplicar todo', de: 'Alles anwenden', ar: 'تطبيق الكل', hi: 'सभी लागू करें', ru: 'Применить все', el: 'Εφαρμογή όλων', syc: 'ܐܚܕܘ ܟܠ' })}
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={handleBatchRejectAll}
              style={{ whiteSpace: 'nowrap' }}
            >
              {L(lang, { ja: 'キャンセル', en: 'Cancel', 'zh-CN': '取消', 'zh-TW': '取消', ko: '취소', la: 'Abscondere', eo: 'Nuligi', es: 'Cancelar', de: 'Abbrechen', ar: 'إلغاء', hi: 'रद्द करें', ru: 'Отмена', el: 'Ακύρωση', syc: 'ܒܛܠ' })}
            </button>
          </div>
        </div>
      )}

      {/* バッチAI校正エラー表示 */}
      {batchProofreadState.status === 'error' && (
        <div className="text-editor-ai-status">
          <span className="ai-bar-error" title={batchProofreadState.message}>
            {L(lang, { ja: 'バッチ校正エラー: ', en: 'Batch error: ', 'zh-CN': '批处理错误: ', 'zh-TW': '批處理錯誤: ', ko: '배치 오류: ', la: 'Error proletis: ', eo: 'Eraro aro: ', es: 'Error lote: ', de: 'Stapel-Fehler: ', ar: 'خطأ دفعي: ', hi: 'बैच त्रुटि: ', ru: 'Ошибка пакета: ', el: 'Σφάλμα παρτίδας: ', syc: 'ܦܘܪܫܢܐ ܟܘܡܐ: ' })}{batchProofreadState.message?.slice(0, 80)}
          </span>
        </div>
      )}

      {/* メイン: テキストエリア or 差分表示 */}
      <div className="text-editor-body">
        {result.textBlocks.length === 0 ? (
          <p className="text-editor-empty-text">
            {L(lang, { ja: 'テキストが検出されませんでした', en: 'No text detected', 'zh-CN': '未检测到文本', 'zh-TW': '未檢測到文字', ko: '감지된 텍스트 없음', la: 'Nullus textus detectus', eo: 'Neniuj tekstoj detektitaj', es: 'No se detectó texto', de: 'Kein Text erkannt', ar: 'لم يتم اكتشاف نص', hi: 'कोई पाठ नहीं मिला', ru: 'Текст не обнаружен', el: 'Δεν εντοπίστηκε κείμενο', syc: 'ܠܐ ܫܚܩ ܡܕܡ ܡܢ ܟܬܒ̈ܬ' })}
          </p>
        ) : shouldShowDiff ? (
          <DiffView
            originalText={proofreadState.originalText}
            correctedText={proofreadState.correctedText}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onApplySelective={(text) => {
              setEditedText(text)
              onTextChange?.(text)
              setProofreadState({ status: 'idle' })
            }}
            lang={lang}
          />
        ) : (
          <div className={`line-numbers-container ${isVertical ? 'text-editor-vertical' : ''}`}>
            {showLineNumbers && !isVertical && (
              <div
                className="line-numbers-gutter"
                ref={gutterRef}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: `${lineSpacing}`,
                }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <span
                    key={i}
                    className="line-number"
                    style={{
                      height: computedLineHeight > 0 ? `${computedLineHeight}px` : `${fontSize * lineSpacing}px`,
                      fontSize: `${Math.max(10, fontSize * 0.75)}px`,
                    }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            )}
            {showLineNumbers && isVertical && (
              <div
                className="line-numbers-gutter-vertical"
                ref={gutterRef}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: `${lineSpacing}`,
                  paddingRight: '0.75rem',
                  paddingLeft: '0.75rem',
                }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <span
                    key={i}
                    className="line-number-vertical"
                    style={{
                      width: computedLineHeight > 0 ? `${computedLineHeight}px` : `${fontSize * lineSpacing}px`,
                      fontSize: `${Math.max(8, fontSize * 0.6)}px`,
                    }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              className={`text-editor-textarea font-${fontFamily}${highlightRange ? ' text-editor-textarea-highlighted' : ''}`}
              value={displayText}
              onChange={handleTextChange}
              onScroll={handleTextareaScroll}
              spellCheck={false}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: `${lineSpacing}`,
                writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                textOrientation: isVertical ? 'mixed' : 'initial',
                fontFeatureSettings: isVertical ? '"vert" 1' : 'normal',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="text-editor-statusbar">
        <div className="text-editor-statusbar-left">
          <span className="text-editor-stat-item">
            {charCount.toLocaleString()} {L(lang, { ja: '文字', en: 'chars', 'zh-CN': '个字符', 'zh-TW': '個字元', ko: '문자', la: 'littera', eo: 'signoj', es: 'caracteres', de: 'Zeichen', ar: 'حرف', hi: 'अक्षर', ru: 'знаки', el: 'χαρακτήρες', syc: 'ܓܪܡ̈ܐ' })}
          </span>
          <span className="text-editor-stat-sep" />
          <span className="text-editor-stat-item">
            {lineCount.toLocaleString()} {L(lang, { ja: '行', en: 'lines', 'zh-CN': '行', 'zh-TW': '行', ko: '줄', la: 'versus', eo: 'linioj', es: 'líneas', de: 'Zeilen', ar: 'أسطر', hi: 'पंक्तियाँ', ru: 'строки', el: 'γραμμές', syc: 'ܣܛܪ̈ܐ' })}
          </span>
          {!saved && (
            <>
              <span className="text-editor-stat-sep" />
              <span className="text-editor-stat-modified">{L(lang, { ja: '変更あり', en: 'Modified', 'zh-CN': '已修改', 'zh-TW': '已修改', ko: '수정됨', la: 'Mutatum', eo: 'Modifita', es: 'Modificado', de: 'Geändert', ar: 'تم التعديل', hi: 'संशोधित', ru: 'Изменено', el: 'Τροποποιήθηκε', syc: 'ܐܬܫܢܝ' })}</span>
            </>
          )}
        </div>
        <div className="text-editor-statusbar-right">
          <label
            className="text-editor-option-compact"
            title={L(lang, {
              ja: 'コピー・保存時にファイル名をヘッダーとして付加します',
              en: 'Prepend the filename as a header when copying or saving',
              'zh-CN': '复制/保存时将文件名作为标题添加',
              'zh-TW': '複製/儲存時將檔案名稱作為標題加入',
              ko: '복사/저장 시 파일 이름을 제목으로 추가',
              la: 'Nomen fasciculi ut titulum adde',
              eo: 'Aldoni dosiernomon kiel titolon',
              es: 'Agregar el nombre del archivo como encabezado al copiar o guardar',
              de: 'Dateinamen als Überschrift beim Kopieren oder Speichern voranstellen',
              ar: 'إضافة اسم الملف كعنوان عند النسخ أو الحفظ',
              hi: 'कॉपी या सेव करते समय फ़ाइल नाम हेडर के रूप में जोड़ें',
              ru: 'Добавить имя файла в качестве заголовка при копировании или сохранении',
              el: 'Προσθήκη ονόματος αρχείου ως κεφαλίδα κατά την αντιγραφή ή αποθήκευση',
              syc: 'ܐܠܦ ܫܡ ܩܛܝܡܐ ܐܘܠܐ ܕܦܘܣܐ'
            })}
          >
            <input
              type="checkbox"
              checked={includeFileName}
              onChange={(e) => setIncludeFileName(e.target.checked)}
            />
            {L(lang, { ja: 'ファイル名', en: 'Filename', 'zh-CN': '文件名', 'zh-TW': '檔案名', ko: '파일명', la: 'Nomen', eo: 'Dosiernomo', es: 'Nombre', de: 'Dateiname', ar: 'اسم الملف', hi: 'फ़ाइल नाम', ru: 'Включить имя файла', el: 'Συμπερίληψη ονόματος αρχείου', syc: 'ܐܥܠ ܫܡ ܩܛܝܡܐ' })}
          </label>
          <label
            className="text-editor-option-compact"
            title={L(lang, {
              ja: 'コピー・保存時に改行を除去して1行にまとめます',
              en: 'Remove all line breaks when copying or saving',
              'zh-CN': '复制/保存时删除所有换行合为一行',
              'zh-TW': '複製/儲存時刪除所有換行合為一行',
              ko: '복사/저장 시 모든 줄바꿈을 제거하여 한 줄로',
              la: 'Omnes versus in unum coniunge',
              eo: 'Forigi ĉiujn linirompojn',
              es: 'Eliminar todos los saltos de línea al copiar o guardar',
              de: 'Alle Zeilenumbrüche beim Kopieren oder Speichern entfernen',
              ar: 'إزالة جميع فواصل الأسطر عند النسخ أو الحفظ',
              hi: 'कॉपी या सेव करते समय सभी लाइन ब्रेक हटाएँ',
              ru: 'Игнорировать переносы строк при копировании или сохранении',
              el: 'Αγνόηση αλλαγών γραμμής κατά την αντιγραφή ή αποθήκευση',
              syc: 'ܐܗܡܐ ܡܢ ܫ̈ܘܚܠܦ ܣܛܪ̈ܐ'
            })}
          >
            <input
              type="checkbox"
              checked={ignoreNewlines}
              onChange={(e) => setIgnoreNewlines(e.target.checked)}
            />
            {L(lang, { ja: '改行無視', en: 'No newlines', 'zh-CN': '忽略换行', 'zh-TW': '忽略換行', ko: '줄바꿈 무시', la: 'Sine fractis', eo: 'Sen linirompoj', es: 'Sin saltos', de: 'Ohne Umbrüche', ar: 'بدون أسطر', hi: 'बिना लाइन ब्रेक', ru: 'Игнорировать переносы строк', el: 'Χωρίς αλλαγές γραμμής', syc: 'ܠܐ ܫ̈ܘܚܠܦ̈ܐ ܣܛܪܐ' })}
          </label>
          <span className="text-editor-stat-sep" />
          <div className="text-editor-font-controls-compact">
            <select
              className="text-editor-font-select"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              title={L(lang, { ja: 'フォント', en: 'Font', 'zh-CN': '字体', 'zh-TW': '字體', ko: '글꼴', la: 'Typus', eo: 'Tiparo', es: 'Fuente', de: 'Schrift', ar: 'الخط', hi: 'फ़ॉन्ट', ru: 'Шрифт', el: 'Γραμματοσειρά', syc: 'ܡܠܟܐ' })}
            >
              <option value="mono">Monospace</option>
              <option value="serif">Serif (明朝)</option>
              <option value="sans">Sans (ゴシック)</option>
              <option value="ud-kyokasho">教科書体 (Klee One)</option>
              <option value="biz-ud">BIZ UDゴシック</option>
            </select>
            <span className="text-editor-font-size-group">
              <svg className="text-editor-font-size-icon" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" stroke="none">
                <text x="0" y="14" fontSize="11" fontWeight="700" fontFamily="sans-serif">A</text>
                <text x="10" y="18" fontSize="8" fontWeight="600" fontFamily="sans-serif">A</text>
              </svg>
              <button
                className="text-editor-font-size-btn"
                onClick={() => setFontSize(s => Math.max(10, s - 2))}
                title={L(lang, { ja: '文字を小さく', en: 'Decrease font size', 'zh-CN': '缩小字体', 'zh-TW': '縮小字體', ko: '글자 축소' })}
              >−</button>
              <span className="text-editor-font-value-compact">{fontSize}px</span>
              <button
                className="text-editor-font-size-btn"
                onClick={() => setFontSize(s => Math.min(48, s + 2))}
                title={L(lang, { ja: '文字を大きく', en: 'Increase font size', 'zh-CN': '放大字体', 'zh-TW': '放大字體', ko: '글자 확대' })}
              >+</button>
              <input
                type="range"
                className="text-editor-font-slider-compact"
                min="10"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                title={L(lang, { ja: `文字サイズ: ${fontSize}px`, en: `Font size: ${fontSize}px`, 'zh-CN': `字号: ${fontSize}px`, 'zh-TW': `字級: ${fontSize}px`, ko: `글자 크기: ${fontSize}px` })}
              />
              <button
                className="text-editor-icon-btn"
                onClick={handleAutoFitFont}
                title={L(lang, { ja: '行幅に合わせて文字を自動拡大', en: 'Auto-fit font to line width', 'zh-CN': '自动适应行宽', 'zh-TW': '自動適應行寬', ko: '줄 너비에 맞춤' })}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4h12M2 12h12" />
                  <path d="M4 2l-2 2 2 2M12 10l2 2-2 2" />
                </svg>
              </button>
            </span>
            <span className="text-editor-font-sep-compact">|</span>
            <span className="text-editor-font-label-compact">{L(lang, { ja: '行間', en: 'Spacing', 'zh-CN': '行距', 'zh-TW': '行距', ko: '행간', la: 'Interl.', eo: 'Interlinio', es: 'Espacio', de: 'Abstand', ar: 'التباعد', hi: 'अंतराल', ru: 'Интервал', el: 'Απόσταση', syc: 'ܦܚܘܩܐ' })}</span>
            <span className="text-editor-font-value-compact">{lineSpacing.toFixed(1)}</span>
            <input
              type="range"
              className="text-editor-font-slider-compact"
              min="1.0"
              max="3.0"
              step="0.1"
              value={lineSpacing}
              onChange={(e) => setLineSpacing(Number(e.target.value))}
              title={`${L(lang, { ja: '行間', en: 'Line spacing', 'zh-CN': '行距', 'zh-TW': '行距', ko: '행간', la: 'Interlineum', eo: 'Interlinio', es: 'Interlineado', de: 'Zeilenabstand', ar: 'تباعد الأسطر', hi: 'पंक्ति अंतराल', ru: 'Интервал строк', el: 'Απόσταση γραμμών', syc: 'ܦܚܘܩܐ ܕ̈ܣܛܪܐ' })}: ${lineSpacing.toFixed(1)}`}
            />
          </div>
        </div>
      </div>

      {showTEIMetadataModal && (
        <Suspense fallback={null}>
          <TEIMetadataModal
            onClose={() => setShowTEIMetadataModal(false)}
            onSave={handleTEIMetadataSave}
            lang={lang}
            initialMetadata={lastTEIMetadata}
          />
        </Suspense>
      )}
    </div>
  )
}
