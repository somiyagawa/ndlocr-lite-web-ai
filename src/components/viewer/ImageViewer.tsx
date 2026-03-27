import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import type { TextBlock, BoundingBox, PageBlock } from '../../types/ocr'
import type { Quadrilateral } from '../../utils/documentScanner'
import type { Language } from '../../i18n'
import { L } from '../../i18n'

interface ImageViewerProps {
  imageDataUrl: string
  textBlocks: TextBlock[]
  selectedBlock: TextBlock | null
  onBlockSelect: (block: TextBlock) => void
  onRegionSelect?: (bbox: BoundingBox) => void
  selectedRegion?: BoundingBox | null
  pageBlocks?: PageBlock[]
  selectedPageBlock?: PageBlock | null
  onPageBlockSelect?: (block: PageBlock) => void
  pageIndex?: number
  totalPages?: number
  /** Perspective crop overlay */
  perspectiveMode?: boolean
  perspectiveCorners?: Quadrilateral | null
  onPerspectiveCornersChange?: (corners: Quadrilateral) => void
  /** Image correction toggle button in toolbar */
  showAdjustButton?: boolean
  adjustActive?: boolean
  onAdjustToggle?: () => void
  adjustLabel?: string
  /** Language for toolbar labels */
  lang?: Language
  /** Reading order edit mode */
  readingOrderEditMode?: boolean
  onReadingOrderCancel?: () => void
  onReadingOrderChange?: (newBlocks: TextBlock[]) => void
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8
const FIT_ZOOM = -1

type InteractionMode = 'pan' | 'select'

export function ImageViewer({
  imageDataUrl,
  textBlocks,
  selectedBlock,
  onBlockSelect,
  onRegionSelect,
  selectedRegion,
  pageBlocks,
  selectedPageBlock,
  onPageBlockSelect,
  pageIndex,
  totalPages,
  perspectiveMode,
  perspectiveCorners,
  onPerspectiveCornersChange,
  showAdjustButton,
  adjustActive,
  onAdjustToggle,
  adjustLabel,
  lang = 'ja',
  readingOrderEditMode = false,
  onReadingOrderCancel,
  onReadingOrderChange,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState<number>(FIT_ZOOM)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [mode, setMode] = useState<InteractionMode>('pan')
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [smooth, setSmooth] = useState(false) // true = animate transitions

  // miwo-inspired overlay modes
  const [showTextOverlay, setShowTextOverlay] = useState(false)
  const [showConfidence, setShowConfidence] = useState(false)
  const [showReadingOrder, setShowReadingOrder] = useState(false)

  // Perspective corner dragging
  const [perspDragging, setPerspDragging] = useState<string | null>(null)

  // Reading order editing state
  const [assignedOrder, setAssignedOrder] = useState<Map<number, number>>(new Map())
  const [nextOrderNumber, setNextOrderNumber] = useState(1)

  const panStartRef = useRef({ x: 0, y: 0 })
  const panOffsetRef = useRef({ x: 0, y: 0 })
  // Keep panOffset ref in sync
  useEffect(() => { panOffsetRef.current = panOffset }, [panOffset])

  // Touch gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; dist: number; zoom: number }>({ x: 0, y: 0, dist: 0, zoom: 1 })
  const lastTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Compute fit-to-container zoom (scale image to fill visible area)
  const computeFitZoom = useCallback(() => {
    if (!containerRef.current || naturalSize.width === 0) return 1
    const c = containerRef.current
    // Allow scaling up so image fills the container on small screens
    return Math.min(c.clientWidth / naturalSize.width, c.clientHeight / naturalSize.height)
  }, [naturalSize])

  const effectiveZoom = zoom === FIT_ZOOM ? computeFitZoom() : zoom

  // Reset on image change or reading order mode change
  useEffect(() => {
    setZoom(FIT_ZOOM)
    setPanOffset({ x: 0, y: 0 })
    setSmooth(false)
  }, [imageDataUrl])

  // Reset reading order state when entering/exiting edit mode
  useEffect(() => {
    if (readingOrderEditMode) {
      setAssignedOrder(new Map())
      setNextOrderNumber(1)
    }
  }, [readingOrderEditMode])

  // Track image natural size
  useEffect(() => {
    const updateSize = () => {
      if (imgRef.current) {
        setImgSize({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight })
        setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight })
      }
    }
    const img = imgRef.current
    if (img) { img.addEventListener('load', updateSize); updateSize() }
    window.addEventListener('resize', updateSize)
    let obs: ResizeObserver | null = null
    if (img) { obs = new ResizeObserver(updateSize); obs.observe(img) }
    // Also observe the container so fit-zoom recalculates when it gets a real size
    let containerObs: ResizeObserver | null = null
    if (containerRef.current) {
      containerObs = new ResizeObserver(() => {
        // Force re-render so computeFitZoom uses the new container size
        if (imgRef.current) {
          setImgSize({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight })
        }
      })
      containerObs.observe(containerRef.current)
    }
    return () => { img?.removeEventListener('load', updateSize); window.removeEventListener('resize', updateSize); obs?.disconnect(); containerObs?.disconnect() }
  }, [imageDataUrl])

