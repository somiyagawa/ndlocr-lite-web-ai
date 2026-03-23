import { useState } from 'react'
import type { DBRunEntry } from '../../types/db'
import type { Language } from '../../i18n'

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
    return new Date(ts).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', {
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
            <h2>{lang === 'ja' ? '処理履歴' : 'History'}</h2>
            {runs.length > 0 && (
              <span className="history-count">{runs.length}</span>
            )}
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="panel-body">
          {runs.length === 0 ? (
            <div className="history-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
              </svg>
              <p>{lang === 'ja' ? '処理履歴がありません' : 'No history yet'}</p>
              <span>{lang === 'ja' ? '画像やPDFをOCR処理すると、ここに履歴が表示されます' : 'OCR results will appear here after processing'}</span>
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
                            {lang === 'ja' ? `${fileCount}ページ` : `${fileCount} pages`}
                          </span>
                        )}
                        <span className="history-meta-tag">
                          {totalChars.toLocaleString()} {lang === 'ja' ? '文字' : 'chars'}
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
            {lang === 'ja' ? '項目をクリックして復元' : 'Click an item to restore'}
          </span>
          <button
            className={`btn btn-sm ${confirmClear ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleClear}
            disabled={runs.length === 0}
          >
            {confirmClear
              ? (lang === 'ja' ? '本当に削除？' : 'Confirm?')
              : (lang === 'ja' ? '履歴を削除' : 'Clear All')}
          </button>
        </div>
      </div>
    </div>
  )
}
