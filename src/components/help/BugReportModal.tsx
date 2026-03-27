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
    sent: '送信完了',
    sentMessage: 'メールクライアントが開きます。送信ボタンを押して下さい。',
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
    sent: 'Sent',
    sentMessage: 'Your email client will open. Please press Send.',
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
    sent: '已发送',
    sentMessage: '邮件客户端将打开。请点击发送。',
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
    sent: '已發送',
    sentMessage: '郵件客戶端將開啟。請點擊發送。',
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
    sent: '전송 완료',
    sentMessage: '이메일 클라이언트가 열립니다. 보내기를 눌러주세요.',
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

export const BugReportModal = memo(function BugReportModal({ lang, onClose }: BugReportModalProps) {
  const strings = getStrings(lang)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<'bug' | 'feature' | 'other'>('bug')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [sent, setSent] = useState(false)

  const categoryLabel = category === 'bug' ? strings.categoryBug
    : category === 'feature' ? strings.categoryFeature
    : strings.categoryOther

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    const browserInfo = getBrowserInfo()
    const subject = `[BLUEPOND ${categoryLabel}] ${description.slice(0, 60)}`
    const body = [
      `Category: ${categoryLabel}`,
      name ? `Name: ${name}` : '',
      email ? `Reply-to: ${email}` : '',
      '',
      '--- Description ---',
      description,
      '',
      steps ? '--- Steps to Reproduce ---' : '',
      steps,
      '',
      '--- Environment ---',
      `Browser: ${browserInfo}`,
      `App Version: v4.4.1`,
      `URL: ${window.location.href}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].filter(Boolean).join('\n')

    const mailto = `mailto:miyagawa.so.36u@kyoto-u.jp?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    // COOP (Cross-Origin-Opener-Policy: same-origin) 環境では
    // window.open() や <a target="_blank"> がブロックされるため、
    // window.location.href に直接代入する方式を使用。
    // モバイルブラウザでも mailto: の直接遷移が最も確実。
    window.location.href = mailto
    setSent(true)
  }, [name, email, category, categoryLabel, description, steps])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bug-report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{strings.title}</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        {sent ? (
          <div className="bug-report-sent">
            <div className="bug-report-sent-icon">✓</div>
            <p>{strings.sentMessage}</p>
            <button className="preprocess-btn preprocess-btn-primary" onClick={onClose} type="button">
              OK
            </button>
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
                disabled={!description.trim()}
              >
                {strings.send}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
})
