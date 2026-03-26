/**
 * サンプル画像タイル選択コンポーネント
 * オートモードでは現代・古典籍の両方のサンプルをビジュアルタイルで表示し、
 * クリックで選択→OCR処理を開始できる。
 * IIIF サンプルはクリック時にマニフェストURLをIIIFLoaderに渡す。
 */
import { useCallback } from 'react'
import type { OCRMode } from '../types/ocr'

interface SampleTileBase {
  id: string
  label: Record<string, string>
  description: Record<string, string>
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
    label: {
      ja: '蜘蛛の糸（現代）',
      en: 'Kumo no Ito (Modern)',
      'zh-CN': '蛛丝（现代）',
      'zh-TW': '蛛絲（現代）',
      ko: '거미줄 (현대)',
    },
    description: {
      ja: '芥川龍之介『蜘蛛の糸』— 活字印刷の現代日本語テキスト',
      en: 'Akutagawa Ryūnosuke "The Spider\'s Thread" — Modern printed Japanese text',
      'zh-CN': '芥川龙之介《蛛丝》— 现代印刷日语文本',
      'zh-TW': '芥川龍之介《蛛絲》— 現代印刷日語文本',
      ko: '아쿠타가와 류노스케 "거미줄" — 현대 인쇄 일본어 텍스트',
    },
    imagePath: '/kumonoito.png',
    fileName: 'kumonoito.png',
    mimeType: 'image/png',
    category: 'modern',
  },
  {
    type: 'local',
    id: 'taketori',
    label: {
      ja: '竹取物語（くずし字）',
      en: 'Taketori Monogatari (Kuzushiji)',
      'zh-CN': '竹取物语（草书）',
      'zh-TW': '竹取物語（草書）',
      ko: '다케토리 모노가타리 (흘림체)',
    },
    description: {
      ja: '竹取物語 — 国立国会図書館デジタルコレクション所蔵のくずし字写本',
      en: 'The Tale of the Bamboo Cutter — Kuzushiji manuscript from NDL Digital Collections',
      'zh-CN': '竹取物语 — 日本国立国会图书馆数字馆藏草书手稿',
      'zh-TW': '竹取物語 — 日本國立國會圖書館數位典藏草書手稿',
      ko: '다케토리 모노가타리 — NDL 디지털 컬렉션 흘림체 필사본',
    },
    imagePath: '/samples/kuzushiji-sample-taketori.jpg',
    fileName: 'kuzushiji-sample-taketori.jpg',
    mimeType: 'image/jpeg',
    category: 'koten',
  },
  {
    type: 'iiif',
    id: 'tamamizu',
    label: {
      ja: '玉水物語（IIIF・くずし字）',
      en: 'Tamamizu Monogatari (IIIF / Kuzushiji)',
      'zh-CN': '玉水物语（IIIF・草书）',
      'zh-TW': '玉水物語（IIIF・草書）',
      ko: '다마미즈 모노가타리 (IIIF / 흘림체)',
    },
    description: {
      ja: '玉水物語 — 京都大学附属図書館蔵・彩色挿図付きお伽草子写本（IIIF Presentation API）',
      en: 'The Tale of Tamamizu — Illustrated otogi-zōshi manuscript, Kyoto University Library (IIIF)',
      'zh-CN': '玉水物语 — 京都大学图书馆藏・彩色插图御伽草子写本（IIIF）',
      'zh-TW': '玉水物語 — 京都大學圖書館藏・彩色插圖御伽草子寫本（IIIF）',
      ko: '다마미즈 모노가타리 — 교토대학 도서관 소장 채색 삽화 오토기조시 (IIIF)',
    },
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

function L(lang: string, map: Record<string, string>): string {
  return map[lang] ?? map['en'] ?? map['ja'] ?? ''
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
        {L(lang, {
          ja: 'サンプル画像で試す:',
          en: 'Try with sample images:',
          'zh-CN': '使用示例图片试用:',
          'zh-TW': '使用範例圖片試用:',
          ko: '샘플 이미지로 사용해보기:',
        })}
      </div>
      <div className="sample-tile-grid">
        {visibleSamples.map(sample => (
          <button
            key={sample.id}
            className={`sample-tile sample-tile-${sample.category}`}
            onClick={() => handleTileClick(sample)}
            disabled={disabled}
            title={L(lang, sample.description)}
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
                  alt={L(lang, sample.label)}
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
                    ? L(lang, { ja: '現代活字', en: 'Modern Print', 'zh-CN': '现代印刷', 'zh-TW': '現代活字', ko: '현대 활자' })
                    : L(lang, { ja: 'くずし字', en: 'Kuzushiji', 'zh-CN': '草书', 'zh-TW': '草書', ko: '흘림체' })
                }
              </span>
            </div>
            <span className="sample-tile-title">{L(lang, sample.label)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
