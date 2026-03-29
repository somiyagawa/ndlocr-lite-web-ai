import { useState, useMemo, memo } from 'react'
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
  cancel: string
  confirm: string
  sentMessage: string
  viaGitHub: string
  viaEmail: string
  viaTwitter: string
  chooseMethod: string
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
    cancel: 'キャンセル',
    confirm: '次へ',
    sentMessage: '以下のいずれかの方法で報告を送信して下さい。',
    viaGitHub: 'GitHub Issue で報告',
    viaEmail: 'メールで報告',
    viaTwitter: 'Twitter / X で報告',
    chooseMethod: '送信方法を選択',
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
    cancel: 'Cancel',
    confirm: 'Next',
    sentMessage: 'Please choose a method to submit your report.',
    viaGitHub: 'Report via GitHub Issue',
    viaEmail: 'Report via Email',
    viaTwitter: 'Report via Twitter / X',
    chooseMethod: 'Choose submission method',
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
    cancel: '取消',
    confirm: '下一步',
    sentMessage: '请选择以下方式提交报告。',
    viaGitHub: '通过 GitHub Issue 报告',
    viaEmail: '通过电子邮件报告',
    viaTwitter: '通过 Twitter / X 报告',
    chooseMethod: '选择提交方式',
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
    cancel: '取消',
    confirm: '下一步',
    sentMessage: '請選擇以下方式提交報告。',
    viaGitHub: '透過 GitHub Issue 報告',
    viaEmail: '透過電子郵件報告',
    viaTwitter: '透過 Twitter / X 報告',
    chooseMethod: '選擇提交方式',
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
    cancel: '취소',
    confirm: '다음',
    sentMessage: '아래 방법 중 하나로 보고서를 제출해 주세요.',
    viaGitHub: 'GitHub Issue로 보고',
    viaEmail: '이메일로 보고',
    viaTwitter: 'Twitter / X로 보고',
    chooseMethod: '제출 방법 선택',
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

const APP_VERSION = '4.4.4'
const REPORT_EMAIL = 'miyagawa.so.kb@u.tsukuba.ac.jp'
const GITHUB_ISSUES_URL = 'https://github.com/somiyagawa/ndlocr-lite-web-ai-deluxe/issues/new'
const TWITTER_HANDLE = 'So_Miyagawa'

export const BugReportModal = memo(function BugReportModal({ lang, onClose }: BugReportModalProps) {
  const strings = getStrings(lang)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<'bug' | 'feature' | 'other'>('bug')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [showLinks, setShowLinks] = useState(false)

  const categoryLabel = category === 'bug' ? strings.categoryBug
    : category === 'feature' ? strings.categoryFeature
    : strings.categoryOther

  /** 報告本文を組み立てる */
  const reportBody = useMemo(() => {
    const parts = [
      `[${categoryLabel}]`,
      '',
      `App Version: v${APP_VERSION}`,
      `Browser: ${getBrowserInfo()}`,
      name ? `Reporter: ${name}${email ? ` (${email})` : ''}` : '',
      '',
      'Description:',
      description,
    ]
    if (category === 'bug' && steps.trim()) {
      parts.push('', 'Steps to Reproduce:', steps)
    }
    return parts.filter(Boolean).join('\n')
  }, [name, email, category, categoryLabel, description, steps])

  /** GitHub Issues URL */
  const githubUrl = useMemo(() => {
    const title = encodeURIComponent(`[${categoryLabel}] ${description.slice(0, 80)}`)
    const mdBody = reportBody
      .replace('Description:', '## Description')
      .replace('Steps to Reproduce:', '## Steps to Reproduce')
      .replace(/^App Version:/m, '**App Version:**')
      .replace(/^Browser:/m, '**Browser:**')
      .replace(/^Reporter:/m, '**Reporter:**')
    const body = encodeURIComponent(mdBody)
    return `${GITHUB_ISSUES_URL}?title=${title}&body=${body}`
  }, [categoryLabel, description, reportBody])

  /** mailto: URL */
  const mailtoUrl = useMemo(() => {
    const subject = encodeURIComponent(`[NDL OCR v${APP_VERSION}] ${categoryLabel}: ${description.slice(0, 60)}`)
    const body = encodeURIComponent(reportBody)
    return `mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}`
  }, [categoryLabel, description, reportBody])

  /** Twitter / X メンション URL（280文字に収める） */
  const twitterUrl = useMemo(() => {
    const prefix = `@${TWITTER_HANDLE} [NDL OCR v${APP_VERSION}] ${categoryLabel}: `
    const maxDesc = 280 - prefix.length - 3 // 末尾の "..." 分
    const truncated = description.length > maxDesc
      ? description.slice(0, maxDesc) + '...'
      : description
    const text = encodeURIComponent(prefix + truncated)
    return `https://x.com/intent/tweet?text=${text}`
  }, [categoryLabel, description])

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setShowLinks(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bug-report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{strings.title}</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        {showLinks ? (
          <div className="bug-report-sent">
            <h3>{strings.chooseMethod}</h3>
            <p>{strings.sentMessage}</p>
            <div className="bug-report-link-buttons">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="preprocess-btn preprocess-btn-primary bug-report-link-btn"
              >
                {strings.viaGitHub}
              </a>
              <a
                href={mailtoUrl}
                className="preprocess-btn preprocess-btn-primary bug-report-link-btn"
              >
                {strings.viaEmail}
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="preprocess-btn preprocess-btn-primary bug-report-link-btn"
              >
                {strings.viaTwitter}
              </a>
            </div>
            <button className="preprocess-btn preprocess-btn-secondary" onClick={onClose} type="button" style={{ marginTop: '12px' }}>
              {strings.cancel}
            </button>
          </div>
        ) : (
          <form className="bug-report-form" onSubmit={handleConfirm}>
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
                {strings.confirm}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
})
