import { useState, useCallback, memo } from 'react'
import type { Language } from '../../i18n'

interface BugReportModalProps {
  lang: Language
  onClose: () => void
}

interface TranslationStrings {
  title: string
  nameLabel: string
  namePlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  categoryLabel: string
  categoryBug: string
  categoryFeature: string
  categoryOther: string
  descriptionLabel: string
  descriptionPlaceholder: string
  stepsLabel: string
  stepsPlaceholder: string
  browserLabel: string
  send: string
  cancel: string
  sending: string
  sent: string
  sentMessage: string
  errorMessage: string
  retry: string
}

const translations: Record<string, TranslationStrings> = {
  ja: {
    title: 'バグ報告 / 機能要望',
    nameLabel: 'お名前',
    namePlaceholder: '(任意)',
    emailLabel: 'メールアドレス',
    emailPlaceholder: '返信先 (任意)',
    categoryLabel: 'カテゴリ',
    categoryBug: 'バグ報告',
    categoryFeature: '機能要望',
    categoryOther: 'その他',
    descriptionLabel: '詳細',
    descriptionPlaceholder: '問題や要望の詳細を記入して下さい',
    stepsLabel: '再現手順',
    stepsPlaceholder: '(バグの場合) どのような手順で問題が発生しましたか？',
    browserLabel: 'ブラウザ',
    send: '送信',
    cancel: 'キャンセル',
    sending: '送信中…',
    sent: '送信完了！',
    sentMessage: 'ご報告ありがとうございます。内容を確認いたします。',
    errorMessage: '送信に失敗しました。ネットワーク接続を確認して再度お試し下さい。',
    retry: '再送信',
  },
  en: {
    title: 'Bug Report / Feature Request',
    nameLabel: 'Name',
    namePlaceholder: '(optional)',
    emailLabel: 'Email',
    emailPlaceholder: 'Reply-to (optional)',
    categoryLabel: 'Category',
    categoryBug: 'Bug Report',
    categoryFeature: 'Feature Request',
    categoryOther: 'Other',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe the issue or request in detail',
    stepsLabel: 'Steps to Reproduce',
    stepsPlaceholder: '(For bugs) What steps led to the issue?',
    browserLabel: 'Browser',
    send: 'Send',
    cancel: 'Cancel',
    sending: 'Sending…',
    sent: 'Sent!',
    sentMessage: 'Thank you for your report. We will review it shortly.',
    errorMessage: 'Submission failed. Please check your network connection and try again.',
    retry: 'Retry',
  },
  'zh-CN': {
    title: '错误报告 / 功能建议',
    nameLabel: '姓名',
    namePlaceholder: '（选填）',
    emailLabel: '电子邮件',
    emailPlaceholder: '回复地址（选填）',
    categoryLabel: '类别',
    categoryBug: '错误报告',
    categoryFeature: '功能建议',
    categoryOther: '其他',
    descriptionLabel: '详情',
    descriptionPlaceholder: '请详细描述问题或建议',
    stepsLabel: '复现步骤',
    stepsPlaceholder: '（如为错误）导致问题的步骤是什么？',
    browserLabel: '浏览器',
    send: '发送',
    cancel: '取消',
    sending: '发送中…',
    sent: '已发送！',
    sentMessage: '感谢您的反馈。我们会尽快查看。',
    errorMessage: '发送失败。请检查网络连接后重试。',
    retry: '重试',
  },
  'zh-TW': {
    title: '錯誤報告 / 功能建議',
    nameLabel: '姓名',
    namePlaceholder: '（選填）',
    emailLabel: '電子信箱',
    emailPlaceholder: '回覆地址（選填）',
    categoryLabel: '類別',
    categoryBug: '錯誤報告',
    categoryFeature: '功能建議',
    categoryOther: '其他',
    descriptionLabel: '詳情',
    descriptionPlaceholder: '請詳細描述問題或建議',
    stepsLabel: '重現步驟',
    stepsPlaceholder: '（如為錯誤）導致問題的步驟是什麼？',
    browserLabel: '瀏覽器',
    send: '發送',
    cancel: '取消',
    sending: '發送中…',
    sent: '已發送！',
    sentMessage: '感謝您的回報。我們會盡快查看。',
    errorMessage: '發送失敗。請檢查網路連線後重試。',
    retry: '重試',
  },
  ko: {
    title: '버그 보고 / 기능 요청',
    nameLabel: '이름',
    namePlaceholder: '(선택)',
    emailLabel: '이메일',
    emailPlaceholder: '회신 주소 (선택)',
    categoryLabel: '카테고리',
    categoryBug: '버그 보고',
    categoryFeature: '기능 요청',
    categoryOther: '기타',
    descriptionLabel: '설명',
    descriptionPlaceholder: '문제 또는 요청을 자세히 설명해 주세요',
    stepsLabel: '재현 단계',
    stepsPlaceholder: '(버그의 경우) 문제가 발생한 단계는?',
    browserLabel: '브라우저',
    send: '보내기',
    cancel: '취소',
    sending: '보내는 중…',
    sent: '전송 완료!',
    sentMessage: '보고해 주셔서 감사합니다. 곧 확인하겠습니다.',
    errorMessage: '전송 실패. 네트워크 연결을 확인하고 다시 시도해 주세요.',
    retry: '다시 시도',
  },
}

function getStrings(lang: Language): TranslationStrings {
  return translations[lang] || translations['en']
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent
  const screen = `${window.screen.width}x${window.screen.height}`
  return `${ua} | Screen: ${screen}`
}

const APP_VERSION = '4.4.3'

