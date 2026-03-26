/**
 * IIIF Manifest Loader Component
 * IIIFマニフェストURLを入力してIIIF画像をOCR用に読み込む
 */
import { useState, useCallback } from 'react'
import { L } from '../i18n'

interface IIIFLoaderProps {
  onImagesLoaded: (files: File[]) => void
  lang: string
  disabled?: boolean
}

interface IIIFCanvas {
  label: string
  imageUrl: string
  width: number
  height: number
}

/**
 * IIIF Presentation API v2/v3 のマニフェストから画像URLを抽出する
 */
function extractCanvases(manifest: Record<string, unknown>): IIIFCanvas[] {
  const canvases: IIIFCanvas[] = []

  // IIIF Presentation API v3
  if (manifest['@context'] === 'http://iiif.io/api/presentation/3/context.json'
    || (Array.isArray(manifest['@context']) && (manifest['@context'] as string[]).includes('http://iiif.io/api/presentation/3/context.json'))
    || manifest.type === 'Manifest') {
    const items = (manifest as Record<string, unknown[]>).items ?? []
    for (const canvas of items) {
      const c = canvas as Record<string, unknown>
      if (c.type !== 'Canvas') continue
      const label = extractLabel(c.label)
      const w = (c.width as number) ?? 0
      const h = (c.height as number) ?? 0
      const canvasItems = (c.items as Record<string, unknown>[]) ?? []
      for (const page of canvasItems) {
        const p = page as Record<string, unknown>
        const annotations = (p.items as Record<string, unknown>[]) ?? []
        for (const anno of annotations) {
          const a = anno as Record<string, unknown>
          const body = a.body as Record<string, unknown> | undefined
          if (body && (body.type === 'Image' || typeof body.id === 'string')) {
            const imageUrl = (body.id as string) ?? ''
            if (imageUrl) {
              canvases.push({ label, imageUrl, width: w, height: h })
            }
          }
        }
      }
    }
    return canvases
  }

  // IIIF Presentation API v2
  const sequences = (manifest as Record<string, unknown[]>).sequences ?? []
  for (const seq of sequences) {
    const s = seq as Record<string, unknown>
    const seqCanvases = (s.canvases as Record<string, unknown>[]) ?? []
    for (const canvas of seqCanvases) {
      const c = canvas as Record<string, unknown>
      const label = typeof c.label === 'string' ? c.label : extractLabel(c.label)
      const w = (c.width as number) ?? 0
      const h = (c.height as number) ?? 0
      const images = (c.images as Record<string, unknown>[]) ?? []
      for (const img of images) {
        const i = img as Record<string, unknown>
        const resource = i.resource as Record<string, unknown> | undefined
        if (resource) {
          // service から IIIF Image API URL を構築
          const service = resource.service as Record<string, unknown> | Record<string, unknown>[] | undefined
          let imageUrl = ''
          if (service) {
            const svc = Array.isArray(service) ? service[0] as Record<string, unknown> : service
            const svcId = (svc['@id'] as string) ?? (svc.id as string) ?? ''
            if (svcId) {
              // IIIF Image API: /full/max/0/default.jpg
              imageUrl = `${svcId.replace(/\/$/, '')}/full/max/0/default.jpg`
            }
          }
          if (!imageUrl) {
            imageUrl = (resource['@id'] as string) ?? (resource.id as string) ?? ''
          }
          if (imageUrl) {
            canvases.push({ label, imageUrl, width: w, height: h })
          }
        }
      }
    }
  }

  return canvases
}

/** IIIF v3 の label オブジェクトから文字列を抽出 */
function extractLabel(label: unknown): string {
  if (typeof label === 'string') return label
  if (label && typeof label === 'object') {
    const obj = label as Record<string, string[]>
    // { "ja": ["..."], "en": ["..."], "none": ["..."] } 形式
    const keys = Object.keys(obj)
    if (keys.length > 0) {
      const firstVal = obj[keys[0]]
      if (Array.isArray(firstVal) && firstVal.length > 0) return firstVal[0]
    }
  }
  return ''
}

