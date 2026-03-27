import { memo } from 'react'
import { L } from '../../i18n'
import type { OCRJobState } from '../../types/ocr'
import type { Language } from '../../i18n'

interface ProgressBarProps {
  jobState: OCRJobState
  lang: Language
}

const MODEL_LABELS: Record<Language, { layout: string; rec30: string; rec50: string; rec100: string; downloading: string }> = {
  ja: {
    layout: 'レイアウト検出モデル',
    rec30: '文字認識モデル（≤30文字）',
    rec50: '文字認識モデル（≤50文字）',
    rec100: '文字認識モデル（≤100文字）',
    downloading: 'モデルをダウンロード中',
  },
  en: {
    layout: 'Layout detection model',
    rec30: 'Recognition model (≤30 chars)',
    rec50: 'Recognition model (≤50 chars)',
    rec100: 'Recognition model (≤100 chars)',
    downloading: 'Downloading models',
  },
  'zh-CN': {
    layout: '布局检测模型',
    rec30: '识别模型（≤30字符）',
    rec50: '识别模型（≤50字符）',
    rec100: '识别模型（≤100字符）',
    downloading: '正在下载模型',
  },
  'zh-TW': {
    layout: '佈局偵測模型',
    rec30: '識別模型（≤30字符）',
    rec50: '識別模型（≤50字符）',
    rec100: '識別模型（≤100字符）',
    downloading: '正在下載模型',
  },
  ko: {
    layout: '레이아웃 감지 모델',
    rec30: '인식 모델 (≤30문자)',
    rec50: '인식 모델 (≤50문자)',
    rec100: '인식 모델 (≤100문자)',
    downloading: '모델 다운로드 중',
  },
  la: {
    layout: 'Exemplar dispositionis',
    rec30: 'Exemplar agnitionis (≤30 litt.)',
    rec50: 'Exemplar agnitionis (≤50 litt.)',
    rec100: 'Exemplar agnitionis (≤100 litt.)',
    downloading: 'Exemplar descendens',
  },
  eo: {
    layout: 'Aranĝa detekta modelo',
    rec30: 'Signorekona modelo (≤30 signoj)',
    rec50: 'Signorekona modelo (≤50 signoj)',
    rec100: 'Signorekona modelo (≤100 signoj)',
    downloading: 'Ŝarĝas modelon',
  },
  es: {
    layout: 'Modelo de detección de diseño',
    rec30: 'Modelo de reconocimiento (≤30 car.)',
    rec50: 'Modelo de reconocimiento (≤50 car.)',
    rec100: 'Modelo de reconocimiento (≤100 car.)',
    downloading: 'Descargando modelo',
  },
  de: {
    layout: 'Layouterkennungsmodell',
    rec30: 'Erkennungsmodell (≤30 Zeichen)',
    rec50: 'Erkennungsmodell (≤50 Zeichen)',
    rec100: 'Erkennungsmodell (≤100 Zeichen)',
    downloading: 'Modell wird heruntergeladen',
  },
  ar: {
    layout: 'نموذج اكتشاف التخطيط',
    rec30: 'نموذج التعرف (≤30 حرف)',
    rec50: 'نموذج التعرف (≤50 حرف)',
    rec100: 'نموذج التعرف (≤100 حرف)',
    downloading: 'جارٍ تنزيل النموذج',
  },
  hi: {
    layout: 'लेआउट पहचान मॉडल',
    rec30: 'पहचान मॉडल (≤30 अक्षर)',
    rec50: 'पहचान मॉडल (≤50 अक्षर)',
    rec100: 'पहचान मॉडल (≤100 अक्षर)',
    downloading: 'मॉडल डाउनलोड हो रहा है',
  },
  ru: {
    layout: 'Модель обнаружения макета',
    rec30: 'Модель распознавания (≤30 символов)',
    rec50: 'Модель распознавания (≤50 символов)',
    rec100: 'Модель распознавания (≤100 символов)',
    downloading: 'Загрузка модели',
  },
  el: {
    layout: 'Μοντέλο ανίχνευσης διάταξης',
    rec30: 'Μοντέλο αναγνώρισης (≤30 χαρακτήρες)',
    rec50: 'Μοντέλο αναγνώρισης (≤50 χαρακτήρες)',
    rec100: 'Μοντέλο αναγνώρισης (≤100 χαρακτήρες)',
    downloading: 'Λήψη μοντέλου',
  },
  syc: {
    layout: 'ܡܕܝܪܬܐ ܕܫܟܢܐ',
    rec30: 'ܡܕܝܪܬܐ ܕܝܕܥܬܐ (≤30 ܐܬܘܬܐ)',
    rec50: 'ܡܕܝܪܬܐ ܕܝܕܥܬܐ (≤50 ܐܬܘܬܐ)',
    rec100: 'ܡܕܝܪܬܐ ܕܝܕܥܬܐ (≤100 ܐܬܘܬܐ)',
    downloading: 'ܐܚܬܝܬ ܡܕܝܪܬܐ',
  },
  cop: {
    layout: 'ⲙⲟⲇⲉⲗ ⲛⲧⲉ ⲙⲁⲧⲁⲓⲁ',
    rec30: 'ⲙⲟⲇⲉⲗ ⲛⲧⲉ ⲙⲟⲕϩ (≤30 ⲛⲏⲣⲛ)',
    rec50: 'ⲙⲟⲇⲉⲗ ⲛⲧⲉ ⲙⲟⲕϩ (≤50 ⲛⲏⲣⲛ)',
    rec100: 'ⲙⲟⲇⲉⲗ ⲛⲧⲉ ⲙⲟⲕϩ (≤100 ⲛⲏⲣⲛ)',
    downloading: 'ⲧⲁⲗⲟ ⲛⲧⲉ ⲙⲟⲇⲉⲗ',
  },
  sa: {
    layout: 'पंक्ति-पहचान-नमूनम्',
    rec30: 'स्वीकृति-नमूनम् (≤30 आक्षराणि)',
    rec50: 'स्वीकृति-नमूनम् (≤50 आक्षराणि)',
    rec100: 'स्वीकृति-नमूनम् (≤100 आक्षराणि)',
    downloading: 'नमूनम् अवतारणम्',
  },
}

