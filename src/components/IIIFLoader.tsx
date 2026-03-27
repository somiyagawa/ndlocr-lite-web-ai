/**
 * IIIF Manifest Loader Component
 * IIIFマニフェストURLを入力してIIIF画像をOCR用に読み込む
 *
 * 対応:
 * - IIIF Presentation API v2 (sc:Manifest)
 * - IIIF Presentation API v3 (type: "Manifest")
 * - IIIF Image API size fallback: full/max → full/1024, → resource @id
 * - 並列ダウンロード（concurrency 制御付き）
 * - AbortController によるキャンセル
 * - ダウンロード進捗表示
 */
import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { L, type Language } from '../i18n'

/** 外部から IIIFLoader を制御するためのハンドル */
export interface IIIFLoaderHandle {
  /** モーダルを開き、指定URLでマニフェストを自動取得する */
  openWithUrl: (url: string) => void
}

interface IIIFLoaderProps {
  onImagesLoaded: (files: File[]) => void
  lang: Language
  disabled?: boolean
}

interface IIIFCanvas {
  label: string
  /** IIIF Image API service URL (末尾スラッシュなし) or 直接画像URL */
  imageServiceUrl: string
  /** resource/@id or body.id — service がない場合のフォールバック */
  directImageUrl: string
  width: number
  height: number
}

/** 並列実行数の上限 */
const MAX_CONCURRENCY = 4

/**
 * IIIF Presentation API v2/v3 のマニフェストから画像URLを抽出する
 */
function extractCanvases(manifest: Record<string, unknown>): IIIFCanvas[] {
  const canvases: IIIFCanvas[] = []

  // IIIF Presentation API v3
  if (isV3Manifest(manifest)) {
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
          if (!body) continue
          // v3: body.type === 'Image' を厳密にチェック
          if (body.type !== 'Image') continue
          const directUrl = (body.id as string) ?? ''
          // v3 の service から Image API URL を取得
          const serviceUrl = extractServiceUrl(body.service)
          if (directUrl || serviceUrl) {
            canvases.push({
              label,
              imageServiceUrl: serviceUrl,
              directImageUrl: directUrl,
              width: w,
              height: h,
            })
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
        if (!resource) continue
        const directUrl = (resource['@id'] as string) ?? (resource.id as string) ?? ''
        const serviceUrl = extractServiceUrl(resource.service)
        if (directUrl || serviceUrl) {
          canvases.push({
            label,
            imageServiceUrl: serviceUrl,
            directImageUrl: directUrl,
            width: w,
            height: h,
          })
        }
      }
    }
  }

  return canvases
}

/** v3 マニフェスト判定 */
function isV3Manifest(manifest: Record<string, unknown>): boolean {
  const ctx = manifest['@context']
  if (ctx === 'http://iiif.io/api/presentation/3/context.json') return true
  if (Array.isArray(ctx) && (ctx as string[]).includes('http://iiif.io/api/presentation/3/context.json')) return true
  return manifest.type === 'Manifest'
}

/** service プロパティから IIIF Image API の base URL を抽出 */
function extractServiceUrl(service: unknown): string {
  if (!service) return ''
  const svc = (Array.isArray(service) ? service[0] : service) as Record<string, unknown>
  const svcId = (svc?.['@id'] as string) ?? (svc?.id as string) ?? ''
  return svcId ? svcId.replace(/\/$/, '') : ''
}

/** IIIF v3 の label オブジェクトから文字列を抽出 */
function extractLabel(label: unknown): string {
  if (typeof label === 'string') return label
  if (label && typeof label === 'object') {
    const obj = label as Record<string, string[]>
    // { "ja": ["..."], "en": ["..."], "none": ["..."] } 形式 — ja を優先
    for (const key of ['ja', 'en', 'none', ...Object.keys(obj)]) {
      const val = obj[key]
      if (Array.isArray(val) && val.length > 0) return val[0]
    }
  }
  return ''
}

/** ファイル名に使えない文字を除去 */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || 'untitled'
}

