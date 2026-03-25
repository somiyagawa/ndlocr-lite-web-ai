import { memo, useState } from 'react'
import { LANGUAGES, LANGUAGE_LABELS, L } from '../../i18n'
import type { Language } from '../../i18n'
import type { AIConnectionStatus } from '../../hooks/useAISettings'
import type { Theme } from '../../hooks/useTheme'

const STATUS_LABELS: Record<AIConnectionStatus, Record<string, string>> = {
  connected:    { ja: 'AI接続済み', en: 'AI Connected', 'zh-CN': 'AI已连接', 'zh-TW': 'AI已連接', ko: 'AI 연결됨', la: 'AI connexum', eo: 'AI konektita', es: 'AI conectado', de: 'AI verbunden', ar: 'AI متصل', hi: 'AI जुड़ा' },
  connecting:   { ja: 'AI接続中...', en: 'AI Connecting...', 'zh-CN': 'AI连接中...', 'zh-TW': 'AI連接中...', ko: 'AI 연결 중...', la: 'AI conectens...', eo: 'AI konektanta...', es: 'AI conectando...', de: 'AI verbindet...', ar: 'AI يتصل...', hi: 'AI जुड़ रहा है...' },
  error:        { ja: 'AI接続エラー', en: 'AI Error', 'zh-CN': 'AI连接错误', 'zh-TW': 'AI連接錯誤', ko: 'AI 오류', la: 'AI error', eo: 'AI eraro', es: 'Error de AI', de: 'AI-Fehler', ar: 'خطأ AI', hi: 'AI त्रुटि' },
  disconnected: { ja: 'AI未接続', en: 'AI Disconnected', 'zh-CN': 'AI未连接', 'zh-TW': 'AI未連接', ko: 'AI 미연결', la: 'AI disiunctum', eo: 'AI malkonektita', es: 'AI desconectado', de: 'AI getrennt', ar: 'AI غير متصل', hi: 'AI डिस्कनेक्ट' },
}

interface HeaderProps {
  lang: Language
  onToggleLanguage: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onOpenSettings: () => void
  onOpenHistory: () => void
  onOpenHelp: () => void
  onAIStatusClick: () => void
  onLogoClick: () => void
  aiConnectionStatus?: AIConnectionStatus
  theme: Theme
  onToggleTheme: () => void
}