export const ProgressBar = memo(function ProgressBar({ jobState, lang }: ProgressBarProps) {
  const { status, currentFileIndex, totalFiles, stageProgress, stage, message, modelProgress } = jobState

  if (status === 'idle') return null

  const isError = status === 'error'
  const isDone = status === 'done'
  const isDownloading = stage === 'loading_models' && modelProgress != null
  const labels = MODEL_LABELS[lang]

  if (isDownloading) {
    return (
      <div className="progress-container">
        <div className="progress-title">{labels.downloading}...</div>
        <div className="model-download-bars">
          {(
            [
              ['layout', labels.layout],
              ['rec30', labels.rec30],
              ['rec50', labels.rec50],
              ['rec100', labels.rec100],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="model-download-row">
              <div className="model-download-label">{label}</div>
              <div className="model-download-bar-wrap">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.round(modelProgress[key] * 100)}%` }}
                  />
                </div>
                <span className="model-download-pct">{Math.round(modelProgress[key] * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 全体進捗: ファイル単位 + 現在ファイル内の進捗
  const overallProgress =
    totalFiles > 0
      ? ((currentFileIndex - 1 + stageProgress) / totalFiles) * 100
      : stageProgress * 100

  return (
    <div className={`progress-container ${isError ? 'error' : ''}`}>
      <div className="progress-files">
        {!isDone && !isError && <span className="progress-spinner" />}
        <span>
          {totalFiles > 1
            ? L(lang, {
                ja: `${currentFileIndex} / ${totalFiles} ファイル処理中`,
                en: `Processing ${currentFileIndex} / ${totalFiles} files`,
                'zh-CN': `处理中 ${currentFileIndex} / ${totalFiles} 个文件`,
                'zh-TW': `處理中 ${currentFileIndex} / ${totalFiles} 個檔案`,
                ko: `${currentFileIndex} / ${totalFiles} 파일 처리 중`,
                la: `Processus ${currentFileIndex} / ${totalFiles}`,
                eo: `Prilaboras ${currentFileIndex} / ${totalFiles} dosierojn`,
                es: `Procesando ${currentFileIndex} / ${totalFiles} archivos`,
                de: `Verarbeite ${currentFileIndex} / ${totalFiles} Dateien`,
                ar: `معالجة ${currentFileIndex} / ${totalFiles} ملفات`,
                hi: `${currentFileIndex} / ${totalFiles} फ़ाइलें संसाधित हो रही हैं`,
                ru: `Обработка ${currentFileIndex} / ${totalFiles} файлов`,
                el: `Επεξεργασία ${currentFileIndex} / ${totalFiles} αρχείων`,
                syc: `ܡܥܒܕ ${currentFileIndex} / ${totalFiles} ܩ̈ܛܝܡܐ`,
                cop: `ⲉϥⲉⲣϩⲱⲃ ${currentFileIndex} / ${totalFiles} ϫⲱⲙⲉ`,
                sa: `${currentFileIndex} / ${totalFiles} फलकानि संसाध्यन्ते`,
              })
            : L(lang, {
                ja: 'OCR処理中…',
                en: 'Processing OCR…',
                'zh-CN': 'OCR处理中…',
                'zh-TW': 'OCR處理中…',
                ko: 'OCR 처리 중…',
                la: 'OCR processus…',
                eo: 'OCR prilaboras…',
                es: 'Procesando OCR…',
                de: 'OCR-Verarbeitung…',
                ar: 'معالجة OCR…',
                hi: 'OCR प्रसंस्करण…',
                ru: 'Обработка OCR…',
                el: 'Επεξεργασία OCR…',
                syc: 'ܡܥܒܕ OCR…',
                cop: 'ⲉϥⲉⲣϩⲱⲃ OCR…',
                sa: 'OCR संसाध्यते…',
              })
          }
        </span>
        {totalFiles > 0 && !isDone && !isError && (
          <span className="progress-pct">{Math.round(overallProgress)}%</span>
        )}
      </div>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${isDone ? 'done' : ''}`}
          style={{ width: `${Math.min(100, overallProgress)}%` }}
        />
      </div>
      {message && (
        <div className="progress-message">
          {isError ? jobState.errorMessage : message}
        </div>
      )}
    </div>
  )
})
