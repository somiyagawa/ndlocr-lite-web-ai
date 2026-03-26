/**
 * サンプル画像タイル選択コンポーネント
 * オートモードでは現代・古典籍の両方のサンプルをビジュアルタイルで表示し、
 * クリックで選択→OCR処理を開始できる。
 */
import { useCallback } from 'react'
import type { OCRMode } from '../types/ocr'

interface SampleTile {
  id: string
  label: Record<string, string>
  description: Record<string, string>
  imagePath: string
  fileName: string
  mimeType: string
  category: 'modern' | 'koten'
}

const SAMPLES: SampleTile[] = [
  {
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
    id: 'genji',
    label: {
      ja: '源氏物語絵巻（くずし字）',
      en: 'Genji Emaki (Kuzushiji)',
      'zh-CN': '源氏物语画卷（草书）',
      'zh-TW': '源氏物語繪卷（草書）',
      ko: '겐지모노가타리 그림두루마리 (흘림체)',
    },
    description: {
      ja: '源氏物語絵巻 — 国立国会図書館デジタルコレクション所蔵のくずし字写本',
      en: 'Tale of Genji Picture Scroll — Kuzushiji manuscript from NDL Digital Collections',
      'zh-CN': '源氏物语画卷 — 日本国立国会图书馆数字馆藏草书手稿',
      'zh-TW': '源氏物語繪卷 — 日本國立國會圖書館數位典藏草書手稿',
      ko: '겐지모노가타리 그림두루마리 — NDL 디지털 컬렉션 흘림체 필사본',
    },
    imagePath: '/samples/kuzushiji-sample-genji.jpg',
    fileName: 'kuzushiji-sample-genji.jpg',
    mimeType: 'image/jpeg',
    category: 'koten',
  },
]

interface SampleTileSelectorProps {
  ocrMode: OCRMode
  lang: string
  disabled: boolean
  onSampleSelected: (files: File[]) => Promise<void>
}

function L(lang: string, map: Record<string, string>): string {
  return map[lang] ?? map['en'] ?? map['ja'] ?? ''
}

export function SampleTileSelector({ ocrMode, lang, disabled, onSampleSelected }: SampleTileSelectorProps) {
  // 表示するサンプルをモードに応じてフィルタ
  const visibleSamples = ocrMode === 'auto'
    ? SAMPLES // オート: 全サンプル表示
    : ocrMode === 'koten'
      ? SAMPLES.filter(s => s.category === 'koten')
      : SAMPLES.filter(s => s.category === 'modern')

  const handleTileClick = useCallback(async (sample: SampleTile) => {
    try {
      const res = await fetch(sample.imagePath)
      const blob = await res.blob()
      const file = new File([blob], sample.fileName, { type: sample.mimeType })
      await onSampleSelected([file])
    } catch (error) {
      console.error('Failed to load sample:', error)
    }
  }, [onSampleSelected])

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
              <img
                src={sample.imagePath}
                alt={L(lang, sample.label)}
                className="sample-tile-image"
                loading="lazy"
              />
              <span className={`sample-tile-badge sample-tile-badge-${sample.category}`}>
                {sample.category === 'modern'
                  ? L(lang, { ja: '現代', en: 'Modern', 'zh-CN': '现代', 'zh-TW': '現代', ko: '현대' })
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
