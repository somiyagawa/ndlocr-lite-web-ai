/**
 * サンプル画像タイル選択コンポーネント
 * オートモードでは現代・古典籍の両方のサンプルをビジュアルタイルで表示し、
 * クリックで選択→OCR処理を開始できる。
 * IIIF サンプルはクリック時にマニフェストURLをIIIFLoaderに渡す。
 */
import { useCallback } from 'react'
import { t } from '../i18n'
import type { OCRMode } from '../types/ocr'

interface SampleTileBase {
  id: string
  category: 'modern' | 'koten'
}

interface LocalSampleTile extends SampleTileBase {
  type: 'local'
  imagePath: string
  fileName: string
  mimeType: string
}

interface IIIFSampleTile extends SampleTileBase {
  type: 'iiif'
  manifestUrl: string
  /** サムネイル表示用の画像URL（IIIF Image API or 静的画像） */
  thumbnailUrl: string
}

type SampleTile = LocalSampleTile | IIIFSampleTile

const SAMPLES: SampleTile[] = [
  {
    type: 'local',
    id: 'kumonoito',
    imagePath: '/kumonoito.png',
    fileName: 'kumonoito.png',
    mimeType: 'image/png',
    category: 'modern',
  },
  {
    type: 'local',
    id: 'taketori',
    imagePath: '/samples/kuzushiji-sample-taketori.jpg',
    fileName: 'kuzushiji-sample-taketori.jpg',
    mimeType: 'image/jpeg',
    category: 'koten',
  },
  {
    type: 'iiif',
    id: 'tamamizu',
    manifestUrl: 'https://rmda.kulib.kyoto-u.ac.jp/iiif/metadata_manifest/RB00013653/manifest.json',
    thumbnailUrl: 'https://rmda.kulib.kyoto-u.ac.jp/iiif/RB00013653/canvas/3/thumbnail',
    category: 'koten',
  },
]

interface SampleTileSelectorProps {
  ocrMode: OCRMode
  lang: string
  disabled: boolean
  onSampleSelected: (files: File[]) => Promise<void>
  onIIIFSampleSelected?: (manifestUrl: string) => void
}

export function SampleTileSelector({ ocrMode, lang, disabled, onSampleSelected, onIIIFSampleSelected }: SampleTileSelectorProps) {
  // 表示するサンプルをモードに応じてフィルタ
  const visibleSamples = ocrMode === 'auto'
    ? SAMPLES // オート: 全サンプル表示
    : ocrMode === 'koten'
      ? SAMPLES.filter(s => s.category === 'koten')
      : SAMPLES.filter(s => s.category === 'modern')

  const handleTileClick = useCallback(async (sample: SampleTile) => {
    if (sample.type === 'iiif') {
      onIIIFSampleSelected?.(sample.manifestUrl)
      return
    }
    try {
      const res = await fetch(sample.imagePath)
      const blob = await res.blob()
      const file = new File([blob], sample.fileName, { type: sample.mimeType })
      await onSampleSelected([file])
    } catch (error) {
      console.error('Failed to load sample:', error)
    }
  }, [onSampleSelected, onIIIFSampleSelected])

  return (
    <div className="sample-tile-container">
      <div className="sample-tile-label">
        {t(lang as any, 'samples.tryWith')}
      </div>
      <div className="sample-tile-grid">
        {visibleSamples.map(sample => (
          <button
            key={sample.id}
            className={`sample-tile sample-tile-${sample.category}`}
            onClick={() => handleTileClick(sample)}
            disabled={disabled}
            title={t(lang as any, `samples.${sample.id}Desc`)}
          >
            <div className="sample-tile-image-wrap">
              {sample.type === 'iiif' ? (
                <div className="sample-tile-iiif-placeholder">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
                  </svg>
                  <span className="sample-tile-iiif-text">IIIF</span>
                </div>
              ) : (
                <img
                  src={sample.imagePath}
                  alt={t(lang as any, `samples.${sample.id}Label`)}
                  className="sample-tile-image"
                  width={270}
                  height={180}
                  loading="lazy"
                />
              )}
              <span className={`sample-tile-badge sample-tile-badge-${sample.category}${sample.type === 'iiif' ? ' sample-tile-badge-iiif' : ''}`}>
                {sample.type === 'iiif'
                  ? 'IIIF'
                  : sample.category === 'modern'
                    ? t(lang as any, 'samples.modernPrint')
                    : t(lang as any, 'samples.kuzushiji')
                }
              </span>
            </div>
            <span className="sample-tile-title">{t(lang as any, `samples.${sample.id}Label`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
