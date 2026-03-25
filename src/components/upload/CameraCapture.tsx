import { useState, useRef, useCallback, useEffect } from 'react'
import { L } from '../../i18n'
import type { Language } from '../../i18n'
import type { Quadrilateral } from '../../utils/documentScanner'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  lang: Language
  disabled?: boolean
}

type ScanStep = 'camera' | 'adjusting' | 'processing'

export function CameraCapture({ onCapture, lang, disabled = false }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanStep, setScanStep] = useState<ScanStep>('camera')
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const [corners, setCorners] = useState<Quadrilateral | null>(null)
  const [draggingCorner, setDraggingCorner] = useState<keyof Quadrilateral | null>(null)
  const [enableDewarp, setEnableDewarp] = useState(false)
  const [enableSplit, setEnableSplit] = useState(false)
  const [scanMode, setScanMode] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const adjustCanvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(L(lang, {
          ja: 'このブラウザはカメラ機能をサポートしていません',
          en: 'Camera is not supported in this browser',
          'zh-CN': '此浏览器不支持摄像头功能',
          'zh-TW': '此瀏覽器不支援攝影機功能',
          ko: '이 브라우저는 카메라를 지원하지 않습니다',
          la: 'Camera in hoc navigatro non sustinetur',
          eo: 'Kamerao ne estas subtenata en ĉi tiu retumilo',
          es: 'La cámara no es compatible con este navegador',
          de: 'Kamera wird in diesem Browser nicht unterstützt',
          ar: 'الكاميرا غير مدعومة في هذا المتصفح',
          hi: 'इस ब्राउज़र में कैमरा समर्थित नहीं है',
          ru: 'Камера не поддерживается в этом браузере',
          el: 'Η κάμερα δεν υποστηρίζεται σε αυτό το πρόγραμμα περιήγησης',
          syc: 'ܡܨܠܡܢܐ ܠܐ ܡܫܬܡܥ ܒܦܦܐ ܗܕܐ',
          cop: 'ⲡⲉϩ ⲛⲧⲉ ⲥⲓⲛⲓ ⲛⲁⲓ ⲙⲙⲟⲛ ⲉⲓⲣⲉⲡⲟⲗⲓ',
          sa: 'छायाग्राहकः इस्मिन् ब्राउजरे न समर्थितः',
        }))
        return
      }

      // Request maximum resolution; on PCs this typically yields 1920x1080 (landscape).
      // On mobile, the facingMode determines which camera and orientation is used.
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
        audio: false,
      })
      setStream(mediaStream)
      setIsOpen(true)
      setScanStep('camera')
      setCapturedDataUrl(null)
      setCorners(null)

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(L(lang, {
          ja: 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラの使用を許可してください',
          en: 'Camera access denied. Please allow camera access in browser settings',
          'zh-CN': '相机访问被拒绝。请在浏览器设置中允许使用相机',
          'zh-TW': '攝影機存取被拒絕。請在瀏覽器設定中允許使用攝影機',
          ko: '카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 사용을 허용해주세요',
          la: 'Accessus camerae denegatus est',
          eo: 'Kameraalirado rifuzita. Bonvolu permesi kameraliron en retumilo-agordoj',
          es: 'Acceso a la cámara denegado. Permita el acceso en la configuración del navegador',
          de: 'Kamerazugriff verweigert. Bitte erlauben Sie den Zugriff in den Browsereinstellungen',
          ar: 'تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول في إعدادات المتصفح',
          hi: 'कैमरा एक्सेस अस्वीकृत। कृपया ब्राउज़र सेटिंग्स में कैमरा एक्सेस की अनुमति दें',
          ru: 'Доступ к камере запрещён. Разрешите использование камеры в настройках браузера',
          el: 'Η πρόσβαση στην κάμερα απορρίφθηκε. Ενεργοποιήστε την κάμερα στις ρυθμίσεις του προγράμματος περιήγησης',
          syc: 'ܐܬܟܠܝ ܡܡܛܝ ܠܡܨܠ̈ܡܢ. ܦܣ ܐܣܘ̈ܪ ܡܨܠ̈ܡܢ ܒܛܘ̈ܟܣ ܡܨܦ̈ܝܢ',
          cop: 'ⲙⲉⲧⲣⲉϩⲓ ⲙⲙⲁⲩ ⲛⲧⲉ ⲣⲁⲓ. ⲁⲗⲱ ⲣⲁⲓ ⲉϣⲁⲥ ⲛⲧⲉ ⲡⲉϩ ⲛⲧⲉ ⲣⲁⲓ ⲙⲓ ⲧⲩ.',
          sa: 'छायाग्राहकः प्रवेशः नीषिद्धः। कृपया ब्राउजर सेटिङ् मे अनुमत्या करोतु।',
        }))
      } else {
        setError(L(lang, {
          ja: 'カメラの起動に失敗しました',
          en: 'Failed to start camera',
          'zh-CN': '无法启动相机',
          'zh-TW': '無法啟動攝影機',
          ko: '카메라 시작에 실패했습니다',
          la: 'Camera incipere non potuit',
          eo: 'Malsukcesis lanĉi kameraon',
          es: 'Error al iniciar la cámara',
          de: 'Kamera konnte nicht gestartet werden',
          ar: 'فشل في تشغيل الكاميرا',
          hi: 'कैमरा शुरू करने में विफल',
          ru: 'Ошибка запуска камеры',
          el: 'Αποτυχία εκκίνησης κάμερας',
          syc: 'ܐܬܟܠܝ ܦܬܝܚܬ ܡܨܠܡܢܐ',
          cop: 'ⲙⲉⲧⲕⲟϣⲥ ⲛⲧⲉ ⲡⲉϩ ⲛⲧⲉ ⲥⲓⲛⲓ',
          sa: 'छायाग्राहकः प्रारम्भे विफलः',
        }))
      }
    }
  }, [lang, facingMode])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsOpen(false)
    setError(null)
    setScanStep('camera')
    setCapturedDataUrl(null)
    setCorners(null)
  }, [stream])

  const switchCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    setTimeout(() => startCamera(), 100)
  }, [stream, startCamera])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

    // Stop video stream after capture
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    if (scanMode) {
      // Enter scan adjustment mode
      setCapturedDataUrl(dataUrl)
      setScanStep('adjusting')

      // Auto-detect document edges
      import('../../utils/documentScanner').then(async (scanner) => {
        try {
          const detected = await scanner.detectDocument(dataUrl)
          setCorners(detected)
        } catch {
          // Fallback to full image
          const img = new Image()
          img.onload = () => {
            setCorners({
              topLeft: { x: 0, y: 0 },
              topRight: { x: img.width, y: 0 },
              bottomRight: { x: img.width, y: img.height },
              bottomLeft: { x: 0, y: img.height },
            })
          }
          img.src = dataUrl
        }
      })
    } else {
      // Direct capture mode (no scanning)
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
          const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' })
          onCapture(file)
          stopCamera()
        }
      }, 'image/jpeg', 0.92)
    }
  }, [onCapture, stopCamera, stream, scanMode])

  // Draw adjustment overlay when corners change
  useEffect(() => {
    if (scanStep !== 'adjusting' || !capturedDataUrl || !corners || !adjustCanvasRef.current) return

    const canvas = adjustCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Draw semi-transparent overlay outside document area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Clear the document area
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(corners.topLeft.x, corners.topLeft.y)
      ctx.lineTo(corners.topRight.x, corners.topRight.y)
      ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y)
      ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, 0, 0)
      ctx.restore()

      // Draw border lines
      ctx.strokeStyle = '#00b4d8'
      ctx.lineWidth = Math.max(2, Math.min(canvas.width, canvas.height) / 200)
      ctx.beginPath()
      ctx.moveTo(corners.topLeft.x, corners.topLeft.y)
      ctx.lineTo(corners.topRight.x, corners.topRight.y)
      ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y)
      ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
      ctx.closePath()
      ctx.stroke()

      // Draw corner handles
      const handleRadius = Math.max(8, Math.min(canvas.width, canvas.height) / 60)
      const cornerKeys: (keyof Quadrilateral)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']
      for (const key of cornerKeys) {
        const p = corners[key]
        ctx.beginPath()
        ctx.arc(p.x, p.y, handleRadius, 0, Math.PI * 2)
        ctx.fillStyle = draggingCorner === key ? '#ff6b6b' : '#00b4d8'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    img.src = capturedDataUrl
  }, [scanStep, capturedDataUrl, corners, draggingCorner])

  // Corner dragging handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!corners || !adjustCanvasRef.current) return

    const canvas = adjustCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY

    const hitRadius = Math.max(20, Math.min(canvas.width, canvas.height) / 30)
    const cornerKeys: (keyof Quadrilateral)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']

    for (const key of cornerKeys) {
      const c = corners[key]
      const dist = Math.sqrt((px - c.x) ** 2 + (py - c.y) ** 2)
      if (dist < hitRadius) {
        setDraggingCorner(key)
        ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
        return
      }
    }
  }, [corners])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingCorner || !corners || !adjustCanvasRef.current) return

    const canvas = adjustCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const px = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX))
    const py = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY))

    setCorners(prev => prev ? {
      ...prev,
      [draggingCorner]: { x: Math.round(px), y: Math.round(py) },
    } : prev)
  }, [draggingCorner, corners])

  const handlePointerUp = useCallback(() => {
    setDraggingCorner(null)
  }, [])

  // Apply scan and send result
  const applyScan = useCallback(async () => {
    if (!capturedDataUrl || !corners) return
    setScanStep('processing')

    try {
      const scanner = await import('../../utils/documentScanner')

      // 1. Perspective correction
      let resultUrl = await scanner.correctPerspective(capturedDataUrl, corners)

      // 2. Optional dewarp
      if (enableDewarp) {
        const img = new Image()
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.src = resultUrl
        })
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const ctx = tempCanvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const dewarped = scanner.dewarpPage(imageData)
        const outCanvas = document.createElement('canvas')
        outCanvas.width = dewarped.width
        outCanvas.height = dewarped.height
        outCanvas.getContext('2d')!.putImageData(dewarped, 0, 0)
        resultUrl = outCanvas.toDataURL('image/jpeg', 0.92)
      }

      // 3. Optional page split
      if (enableSplit) {
        const [rightPage, leftPage] = await scanner.splitDoublePageScan(resultUrl)
        // Send both pages (right first for Japanese reading order)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

        const rightBlob = await (await fetch(rightPage)).blob()
        const rightFile = new File([rightBlob], `scan-${timestamp}-R.jpg`, { type: 'image/jpeg' })
        onCapture(rightFile)

        const leftBlob = await (await fetch(leftPage)).blob()
        const leftFile = new File([leftBlob], `scan-${timestamp}-L.jpg`, { type: 'image/jpeg' })

        // Small delay so App processes first file
        setTimeout(() => onCapture(leftFile), 100)
      } else {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const blob = await (await fetch(resultUrl)).blob()
        const file = new File([blob], `scan-${timestamp}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
      }

      // Close
      setIsOpen(false)
      setScanStep('camera')
      setCapturedDataUrl(null)
      setCorners(null)
    } catch (err) {
      console.error('Scan processing error:', err)
      setError(L(lang, {
        ja: 'スキャン処理に失敗しました',
        en: 'Scan processing failed',
        'zh-CN': '扫描处理失败',
        'zh-TW': '掃描處理失敗',
        ko: '스캔 처리에 실패했습니다',
        la: 'Processus scantionis defecit',
        eo: 'Skanada pretigo malsukcesis',
        es: 'Error en el procesamiento del escaneo',
        de: 'Scan-Verarbeitung fehlgeschlagen',
        ar: 'فشل في معالجة المسح',
        hi: 'स्कैन प्रोसेसिंग विफल',
        ru: 'Ошибка обработки сканирования',
        el: 'Αποτυχία επεξεργασίας σάρωσης',
        syc: 'ܡܣܪܩ ܦ̈ܘ̈ܠ̈ܚ̈ܢ ܐܬ̈ܟ̈ܠ̈ܝ',
        cop: 'ⲙⲉⲧⲕⲟϣⲥ ⲛⲧⲉ ⲡⲥⲕⲁⲛ',
        sa: 'सर्वेक्षण-संस्करणे विफलम्',
      }))
      setScanStep('adjusting')
    }
  }, [capturedDataUrl, corners, enableDewarp, enableSplit, onCapture, lang])

  // Retake photo
  const retake = useCallback(() => {
    setCapturedDataUrl(null)
    setCorners(null)
    setScanStep('camera')
    startCamera()
  }, [startCamera])

  // Button to open camera (shown in upload area)
  if (!isOpen) {
    return (
      <>
        <button
          className="btn btn-secondary"
          onClick={startCamera}
          disabled={disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.3rem' }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {L(lang, {
            ja: 'カメラで撮影',
            en: 'Take Photo',
            'zh-CN': '拍照',
            'zh-TW': '拍照',
            ko: '사진 촬영',
            la: 'Photographare',
            eo: 'Fotografi',
            es: 'Tomar foto',
            de: 'Foto aufnehmen',
            ar: 'التقاط صورة',
            hi: 'फ़ोटो लें',
            ru: 'Сфотографировать',
            el: 'Λήψη φωτογραφίας',
            syc: 'ܨܘܪ ܒܡܨܠܡܢܐ',
            cop: 'ⲣⲁⲡ ⲛⲧⲉ ⲕⲁⲙⲉⲣⲁ',
            sa: 'छायाग्राहकेन छायां गृह्णातु',
          })}
        </button>
        {error && <p className="camera-error">{error}</p>}
      </>
    )
  }

  // ----- Camera viewfinder -----
  if (scanStep === 'camera') {
    return (
      <div className="camera-overlay">
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Scan mode indicator */}
        {scanMode && (
          <div className="scan-mode-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
            {L(lang, {
              ja: 'スキャンモード',
              en: 'Scan Mode',
              'zh-CN': '扫描模式',
              'zh-TW': '掃描模式',
              ko: '스캔 모드',
              la: 'Modus scantionis',
              eo: 'Skan-reĝimo',
              es: 'Modo escaneo',
              de: 'Scan-Modus',
              ar: 'وضع المسح',
              hi: 'स्कैन मोड',
              ru: 'Режим сканирования',
              el: 'Λειτουργία σάρωσης',
              syc: 'ܛܘ̈ܟ̈ܣ ܡ̈ܣ̈ܪ̈ܩ',
              cop: 'ⲧⲣⲟⲡⲟⲥ ⲛⲧⲉ ⲥⲕⲁⲛ',
              sa: 'सर्वेक्षण-विधिः',
            })}
          </div>
        )}

        {/* Scan mode corners overlay */}
        {scanMode && (
          <div className="scan-viewfinder">
            <div className="scan-corner scan-corner-tl" />
            <div className="scan-corner scan-corner-tr" />
            <div className="scan-corner scan-corner-bl" />
            <div className="scan-corner scan-corner-br" />
          </div>
        )}

        <div className="camera-controls">
          <button className="camera-btn camera-btn-close" onClick={stopCamera} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <button className="camera-btn camera-btn-capture" onClick={capturePhoto} aria-label="Capture">
            <div className="camera-shutter" />
          </button>

          <div className="camera-right-controls">
            <button className="camera-btn camera-btn-switch" onClick={switchCamera} aria-label="Switch camera">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 16V8a2 2 0 0 0-2-2h-3l-2-2H9L7 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z" />
                <path d="M12 11a2 2 0 1 0 0 4 2 2 0 1 0 0-4z" />
                <path d="M17 2l3 3-3 3" />
                <path d="M7 22l-3-3 3-3" />
              </svg>
            </button>

            <button
              className={`camera-btn camera-btn-scan-toggle ${scanMode ? 'active' : ''}`}
              onClick={() => setScanMode(prev => !prev)}
              aria-label="Toggle scan mode"
              title={L(lang, {
                ja: scanMode ? 'スキャンモード: ON' : 'スキャンモード: OFF',
                en: scanMode ? 'Scan mode: ON' : 'Scan mode: OFF',
              })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ----- Adjustment screen -----
  if (scanStep === 'adjusting' && capturedDataUrl) {
    return (
      <div className="camera-overlay scan-adjust-overlay">
        <div className="scan-adjust-container">
          <canvas
            ref={adjustCanvasRef}
            className="scan-adjust-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          {!corners && (
            <div className="scan-detecting">
              <div className="scan-spinner" />
              {L(lang, {
                ja: 'ドキュメントを検出中...',
                en: 'Detecting document...',
                'zh-CN': '正在检测文档...',
                'zh-TW': '正在偵測文件...',
                ko: '문서 감지 중...',
                la: 'Documentum detegit...',
                eo: 'Detektante dokumenton...',
                es: 'Detectando documento...',
                de: 'Dokument wird erkannt...',
                ar: 'جاري كشف المستند...',
                hi: 'दस्तावेज़ का पता लगा रहा है...',
                ru: 'Обнаружение документа...',
                el: 'Εντοπισμός εγγράφου...',
                syc: 'ܡ̈ܫ̈ܟ̈ܚ ܟ̈ܬ̈ܒ̈ܐ...',
                cop: 'ⲉⲩϩⲱⲣⲡ ⲙⲡⲓⲇⲟⲕⲩⲙⲉⲛⲧ...',
                sa: 'प्रलेखं अन्विष्यति...',
              })}
            </div>
          )}
        </div>

        <div className="scan-adjust-toolbar">
          <div className="scan-adjust-options">
            <label className="scan-option-label">
              <input
                type="checkbox"
                checked={enableDewarp}
                onChange={(e) => setEnableDewarp(e.target.checked)}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {L(lang, {
                ja: '湾曲補正',
                en: 'Dewarp',
                'zh-CN': '弯曲校正',
                'zh-TW': '彎曲校正',
                ko: '곡면 보정',
                la: 'Correctio curvaturae',
                eo: 'Kurbkorektado',
                es: 'Corregir curvatura',
                de: 'Krümmungskorrektur',
                ar: 'تصحيح الانحناء',
                hi: 'वक्रता सुधार',
                ru: 'Коррекция кривизны',
                el: 'Διόρθωση καμπυλότητας',
                syc: 'ܬ̈ܘ̈ܪ̈ܨ ܥ̈ܩ̈ܡ̈ܬ̈ܐ',
                cop: 'ⲡⲓⲥⲟⲩⲧⲉⲛ ⲛⲛⲓⲕⲟⲗⲡ',
                sa: 'वक्रता-संशोधनम्',
              })}
            </label>

            <label className="scan-option-label">
              <input
                type="checkbox"
                checked={enableSplit}
                onChange={(e) => setEnableSplit(e.target.checked)}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="3" x2="12" y2="21" />
                <rect x="2" y="3" width="20" height="18" rx="2" />
              </svg>
              {L(lang, {
                ja: 'ページ分割',
                en: 'Page Split',
                'zh-CN': '页面分割',
                'zh-TW': '頁面分割',
                ko: '페이지 분할',
                la: 'Divisio paginae',
                eo: 'Paĝdivido',
                es: 'Dividir páginas',
                de: 'Seitenteilung',
                ar: 'تقسيم الصفحة',
                hi: 'पेज विभाजन',
                ru: 'Разделение страниц',
                el: 'Διαχωρισμός σελίδας',
                syc: 'ܦ̈ܪ̈ܝ̈ܫ̈ ܦ̈ܪ̈ܖ̈ܝ̈ܐ',
                cop: 'ⲫⲱⲣϫ ⲛⲛⲓⲡⲁⲅⲉ',
                sa: 'पृष्ठ-विभाजनम्',
              })}
            </label>
          </div>

          <div className="scan-adjust-actions">
            <button className="btn btn-secondary" onClick={retake}>
              {L(lang, {
                ja: '撮り直す',
                en: 'Retake',
                'zh-CN': '重新拍摄',
                'zh-TW': '重新拍攝',
                ko: '다시 촬영',
                la: 'Rephotographare',
                eo: 'Refotografi',
                es: 'Repetir',
                de: 'Wiederholen',
                ar: 'إعادة التقاط',
                hi: 'पुनः लें',
                ru: 'Пересъёмка',
                el: 'Επανάληψη',
                syc: 'ܬ̈ܘ̈ܒ ܨ̈ܘ̈ܪ',
                cop: 'ⲉⲣⲡⲁⲗⲓⲛ',
                sa: 'पुनः गृह्णातु',
              })}
            </button>
            <button
              className="btn btn-primary"
              onClick={applyScan}
              disabled={!corners}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.3rem' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {L(lang, {
                ja: 'スキャン実行',
                en: 'Apply Scan',
                'zh-CN': '执行扫描',
                'zh-TW': '執行掃描',
                ko: '스캔 적용',
                la: 'Exsecutio scantionis',
                eo: 'Apliki skanon',
                es: 'Aplicar escaneo',
                de: 'Scan anwenden',
                ar: 'تطبيق المسح',
                hi: 'स्कैन लागू करें',
                ru: 'Применить скан',
                el: 'Εφαρμογή σάρωσης',
                syc: 'ܣ̈ܥ̈ܘ̈ܪ ܡ̈ܣ̈ܪ̈ܩ',
                cop: 'ⲁⲣⲓⲥⲕⲁⲛ',
                sa: 'सर्वेक्षणं कुरुत',
              })}
            </button>
          </div>
        </div>

        {error && <p className="camera-error" style={{ position: 'absolute', bottom: '80px' }}>{error}</p>}
      </div>
    )
  }

  // ----- Processing screen -----
  if (scanStep === 'processing') {
    return (
      <div className="camera-overlay scan-processing-overlay">
        <div className="scan-processing-content">
          <div className="scan-spinner-large" />
          <p>
            {L(lang, {
              ja: 'スキャン処理中...',
              en: 'Processing scan...',
              'zh-CN': '正在处理扫描...',
              'zh-TW': '正在處理掃描...',
              ko: '스캔 처리 중...',
              la: 'Processans...',
              eo: 'Prilaboras skanon...',
              es: 'Procesando escaneo...',
              de: 'Scan wird verarbeitet...',
              ar: 'جاري معالجة المسح...',
              hi: 'स्कैन प्रोसेस हो रहा है...',
              ru: 'Обработка скана...',
              el: 'Επεξεργασία σάρωσης...',
              syc: 'ܦ̈ܠ̈ܛ̈ ܡ̈ܣ̈ܪ̈ܩ...',
              cop: 'ⲉⲩⲉⲣϩⲱⲃ ⲙⲡⲓⲥⲕⲁⲛ...',
              sa: 'सर्वेक्षणं संस्क्रियते...',
            })}
          </p>
        </div>
      </div>
    )
  }

  return null
}
