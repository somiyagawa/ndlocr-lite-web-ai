import { useState } from 'react'
import type { DBRunEntry } from '../../types/db'
import type { Language } from '../../i18n'
import { L } from '../../i18n'

interface HistoryPanelProps {
  runs: DBRunEntry[]
  onSelect: (entry: DBRunEntry) => void
  onClear: () => void
  onClose: () => void
  lang: Language
}

export function HistoryPanel({ runs, onSelect, onClear, onClose, lang }: HistoryPanelProps) {
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = () => {
    if (confirmClear) {
      onClear()
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  const formatDate = (ts: number) => {
    const localeMap: Partial<Record<Language, string>> = {
      ja: 'ja-JP',
      en: 'en-US',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      ko: 'ko-KR',
      es: 'es-ES',
      de: 'de-DE',
      ar: 'ar-SA',
      hi: 'hi-IN',
      la: 'en-US',
      eo: 'en-US',
      ru: 'ru-RU',
      el: 'el-GR',
      syc: 'en-US',
      cop: 'en-US',
      sa: 'hi-IN',
    }
    return new Date(ts).toLocaleString(localeMap[lang], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel history-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <div className="history-header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
            </svg>
            <h2>{L(lang, { ja: '処理履歴', en: 'Processing History', 'zh-CN': '处理历史', 'zh-TW': '處理紀錄', ko: '처리 기록', la: 'Historia processuum', eo: 'Prilaborhistorio', ru: 'История обработки', el: 'Ιστορικό επεξεργασίας', syc: 'ܬ̈ܫ̈ܥ̈ܝ̈ܬ ܕܦ̈ܘ̈ܠ̈ܚ̈ܢ', cop: 'ⲧⲁⲓⲟ ⲛⲧⲉ ⲡⲟⲩⲟⲙ', sa: 'संस्करणसञ्चयितिः' })}</h2>
            {runs.length > 0 && (
              <span className="history-count">{runs.length}</span>
            )}
          </div>
          <button className="btn-close" onClick={onClose} title={L(lang, { ja: '閉じる', en: 'Close', 'zh-CN': '关闭', 'zh-TW': '關閉', ko: '닫기', la: 'Claudere', eo: 'Fermi', ru: 'Закрыть', el: 'Κλείσιμο', syc: 'ܐܚ̈ܘ̈ܕ', cop: 'ⲁϣⲧⲉⲙ', sa: 'अपिदधातु' })}>✕</button>
        </div>

        {/* Body */}
        <div className="panel-body">
          {runs.length === 0 ? (
            <div className="history-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
              </svg>
              <p>{L(lang, { ja: '処理履歴がありません', en: 'No history yet', 'zh-CN': '暂无处理历史', 'zh-TW': '暫無處理紀錄', ko: '처리 기록이 없습니다', la: 'Nulla historia', eo: 'Neniu historio', ru: 'Нет истории обработки', el: 'Κανένα ιστορικό', syc: 'ܠ̈ܝ̈ܬ ܬ̈ܫ̈ܥ̈ܝ̈ܬ', cop: 'ⲙⲁ ⲧⲁⲓⲟ ⲛⲧⲉ ⲟⲩⲟⲛ', sa: 'संस्करणा न विद्यन्ते' })}</p>
              <span>{L(lang, { ja: '画像やPDFをOCR処理すると、ここに履歴が表示されます', en: 'OCR results will appear here after processing', 'zh-CN': '处理图像或PDF后，历史记录将显示在这里', 'zh-TW': '處理圖像或PDF後，紀錄將顯示在這裡', ko: '이미지 또는 PDF를 OCR 처리한 후 기록이 여기에 나타납니다', la: 'Historia apparebit post processus OCR', eo: 'Historio aperos ĉi tie post OCR-prilaborado', ru: 'История обработки появится здесь', el: 'Το ιστορικό θα εμφανιστεί εδώ', syc: 'ܬ̈ܫ̈ܥ̈ܝ̈ܬ ܬܪܒܐ ܠܗܪܟܐ', cop: 'ⲧⲁⲓⲟ ⲉϣⲁⲟ ⲙⲡⲁⲧ ⲛⲧⲉ ⲡⲟⲩⲟⲙ', sa: 'संस्करणा अत्र प्रदर्शनीयाः भविष्यन्ति' })}</span>
            </div>
          ) : (
            <ul className="history-list">
              {runs.map((run) => {
                const firstFile = run.files[0]
                const fileCount = run.files.length
                const totalTime = run.files.reduce((sum, f) => sum + f.processingTimeMs, 0)
                const totalChars = run.files.reduce((sum, f) => sum + f.fullText.length, 0)
                const previewText = run.files.map(f => f.fullText).join(' ').slice(0, 80)
                return (
                  <li key={run.id} className="history-item" onClick={() => onSelect(run)}>
                    {/* Thumbnail */}
                    {firstFile && (
                      <div className="history-thumb-wrap">
                        <img
                          src={firstFile.imageDataUrl}
                          alt={firstFile.fileName}
                          className="history-thumb"
                        />
                        {fileCount > 1 && (
                          <span className="history-thumb-badge">+{fileCount - 1}</span>
                        )}
                      </div>
                    )}
                    {/* Info */}
                    <div className="history-info">
                      <div className="history-info-top">
                        <span className="history-filename">
                          {firstFile?.fileName ?? 'unknown'}
                        </span>
                        <span className="history-date">{formatDate(run.createdAt)}</span>
                      </div>
                      <div className="history-meta">
                        {fileCount > 1 && (
                          <span className="history-meta-tag">
                            {L(lang, { ja: `${fileCount}ページ`, en: `${fileCount} pages`, 'zh-CN': `${fileCount}页`, 'zh-TW': `${fileCount}頁`, ko: `${fileCount}페이지`, la: `${fileCount} paginae`, eo: `${fileCount} paĝoj`, ru: `${fileCount} страниц`, el: `${fileCount} σελίδες`, syc: `${fileCount} ܦܪ̈ܖ̈ܝܐ`, cop: `${fileCount} ⲡⲁⲅⲉ`, sa: `${fileCount} पृष्ठाः` })}
                          </span>
                        )}
                        <span className="history-meta-tag">
                          {totalChars.toLocaleString()} {L(lang, { ja: '文字', en: 'chars', 'zh-CN': '字符', 'zh-TW': '字元', ko: '자', la: 'characteres', eo: 'signoj', ru: 'символов', el: 'χαρακτήρες', syc: 'ܐܬܘܬܐ', cop: 'ⲛⲏⲣⲛ', sa: 'आक्षराणि' })}
                        </span>
                        <span className="history-meta-tag">
                          {formatTime(totalTime)}
                        </span>
                      </div>
                      {previewText && (
                        <p className="history-preview">{previewText}…</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="panel-footer">
          <span className="history-footer-hint">
            {L(lang, { ja: '項目をクリックして復元', en: 'Click an item to restore', 'zh-CN': '点击项目恢复', 'zh-TW': '點擊項目恢復', ko: '항목을 클릭하여 복원', la: 'Clica itemum ad restituendum', eo: 'Klaku eron por restarigi', ru: 'Щелкните элемент для восстановления', el: 'Κάντε κλικ σε ένα στοιχείο για επαναφορά', syc: 'ܕܘܨ ܥܠ ܐܪܒܢܐ ܠܦܠܬܐ', cop: 'ⲗⲁⲗⲁⲧ ⲡⲓⲥⲓ ⲉϥϩⲉ', sa: 'पदं क्लिक् क्रियां पुनः स्थापयतु' })}
          </span>
          <button
            className={`btn btn-sm ${confirmClear ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleClear}
            disabled={runs.length === 0}
          >
            {confirmClear
              ? L(lang, { ja: '本当に削除？', en: 'Confirm?', 'zh-CN': '确定删除？', 'zh-TW': '確定刪除？', ko: '정말 삭제?', la: 'Visne vere delere?', eo: 'Ĉu vere forigi?', ru: 'Вы уверены?', el: 'Επιβεβαίωση;', syc: 'ܦܢܝܐ ܕܫܘܦ?', cop: 'ⲗⲁⲙⲛⲧⲡⲁ?', sa: 'निश्चयं लोपयितुम्?' })
              : L(lang, { ja: '履歴を削除', en: 'Clear All', 'zh-CN': '全部删除', 'zh-TW': '全部刪除', ko: '전체 삭제', la: 'Omnia delere', eo: 'Forigi ĉiujn', ru: 'Очистить кэш', el: 'Εκκαθάριση κρυφής μνήμης', syc: 'ܡܚ̈ܝ ܬ̈ܫ̈ܥ̈ܝ̈ܬ', cop: 'ⲙⲁϩ ⲧⲁⲓⲉ ⲛⲧⲉ ⲟⲩⲟⲛ', sa: 'सर्वाः संस्करणाः लोपयितुम्' })}
          </button>
        </div>
      </div>
    </div>
  )
}