/** 画像blobのバリデーション（マジックバイトチェック） */
async function isValidImageBlob(blob: Blob): Promise<boolean> {
  if (blob.size < 100) return false
  // Content-Type が明示的に非画像なら拒否
  if (blob.type && !blob.type.startsWith('image/')) return false
  try {
    const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
    // JPEG: FF D8 FF
    if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) return true
    // PNG: 89 50 4E 47
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return true
    // GIF: 47 49 46
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) return true
    // WebP (RIFF): 52 49 46 46
    if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) return true
    // TIFF: 49 49 or 4D 4D
    if ((header[0] === 0x49 && header[1] === 0x49) || (header[0] === 0x4D && header[1] === 0x4D)) return true
    // BMP: 42 4D
    if (header[0] === 0x42 && header[1] === 0x4D) return true
    // Content-Type が image/ なら信頼する（マジックバイト未知の形式）
    if (blob.type.startsWith('image/')) return true
    return false
  } catch {
    return false
  }
}

/**
 * IIIF Image API のサイズ交渉:
 * 多くのサーバーは full/max を拒否する（NDL含む）ため、段階的にフォールバック:
 * 1. full/max/0/default.jpg
 * 2. full/1024,/0/default.jpg （OCR には十分な解像度）
 * 3. directImageUrl そのまま
 */
async function fetchImageWithFallback(
  canvas: IIIFCanvas,
  signal: AbortSignal
): Promise<Blob> {
  const urls: string[] = []

  if (canvas.imageServiceUrl) {
    urls.push(`${canvas.imageServiceUrl}/full/max/0/default.jpg`)
    // 幅 2048px — OCR解像度として十分、かつ多くのサーバーで許可される
    urls.push(`${canvas.imageServiceUrl}/full/2048,/0/default.jpg`)
    urls.push(`${canvas.imageServiceUrl}/full/1024,/0/default.jpg`)
  }
  if (canvas.directImageUrl && !urls.includes(canvas.directImageUrl)) {
    urls.push(canvas.directImageUrl)
  }

  let lastError: Error = new Error('No image URLs available')
  for (const url of urls) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    try {
      const res = await fetch(url, { signal, mode: 'cors' })
      if (!res.ok) { lastError = new Error(`HTTP ${res.status}`); continue }
      const blob = await res.blob()
      // 画像バリデーション: Content-Type + マジックバイトチェック
      if (await isValidImageBlob(blob)) return blob
      lastError = new Error('Invalid image data')
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      lastError = e as Error
    }
  }
  throw lastError
}

/**
 * 並列実行ヘルパー（concurrency 制限付き、チャンク方式）
 * JS はシングルスレッドだが、意図を明確にするためチャンク分割で実装
 */
async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let completed = 0

  for (let start = 0; start < items.length; start += concurrency) {
    const chunk = items.slice(start, Math.min(start + concurrency, items.length))
    await Promise.all(
      chunk.map(async (item, offset) => {
        const idx = start + offset
        results[idx] = await fn(item, idx)
        completed++
        onProgress?.(completed, items.length)
      })
    )
  }
  return results
}