export const Header = memo(function Header({
  lang,
  onToggleLanguage,
  onOpenSettings,
  onOpenHistory,
  onOpenHelp,
  onAIStatusClick,
  onLogoClick,
  aiConnectionStatus = 'disconnected',
  theme,
  onToggleTheme,
}: HeaderProps) {
  const statusClass = `ai-status ai-status-${aiConnectionStatus}`
  const statusText = STATUS_LABELS[aiConnectionStatus]?.[lang]
    ?? STATUS_LABELS[aiConnectionStatus]?.en
    ?? ''

  const THEME_LABELS: Record<string, Record<string, string>> = {
    toLight: { ja: 'ライトモードに切替', en: 'Switch to Light Mode', 'zh-CN': '切换到浅色模式', 'zh-TW': '切換到淺色模式', ko: '라이트 모드로 전환', la: 'Mutu ad Lucem', eo: 'Ŝanĝi al Hela Reĝimo', es: 'Modo claro', de: 'Hellmodus', ar: 'الوضع الفاتح', hi: 'लाइट मोड', ru: 'Перейти в светлый режим', el: 'Αλλαγή σε λαμπερή λειτουργία', syc: 'ܫܘܢܐ ܠܓܢܒܐ ܕܢܘܗܪܐ', cop: 'ⲙⲉⲧⲟⲩⲟⲣⲱⲧ ⲉⲡⲟⲩⲟⲓ', sa: 'ज्योतिर्मोड-प्रवेशम्' },
    toDark:  { ja: 'ダークモードに切替', en: 'Switch to Dark Mode', 'zh-CN': '切换到深色模式', 'zh-TW': '切換到深色模式', ko: '다크 모드로 전환', la: 'Mutu ad Obscuram', eo: 'Ŝanĝi al Malluma Reĝimo', es: 'Modo oscuro', de: 'Dunkelmodus', ar: 'الوضع الداكن', hi: 'डार्क मोड', ru: 'Перейти в темный режим', el: 'Αλλαγή σε σκοτεινή λειτουργία', syc: 'ܫܘܢܐ ܠܓܢܒܐ ܕܚܫܡܐ', cop: 'ⲙⲉⲧⲟⲩⲟⲣⲱⲧ ⲉⲡܚܫܡܐ', sa: 'तामस-मोड-प्रवेशम्' },
    history: { ja: '処理履歴', en: 'History', 'zh-CN': '处理历史', 'zh-TW': '處理紀錄', ko: '처리 기록', la: 'Historia', eo: 'Historio', es: 'Historial', de: 'Verlauf', ar: 'السجل', hi: 'इतिहास', ru: 'История', el: 'Ιστορικό', syc: 'ܬ̈ܫ̈ܥ̈ܝ̈ܬ', cop: 'ⲧⲁⲓⲟ', sa: 'चरितम्' },
    settings: { ja: '設定', en: 'Settings', 'zh-CN': '设置', 'zh-TW': '設定', ko: '설정', la: 'Optiones', eo: 'Agordoj', es: 'Configuración', de: 'Einstellungen', ar: 'الإعدادات', hi: 'सेटिंग्स', ru: 'Параметры', el: 'Ρυθμίσεις', syc: 'ܛ̈ܘ̈ܟ̈ܣ̈ܐ', cop: 'ⲛⲓⲥⲉⲧⲧⲓⲛⲅⲥ', sa: 'विन्यासाः' },
    help: { ja: '使い方ガイド', en: 'User Guide', 'zh-CN': '使用指南', 'zh-TW': '使用指南', ko: '사용 안내', la: 'Auxilium', eo: 'Helpo', es: 'Guía', de: 'Hilfe', ar: 'الدليل', hi: 'मार्गदर्शिका', ru: 'Руководство пользователя', el: 'Οδηγός χρήστη', syc: 'ܡܠܦܢܬܐ ܕܦܠܓܐ', cop: 'ⲡⲙⲁⲧⲟⲉ', sa: 'उपयोगकर्ता-मार्गदर्शनम्' },
  }

  const FLAG_EMOJI: Record<string, string> = {
    ja: '\u{1F1EF}\u{1F1F5}',      // 🇯🇵
    en: '\u{1F1EC}\u{1F1E7}',      // 🇬🇧
    'zh-CN': '\u{1F1E8}\u{1F1F3}', // 🇨🇳
    'zh-TW': '\u{1F1ED}\u{1F1F0}', // 🇭🇰
    ko: '\u{1F1F0}\u{1F1F7}',      // 🇰🇷
    es: '\u{1F1EA}\u{1F1F8}',      // 🇪🇸
    de: '\u{1F1E9}\u{1F1EA}',      // 🇩🇪
    ar: '\u{1F1F8}\u{1F1E6}',      // 🇸🇦
    hi: '\u{1F1EE}\u{1F1F3}',      // 🇮🇳
    ru: '\u{1F1F7}\u{1F1FA}',      // 🇷🇺
    el: '\u{1F1EC}\u{1F1F7}',      // 🇬🇷
    sa: '\u{1F549}\uFE0F',          // 🕉️ (Sanskrit/India)
    syc: '\u{2670}',                // ☰ (Syriac cross)
    cop: '\u{2625}\uFE0F',          // ☥ (Ankh / Coptic)
    la: '\u{1F3DB}\uFE0F',          // 🏛️
    eo: '\u{1F30D}',                // 🌍
  }

  const themeTitle = theme === 'dark'
    ? (THEME_LABELS.toLight[lang] ?? THEME_LABELS.toLight.en)
    : (THEME_LABELS.toDark[lang] ?? THEME_LABELS.toDark.en)

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="header">
      {/* Logo & Title Section */}
      <button className="header-title" onClick={onLogoClick}>
        <div className="header-logo-container">
          {/* Stylized document/scan icon */}
          <svg
            className="header-logo-icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
            <line x1="9" y1="9" x2="10" y2="9" />
          </svg>
        </div>
        <div className="header-title-text">
          <span className="header-title-main">NDLOCR-lite Web AI</span>
          <span className="header-title-accent">Model BLUEPOND</span>
        </div>
        <span className="header-version header-version-pulse">v3.4</span>
      </button>

      {/* Hamburger button - visible on mobile only */}
      <button
        className="header-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {menuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Drawer overlay - mobile only */}
      {menuOpen && <div className="drawer-overlay visible" onClick={() => setMenuOpen(false)} />}

      {/* Actions Section — becomes slide-out drawer on mobile */}
      <div className={`header-actions${menuOpen ? ' header-actions-open' : ''}`}>
        {/* Close button — visible only inside drawer on mobile */}
        <button className="drawer-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* AI Status + Settings Group */}
        <div className="header-actions-group">
          {aiConnectionStatus === 'disconnected' || aiConnectionStatus === 'error' ? (
            <button
              className={`${statusClass} ai-status-clickable`}
              onClick={() => { onAIStatusClick(); setMenuOpen(false) }}
            >
              <span className="ai-status-dot" />
              <span className="ai-status-text">{statusText}</span>
            </button>
          ) : (
            <span className={statusClass} title={statusText}>
              <span className="ai-status-dot" />
              <span className="ai-status-text">{statusText}</span>
            </span>
          )}
          <button
            className="btn-icon drawer-menu-item"
            onClick={() => { onOpenSettings(); setMenuOpen(false) }}
            title={THEME_LABELS.settings[lang] ?? 'Settings'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="drawer-label">{THEME_LABELS.settings[lang] ?? 'Settings'}</span>
          </button>
        </div>

        {/* Help & Theme & History & Language Group */}
        <div className="header-actions-group">
          <button
            className="btn-icon drawer-menu-item"
            onClick={() => { onOpenHelp(); setMenuOpen(false) }}
            title={THEME_LABELS.help[lang] ?? 'User Guide'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="drawer-label">{THEME_LABELS.help[lang] ?? 'User Guide'}</span>
          </button>
          <button
            className="btn-icon btn-theme-toggle drawer-menu-item"
            onClick={onToggleTheme}
            aria-label={themeTitle}
            title={themeTitle}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <span className="drawer-label">{themeTitle}</span>
          </button>
          <button
            className="btn-icon drawer-menu-item"
            onClick={() => { onOpenHistory(); setMenuOpen(false) }}
            title={THEME_LABELS.history[lang] ?? 'History'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="drawer-label">{THEME_LABELS.history[lang] ?? 'History'}</span>
          </button>

          {/* Language section label */}
          <div className="drawer-lang-label">{L(lang, {
            ja: '言語', en: 'Language', 'zh-CN': '语言', 'zh-TW': '語言', ko: '언어',
            la: 'Lingua', eo: 'Lingvo', es: 'Idioma', de: 'Sprache', ar: 'اللغة', hi: 'भाषा',
            ru: 'Язык', el: 'Γλώσσα', syc: 'ܠܫܢܐ', cop: 'ⲁⲥⲡⲓ', sa: 'भाषा'
          })}</div>

          <div className="lang-flags" role="radiogroup" aria-label="Language">
            {LANGUAGES.map(code => (
              <button
                key={code}
                className={`lang-flag-btn${lang === code ? ' lang-flag-active' : ''}`}
                onClick={() => {
                  onToggleLanguage({ target: { value: code } } as React.ChangeEvent<HTMLSelectElement>)
                  setMenuOpen(false)
                }}
                title={LANGUAGE_LABELS[code]}
                aria-label={LANGUAGE_LABELS[code]}
                role="radio"
                aria-checked={lang === code}
              >
                {FLAG_EMOJI[code]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
})
