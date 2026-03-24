import { useState, useRef, useCallback } from 'react'
import { L } from '../../i18n'
import type { Language } from '../../i18n'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  lang: Language
  disabled?: boolean
}

export function CameraCapture({ onCapture, lang, disabled = false }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      // Check if camera API is available
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
        }))
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 2048 },
          height: { ideal: 2048 },
        },
        audio: false,
      })
      setStream(mediaStream)
      setIsOpen(true)

      // Attach to video element after state update
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
  }, [stream])

  const switchCamera = useCallback(() => {
    // Stop current stream and restart with different facing mode
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    // Will restart via useEffect or manual trigger
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

    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        stopCamera()
      }
    }, 'image/jpeg', 0.92)
  }, [onCapture, stopCamera])

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
          })}
        </button>
        {error && <p className="camera-error">{error}</p>}
      </>
    )
  }

  // Full-screen camera viewfinder
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

        <button className="camera-btn camera-btn-switch" onClick={switchCamera} aria-label="Switch camera">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 16V8a2 2 0 0 0-2-2h-3l-2-2H9L7 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z" />
            <path d="M12 11a2 2 0 1 0 0 4 2 2 0 1 0 0-4z" />
            <path d="M17 2l3 3-3 3" />
            <path d="M7 22l-3-3 3-3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
