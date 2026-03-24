import { useRef, useState, useCallback, useEffect } from 'react'
import { L } from '../../i18n'
import type { Language } from '../../i18n'

interface SplitViewProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultRatio?: number // 0–1, default 0.5
  minLeftPx?: number
  minRightPx?: number
  lang?: Language
}

export function SplitView({
  left,
  right,
  defaultRatio = 0.5,
  minLeftPx = 200,
  minRightPx = 200,
  lang = 'ja',
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState(defaultRatio)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left')
  const dragging = useRef(false)
  const swipeStartX = useRef(0)

  // Viewport detection
  useEffect(() => {
    const updateMode = () => {
      const w = window.innerWidth
      if (w <= 480) setViewMode('mobile')
      else if (w <= 768) setViewMode('tablet')
      else setViewMode('desktop')
    }
    updateMode()
    window.addEventListener('resize', updateMode)
    return () => window.removeEventListener('resize', updateMode)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const cursorStyle = viewMode === 'tablet' ? 'row-resize' : 'col-resize'
    document.body.style.cursor = cursorStyle
    document.body.style.userSelect = 'none'
  }, [viewMode])

  const handleTouchDividerStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    dragging.current = true
    const cursorStyle = viewMode === 'tablet' ? 'row-resize' : 'col-resize'
    document.body.style.cursor = cursorStyle
  }, [viewMode])

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX
  }, [])

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (viewMode !== 'mobile') return
    const swipeEndX = e.changedTouches[0].clientX
    const diff = swipeStartX.current - swipeEndX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeTab === 'left') {
        setActiveTab('right')
      } else if (diff < 0 && activeTab === 'right') {
        setActiveTab('left')
      }
    }
  }, [viewMode, activeTab])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()

      if (viewMode === 'tablet') {
        const totalHeight = rect.height
        const y = e.clientY - rect.top
        const newRatio = Math.max(0.2, Math.min(0.8, y / totalHeight))
        setRatio(newRatio)
      } else {
        const totalWidth = rect.width
        const x = e.clientX - rect.left
        const minLeft = minLeftPx / totalWidth
        const minRight = minRightPx / totalWidth
        const newRatio = Math.max(minLeft, Math.min(1 - minRight, x / totalWidth))
        setRatio(newRatio)
      }
    }

    const handleMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging.current || !containerRef.current) return
      const touch = e.touches[0]
      const rect = containerRef.current.getBoundingClientRect()

      if (viewMode === 'tablet') {
        const totalHeight = rect.height
        const y = touch.clientY - rect.top
        const newRatio = Math.max(0.2, Math.min(0.8, y / totalHeight))
        setRatio(newRatio)
      } else {
        const totalWidth = rect.width
        const x = touch.clientX - rect.left
        const minLeft = minLeftPx / totalWidth
        const minRight = minRightPx / totalWidth
        const newRatio = Math.max(minLeft, Math.min(1 - minRight, x / totalWidth))
        setRatio(newRatio)
      }
    }

    const handleTouchEnd = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [viewMode, minLeftPx, minRightPx])

  const leftLabel = L(lang, {
    ja: '画像',
    en: 'Image',
    'zh-CN': '图像',
    'zh-TW': '圖像',
    ko: '이미지',
    la: 'Imago',
    eo: 'Bildo',
    es: 'Imagen',
    de: 'Bild',
    ar: 'صورة',
    hi: 'छवि',
  })

  const rightLabel = L(lang, {
    ja: 'テキスト',
    en: 'Text',
    'zh-CN': '文本',
    'zh-TW': '文字',
    ko: '텍스트',
    la: 'Textus',
    eo: 'Teksto',
    es: 'Texto',
    de: 'Text',
    ar: 'نص',
    hi: 'पाठ',
  })

  // Mobile layout with tabs
  if (viewMode === 'mobile') {
    return (
      <div className="split-view split-view-mobile" ref={containerRef}>
        <div className="split-view-tabs">
          <button
            className={`split-view-tab${activeTab === 'left' ? ' active' : ''}`}
            onClick={() => setActiveTab('left')}
          >
            📷 {leftLabel}
          </button>
          <button
            className={`split-view-tab${activeTab === 'right' ? ' active' : ''}`}
            onClick={() => setActiveTab('right')}
          >
            📝 {rightLabel}
          </button>
        </div>
        <div className="split-view-swipe" onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
          <div
            className={`split-pane split-pane-left${activeTab === 'left' ? ' split-pane-active' : ''}`}
          >
            {left}
          </div>
          <div
            className={`split-pane split-pane-right${activeTab === 'right' ? ' split-pane-active' : ''}`}
          >
            {right}
          </div>
        </div>
      </div>
    )
  }

  // Tablet layout with horizontal divider
  if (viewMode === 'tablet') {
    return (
      <div className="split-view split-view-tablet" ref={containerRef} style={{ flexDirection: 'column' }}>
        <div className="split-pane split-pane-left split-pane-active" style={{ flex: `0 0 calc(${ratio * 100}% - 4px)` }}>
          {left}
        </div>
        <div
          className="split-divider split-divider-horizontal"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchDividerStart}
        />
        <div className="split-pane split-pane-right split-pane-active" style={{ flex: `0 0 calc(${(1 - ratio) * 100}% - 4px)` }}>
          {right}
        </div>
      </div>
    )
  }

  // Desktop layout with vertical divider (original behavior)
  return (
    <div className="split-view split-view-desktop" ref={containerRef}>
      <div className="split-pane split-pane-left split-pane-active" style={{ flex: `0 0 calc(${ratio * 100}% - 4px)` }}>
        {left}
      </div>
      <div
        className="split-divider"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchDividerStart}
      />
      <div className="split-pane split-pane-right split-pane-active" style={{ flex: `0 0 calc(${(1 - ratio) * 100}% - 4px)` }}>
        {right}
      </div>
    </div>
  )
}