  // Spacebar held = temporary pan mode
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); setSpaceHeld(true) } }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); setSpaceHeld(false) } }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const activeMode: InteractionMode = spaceHeld ? 'pan' : mode

  const scaleX = useMemo(() => naturalSize.width > 0 ? imgSize.width / naturalSize.width : 1, [imgSize.width, naturalSize.width])
  const scaleY = useMemo(() => naturalSize.height > 0 ? imgSize.height / naturalSize.height : 1, [imgSize.height, naturalSize.height])

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // ─── Touch gesture helpers ───
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getTouchCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  })

  // ─── Zoom towards a point ───
  // When zooming, keep the point under the cursor fixed in place.
  const zoomTowards = useCallback((clientX: number, clientY: number, newZoom: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    // Mouse position relative to container center
    const mx = clientX - rect.left - rect.width / 2
    const my = clientY - rect.top - rect.height / 2

    const oldZoom = zoom === FIT_ZOOM ? computeFitZoom() : zoom
    const ratio = newZoom / oldZoom

    // Adjust pan so the point under cursor stays fixed
    const newPan = {
      x: mx - ratio * (mx - panOffsetRef.current.x),
      y: my - ratio * (my - panOffsetRef.current.y),
    }

    setSmooth(false)
    setZoom(newZoom)
    setPanOffset(newPan)
  }, [zoom, computeFitZoom])

  // ─── Wheel zoom (cursor-centered, no modifier needed) ───
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      // Pinch zoom on trackpad sends ctrlKey + deltaY
      // Regular wheel also zooms (natural for image viewers)
      e.preventDefault()

      const factor = e.ctrlKey
        ? 1 - e.deltaY * 0.01   // trackpad pinch (fine)
        : 1 - e.deltaY * 0.003  // mouse wheel (coarser)

      const oldZ = zoom === FIT_ZOOM ? computeFitZoom() : zoom
      const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZ * factor))
      zoomTowards(e.clientX, e.clientY, newZ)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [zoom, computeFitZoom, zoomTowards])

  // ─── Double-click: zoom in 2x or reset ───
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const oldZ = zoom === FIT_ZOOM ? computeFitZoom() : zoom
    if (oldZ > computeFitZoom() * 1.1) {
      // Already zoomed in — reset to fit
      setSmooth(true)
      setZoom(FIT_ZOOM)
      setPanOffset({ x: 0, y: 0 })
      setTimeout(() => setSmooth(false), 300)
    } else {
      // Zoom in 2x towards cursor
      const newZ = Math.min(MAX_ZOOM, oldZ * 2)
      setSmooth(true)
      zoomTowards(e.clientX, e.clientY, newZ)
      setTimeout(() => setSmooth(false), 300)
    }
  }, [zoom, computeFitZoom, zoomTowards])

  // Displayed image dimensions (needed before hooks that depend on them)
  const displayedWidth = naturalSize.width * effectiveZoom
  const displayedHeight = naturalSize.height * effectiveZoom

  // ─── Image offset within viewer (centering + pan) ───
  const getImgOffsetInViewer = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const cw = containerRef.current.clientWidth
    const ch = containerRef.current.clientHeight
    return {
      x: (cw - displayedWidth) / 2 + panOffset.x,
      y: (ch - displayedHeight) / 2 + panOffset.y,
    }
  }, [displayedWidth, displayedHeight, panOffset])

  // ─── Perspective corner hit-test helper (viewer-relative coords) ───
  // Use effectiveZoom directly (not scaleX/scaleY from ResizeObserver) for consistency with SVG overlay
  const hitTestPerspCorner = useCallback((viewerPos: { x: number; y: number }): string | null => {
    if (!perspectiveCorners) return null
    const off = getImgOffsetInViewer()
    const hitRadius = 22 // pixels — generous for usability
    const corners = [
      { key: 'topLeft', pt: perspectiveCorners.topLeft },
      { key: 'topRight', pt: perspectiveCorners.topRight },
      { key: 'bottomRight', pt: perspectiveCorners.bottomRight },
      { key: 'bottomLeft', pt: perspectiveCorners.bottomLeft },
    ]
    for (const { key, pt } of corners) {
      const dx = viewerPos.x - (off.x + pt.x * effectiveZoom)
      const dy = viewerPos.y - (off.y + pt.y * effectiveZoom)
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) return key
    }
    return null
  }, [perspectiveCorners, effectiveZoom, getImgOffsetInViewer])

  // ─── Get position relative to viewer container ───
  const getViewerRelativePos = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // ─── Mouse interactions ───
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    // Perspective corner drag takes priority (use viewer-relative coords)
    if (perspectiveMode && perspectiveCorners && onPerspectiveCornersChange) {
      const viewerPos = getViewerRelativePos(e)
      const hit = hitTestPerspCorner(viewerPos)
      if (hit) {
        setPerspDragging(hit)
        return
      }
    }
    if (activeMode === 'pan') {
      setIsPanning(true)
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }
    } else if (activeMode === 'select' && onRegionSelect) {
      const pos = getRelativePos(e)
      setDragStart(pos)
      setDragCurrent(pos)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Perspective corner dragging (convert viewer coords → natural image coords)
    if (perspDragging && perspectiveCorners && onPerspectiveCornersChange) {
      const viewerPos = getViewerRelativePos(e)
      const off = getImgOffsetInViewer()
      const x = Math.max(0, Math.min(naturalSize.width, Math.round((viewerPos.x - off.x) / effectiveZoom)))
      const y = Math.max(0, Math.min(naturalSize.height, Math.round((viewerPos.y - off.y) / effectiveZoom)))
      onPerspectiveCornersChange({ ...perspectiveCorners, [perspDragging]: { x, y } })
      return
    }
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      })
    } else if (dragStart) {
      setDragCurrent(getRelativePos(e))
    }
  }

  const handleMouseUp = () => {
    if (perspDragging) { setPerspDragging(null); return }
    if (isPanning) { setIsPanning(false); return }
    if (dragStart && dragCurrent && onRegionSelect) {
      const x1 = Math.min(dragStart.x, dragCurrent.x) / scaleX
      const y1 = Math.min(dragStart.y, dragCurrent.y) / scaleY
      const x2 = Math.max(dragStart.x, dragCurrent.x) / scaleX
      const y2 = Math.max(dragStart.y, dragCurrent.y) / scaleY
      const bbox: BoundingBox = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
      if (bbox.width >= 15 && bbox.height >= 15) onRegionSelect(bbox)
    }
    setDragStart(null)
    setDragCurrent(null)
  }

  // ─── Zoom button handlers ───
  const handleZoomIn = () => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const oldZ = zoom === FIT_ZOOM ? computeFitZoom() : zoom
    setSmooth(true)
    zoomTowards(cx, cy, Math.min(MAX_ZOOM, oldZ * 1.4))
    setTimeout(() => setSmooth(false), 250)
  }

  const handleZoomOut = () => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const oldZ = zoom === FIT_ZOOM ? computeFitZoom() : zoom
    setSmooth(true)
    zoomTowards(cx, cy, Math.max(MIN_ZOOM, oldZ / 1.4))
    setTimeout(() => setSmooth(false), 250)
  }

  const handleZoomReset = () => {
    setSmooth(true)
    setZoom(FIT_ZOOM)
    setPanOffset({ x: 0, y: 0 })
    setTimeout(() => setSmooth(false), 300)
  }

  // Preset zoom levels
  const handleZoom100 = () => {
    setSmooth(true)
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
    setTimeout(() => setSmooth(false), 300)
  }

  // ─── Touch interactions ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2) {
      // Pinch zoom start
      const dist = getTouchDistance(e.touches)
      const center = getTouchCenter(e.touches)
      const currentZoom = zoom === FIT_ZOOM ? computeFitZoom() : zoom
      touchStartRef.current = {
        x: center.x,
        y: center.y,
        dist,
        zoom: currentZoom,
      }
    } else if (e.touches.length === 1) {
      // Single touch pan start
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setIsPanning(true)
      panStartRef.current = { x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y }
    }
  }, [zoom, computeFitZoom, panOffset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2) {
      // Pinch zoom
      const dist = getTouchDistance(e.touches)
      if (touchStartRef.current.dist > 0) {
        const scale = dist / touchStartRef.current.dist
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, touchStartRef.current.zoom * scale))
        const container = containerRef.current
        if (container) {
          // Zoom towards the center point between the two fingers
          zoomTowards(touchStartRef.current.x, touchStartRef.current.y, newZoom)
        }
      }
    } else if (e.touches.length === 1 && isPanning) {
      // Pan with single touch
      setPanOffset({
        x: e.touches[0].clientX - panStartRef.current.x,
        y: e.touches[0].clientY - panStartRef.current.y,
      })
    }
  }, [isPanning, zoomTowards])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 0) {
      // All touches released
      setIsPanning(false)
      touchStartRef.current = { x: 0, y: 0, dist: 0, zoom: 1 }
      lastTouchRef.current = { x: 0, y: 0 }
    }
  }, [])

  // ─── Memoized overlay elements ───
  const pageBlockOverlays = useMemo(() => {
    if (!pageBlocks) return null
    return pageBlocks.map((block, i) => (
      <div
        key={`pb-${i}`}
        className={`page-block-box ${selectedPageBlock === block ? 'selected' : ''}`}
        style={{
          left: block.x * scaleX, top: block.y * scaleY,
          width: block.width * scaleX, height: block.height * scaleY,
        }}
        onClick={(e) => { e.stopPropagation(); onPageBlockSelect?.(block) }}
        title={`Block ${i + 1}`}
      />
    ))
  }, [pageBlocks, selectedPageBlock, scaleX, scaleY, onPageBlockSelect])

  const textBlockOverlays = useMemo(() => {
    return textBlocks.map((block, i) => {
      const conf = block.confidence ?? 0.5
      const confColor = showConfidence
        ? `hsla(${Math.round(conf * 120)}, 85%, 50%, 0.5)`
        : undefined
      const confBorder = showConfidence
        ? `2px solid hsla(${Math.round(conf * 120)}, 85%, 45%, 0.8)`
        : undefined

      const hasAssignedOrder = assignedOrder.has(i)
      const assignedNum = assignedOrder.get(i)

      return (
        <div
          key={i}
          className={`region-box ${selectedBlock === block ? 'selected' : ''} ${showTextOverlay ? 'region-box-text-overlay' : ''}`}
          style={{
            left: block.x * scaleX, top: block.y * scaleY,
            width: block.width * scaleX, height: block.height * scaleY,
            ...(confColor ? { background: confColor, border: confBorder } : {}),
          }}
          onClick={() => {
            if (readingOrderEditMode) {
              setAssignedOrder(prev => {
                const next = new Map(prev)
                next.set(i, nextOrderNumber)
                return next
              })
              setNextOrderNumber(prev => prev + 1)
            } else {
              onBlockSelect(block)
            }
          }}
          /* モバイル対応: コンテナの touchstart preventDefault により click が
             発火しないため、touchEnd でタップを検出して直接 onBlockSelect を呼ぶ */
          onTouchStart={(e) => {
            // タッチ開始位置を記録（パンとタップを区別するため）
            const touch = e.touches[0]
            ;(e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX)
            ;(e.currentTarget as HTMLElement).dataset.touchY = String(touch.clientY)
            ;(e.currentTarget as HTMLElement).dataset.touchTime = String(Date.now())
            e.stopPropagation()  // コンテナのパン開始を防止
          }}
          onTouchEnd={(e) => {
            const el = e.currentTarget as HTMLElement
            const startX = parseFloat(el.dataset.touchX || '0')
            const startY = parseFloat(el.dataset.touchY || '0')
            const startTime = parseInt(el.dataset.touchTime || '0', 10)
            const endTouch = e.changedTouches[0]
            const dx = Math.abs(endTouch.clientX - startX)
            const dy = Math.abs(endTouch.clientY - startY)
            const dt = Date.now() - startTime
            // 移動量が少なく短時間ならタップと判定
            if (dx < 15 && dy < 15 && dt < 500) {
              e.stopPropagation()
              e.preventDefault()
              if (readingOrderEditMode) {
                setAssignedOrder(prev => {
                  const next = new Map(prev)
                  next.set(i, nextOrderNumber)
                  return next
                })
                setNextOrderNumber(prev => prev + 1)
              } else {
                onBlockSelect(block)
              }
            }
          }}
          title={`${block.text}${showConfidence ? ` (${Math.round(conf * 100)}%)` : ''}`}
        >
          {readingOrderEditMode && (
            <div className="reading-order-badge-container">
              <div className={`reading-order-badge ${hasAssignedOrder ? 'assigned' : 'unassigned'}`}>
                {hasAssignedOrder ? assignedNum : '?'}
              </div>
            </div>
          )}
          {(showReadingOrder && !readingOrderEditMode) && (
            <span className="region-reading-order">{block.readingOrder}</span>
          )}
          {showTextOverlay && (
            <span
              className="region-text-label"
              style={{
                writingMode: block.height > block.width * 1.3 ? 'vertical-rl' : 'horizontal-tb',
                textOrientation: block.height > block.width * 1.3 ? 'mixed' : undefined,
              }}
            ><span className="region-text-label-inner">{block.text}</span></span>
          )}
        </div>
      )
    })
  }, [textBlocks, selectedBlock, showConfidence, showTextOverlay, showReadingOrder, scaleX, scaleY, onBlockSelect, readingOrderEditMode, assignedOrder, nextOrderNumber])

  // ─── Derived state ───
  const selectionRect = dragStart && dragCurrent ? {
    left: Math.min(dragStart.x, dragCurrent.x),
    top: Math.min(dragStart.y, dragCurrent.y),
    width: Math.abs(dragCurrent.x - dragStart.x),
    height: Math.abs(dragCurrent.y - dragStart.y),
  } : null

  const zoomPercent = Math.round(effectiveZoom * 100)
  const isFit = zoom === FIT_ZOOM
  const cursorStyle = perspDragging ? 'grabbing'
    : perspectiveMode ? 'default'
    : activeMode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair'

  const transformStyle: React.CSSProperties = {
    width: displayedWidth,
    height: displayedHeight,
    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
    transformOrigin: '0 0',
    position: 'relative',
    margin: 'auto',
    transition: smooth ? 'width 0.25s ease, height 0.25s ease, transform 0.25s ease' : 'none',
  }

  return (
    <div className="image-viewer-wrap">
      {/* Reading order edit bar */}
      {readingOrderEditMode && (
        <div className="reading-order-edit-bar">
          <span className="reading-order-edit-hint">
            {L(lang, {
              ja: 'ブロックを読み順にクリックしてください',
              en: 'Click blocks in reading order',
              'zh-CN': '按阅读顺序点击块',
              'zh-TW': '按閱讀順序點擊塊',
              ko: '읽기 순서대로 블록을 클릭하세요',
              la: 'Regionum lege ordinare',
              eo: 'Klaku blokojn en legordo',
              es: 'Haz clic en bloques en orden de lectura',
              de: 'Klicken Sie auf Blöcke in Leserichtung',
              ar: 'انقر على الكتل بترتيب القراءة',
              hi: 'पढ़ने के क्रम में ब्लॉक पर क्लिक करें',
              ru: 'Нажмите блоки в порядке чтения',
              el: 'Κάντε κλικ στα μπλοκ κατά σειρά ανάγνωσης',
              syc: 'ܠܡܨ ܒܠܘܟܐ ܒܣܕܪ ܩܪܝܢܐ',
            })}
          </span>
          <div className="reading-order-edit-buttons">
            {assignedOrder.size > 0 && (
              <button
                className="btn-reading-order-action"
                onClick={() => {
                  if (assignedOrder.size > 0) {
                    const lastIndex = Array.from(assignedOrder.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
                    if (lastIndex !== undefined) {
                      setAssignedOrder(prev => {
                        const next = new Map(prev)
                        next.delete(lastIndex)
                        return next
                      })
                      setNextOrderNumber(prev => Math.max(1, prev - 1))
                    }
                  }
                }}
                title={L(lang, {
                  ja: '最後の割り当てを取り消す',
                  en: 'Undo last',
                  'zh-CN': '撤销上一步',
                  'zh-TW': '取消上一步',
                  ko: '마지막 실행 취소',
                  la: 'Ultima praefatio delere',
                  eo: 'Malfari laste',
                  es: 'Deshacer último',
                  de: 'Letzten rückgängig machen',
                  ar: 'تراجع الأخير',
                  hi: 'अंतिम को पूर्ववत करें',
                  ru: 'Отменить последнее',
                  el: 'Αναίρεση τελευταίου',
                  syc: 'ܡܦܩܕ ܕܒܬܪ',
                })}
              >
                {L(lang, {
                  ja: '最後を取消',
                  en: 'Undo Last',
                  'zh-CN': '撤销',
                  'zh-TW': '撤銷',
                  ko: '취소',
                  la: 'Praefatio delere',
                  eo: 'Malfari',
                  es: 'Deshacer',
                  de: 'Rückgängig',
                  ar: 'تراجع',
                  hi: 'पूर्ववत',
                  ru: 'Отменить',
                  el: 'Αναίρεση',
                  syc: 'ܡܦܩܕ',
                })}
              </button>
            )}
            <button
              className="btn-reading-order-action"
              onClick={() => {
                setAssignedOrder(new Map())
                setNextOrderNumber(1)
              }}
              title={L(lang, {
                ja: 'すべての割り当てをクリア',
                en: 'Reset all assignments',
                'zh-CN': '重置所有分配',
                'zh-TW': '重設所有指派',
                ko: '모든 할당 초기화',
                la: 'Omnes abire',
                eo: 'Restarigi ĉiojn',
                es: 'Restablecer todo',
                de: 'Alles zurücksetzen',
                ar: 'إعادة تعيين الكل',
                hi: 'सभी को रीसेट करें',
                ru: 'Сбросить всё',
                el: 'Επαναφορά όλων',
                syc: 'ܩܘܡ ܕܡܕܡ ܕܠܐ',
              })}
            >
              {L(lang, {
                ja: 'リセット',
                en: 'Reset',
                'zh-CN': '重置',
                'zh-TW': '重設',
                ko: '초기화',
                la: 'Abire',
                eo: 'Restarigi',
                es: 'Restablecer',
                de: 'Zurücksetzen',
                ar: 'إعادة تعيين',
                hi: 'रीसेट',
                ru: 'Сброс',
                el: 'Επαναφορά',
                syc: 'ܩܘܡ',
              })}
            </button>
            <button
              className="btn-reading-order-action btn-reading-order-done"
              onClick={() => {
                if (onReadingOrderChange && assignedOrder.size > 0) {
                  const newBlocks = textBlocks.map((block, i) => ({
                    ...block,
                    readingOrder: assignedOrder.get(i) ?? block.readingOrder,
                  }))
                  onReadingOrderChange(newBlocks)
                }
              }}
              disabled={assignedOrder.size === 0}
            >
              {L(lang, {
                ja: '完了',
                en: 'Done',
                'zh-CN': '完成',
                'zh-TW': '完成',
                ko: '완료',
                la: 'Finis',
                eo: 'Farite',
                es: 'Hecho',
                de: 'Fertig',
                ar: 'تم',
                hi: 'पूर्ण',
                ru: 'Готово',
                el: 'Ολοκληρώθη',
                syc: 'ܓܡܪ',
              })}
            </button>
            <button
              className="btn-reading-order-action"
              onClick={() => {
                setAssignedOrder(new Map())
                setNextOrderNumber(1)
                onReadingOrderCancel?.()
              }}
            >
              {L(lang, {
                ja: 'キャンセル',
                en: 'Cancel',
                'zh-CN': '取消',
                'zh-TW': '取消',
                ko: '취소',
                la: 'Renuntiare',
                eo: 'Rezigni',
                es: 'Cancelar',
                de: 'Abbrechen',
                ar: 'إلغاء',
                hi: 'रद्द करें',
                ru: 'Отмена',
                el: 'Ακύρωση',
                syc: 'ܦܪܙܓܢܐ',
              })}
            </button>
          </div>
        </div>
      )}

      {/* Image container */}
      <div
        className="image-viewer"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: cursorStyle, overflow: 'hidden', touchAction: 'none' }}
      >
      {/* Zoom + mode controls — placed inside .image-viewer so absolute positioning is relative to image area */}
      {/* onTouchStart stopPropagation prevents parent pan/zoom handlers from stealing button taps on mobile */}
      <div className="zoom-controls" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
        {/* Reset / Fit */}
        <button
          className="btn-zoom btn-zoom-reset"
          onClick={handleZoomReset}
          title={L(lang, { ja: '画面に合わせる', en: 'Fit to view', 'zh-CN': '适应视图', 'zh-TW': '適應檢視', ko: '화면에 맞추기', la: 'Aptare', eo: 'Adapti', es: 'Ajustar', de: 'Einpassen', ar: 'ملاءمة', hi: 'फ़िट करें', ru: 'Вписать', el: 'Προσαρμογή', syc: 'ܚܒܘܫ' })}
          disabled={isFit && panOffset.x === 0 && panOffset.y === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
          </svg>
        </button>
        <span className="zoom-controls-sep" />
        {/* Zoom out / level / in */}
        <button className="btn-zoom" onClick={handleZoomOut} title={L(lang, { ja: '縮小', en: 'Zoom out', 'zh-CN': '缩小', 'zh-TW': '縮小', ko: '축소', la: 'Minuere', eo: 'Malpligrandigi', es: 'Alejar', de: 'Verkleinern', ar: 'تصغير', hi: 'छोटा करें', ru: 'Уменьшить', el: 'Σμίκρυνση', syc: 'ܙܥܘܪ' })}>−</button>
        <button className="zoom-level" onClick={handleZoom100} title={L(lang, { ja: '100%表示', en: 'Click for 100%', 'zh-CN': '点击100%', 'zh-TW': '點擊100%', ko: '100% 보기', la: '100%', eo: '100%', es: '100%', de: '100%', ar: '100%', hi: '100%', ru: '100%', el: '100%', syc: '100%' })}>{zoomPercent}%</button>
        <button className="btn-zoom" onClick={handleZoomIn} title={L(lang, { ja: '拡大', en: 'Zoom in', 'zh-CN': '放大', 'zh-TW': '放大', ko: '확대', la: 'Augere', eo: 'Pligrandigi', es: 'Acercar', de: 'Vergrößern', ar: 'تكبير', hi: 'बड़ा करें', ru: 'Увеличить', el: 'Μεγέθυνση', syc: 'ܪܒ' })}>+</button>
        <span className="zoom-controls-sep" />
        {/* Mode toggle */}
        <button
          className={`btn-zoom ${activeMode === 'pan' ? 'btn-zoom-active' : ''}`}
          onClick={() => setMode('pan')}
          title={L(lang, { ja: 'パンモード — ドラッグで移動（Space長押し）', en: 'Pan mode — drag to move (hold Space)', 'zh-CN': '平移模式 — 拖动移动（按住Space）', 'zh-TW': '平移模式 — 拖曳移動（按住Space）', ko: '팬 모드 — 드래그로 이동 (Space 길게 누르기)', la: 'Modus motus', eo: 'Pan-reĝimo', es: 'Modo panorámico', de: 'Schwenkmodus', ar: 'وضع التحريك', hi: 'पैन मोड', ru: 'Режим перемещения', el: 'Μετακίνηση', syc: 'ܫܢܝ' })}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-4 0v5" /><path d="M14 10V4a2 2 0 0 0-4 0v6" /><path d="M10 10.5V6a2 2 0 0 0-4 0v8a6 6 0 0 0 12 0v-2a2 2 0 0 0-4 0" />
          </svg>
        </button>
        {onRegionSelect && (
          <button
            className={`btn-zoom ${activeMode === 'select' && !spaceHeld ? 'btn-zoom-active' : ''}`}
            onClick={() => setMode('select')}
            title={L(lang, { ja: '領域選択 — ドラッグでOCR範囲を選択', en: 'Select region — drag to select area for OCR', 'zh-CN': '选择区域 — 拖动选择OCR范围', 'zh-TW': '選取區域 — 拖曳選取OCR範圍', ko: '영역 선택 — 드래그로 OCR 범위 선택', la: 'Regionem seligere', eo: 'Elekti regionon', es: 'Seleccionar región', de: 'Bereich auswählen', ar: 'تحديد المنطقة', hi: 'क्षेत्र चुनें', ru: 'Выбрать область', el: 'Επιλογή περιοχής', syc: 'ܓܒܝ ܐܬܪ' })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
            </svg>
          </button>
        )}
        {/* miwo-inspired overlay toggles */}
        {textBlocks.length > 0 && (
          <>
            <span className="zoom-controls-sep" />
            <button
              className={`btn-zoom ${showTextOverlay ? 'btn-zoom-active' : ''}`}
              onClick={() => setShowTextOverlay(prev => !prev)}
              title={L(lang, { ja: 'OCRテキストを画像上に表示', en: 'Show OCR text on image', 'zh-CN': '在图像上显示OCR文字', 'zh-TW': '在影像上顯示OCR文字', ko: '이미지에 OCR 텍스트 표시', la: 'Textum OCR ostendere', eo: 'Montri OCR-tekston', es: 'Mostrar texto OCR', de: 'OCR-Text anzeigen', ar: 'عرض نص OCR', hi: 'OCR पाठ दिखाएँ', ru: 'Показать текст OCR', el: 'Εμφάνιση κειμένου OCR', syc: 'ܚܘܝ ܟܬܒ OCR' })}
            >
              {/* □字 アイコン — テキストオーバーレイ */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="1" width="22" height="22" rx="2" />
                <text x="12" y="18" fontSize="15" fontWeight="700" fill="currentColor" stroke="none" fontFamily="serif" textAnchor="middle">字</text>
              </svg>
            </button>
            <button
              className={`btn-zoom ${showConfidence ? 'btn-zoom-active' : ''}`}
              onClick={() => setShowConfidence(prev => !prev)}
              title={L(lang, { ja: '信頼度ヒートマップ表示', en: 'Show confidence heatmap', 'zh-CN': '显示置信度热图', 'zh-TW': '顯示信賴度熱圖', ko: '신뢰도 히트맵 표시', la: 'Fiduciam ostendere', eo: 'Montri fidmapon', es: 'Mostrar confianza', de: 'Konfidenz-Heatmap', ar: 'عرض خريطة الثقة', hi: 'विश्वसनीयता हीटमैप', ru: 'Тепловая карта', el: 'Χάρτης εμπιστοσύνης', syc: 'ܚܘܝ ܬܘܟܠܢ' })}
            >
              {/* 温度計・棒グラフ風の信頼度アイコン */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="12" width="4" height="8" rx="1" fill="currentColor" opacity="0.3" />
                <rect x="10" y="7" width="4" height="13" rx="1" fill="currentColor" opacity="0.55" />
                <rect x="17" y="3" width="4" height="17" rx="1" fill="currentColor" opacity="0.85" />
              </svg>
            </button>
            <button
              className={`btn-zoom ${showReadingOrder ? 'btn-zoom-active' : ''}`}
              onClick={() => setShowReadingOrder(prev => !prev)}
              title={L(lang, { ja: '読み順表示', en: 'Show reading order', 'zh-CN': '显示阅读顺序', 'zh-TW': '顯示閱讀順序', ko: '읽기 순서 표시', la: 'Ordinem legendi ostendere', eo: 'Montri legordon', es: 'Mostrar orden', de: 'Lesereihenfolge', ar: 'عرض ترتيب القراءة', hi: 'पढ़ने का क्रम', ru: 'Порядок чтения', el: 'Σειρά ανάγνωσης', syc: 'ܚܘܝ ܣܕܪ ܩܪܝܢ' })}
            >
              {/* ①② 読み順アイコン */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6.5" strokeWidth="1.5" />
                <text x="8" y="11" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" fontFamily="sans-serif" textAnchor="middle">1</text>
                <circle cx="16" cy="16" r="6.5" strokeWidth="1.5" />
                <text x="16" y="19" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" fontFamily="sans-serif" textAnchor="middle">2</text>
              </svg>
            </button>
          </>
        )}
        {/* Image correction (画像補正) toggle */}
        {showAdjustButton && onAdjustToggle && (
          <>
            <span className="zoom-controls-sep" />
            <button
              className={`btn-zoom btn-zoom-adjust ${adjustActive ? 'btn-zoom-active' : ''}`}
              onClick={onAdjustToggle}
              title={adjustLabel ?? 'Adjust'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="14.5 2 18 6 7.5 16.5 4 17 4.5 13.5 14.5 2" />
              </svg>
              <span className="btn-zoom-label">{adjustLabel ?? 'Adjust'}</span>
            </button>
          </>
        )}
      </div>
        <div className="image-viewer-transform" style={transformStyle}>
          <img
            ref={imgRef}
            src={imageDataUrl}
            alt="OCR対象画像"
            className="viewer-image"
            draggable={false}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Overlays */}
          <div className="viewer-overlay" style={{ width: imgSize.width, height: imgSize.height }}>
            {pageBlockOverlays}
            {textBlockOverlays}
            {selectionRect && (
              <div className="drag-selection" style={{
                left: selectionRect.left, top: selectionRect.top,
                width: selectionRect.width, height: selectionRect.height,
              }} />
            )}
            {selectedRegion && !selectionRect && (
              <div className="region-selected-highlight" style={{
                left: selectedRegion.x * scaleX, top: selectedRegion.y * scaleY,
                width: selectedRegion.width * scaleX, height: selectedRegion.height * scaleY,
              }} />
            )}
          </div>
        </div>
        {/* Perspective crop overlay — rendered at viewer level to avoid clipping */}
        {perspectiveMode && perspectiveCorners && (() => {
          const cw = containerRef.current?.clientWidth ?? 0
          const ch = containerRef.current?.clientHeight ?? 0
          // Compute image offset within viewer (centering + pan)
          const ox = (cw - displayedWidth) / 2 + panOffset.x
          const oy = (ch - displayedHeight) / 2 + panOffset.y
          const cornerPt = (key: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => ({
            x: ox + perspectiveCorners[key].x * effectiveZoom,
            y: oy + perspectiveCorners[key].y * effectiveZoom,
          })
          const tl = cornerPt('topLeft'), tr = cornerPt('topRight')
          const br = cornerPt('bottomRight'), bl = cornerPt('bottomLeft')
          const pts = `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`
          return (
            <svg
              className="perspective-overlay-svg"
              style={{ position: 'absolute', left: 0, top: 0, width: cw, height: ch, pointerEvents: 'none', zIndex: 5 }}
              viewBox={`0 0 ${cw} ${ch}`}
            >
              <defs>
                <mask id="persp-mask">
                  <rect width={cw} height={ch} fill="white" />
                  <polygon points={pts} fill="black" />
                </mask>
              </defs>
              <rect width={cw} height={ch} fill="rgba(0,0,0,0.35)" mask="url(#persp-mask)" />
              <polygon points={pts} fill="none" stroke="#00b4d8" strokeWidth="2.5" />
              {/* Edge midpoint lines for visibility */}
              {[
                { key: 'topLeft' as const, pt: tl },
                { key: 'topRight' as const, pt: tr },
                { key: 'bottomRight' as const, pt: br },
                { key: 'bottomLeft' as const, pt: bl },
              ].map(({ key, pt }) => (
                <circle
                  key={key}
                  cx={pt.x}
                  cy={pt.y}
                  r={12}
                  fill={perspDragging === key ? '#ff6b6b' : '#00b4d8'}
                  stroke="#fff"
                  strokeWidth="2.5"
                  style={{ pointerEvents: 'all', cursor: perspDragging === key ? 'grabbing' : 'grab' }}
                />
              ))}
            </svg>
          )
        })()}
      </div>

      {/* Page info */}
      <div className="image-viewer-info">
        {totalPages != null && totalPages > 0 && (
          <span>page {(pageIndex ?? 0) + 1}/{totalPages}</span>
        )}
        {naturalSize.width > 0 && (
          <span>{naturalSize.width}×{naturalSize.height}px</span>
        )}
      </div>
    </div>
  )
}
