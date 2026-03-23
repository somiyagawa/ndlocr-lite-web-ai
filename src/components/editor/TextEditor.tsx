import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { OCRResult, TextBlock } from '../../types/ocr'
import type { AIConnector } from '../../types/ai'
import type { AIConnectionStatus } from '../../hooks/useAISettings'
import { downloadText, copyToClipboard } from '../../utils/textExport'
import { downloadTEI } from '../../utils/exportTEI'
import { downloadHOCR } from '../../utils/exportHOCR'
import { downloadPDF } from '../../utils/exportPDF'
import { DiffView } from './DiffView'
import type { Language } from '../../i18n'

interface TextEditorProps {
  result: OCRResult | null
  selectedBlock: TextBlock | null
  selectedPageBlockText: string | null
  lang: Language
  onTextChange?: (text: string) => void
  aiConnector: AIConnector | null
  aiConnectionStatus?: AIConnectionStatus
  imageDataUrl?: string
}

type ProofreadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; originalText: string; correctedText: string }
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
  selectedBlock,
  selectedPageBlockText,
  lang,
  onTextChange,
  aiConnector,
  aiConnectionStatus = 'disconnected',
  imageDataUrl,
}: TextEditorProps) {
  const [editedText, setEditedText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [includeFileName, setIncludeFileName] = useState(false)
  const [ignoreNewlines, setIgnoreNewlines] = useState(false)
  const [proofreadState, setProofreadState] = useState<ProofreadState>({ status: 'idle' })
  const [fontSize, setFontSize] = useState(14)
  const [fontFamily, setFontFamily] = useState<string>('mono')
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [isVertical, setIsVertical] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [undoStack, setUndoStack] = useState<UndoRedoEntry[]>([])
  const [redoStack, setRedoStack] = useState<UndoRedoEntry[]>([])
  const [saved, setSaved] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(null)
  const [computedLineHeight, setComputedLineHeight] = useState<number>(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // editedText が null なら result.fullText を使う
  const displayText = editedText ?? result?.fullText ?? ''

  // Determine if we should show diff view
  const shouldShowDiff = proofreadState.status === 'done'

  // テキストエリアの実際の lineHeight を計測して行番号と同期する
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    const style = window.getComputedStyle(ta)
    const lh = parseFloat(style.lineHeight)
    if (!isNaN(lh) && lh > 0) {
      setComputedLineHeight(lh)
    } else {
      // fallback: fontSize × line-height ratio (CSS: 1.9)
      setComputedLineHeight(fontSize * 1.9)
    }
  }, [fontSize, isVertical])

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

  // Line numbers
  const lineCount = useMemo(() => {
    return displayText.split('\n').length
  }, [displayText])

  // Character count
  const charCount = displayText.length

  const prevDisplayTextRef = useRef(displayText)
  prevDisplayTextRef.current = displayText

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value
      const currentText = prevDisplayTextRef.current

      // Add current text to undo stack before changing
      if (currentText !== newText) {
        setUndoStack(prev => [...prev, { text: currentText, cursorPos: textareaRef.current?.selectionStart }])
        setRedoStack([])
        setSaved(false)
      }

      setEditedText(newText)
      onTextChange?.(newText)
    },
    [onTextChange],
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
        handleSave()
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

    // textarea にフォーカスして選択範囲を設定
    ta.focus()
    ta.setSelectionRange(start, end)

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

  const handleDownload = () => {
    if (!result) return
    const text = applyOptions(editedText ?? result.fullText)
    downloadText(
      includeFileName ? `=== ${result.fileName} ===\n${text}` : text,
      result.fileName,
    )
  }

  const handleSave = () => {
    if (!result) return
    const text = applyOptions(editedText ?? result.fullText)
    downloadText(
      includeFileName ? `=== ${result.fileName} ===\n${text}` : text,
      result.fileName,
    )
    setSaved(true)
  }

  const handleUndo = useCallback(() => {
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
  }, [onTextChange])

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

  // Export menu: close on click outside
  useEffect(() => {
    if (!showExportMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const handleExport = useCallback((format: 'txt' | 'tei' | 'hocr' | 'pdf') => {
    if (!result) return
    setShowExportMenu(false)
    if (format === 'txt') {
      handleDownload()
    } else if (format === 'tei') {
      downloadTEI(result)
    } else if (format === 'hocr') {
      downloadHOCR(result)
    } else if (format === 'pdf') {
      downloadPDF(result, imageDataUrl)
    }
  }, [result, imageDataUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // AI校正実行
  const handleProofread = useCallback(async () => {
    if (!aiConnector || !result) return

    // AI未接続（接続テスト未実施）の場合、警告を表示
    if (aiConnectionStatus !== 'connected') {
      const msg = lang === 'ja'
        ? 'AI接続が確認されていません。設定画面で接続テストを実行してください。続行しますか？'
        : 'AI connection has not been verified. Please run a connection test in Settings. Continue anyway?'
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
        <p>{lang === 'ja' ? '結果なし' : 'No results'}</p>
      </div>
    )
  }

  return (
    <div className="text-editor">
      {/* ── Row 1: Title bar with AI proofread ── */}
      <div className="text-editor-header">
        <div className="text-editor-header-left">
          <span className="text-editor-label">
            {lang === 'ja' ? 'OCR結果' : 'OCR Result'}
            {!saved && <span className="text-editor-unsaved-indicator" title={lang === 'ja' ? '未保存' : 'Unsaved'} />}
          </span>
          <span className="text-editor-stats">
            {result.textBlocks.length}
            {lang === 'ja' ? '領域' : ' regions'}
            {' · '}
            {(result.processingTimeMs / 1000).toFixed(1)}s
          </span>
        </div>
        <div className="text-editor-header-buttons">
          <button
            className="btn btn-ai"
            onClick={handleProofread}
            disabled={!aiConnector || proofreadState.status === 'loading' || result.textBlocks.length === 0}
            title={!aiConnector ? (lang === 'ja' ? '設定でAI接続を構成してください' : 'Configure AI connection in Settings') : ''}
          >
            {proofreadState.status === 'loading' ? (
              <>
                <span className="btn-ai-spinner" />
                {lang === 'ja' ? 'AI校正中...' : 'Proofreading...'}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2l2 6h6l-5 3.5 2 6.5L8 14l-5 4 2-6.5L0 8h6z" />
                </svg>
                {lang === 'ja' ? 'AI校正' : 'AI Proofread'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Row 2: Toolbar ── */}
      <div className="text-editor-toolbar">
        {/* Left: edit tools */}
        <div className="text-editor-toolbar-group">
          <button
            className="btn btn-icon btn-sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title={lang === 'ja' ? '戻す (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
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
            title={lang === 'ja' ? 'やり直す (Ctrl+Shift+Z)' : 'Redo (Ctrl+Shift+Z)'}
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
            title={lang === 'ja' ? '検索と置換 (Ctrl+F)' : 'Find & Replace (Ctrl+F)'}
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
            title={lang === 'ja' ? '行番号' : 'Line numbers'}
            aria-label="Toggle line numbers"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <text x="1" y="6" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">1</text>
              <line x1="7" y1="4" x2="15" y2="4" />
              <text x="1" y="13" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">2</text>
              <line x1="7" y1="11" x2="15" y2="11" />
            </svg>
          </button>

          <button
            className={`btn btn-sm btn-text-toggle${isVertical ? ' btn-text-toggle-active' : ''}`}
            onClick={() => setIsVertical(!isVertical)}
            title={lang === 'ja' ? (isVertical ? '横書きに切替' : '縦書きに切替') : (isVertical ? 'Switch to horizontal' : 'Switch to vertical')}
            aria-label="Toggle vertical text"
            aria-pressed={isVertical}
          >
            {lang === 'ja' ? '縦書き' : 'Vertical'}
          </button>

          <span className="text-editor-toolbar-sep" />

          <button
            className="btn btn-icon btn-sm"
            onClick={handleRemoveEmptyLines}
            title={lang === 'ja' ? '空行を削除' : 'Remove empty lines'}
            aria-label="Remove empty lines"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="3" x2="14" y2="3" />
              <line x1="5" y1="8" x2="11" y2="8" strokeDasharray="2 2" opacity="0.4" />
              <path d="M7 7l2 2M9 7l-2 2" strokeWidth="1.2" />
              <line x1="2" y1="13" x2="14" y2="13" />
            </svg>
          </button>

          <button
            className="btn btn-icon btn-sm"
            onClick={handleJoinLines}
            title={lang === 'ja' ? '改行を削除して結合' : 'Join lines'}
            aria-label="Join lines"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="8" x2="14" y2="8" />
              <polyline points="5 5 2 8 5 11" fill="none" />
              <polyline points="11 5 14 8 11 11" fill="none" />
            </svg>
          </button>

          <button
            className="btn btn-sm btn-text-toggle"
            onClick={handleRestoreNewlines}
            disabled={undoStack.length === 0}
            title={lang === 'ja' ? '直前の操作を元に戻す（改行の復元等）' : 'Undo last operation (restore newlines, etc.)'}
            aria-label="Restore"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '2px' }}>
              <path d="M4 7h6a3 3 0 0 1 0 6H8" />
              <polyline points="7 4 4 7 7 10" fill="none" />
            </svg>
            {lang === 'ja' ? '元に戻す' : 'Undo'}
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
              ? (lang === 'ja' ? 'OK!' : 'OK!')
              : (lang === 'ja' ? 'コピー' : 'Copy')}
          </button>
          <div className="export-dropdown-wrapper" ref={exportMenuRef}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowExportMenu(!showExportMenu)}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '3px' }}>
                <path d="M8 2v9M4 8l4 4 4-4" />
                <path d="M2 12v2h12v-2" />
              </svg>
              {lang === 'ja' ? 'DL' : 'DL'}
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '2px' }}>
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="export-dropdown-menu">
                <button className="export-dropdown-item" onClick={() => handleExport('txt')}>
                  <span className="export-dropdown-icon">TXT</span>
                  <span>{lang === 'ja' ? 'プレーンテキスト (.txt)' : 'Plain Text (.txt)'}</span>
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('tei')}>
                  <span className="export-dropdown-icon">TEI</span>
                  <span>{lang === 'ja' ? 'TEI XML (.xml)' : 'TEI XML (.xml)'}</span>
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('hocr')}>
                  <span className="export-dropdown-icon">hOCR</span>
                  <span>{lang === 'ja' ? 'hOCR (.hocr)' : 'hOCR (.hocr)'}</span>
                </button>
                <button className="export-dropdown-item" onClick={() => handleExport('pdf')}>
                  <span className="export-dropdown-icon">PDF</span>
                  <span>{lang === 'ja' ? 'テキスト付きPDF (.pdf)' : 'Text-embedded PDF (.pdf)'}</span>
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave} title="Ctrl+S">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '3px' }}>
              <path d="M2 2v12h12V5l-3-3H2z" />
              <path d="M5 2v4h5V2" />
              <rect x="4" y="9" width="8" height="5" rx="0.5" />
            </svg>
            {lang === 'ja' ? '保存' : 'Save'}
          </button>
        </div>
      </div>

      {/* Search & Replace bar */}
      {showSearchBar && (
        <div className="text-editor-search-bar">
          <div className="text-editor-search-controls">
            <input
              type="text"
              className="text-editor-search-input"
              placeholder={lang === 'ja' ? '検索...' : 'Find...'}
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
              {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : lang === 'ja' ? '0件' : '0'}
            </span>
            <button
              className="btn btn-sm btn-icon"
              onClick={handlePreviousMatch}
              disabled={searchMatches.length === 0}
              title={lang === 'ja' ? '前へ' : 'Previous'}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12l-4-4 4-4" />
              </svg>
            </button>
            <button
              className="btn btn-sm btn-icon"
              onClick={handleNextMatch}
              disabled={searchMatches.length === 0}
              title={lang === 'ja' ? '次へ' : 'Next'}
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
              placeholder={lang === 'ja' ? '置換...' : 'Replace...'}
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
              {lang === 'ja' ? '置換' : 'Replace'}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleReplaceAll}
              disabled={searchMatches.length === 0}
            >
              {lang === 'ja' ? '全置換' : 'All'}
            </button>
            <button
              className="btn btn-sm btn-icon"
              onClick={() => setShowSearchBar(false)}
              title={lang === 'ja' ? '閉じる' : 'Close'}
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
              <span className="ai-bar-hint">{lang === 'ja' ? 'AIが画像とテキストを比較中...' : 'AI is comparing image and text...'}</span>
            </>
          )}
          {proofreadState.status === 'error' && (
            <span className="ai-bar-error" title={proofreadState.message}>
              {lang === 'ja' ? '校正エラー: ' : 'Error: '}{proofreadState.message?.slice(0, 80)}
            </span>
          )}
        </div>
      )}

      {/* メイン: テキストエリア or 差分表示 */}
      <div className="text-editor-body">
        {result.textBlocks.length === 0 ? (
          <p className="text-editor-empty-text">
            {lang === 'ja' ? 'テキストが検出されませんでした' : 'No text detected'}
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
              <div className="line-numbers-gutter" ref={gutterRef}>
                {Array.from({ length: lineCount }).map((_, i) => (
                  <span
                    key={i}
                    className="line-number"
                    style={{ height: computedLineHeight > 0 ? `${computedLineHeight}px` : undefined }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            )}
            {showLineNumbers && isVertical && (
              <div className="line-numbers-gutter-vertical" ref={gutterRef}>
                {Array.from({ length: lineCount }).map((_, i) => (
                  <span
                    key={i}
                    className="line-number-vertical"
                    style={{ width: computedLineHeight > 0 ? `${computedLineHeight}px` : undefined }}
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
                writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                textOrientation: isVertical ? 'mixed' : 'initial',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="text-editor-statusbar">
        <div className="text-editor-statusbar-left">
          <span className="text-editor-stat-item">
            {charCount.toLocaleString()} {lang === 'ja' ? '文字' : 'chars'}
          </span>
          <span className="text-editor-stat-sep" />
          <span className="text-editor-stat-item">
            {lineCount.toLocaleString()} {lang === 'ja' ? '行' : 'lines'}
          </span>
          {!saved && (
            <>
              <span className="text-editor-stat-sep" />
              <span className="text-editor-stat-modified">{lang === 'ja' ? '変更あり' : 'Modified'}</span>
            </>
          )}
        </div>
        <div className="text-editor-statusbar-right">
          <label
            className="text-editor-option-compact"
            title={lang === 'ja'
              ? 'コピー・保存時にファイル名をヘッダーとして付加します'
              : 'Prepend the filename as a header when copying or saving'}
          >
            <input
              type="checkbox"
              checked={includeFileName}
              onChange={(e) => setIncludeFileName(e.target.checked)}
            />
            {lang === 'ja' ? 'ファイル名' : 'Filename'}
          </label>
          <label
            className="text-editor-option-compact"
            title={lang === 'ja'
              ? 'コピー・保存時に改行を除去して1行にまとめます'
              : 'Remove all line breaks when copying or saving'}
          >
            <input
              type="checkbox"
              checked={ignoreNewlines}
              onChange={(e) => setIgnoreNewlines(e.target.checked)}
            />
            {lang === 'ja' ? '改行無視' : 'No newlines'}
          </label>
          <span className="text-editor-stat-sep" />
          <div className="text-editor-font-controls-compact">
            <select
              className="text-editor-font-select"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              title={lang === 'ja' ? 'フォント' : 'Font'}
            >
              <option value="mono">Monospace</option>
              <option value="serif">Serif (明朝)</option>
              <option value="sans">Sans (ゴシック)</option>
            </select>
            <span className="text-editor-font-value-compact">{fontSize}px</span>
            <input
              type="range"
              className="text-editor-font-slider-compact"
              min="10"
              max="28"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              title={`${fontSize}px`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