export const IIIFLoader = forwardRef<IIIFLoaderHandle, IIIFLoaderProps>(function IIIFLoader({ onImagesLoaded, lang, disabled }, ref) {
  const [showModal, setShowModal] = useState(false)
  const [manifestUrl, setManifestUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [canvases, setCanvases] = useState<IIIFCanvas[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [step, setStep] = useState<'input' | 'select'>('input')
  const [downloadProgress, setDownloadProgress] = useState({ done: 0, total: 0 })
  const abortRef = useRef<AbortController | null>(null)

  const fetchManifestByUrl = useCallback(async (urlToFetch: string) => {
    const url = urlToFetch.trim()
    if (!url) return
    setLoading(true)
    setError('')
    abortRef.current = new AbortController()
    try {
      const res = await fetch(url, { signal: abortRef.current.signal, mode: 'cors' })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      // Content-Type チェックは緩和: text/plain 等で返すサーバーもある
      // JSON パースで判定し、失敗時にエラーを出す
      let manifest: Record<string, unknown>
      try {
        manifest = await res.json()
      } catch {
        throw new Error(L(lang, {
          ja: 'JSONではないレスポンスが返されました。URLがIIIFマニフェストか確認してください。',
          en: 'Response is not JSON. Please verify the URL points to a IIIF manifest.',
        }))
      }

      // IIIF Collection 判定
      if (manifest['@type'] === 'sc:Collection' || manifest.type === 'Collection') {
        throw new Error(L(lang, {
          ja: 'このURLはIIIFコレクションです。個別のマニフェストURLを入力してください。',
          en: 'This URL is a IIIF Collection. Please enter a specific manifest URL.',
        }))
      }

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
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message)
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [lang])

  const handleFetchManifest = useCallback(async () => {
    await fetchManifestByUrl(manifestUrl)
  }, [manifestUrl, fetchManifestByUrl])

  // 外部から URL 指定でモーダルを開くハンドル
  useImperativeHandle(ref, () => ({
    openWithUrl: (url: string) => {
      setManifestUrl(url)
      setShowModal(true)
      setStep('input')
      setError('')
      // 次のレンダー後に自動フェッチ
      setTimeout(() => { fetchManifestByUrl(url) }, 50)
    },
  }), [fetchManifestByUrl])

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
    setDownloadProgress({ done: 0, total: selectedIndices.size })
    abortRef.current = new AbortController()

    try {
      const selected = canvases.filter((_, i) => selectedIndices.has(i))

      const files = await parallelMap(
        selected,
        async (canvas, i) => {
          if (!abortRef.current) throw new DOMException('Aborted', 'AbortError')
          const blob = await fetchImageWithFallback(canvas, abortRef.current.signal)
          const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
          const name = sanitizeFilename(canvas.label || `iiif-page-${i + 1}`)
          return new File([blob], `${name}.${ext}`, { type: blob.type || 'image/jpeg' })
        },
        MAX_CONCURRENCY,
        (done, total) => setDownloadProgress({ done, total }),
      )

      onImagesLoaded(files)
      // リセット
      setShowModal(false)
      setStep('input')
      setManifestUrl('')
      setCanvases([])
      setSelectedIndices(new Set())
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message)
      }
    } finally {
      setLoading(false)
      abortRef.current = null
      setDownloadProgress({ done: 0, total: 0 })
    }
  }, [canvases, selectedIndices, onImagesLoaded])

  const handleClose = useCallback(() => {
    abortRef.current?.abort()
    setShowModal(false)
    setStep('input')
    setError('')
    setLoading(false)
    setDownloadProgress({ done: 0, total: 0 })
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
                    ja: 'IIIF対応の画像コレクション（国立国会図書館デジタルコレクション、国文学研究資料館、ColBase等）からマニフェストURLを貼り付けて画像を読み込みます。Presentation API v2/v3に対応。',
                    en: 'Paste a manifest URL from any IIIF-compatible collection (NDL Digital Collections, NIJL, ColBase, etc.) to load images. Supports Presentation API v2 and v3.',
                  })}
                </p>
                <label className="iiif-input-label" htmlFor="iiif-manifest-url">{L(lang, {
                  ja: 'マニフェストURL',
                  en: 'Manifest URL',
                })}</label>
                <div className="iiif-input-row">
                  <input
                    id="iiif-manifest-url"
                    type="url"
                    className="iiif-url-input"
                    placeholder="https://www.dl.ndl.go.jp/api/iiif/1234567/manifest.json"
                    value={manifestUrl}
                    onChange={e => { setManifestUrl(e.target.value); setError('') }}
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
                    ja: 'NDLデジコレの場合: 資料ページURL末尾の数字が資料IDです → https://www.dl.ndl.go.jp/api/iiif/資料ID/manifest.json',
                    en: 'For NDL Digital Collections: the number at the end of the item page URL is the item ID → https://www.dl.ndl.go.jp/api/iiif/ITEM_ID/manifest.json',
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
                    <button className="btn btn-sm" onClick={handleSelectAll} disabled={loading}>
                      {L(lang, { ja: '全選択', en: 'Select All' })}
                    </button>
                    <button className="btn btn-sm" onClick={handleDeselectAll} disabled={loading}>
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
                        disabled={loading}
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
                  <button className="btn btn-secondary" onClick={() => { setStep('input'); setError('') }} disabled={loading}>
                    {L(lang, { ja: '戻る', en: 'Back' })}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleLoadImages}
                    disabled={loading || selectedIndices.size === 0}
                  >
                    {loading
                      ? L(lang, {
                        ja: `画像を取得中... ${downloadProgress.done}/${downloadProgress.total}`,
                        en: `Downloading... ${downloadProgress.done}/${downloadProgress.total}`,
                      })
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
})