/**
 * Web3Forms アクセスキー（オプション）
 *
 * Vercel 環境では Netlify Forms が使えないため、
 * クライアントサイドで動作する Web3Forms API を使用する。
 * https://web3forms.com で無料キーを取得し、
 * Vercel の環境変数 VITE_WEB3FORMS_KEY に設定する。
 *
 * キーが未設定の場合は GitHub Issues へのリダイレクトにフォールバックする。
 */
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined

/** GitHub Issues URL（Web3Forms 未設定時のフォールバック） */
const GITHUB_ISSUES_URL = 'https://github.com/somiyagawa/ndlocr-lite-web-ai-deluxe/issues/new'

export const BugReportModal = memo(function BugReportModal({ lang, onClose }: BugReportModalProps) {
  const strings = getStrings(lang)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<'bug' | 'feature' | 'other'>('bug')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const categoryLabel = category === 'bug' ? strings.categoryBug
    : category === 'feature' ? strings.categoryFeature
    : strings.categoryOther

  /**
   * GitHub Issues にリダイレクトする（Web3Forms 未設定時のフォールバック）。
   * COOP ヘッダー環境でも window.location.href は動作する。
   */
  const submitViaGitHub = useCallback(() => {
    const title = encodeURIComponent(
      `[${categoryLabel}] ${description.slice(0, 80)}`,
    )
    const bodyParts = [
      `## ${categoryLabel}`,
      '',
      `**App Version:** v${APP_VERSION}`,
      `**Browser:** ${getBrowserInfo()}`,
      name ? `**Reporter:** ${name}${email ? ` (${email})` : ''}` : '',
      '',
      '## Description',
      description,
    ]
    if (category === 'bug' && steps.trim()) {
      bodyParts.push('', '## Steps to Reproduce', steps)
    }
    const body = encodeURIComponent(bodyParts.filter(Boolean).join('\n'))
    const url = `${GITHUB_ISSUES_URL}?title=${title}&body=${body}`

    // window.location.href で遷移（COOP 環境でも安全）
    window.location.href = url
  }, [name, email, category, categoryLabel, description, steps])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    // Web3Forms キーが未設定 → GitHub Issues にフォールバック
    if (!WEB3FORMS_KEY) {
      console.log('[BugReport] Web3Forms key not set — redirecting to GitHub Issues')
      submitViaGitHub()
      return
    }

    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `[NDL OCR v${APP_VERSION}] ${categoryLabel}: ${description.slice(0, 60)}`,
      from_name: name || 'Anonymous',
      email: email || 'noreply@example.com',
      category: `${category} (${categoryLabel})`,
      description,
      steps: steps || '(N/A)',
      browser: getBrowserInfo(),
      app_version: APP_VERSION,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      botcheck: '',
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (response.ok && result.success) {
        setStatus('sent')
      } else {
        console.error('Form submission failed:', result)
        setStatus('error')
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setStatus('error')
    }
  }, [name, email, category, categoryLabel, description, steps, submitViaGitHub])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bug-report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{strings.title}</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        {status === 'sent' ? (
          <div className="bug-report-sent">
            <div className="bug-report-sent-icon">✓</div>
            <p>{strings.sentMessage}</p>
            <button className="preprocess-btn preprocess-btn-primary" onClick={onClose} type="button">
              OK
            </button>
          </div>
        ) : status === 'error' ? (
          <div className="bug-report-sent">
            <div className="bug-report-sent-icon" style={{ color: 'var(--color-danger, #dc3545)' }}>✕</div>
            <p>{strings.errorMessage}</p>
            <div className="bug-report-actions">
              <button className="preprocess-btn preprocess-btn-secondary" onClick={onClose} type="button">
                {strings.cancel}
              </button>
              <button className="preprocess-btn preprocess-btn-primary" onClick={() => setStatus('idle')} type="button">
                {strings.retry}
              </button>
            </div>
          </div>
        ) : (
          <form className="bug-report-form" onSubmit={handleSubmit}>
            <div className="bug-report-row">
              <label>{strings.categoryLabel}</label>
              <div className="bug-report-category-group">
                {(['bug', 'feature', 'other'] as const).map(cat => (
                  <label key={cat} className={`bug-report-category-option ${category === cat ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                    />
                    {cat === 'bug' ? strings.categoryBug : cat === 'feature' ? strings.categoryFeature : strings.categoryOther}
                  </label>
                ))}
              </div>
            </div>

            <div className="bug-report-row">
              <label>{strings.descriptionLabel} *</label>
              <textarea
                className="bug-report-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={strings.descriptionPlaceholder}
                required
                rows={4}
              />
            </div>

            {category === 'bug' && (
              <div className="bug-report-row">
                <label>{strings.stepsLabel}</label>
                <textarea
                  className="bug-report-textarea"
                  value={steps}
                  onChange={e => setSteps(e.target.value)}
                  placeholder={strings.stepsPlaceholder}
                  rows={3}
                />
              </div>
            )}

            <div className="bug-report-row-inline">
              <div className="bug-report-field">
                <label>{strings.nameLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={strings.namePlaceholder}
                />
              </div>
              <div className="bug-report-field">
                <label>{strings.emailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={strings.emailPlaceholder}
                />
              </div>
            </div>

            <div className="bug-report-row">
              <label>{strings.browserLabel}</label>
              <input
                type="text"
                className="bug-report-browser"
                value={getBrowserInfo()}
                readOnly
              />
            </div>

            <div className="bug-report-actions">
              <button type="button" className="preprocess-btn preprocess-btn-secondary" onClick={onClose}>
                {strings.cancel}
              </button>
              <button
                type="submit"
                className="preprocess-btn preprocess-btn-primary"
                disabled={!description.trim() || status === 'sending'}
              >
                {status === 'sending' ? strings.sending : strings.send}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
})
