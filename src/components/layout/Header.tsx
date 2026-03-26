import { memo, useState, useCallback } from 'react'
import { LANGUAGES, LANGUAGE_LABELS, L } from '../../i18n'
import type { Language } from '../../i18n'
import type { AIConnectionStatus } from '../../hooks/useAISettings'
import type { Theme } from '../../hooks/useTheme'
import type { OCRMode } from '../../types/ocr'

/** 更新履歴データ */
const CHANGELOG: { version: string; date: string; changes: Record<string, string[]> }[] = [
  {
    version: '4.3.3',
    date: '2026-03-27',
    changes: {
      ja: [
        '携帯版: ズームコントロール・オーバーレイ文字・信頼度・読み順ボタンがタッチ操作で反応しなかった問題を修正（touchイベント伝播制御）',
        '携帯版: 画像補正パネルをボトムシート方式に変更 — 画面下部からスライドアップし、画像を確認しながら補正可能に',
        '携帯版: 保存メニューをボトムシート方式に変更 — ツールバーのオーバーフローでクリップされていた問題を修正',
        '携帯版: メニューを左からスライドするように変更（ハンバーガーボタン位置に合わせて）',
        '携帯版: メニュー内の言語選択・OCRモード切替のレイアウトを改善',
        '携帯版: ドロップゾーンを超コンパクト化（フォーマット表記非表示）',
        '携帯版: 冗長なUpload image/PDFボタン（BottomToolbar）を削除',
        '携帯版: フッターを非表示にし、フッター情報をメニューパネル下部に移動',
        '携帯版: テキストエディタの縦方向領域を拡大（80vh）',
        '文字オーバーレイボタンを「□字」アイコンに変更',
        '読み順ボタンを「①②」丸囲み数字アイコンに変更',
      ],
      en: [
        'Mobile: fixed zoom controls, overlay text, confidence, and reading order buttons not responding to touch (touch event propagation fix)',
        'Mobile: image correction panel now slides up as bottom sheet — image stays visible while adjusting',
        'Mobile: save/export menu now slides up as bottom sheet — fixes clipping by toolbar overflow',
        'Mobile: menu now slides from LEFT to match hamburger button position',
        'Mobile: improved language selector and OCR mode toggle layout in drawer menu',
        'Mobile: ultra-compact dropzone (format text hidden)',
        'Mobile: removed redundant Upload image/PDF button (BottomToolbar)',
        'Mobile: footer info moved into drawer menu panel',
        'Mobile: increased text editor vertical area (80vh)',
        'Changed text overlay button icon to □字 (kanji in square)',
        'Changed reading order button icon to ①② (circled numbers)',
      ],
    },
  },
  {
    version: '4.3.2',
    date: '2026-03-27',
    changes: {
      ja: [
        '携帯版: ペイン順序修正 — 画像ビューワを上、テキストエディタを下に正しく配置',
        '携帯版: 「ファイル名」「改行無視」をアイコンのみのチェックボックスに統合し、行間スライダー横に配置',
        '携帯版: ツールバーボタン（空行削除・行結合・元に戻す）のテキストラベルを非表示、アイコンのみに',
        '携帯版: バグ報告ボタンを虫アイコンのみに変更',
        '携帯版: 画像補正パネルを縦スタック表示に対応（幅100%、高さ制限40vh）',
        '携帯版: 領域選択ヒントテキストを非表示にし表示面積を最大化',
        '携帯版: フッターのビューワ重なりを修正',
        '携帯版: 画像ビューワのコンテナにResizeObserverを追加し初回ロード時のfitZoom再計算を確実に',
      ],
      en: [
        'Mobile: fixed pane order — image viewer on top, text editor on bottom',
        'Mobile: merged filename/ignore-newline into icon-only checkboxes next to line-spacing slider',
        'Mobile: hidden text labels on toolbar buttons (del blank, join, undo) — icons only',
        'Mobile: bug report button now shows bug icon only',
        'Mobile: image correction panel stacks vertically (100% width, 40vh max)',
        'Mobile: hidden region-select hint to maximize display area',
        'Mobile: fixed footer overlapping viewer',
        'Mobile: added ResizeObserver on viewer container for reliable fitZoom on initial load',
      ],
    },
  },
  {
    version: '4.3.1',
    date: '2026-03-27',
    changes: {
      ja: [
        '携帯版: 画像ビューワ・テキストエディタの分割ペインを大幅に拡大（各70vh、従来の2倍以上）',
        '携帯版: ステータスバー（ファイル名・改行無視等）を超コンパクト化し、テキスト編集面積を最大化',
        '携帯版: 画像読み込み時にビューワ全体に画像がフィットするよう修正（fitZoomの上限キャップ撤廃）',
        '携帯版: テキストエディタのtextareaがペイン全体を埋めるようflex伸長を追加',
        'モーダルのモバイルCSS重複定義を統合',
      ],
      en: [
        'Mobile: greatly enlarged image viewer and text editor split panes (70vh each, 2x+ previous)',
        'Mobile: ultra-compact statusbar (filename, ignore-newline, etc.) to maximize text editing area',
        'Mobile: fixed image filling viewer on load by removing fitZoom cap',
        'Mobile: textarea now fills entire pane via flex growth',
        'Merged duplicate mobile modal CSS definitions',
      ],
    },
  },
  {
    version: '4.3.0',
    date: '2026-03-27',
    changes: {
      ja: [
        'IIIFサンプル追加: 玉水物語（京都大学附属図書館蔵）をサンプルタイルから直接読み込み可能に',
        'IIIFLoaderに外部URL指定による自動フェッチ機能を追加（forwardRef + useImperativeHandle）',
        'テキストエディタに文字サイズ自動フィット機能を追加（行幅に合わせてフォントサイズを自動拡大）',
        '縦書きモードで「ー」等の縦書き字形が正しく表示されるようfont-feature-settings: "vert"を追加',
        'くずし字サンプルを竹取物語に修正、バッジ色をpondblueに変更',
        'ヘッダーサブタイトル「現代の活字からくずし字まで」をバッジ風の目立つデザインに変更',
        'サンプルラベル「サンプル画像で試す:」の視認性を向上',
        '携帯版: 結果ツールバー・AI校正・読み順編集・バグ報告ボタンをコンパクト化',
        '携帯版: テキストエディタのヘッダー・ステータスバー・フォントコントロールを画面内に収まるよう最適化',
      ],
      en: [
        'Added IIIF sample: Tamamizu Monogatari (Kyoto Univ. Library) loadable from sample tile',
        'Added auto-fetch via external URL to IIIFLoader (forwardRef + useImperativeHandle)',
        'Added auto-fit font size feature to text editor (scales font to fill line width)',
        'Fixed vertical glyph rendering for "ー" etc. with font-feature-settings: "vert"',
        'Corrected kuzushiji sample to Taketori Monogatari, changed badge color to pondblue',
        'Made header subtitle more prominent with badge-style design',
        'Improved visibility of sample tile label',
        'Mobile: compacted result toolbar, AI proofread, reading order, and bug report buttons',
        'Mobile: optimized text editor header, statusbar, and font controls to fit screen',
      ],
    },
  },
  {
    version: '4.2.2',
    date: '2026-03-26',
    changes: {
      ja: [
        'くずし字サンプルタイルのバッジ色をpondblue（プライマリカラー）に変更',
      ],
      en: [
        'Changed kuzushiji sample tile badge color to pondblue (primary color)',
      ],
    },
  },
  {
    version: '4.2.1',
    date: '2026-03-26',
    changes: {
      ja: [
        'IIIF画像読み込みエラーを修正: COEP headerを require-corp → credentialless に変更し、クロスオリジンIIIF fetchを許可',
        'IIIFマニフェスト取得時のContent-Type検証を緩和（text/plain等で返すサーバーに対応）',
      ],
      en: [
        'Fixed IIIF image loading error: changed COEP header from require-corp to credentialless, allowing cross-origin IIIF fetches',
        'Relaxed Content-Type validation for IIIF manifest fetch (supports servers returning text/plain etc.)',
      ],
    },
  },
  {
    version: '4.2.0',
    date: '2026-03-26',
    changes: {
      ja: [
        '名称変更: NDLOCR-lite Web AI: Ultra Bluepond → NDL(Kotenseki)OCR-lite Web AI Ultra Bluepond',
        'IIIF画像読み込み機能を追加（Presentation API v2/v3対応、マニフェストURLから画像を選択・読み込み）',
        'NDL古典籍OCR-Liteのクレジットをフッター・ライセンス・READMEに追加',
        'コードレビューで発見されたバグ修正（null安全性、ハンドラ競合、メッセージIDフィルタリング）',
      ],
      en: [
        'Renamed: NDLOCR-lite Web AI: Ultra Bluepond → NDL(Kotenseki)OCR-lite Web AI Ultra Bluepond',
        'Added IIIF image loading (Presentation API v2/v3, select and load images from manifest URL)',
        'Added NDL Kotenseki OCR-Lite credit to footer, license, and README',
        'Fixed bugs from code review (null safety, handler race conditions, message ID filtering)',
      ],
    },
  },
  {
    version: '4.1.0',
    date: '2026-03-26',
    changes: {
      ja: [
        'オートモードで画像の色分布・紙質を自動分析し、現代/古典籍OCRを自動選択する機能を実装',
        'サンプル画像をビジュアルタイル形式で選択可能に（現代: 蜘蛛の糸、くずし字: 竹取物語）',
        'くずし字/古典籍ボタンのラベルを「くずし字/古典籍」に変更し、対応範囲を明確化',
        'RTMDetレイアウト検出モデルの入力サイズバグを修正（1280→1024、モデル実寸に合致）',
        'オートモード初期化時に全モデル（現代+古典籍）を並列ロードし、切替遅延を解消',
      ],
      en: [
        'Implemented auto-detection: analyzes image color/paper texture to auto-select Modern or Classical OCR pipeline',
        'Added visual sample tile selector (Modern: Spider\'s Thread, Kuzushiji: Tale of Genji scroll)',
        'Renamed Kuzushiji button to "Kuzushiji/Classical" to clarify supported scope',
        'Fixed RTMDet layout model input size bug (1280→1024, matching actual model dimensions)',
        'Auto mode now pre-loads all models (modern + classical) in parallel for instant switching',
      ],
    },
  },
  {
    version: '4.0.0',
    date: '2026-03-26',
    changes: {
      ja: [
        '古典籍OCRモード追加（RTMDetレイアウト検出 + PARSeqくずし字認識）',
        'オート / 現代 / くずし字・古典籍 の3モード切替UIをヘッダーに追加（アイコン・目立つデザイン）',
        'ndlkotenocr-lite の ONNX モデルをブラウザ統合',
      ],
      en: [
        'Added classical Japanese OCR mode (RTMDet layout detection + PARSeq cursive script recognition)',
        'Added Auto / Modern / Kuzushiji 3-way mode toggle in header with icons',
        'Integrated ndlkotenocr-lite ONNX models for browser-based execution',
      ],
    },
  },
  {
    version: '3.9.0',
    date: '2026-03-26',
    changes: {
      ja: [
        '言語セレクタをコンパクトなドロップダウン方式に変更（現代語・古典語とも選択中の国旗のみ表示）',
      ],
      en: [
        'Compact dropdown language selector (shows only selected flag; click to expand full list)',
      ],
    },
  },
  {
    version: '3.8.0',
    date: '2026-03-26',
    changes: {
      ja: [
        '英語OCRのスペース認識を修正（maxIndex=1をスペース文字として許可）',
      ],
      en: [
        'Fixed English OCR space recognition (allow maxIndex=1 as space character)',
      ],
    },
  },
  {
    version: '3.7.0',
    date: '2026-03-26',
    changes: {
      ja: [
        '名称変更: Model BLUEPOND → Ultra Bluepond',
        'モバイル保存ボタンの修正（iOS Safari ダウンロード互換性向上）',
        'ローディング画面タイトル・サブタイトルの白いハロー効果を強化',
        'ドロップダウンメニューのモバイルタッチ操作を改善',
        'モバイルでのブロック選択→エディタ連動を修正（タップ検出・キーボード非表示）',
        'タイトル「Bluepond」の「Blue」部分にテーマカラーを適用',
      ],
      en: [
        'Renamed: Model BLUEPOND → Ultra Bluepond',
        'Fixed mobile save button (iOS Safari download compatibility)',
        'Enhanced white halo effect on loading screen title & subtitle',
        'Improved dropdown menu touch interaction on mobile',
        'Fixed mobile block selection → editor scroll/highlight (tap detection, no keyboard)',
        'Applied theme color to "Blue" in "Bluepond" title',
      ],
    },
  },
  {
    version: '3.5.0',
    date: '2026-03-26',
    changes: {
      ja: [
        '一括AI校正機能を追加',
        'ドラッグ＆ドロップによる結果ページ並べ替え',
        'テキストブロック読み順の手動修正機能',
        'TEI XMLメタデータ入力UI（学術用9フィールド）',
        '自動たち落としにおける大津の方法による閾値自動算出',
        'バグ報告のmailtoリンク修正（COOP対応）',
        '画像前処理の適用/リセットを結果ビューで修正',
        '読み順編集バーとズームコントロールの重なり修正',
        'ライセンス表示の4者構成化（NDL / 橋本 / 小形 / 宮川）',
        'エクスポートメニューのフォーマット名揃え修正',
        '16言語UI対応',
      ],
      en: [
        'Added batch AI proofreading',
        'Drag & drop result page reordering',
        'Manual text block reading order correction',
        'TEI XML metadata input UI (9 academic fields)',
        'Auto crop with Otsu\'s method for automatic thresholding',
        'Fixed bug report mailto link (COOP compatibility)',
        'Fixed image preprocessing apply/reset in results view',
        'Fixed reading order edit bar overlapping zoom controls',
        'License display with 4-party structure (NDL / Hashimoto / Ogata / Miyagawa)',
        'Fixed export menu format name alignment',
        '16-language UI support',
      ],
    },
  },
  {
    version: '3.4.0',
    date: '2026-03-25',
    changes: {
      ja: [
        'AI校正機能の追加（Direct API / MCP対応）',
        '差分表示（accept/reject UI）',
        'DOCXエクスポート機能',
        'hOCRエクスポート機能',
        'テキスト付きPDFエクスポート機能',
        'バグ報告・機能要望フォーム',
      ],
      en: [
        'Added AI proofreading (Direct API / MCP support)',
        'Diff view with accept/reject UI',
        'DOCX export',
        'hOCR export',
        'Text-embedded PDF export',
        'Bug report / feature request form',
      ],
    },
  },
  {
    version: '3.3.0',
    date: '2026-03-25',
    changes: {
      ja: [
        '画像前処理機能（明度・コントラスト・二値化・ノイズ除去・傾き補正）',
        '見開きページ自動分割',
        '領域選択OCR',
        'カメラ撮影・ドキュメントスキャナー対応',
      ],
      en: [
        'Image preprocessing (brightness, contrast, binarization, denoising, deskew)',
        'Double-page automatic splitting',
        'Region-select OCR',
        'Camera capture & document scanner support',
      ],
    },
  },
  {
    version: '3.2.0',
    date: '2026-03-24',
    changes: {
      ja: [
        '縦書き表示モード',
        '検索・置換機能',
        'TEI XMLエクスポート',
        '処理履歴パネル',
      ],
      en: [
        'Vertical text display mode',
        'Search & replace',
        'TEI XML export',
        'Processing history panel',
      ],
    },
  },
  {
    version: '3.1.0',
    date: '2026-03-24',
    changes: {
      ja: [
        'ダークモード',
        '多言語UI（初期対応）',
        '鳥獣戯画の背景',
        '一括保存機能',
      ],
      en: [
        'Dark mode',
        'Multilingual UI (initial support)',
        'Choju-giga background',
        'Batch save feature',
      ],
    },
  },
]

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
  ocrMode: OCRMode
  onSwitchOcrMode: (mode: OCRMode) => void
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
  ocrMode,
  onSwitchOcrMode,
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
  const [showChangelog, setShowChangelog] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const CLASSICAL_LANGS = ['la', 'sa', 'syc', 'cop'] as const
  const MODERN_LANGS = LANGUAGES.filter(c => !(CLASSICAL_LANGS as readonly string[]).includes(c))

  const CLASSICAL_LABELS: Record<string, Record<string, string>> = {
    la:  { ja: 'ラテン語', en: 'Latin', 'zh-CN': '拉丁语', 'zh-TW': '拉丁語', ko: '라틴어', la: 'Latina', eo: 'Latina', es: 'Latín', de: 'Latein', ar: 'اللاتينية', hi: 'लैटिन', ru: 'Латынь', el: 'Λατινικά', syc: 'ܠܛܝܢܝܐ', cop: 'ⲗⲁⲧⲓⲛⲟⲛ', sa: 'लातिनी' },
    sa:  { ja: '梵語', en: 'Sanskrit', 'zh-CN': '梵语', 'zh-TW': '梵語', ko: '산스크리트어', la: 'Sanscrita', eo: 'Sanskrito', es: 'Sánscrito', de: 'Sanskrit', ar: 'السنسكريتية', hi: 'संस्कृत', ru: 'Санскрит', el: 'Σανσκριτικά', syc: 'ܣܢܣܩܪܝܛ', cop: 'ⲥⲁⲛⲥⲕⲣⲓⲧ', sa: 'संस्कृतम्' },
    syc: { ja: 'シリア語', en: 'Syriac', 'zh-CN': '叙利亚语', 'zh-TW': '敘利亞語', ko: '시리아어', la: 'Syriaca', eo: 'Siria', es: 'Siríaco', de: 'Syrisch', ar: 'السريانية', hi: 'सीरियाई', ru: 'Сирийский', el: 'Συριακά', syc: 'ܣܘܪܝܝܐ', cop: 'ⲙⲉⲧⲥⲩⲣⲓⲁⲛⲟⲥ', sa: 'सिरियाक्' },
    cop: { ja: 'コプト語', en: 'Coptic', 'zh-CN': '科普特语', 'zh-TW': '科普特語', ko: '콥트어', la: 'Coptica', eo: 'Kopta', es: 'Copto', de: 'Koptisch', ar: 'القبطية', hi: 'कॉप्टिक', ru: 'Коптский', el: 'Κοπτικά', syc: 'ܩܘܦܛܝܐ', cop: 'ⲙⲉⲧⲣⲉⲙⲛⲕⲏⲙⲉ', sa: 'कोप्तिक्' },
  }

  const handleVersionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowChangelog(true)
  }, [])

  const changelogTitle = L(lang, {
    ja: '更新履歴', en: 'Changelog', 'zh-CN': '更新日志', 'zh-TW': '更新紀錄', ko: '업데이트 기록',
    la: 'Historia mutationum', eo: 'Ŝanĝoprotokolo', es: 'Registro de cambios', de: 'Änderungsprotokoll',
    ar: 'سجل التغييرات', hi: 'परिवर्तन लॉग', ru: 'Журнал изменений', el: 'Αρχείο αλλαγών',
    syc: 'ܫ̈ܘ̈ܚ̈ܠ̈ܦ̈ܐ', cop: 'ⲡⲓⲥϧⲁⲓ ⲛⲧⲉ ⲛⲓϣⲟⲃⲧ', sa: 'परिवर्तन-सूची'
  })

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
          <span className="header-title-main">NDL(Kotenseki)OCR-lite Web AI</span>
          <span className="header-title-accent">Ultra <span className="bluepond-blue">Blue</span>pond</span>
          <span className="header-subtitle">{L(lang, {
            ja: '現代の活字からくずし字まで',
            en: 'Modern print to kuzushiji',
            'zh-CN': '现代印刷体到古典草书',
            'zh-TW': '現代印刷體到古典草書',
            ko: '현대 인쇄체에서 흘림체까지',
            la: 'A typis modernis ad kuzushiji',
            eo: 'De moderna presaĵo ĝis kuzushiji',
            es: 'Del texto moderno al kuzushiji',
            de: 'Vom Druck bis Kuzushiji',
            ar: 'من الطباعة الحديثة إلى الكوزوشيجي',
            hi: 'आधुनिक मुद्रण से कुज़ुशिजी तक',
            ru: 'От печати до кудзусидзи',
            el: 'Από τυπωμένα κείμενα έως κουζουσίτζι',
            syc: 'ܡܢ ܐܬܘ̈ܬ ܛܒ̈ܥܐ ܥܕܡܐ ܠܟ̈ܘ̈ܙ̈ܘ̈ܫ̈ܝ̈ܓ̈ܝ',
            cop: 'Ⲓⲥϫⲉⲛ ⲛⲓⲧⲩⲡⲟⲥ ϣⲁ ⲛⲓⲕⲟⲩⲍⲟⲩϣⲓϫⲓ',
            sa: 'आधुनिक-मुद्रणात् कुज़ुशिजी-पर्यन्तम्',
          })}</span>
        </div>
        <span
          className="header-version header-version-pulse header-version-clickable"
          onClick={handleVersionClick}
          title={changelogTitle}
          role="button"
          tabIndex={0}
        >v4.3.3</span>
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

          {/* OCR Mode switcher — auto / modern / koten (3-way toggle) */}
          <div className="ocr-mode-toggle">
            <button
              className={`ocr-mode-btn${ocrMode === 'auto' ? ' ocr-mode-btn-active' : ''}`}
              onClick={() => onSwitchOcrMode('auto')}
              title={L(lang, { ja: 'オート認識（自動判定）', en: 'Auto detect', 'zh-CN': '自动识别', 'zh-TW': '自動辨識', ko: '자동 인식' })}
            >
              <svg className="ocr-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              {L(lang, { ja: 'オート', en: 'Auto', 'zh-CN': '自动', 'zh-TW': '自動', ko: '자동', la: 'Auto', eo: 'Aŭto', es: 'Auto', de: 'Auto', ar: 'تلقائي', hi: 'ऑटो' })}
            </button>
            <button
              className={`ocr-mode-btn${ocrMode === 'modern' ? ' ocr-mode-btn-active' : ''}`}
              onClick={() => onSwitchOcrMode('modern')}
              title={L(lang, { ja: '現代日本語OCR（活字・印刷物）', en: 'Modern Japanese OCR (printed text)', 'zh-CN': '现代日语OCR（印刷体）', 'zh-TW': '現代日語OCR（印刷體）', ko: '현대 일본어 OCR (인쇄체)' })}
            >
              <svg className="ocr-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
              </svg>
              {L(lang, { ja: '現代', en: 'Modern', 'zh-CN': '现代', 'zh-TW': '現代', ko: '현대', la: 'Moderna', eo: 'Moderna', es: 'Moderno', de: 'Modern', ar: 'حديث', hi: 'आधुनिक' })}
            </button>
            <button
              className={`ocr-mode-btn${ocrMode === 'koten' ? ' ocr-mode-btn-active' : ''}`}
              onClick={() => onSwitchOcrMode('koten')}
              title={L(lang, { ja: 'くずし字/古典籍OCR（写本・版本・古文書）', en: 'Kuzushiji/Classical OCR (manuscripts & old texts)', 'zh-CN': '草书/古籍OCR（手稿及古文献）', 'zh-TW': '草書/古籍OCR（手稿及古文獻）', ko: '흘림체/고전 OCR (필사본 및 고문서)' })}
            >
              <svg className="ocr-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              {L(lang, { ja: 'くずし字/古典籍', en: 'Kuzushiji/Classical', 'zh-CN': '草书/古籍', 'zh-TW': '草書/古籍', ko: '흘림체/고전', la: 'Cursiva/Classica', eo: 'Kursiva/Klasika', es: 'Cursiva/Clásica', de: 'Kursiv/Klassisch', ar: 'مخطوط/كلاسيكي', hi: 'कुज़ुशिजी/शास्त्रीय' })}
            </button>
          </div>

          {/* Unified UI language selector */}
          <div className="lang-dropdown-wrap">
            <button
              className="lang-dropdown-toggle"
              onClick={() => setLangOpen(!langOpen)}
              type="button"
              title={L(lang, { ja: 'UI言語', en: 'UI Language', 'zh-CN': 'UI语言', 'zh-TW': 'UI語言', ko: 'UI 언어' })}
            >
              <svg className="lang-ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="lang-dropdown-flag">{FLAG_EMOJI[lang] ?? FLAG_EMOJI['ja']}</span>
              <span className="lang-dropdown-label">{LANGUAGE_LABELS[lang] ?? 'Language'}</span>
              <svg className="lang-dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: langOpen ? 'rotate(180deg)' : 'none' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {langOpen && (
              <div className="lang-dropdown-menu">
                <div className="lang-dropdown-section-label">{L(lang, {
                  ja: '── 現代語 ──', en: '── Modern ──', 'zh-CN': '── 现代语 ──', 'zh-TW': '── 現代語 ──',
                  ko: '── 현대어 ──', la: '── Modernae ──', eo: '── Modernaj ──', es: '── Modernas ──',
                  de: '── Modern ──', ar: '── حديثة ──', hi: '── आधुनिक ──', ru: '── Современные ──',
                  el: '── Σύγχρονες ──', sa: '── आधुनिकाः ──', syc: '── ܚ̈ܕ̈ܬ̈ܬ̈ܐ ──', cop: '── ⲛⲓⲕⲉⲙⲟⲇⲉⲣⲛ ──'
                })}</div>
                {MODERN_LANGS.map(code => (
                  <button
                    key={code}
                    className={`lang-dropdown-item${lang === code ? ' lang-dropdown-item-active' : ''}`}
                    onClick={() => {
                      onToggleLanguage({ target: { value: code } } as React.ChangeEvent<HTMLSelectElement>)
                      setLangOpen(false)
                      setMenuOpen(false)
                    }}
                  >
                    <span className="lang-dropdown-item-flag">{FLAG_EMOJI[code]}</span>
                    <span className="lang-dropdown-item-name">{LANGUAGE_LABELS[code]}</span>
                  </button>
                ))}
                <div className="lang-dropdown-section-label">{L(lang, {
                  ja: '── 古典語 ──', en: '── Classical ──', 'zh-CN': '── 古典语 ──', 'zh-TW': '── 古典語 ──',
                  ko: '── 고전어 ──', la: '── Classicae ──', eo: '── Klasikaj ──', es: '── Clásicas ──',
                  de: '── Klassisch ──', ar: '── كلاسيكية ──', hi: '── शास्त्रीय ──', ru: '── Классические ──',
                  el: '── Κλασικές ──', sa: '── शास्त्रीयाः ──', syc: '── ܩ̈ܕ̈ܝ̈ܡ̈ܬ̈ܐ ──', cop: '── ⲛⲓⲕⲗⲁⲥⲓⲕⲟⲛ ──'
                })}</div>
                {CLASSICAL_LANGS.map(code => (
                  <button
                    key={code}
                    className={`lang-dropdown-item${lang === code ? ' lang-dropdown-item-active' : ''}`}
                    onClick={() => {
                      onToggleLanguage({ target: { value: code } } as React.ChangeEvent<HTMLSelectElement>)
                      setLangOpen(false)
                      setMenuOpen(false)
                    }}
                  >
                    <span className="lang-dropdown-item-flag">{FLAG_EMOJI[code]}</span>
                    <span className="lang-dropdown-item-name">{CLASSICAL_LABELS[code]?.[lang] ?? CLASSICAL_LABELS[code]?.en ?? code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer info inside drawer (mobile only) ── */}
        <div className="drawer-footer-info">
          <div className="drawer-footer-privacy">
            <span className="privacy-icon">🔒</span>
            {L(lang, {
              ja: 'このシステムはWebブラウザで完結して動作します。選択した画像とOCR結果はPCの外部には送信されません。',
              en: 'This system runs entirely in your browser. Images and OCR results are never sent to any external server.',
              'zh-CN': '该系统完全在浏览器中运行。图像和OCR结果不会发送到外部。',
              'zh-TW': '該系統完全在瀏覽器中運行。圖像和OCR結果不會傳送到外部。',
              ko: '이 시스템은 브라우저에서 완전히 실행됩니다. 이미지와 OCR 결과는 외부로 전송되지 않습니다.',
              la: 'Hoc systema in navigatro operatur. Imagines et eventus OCR extra non mittuntur.',
              eo: 'Ĉi tiu sistemo funkcias tute en via retumilo. Bildoj kaj OCR-rezultoj neniam estas senditaj eksteren.',
              es: 'Este sistema funciona completamente en su navegador. Las imágenes y resultados OCR nunca se envían a ningún servidor.',
              de: 'Dieses System läuft vollständig in Ihrem Browser. Bilder und OCR-Ergebnisse werden nie an externe Server gesendet.',
              ar: 'يعمل هذا النظام بالكامل في متصفحك. لا يتم إرسال الصور ونتائج OCR إلى أي خادم خارجي.',
              hi: 'यह सिस्टम पूरी तरह आपके ब्राउज़र में चलता है। छवियाँ और OCR परिणाम कभी बाहर नहीं भेजे जाते।',
              ru: 'Эта система работает полностью в вашем браузере. Изображения и результаты OCR никогда не отправляются на внешний сервер.',
              el: 'Αυτό το σύστημα λειτουργεί εξ ολοκλήρου στο πρόγραμμα περιήγησής σας. Οι εικόνες και τα αποτελέσματα OCR δεν αποστέλλονται ποτέ.',
              syc: 'ܗܢ ܫܘ̈ܠܛ̈ܢ ܟ̈ܠ̈ܗ ܒ̈ܡ̈ܕ̈ܒ̈ܪ̈ܢ̈ܐ ܦ̈ܥ̈ܠ. ܨ̈ܘ̈ܪ̈ܬ̈ܐ ܘ̈ܦ̈ܠ̈ܛ̈ OCR ܠ̈ܒ̈ܪ ܠ̈ܐ ܡ̈ܫ̈ܬ̈ܕ̈ܪ̈ܝ̈ܢ.',
              cop: 'ⲡⲁⲓⲥⲩⲥⲧⲏⲙⲁ ⲉϥⲉⲣϩⲱⲃ ⲧⲏⲣϥ ϧⲉⲛ ⲡⲉⲕⲃⲣⲁⲩⲍⲉⲣ. ⲛⲓⲉⲓⲕⲱⲛ ⲛⲉⲙ ⲛⲓⲡⲟⲗⲏ ⲛⲧⲉ OCR ⲛⲁⲩⲟⲩⲟⲣⲡⲟⲩ ⲉⲃⲟⲗ ⲁⲛ.',
              sa: 'एतत् प्रणालिका सम्पूर्णतया ब्राउज़रे चलति। चित्राणि OCR-फलानि च बाह्यसेवकाय न प्रेष्यन्ते।'
            })}
          </div>
          <div className="drawer-footer-credits">
            {L(lang, {
              ja: 'OCRエンジン: 国立国会図書館 (NDL Lab) / Web版: 橋本雄太 / AI校正: 小形克宏 / Ultra Bluepond: 宮川創',
              en: 'OCR engine: NDL Lab / Web port: Y. Hashimoto / AI proofread: K. Ogata / Ultra Bluepond: S. Miyagawa',
              'zh-CN': 'OCR引擎: NDL Lab / Web版: 桥本雄太 / AI校正: 小形克宏 / Ultra Bluepond: 宫川创',
              'zh-TW': 'OCR引擎: NDL Lab / Web版: 橋本雄太 / AI校正: 小形克宏 / Ultra Bluepond: 宮川創',
              ko: 'OCR 엔진: NDL Lab / Web판: 하시모토 유타 / AI교정: 오가타 카쓰히로 / Ultra Bluepond: 미야가와 소',
              la: 'OCR: NDL Lab / Web: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              eo: 'OCR: NDL Lab / Retversio: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              es: 'OCR: NDL Lab / Web: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              de: 'OCR: NDL Lab / Web: Y. Hashimoto / KI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              ar: 'محرك OCR: NDL Lab / الويب: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              hi: 'OCR: NDL Lab / वेब: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              ru: 'OCR: NDL Lab / Веб: Ю. Хасимото / AI: К. Огата / Ultra Bluepond: С. Миягава',
              el: 'OCR: NDL Lab / Web: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              syc: 'OCR: NDL Lab / ܓܘ: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              cop: 'OCR: NDL Lab / Web: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa',
              sa: 'OCR: NDL Lab / Web: Y. Hashimoto / AI: K. Ogata / Ultra Bluepond: S. Miyagawa'
            })}
          </div>
          <div className="drawer-footer-license">
            NDLOCR-Lite: CC BY 4.0 (NDL) / Web: CC BY 4.0 (Hashimoto) / AI: MIT (Ogata) / Ultra Bluepond: CC BY 4.0 (Miyagawa)
          </div>
          <div className="drawer-footer-frog">
            {L(lang, {
              ja: '🐸 鳥獣戯画模様は NDLOCR 開発者・青池亨先生へのオマージュ',
              en: '🐸 Choju-giga background is a tribute to Toru Aoike (NDL), developer of NDLOCR',
              'zh-CN': '🐸 鸟兽戏画背景是向NDLOCR开发者青池亨致敬',
              'zh-TW': '🐸 鳥獸戲畫背景是向NDLOCR開發者青池亨致敬',
              ko: '🐸 조수희화 배경은 NDLOCR 개발자 아오이케 토오루에 대한 오마주',
              la: '🐸 Choju-giga est honorarium Toru Aoike (NDL), creatori NDLOCR',
              eo: '🐸 Choju-giga estas omaĝo al Toru Aoike (NDL), kreinto de NDLOCR',
              es: '🐸 Choju-giga es un tributo a Toru Aoike (NDL), desarrollador de NDLOCR',
              de: '🐸 Choju-giga ist eine Hommage an Toru Aoike (NDL), Entwickler von NDLOCR',
              ar: '🐸 Choju-giga هو تكريم لـ Toru Aoike (NDL)، مطور NDLOCR',
              hi: '🐸 Choju-giga पृष्ठभूमि Toru Aoike (NDL), NDLOCR के डेवलपर को श्रद्धांजलि',
              ru: '🐸 Choju-giga — дань уважения Тору Аойке (NDL), разработчику NDLOCR',
              el: '🐸 Choju-giga: φόρος τιμής στον Toru Aoike (NDL), δημιουργό του NDLOCR',
              syc: '🐸 Choju-giga ܐ̈ܝ̈ܩ̈ܪ̈ ܠ Toru Aoike (NDL)، ܒ̈ܪ̈ܘ̈ܝ̈ NDLOCR',
              cop: '🐸 Choju-giga ⲟⲩⲧⲁⲓⲟ ⲛ Toru Aoike (NDL), ⲫⲏ ⲉⲧⲁϥⲑⲁⲙⲓⲟ ⲙ NDLOCR',
              sa: '🐸 Choju-giga Toru Aoike (NDL) NDLOCR विकासकस्य सम्मानार्थम्'
            })}
          </div>
        </div>
      </div>

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="modal-overlay" onClick={() => setShowChangelog(false)}>
          <div className="modal-content changelog-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{changelogTitle}</h2>
              <button className="modal-close" onClick={() => setShowChangelog(false)} type="button">&times;</button>
            </div>
            <div className="changelog-body">
              {CHANGELOG.map(entry => (
                <div key={entry.version} className="changelog-entry">
                  <div className="changelog-version-header">
                    <span className="changelog-version-badge">v{entry.version}</span>
                    <span className="changelog-date">{entry.date}</span>
                  </div>
                  <ul className="changelog-list">
                    {(entry.changes[lang] || entry.changes['en']).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
})