export function IIIFLoader({ onImagesLoaded, lang, disabled }: IIIFLoaderProps) {
  const [showModal, setShowModal] = useState(false)
  const [manifestUrl, setManifestUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [canvases, setCanvases] = useState<IIIFCanvas[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [step, setStep] = useState<'input' | 'select'>('input')

  const handleFetchManifest = useCallback(async () => {
    if (!manifestUrl.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(manifestUrl.trim())
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const manifest = await res.json()
      const extracted = extractCanvases(manifest)
      if (extracted.length === 0) {
        throw new Error(L(lang, {
          ja: 'マニフェストから画像が見つかりませんでした',
          en: 'No images found in manifest',
        }))
      }
      setCanvases(extracted)
      setSelectedIndices(new Set(extracted.map((_, i) => i)))
      setStep('select')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [manifestUrl, lang])

  const handleToggle = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIndices(new Set(canvases.map((_, i) => i)))
  }, [canvases])

  const handleDeselectAll = useCallback(() => {
    setSelectedIndices(new Set())
  }, [])

  const handleLoadImages = useCallback(async () => {
    if (selectedIndices.size === 0) return
    setLoading(true)
    setError('')
    try {
      const selected = canvases.filter((_, i) => selectedIndices.has(i))
      const files: File[] = []
      for (let i = 0; i < selected.length; i++) {
        const canvas = selected[i]
        const res = await fetch(canvas.imageUrl)
        if (!res.ok) throw new Error(`Failed to load image ${i + 1}: HTTP ${res.status}`)
        const blob = await res.blob()
        const ext = blob.type.includes('png') ? 'png' : 'jpg'
        const name = canvas.label || `iiif-page-${i + 1}`
        const file = new File([blob], `${name}.${ext}`, { type: blob.type || 'image/jpeg' })
        files.push(file)
      }
      onImagesLoaded(files)
      setShowModal(false)
      setStep('input')
      setManifestUrl('')
      setCanvases([])
      setSelectedIndices(new Set())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [canvases, selectedIndices, onImagesLoaded])

  const handleClose = useCallback(() => {
    setShowModal(false)
    setStep('input')
    setError('')
    setLoading(false)
  }, [])

  return (
    <>
      <button
        className="btn btn-secondary iiif-trigger-btn"
        onClick={() => setShowModal(true)}
        disabled={disabled}
        title={L(lang, {
          ja: 'IIIFマニフェストURLから画像を読み込み',
          en: 'Load images from IIIF manifest URL',
        })}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
          <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
        </svg>
        {L(lang, {
          ja: 'IIIF画像を読み込む',
          en: 'Load IIIF Images',
          'zh-CN': '加载IIIF图像',
          'zh-TW': '載入IIIF圖像',
          ko: 'IIIF 이미지 불러오기',
          la: 'Imagines IIIF legere',
          eo: 'Ŝarĝi IIIF-bildojn',
          es: 'Cargar imágenes IIIF',
          de: 'IIIF-Bilder laden',
          ar: 'تحميل صور IIIF',
          hi: 'IIIF छवियाँ लोड करें',
          ru: 'Загрузить изображения IIIF',
          el: 'Φόρτωση εικόνων IIIF',
          syc: 'ܫܩܘܠ ܨܘ̈ܪܬܐ IIIF',
          cop: 'Ϣⲱⲡ ⲛⲛⲓⲕⲱⲛ IIIF',
          sa: 'IIIF चित्राणि आनयतु',
        })}
      </button>

      {showModal && (
        <div className="iiif-modal-overlay" onClick={handleClose}>
          <div className="iiif-modal" onClick={e => e.stopPropagation()}>
            <div className="iiif-modal-header">
              <h3>{L(lang, {
                ja: 'IIIF画像の読み込み',
                en: 'Load IIIF Images',
              })}</h3>
              <button className="iiif-modal-close" onClick={handleClose}>&times;</button>
            </div>

            {step === 'input' && (
              <div className="iiif-modal-body">
                <p className="iiif-description">
                  {L(lang, {
                    ja: 'IIIFマニフェストのURLを入力してください。Presentation API v2/v3に対応しています。',
                    en: 'Enter a IIIF manifest URL. Supports Presentation API v2 and v3.',
                  })}
                </p>
                <div className="iiif-input-row">
                  <input
                    type="url"
                    className="iiif-url-input"
                    placeholder="https://example.org/iiif/manifest.json"
                    value={manifestUrl}
                    onChange={e => setManifestUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetchManifest()}
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleFetchManifest}
                    disabled={loading || !manifestUrl.trim()}
                  >
                    {loading
                      ? L(lang, { ja: '読込中...', en: 'Loading...' })
                      : L(lang, { ja: '取得', en: 'Fetch' })
                    }
                  </button>
                </div>
                <p className="iiif-hint">
                  {L(lang, {
                    ja: '例: 国立国会図書館デジタルコレクション、国文学研究資料館、ColBase 等のIIIFマニフェストURL',
                    en: 'e.g. IIIF manifest URLs from NDL Digital Collections, NIJL, ColBase, etc.',
                  })}
                </p>
              </div>
            )}

            {step === 'select' && (
              <div className="iiif-modal-body">
                <div className="iiif-select-header">
                  <span>
                    {L(lang, {
                      ja: `${canvases.length}件の画像が見つかりました（${selectedIndices.size}件選択中）`,
                      en: `Found ${canvases.length} images (${selectedIndices.size} selected)`,
                    })}
                  </span>
                  <div className="iiif-select-actions">
                    <button className="btn btn-sm" onClick={handleSelectAll}>
                      {L(lang, { ja: '全選択', en: 'Select All' })}
                    </button>
                    <button className="btn btn-sm" onClick={handleDeselectAll}>
                      {L(lang, { ja: '全解除', en: 'Deselect All' })}
                    </button>
                  </div>
                </div>
                <div className="iiif-canvas-list">
                  {canvases.map((canvas, i) => (
                    <label key={i} className={`iiif-canvas-item ${selectedIndices.has(i) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(i)}
                        onChange={() => handleToggle(i)}
                      />
                      <span className="iiif-canvas-label">
                        {canvas.label || `Page ${i + 1}`}
                      </span>
                      {canvas.width > 0 && (
                        <span className="iiif-canvas-size">{canvas.width}×{canvas.height}</span>
                      )}
                    </label>
                  ))}
                </div>
                <div className="iiif-modal-footer">
                  <button className="btn btn-secondary" onClick={() => setStep('input')}>
                    {L(lang, { ja: '戻る', en: 'Back' })}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleLoadImages}
                    disabled={loading || selectedIndices.size === 0}
                  >
                    {loading
                      ? L(lang, { ja: '画像を取得中...', en: 'Downloading images...' })
                      : L(lang, {
                        ja: `${selectedIndices.size}件の画像を読み込む`,
                        en: `Load ${selectedIndices.size} image${selectedIndices.size !== 1 ? 's' : ''}`,
                      })
                    }
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="iiif-error">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
