import type { Language } from '../../i18n'

interface AIConnectHelpProps {
  lang: Language
  onClose: () => void
  onOpenSettings: () => void
}

const content: Record<string, {
  title: string
  intro: string
  steps: { label: string; detail: string }[]
  providers: { name: string; desc: string }[]
  notes: string[]
  settingsBtn: string
  closeBtn: string
  supportedAIServicesHeading: string
  notesHeading: string
}> = {
  ja: {
    title: 'AI校正機能の接続方法',
    intro: 'AI校正機能を使うと、OCR結果をAIが自動で校正します。接続には各AIサービスのAPIキーが必要です。',
    steps: [
      {
        label: '1. APIキーを取得する',
        detail: '利用したいAIサービス（Claude, GPT, Gemini等）の公式サイトでAPIキーを発行してください。多くのサービスは無料枠があります。',
      },
      {
        label: '2. 設定画面を開く',
        detail: 'ヘッダー右側の歯車アイコン（⚙）をクリックするか、下の「設定を開く」ボタンを押してください。',
      },
      {
        label: '3. プロバイダーを選択',
        detail: '設定画面の「AIプロバイダー」タブで使用するサービスを選びます。',
      },
      {
        label: '4. APIキーを入力',
        detail: 'APIキー入力欄にキーを貼り付けます。キーはブラウザ内で暗号化保存され、外部サーバーには送信されません。',
      },
      {
        label: '5. 接続テスト',
        detail: '「接続テスト」ボタンを押して接続を確認します。成功すると「AI接続済み」と表示されます。',
      },
    ],
    providers: [
      { name: 'Anthropic (Claude)', desc: 'console.anthropic.com でAPIキーを取得' },
      { name: 'OpenAI (GPT)', desc: 'platform.openai.com でAPIキーを取得' },
      { name: 'Google (Gemini)', desc: 'aistudio.google.com でAPIキーを取得' },
      { name: 'Groq', desc: 'console.groq.com でAPIキーを取得（無料枠あり）' },
    ],
    notes: [
      'APIキーはブラウザ内でAES-GCM暗号化され、安全に保存されます。',
      'AI校正はOCR結果のテキストのみをAPIに送信します。画像は送信されません。',
      '歴史的文書の旧字体はデフォルトで保持されます（現代字体に変換しません）。',
    ],
    settingsBtn: '設定を開く',
    closeBtn: '閉じる',
    supportedAIServicesHeading: '対応AIサービス',
    notesHeading: '補足情報',
  },
  en: {
    title: 'How to Connect AI Proofreading',
    intro: 'AI proofreading automatically corrects OCR results using AI. An API key from your preferred AI service is required.',
    steps: [
      {
        label: '1. Get an API Key',
        detail: 'Visit the official website of your preferred AI service (Claude, GPT, Gemini, etc.) and generate an API key. Most services offer a free tier.',
      },
      {
        label: '2. Open Settings',
        detail: 'Click the gear icon (⚙) in the header, or press the "Open Settings" button below.',
      },
      {
        label: '3. Select a Provider',
        detail: 'In the Settings "AI Provider" tab, choose the service you want to use.',
      },
      {
        label: '4. Enter Your API Key',
        detail: 'Paste your API key in the input field. Keys are encrypted in your browser and never sent to external servers.',
      },
      {
        label: '5. Test Connection',
        detail: 'Press "Test Connection" to verify. On success, the status will show "AI Connected".',
      },
    ],
    providers: [
      { name: 'Anthropic (Claude)', desc: 'Get API key at console.anthropic.com' },
      { name: 'OpenAI (GPT)', desc: 'Get API key at platform.openai.com' },
      { name: 'Google (Gemini)', desc: 'Get API key at aistudio.google.com' },
      { name: 'Groq', desc: 'Get API key at console.groq.com (free tier available)' },
    ],
    notes: [
      'API keys are encrypted with AES-GCM and stored securely in your browser.',
      'AI proofreading only sends OCR text to the API. Images are never transmitted.',
      'Historical characters (旧字体) are preserved by default.',
    ],
    settingsBtn: 'Open Settings',
    closeBtn: 'Close',
    supportedAIServicesHeading: 'Supported AI Services',
    notesHeading: 'Notes',
  },
  'zh-CN': {
    title: 'AI连接指南',
    intro: 'AI校正功能可自动使用AI校对OCR结果。需要从您选择的AI服务获取API密钥。',
    steps: [
      {
        label: '1. 获取API密钥',
        detail: '访问您喜欢的AI服务（Claude、GPT、Gemini等）的官方网站并生成API密钥。大多数服务提供免费层级。',
      },
      {
        label: '2. 打开设置',
        detail: '点击标题中的齿轮图标（⚙）或按下下面的"打开设置"按钮。',
      },
      {
        label: '3. 选择提供商',
        detail: '在设置的"AI提供商"选项卡中选择要使用的服务。',
      },
      {
        label: '4. 输入API密钥',
        detail: '将API密钥粘贴到输入字段中。密钥在浏览器中加密，从不发送到外部服务器。',
      },
      {
        label: '5. 测试连接',
        detail: '按"测试连接"以验证。成功后，状态将显示"AI已连接"。',
      },
    ],
    providers: [
      { name: 'Anthropic (Claude)', desc: '在console.anthropic.com获取API密钥' },
      { name: 'OpenAI (GPT)', desc: '在platform.openai.com获取API密钥' },
      { name: 'Google (Gemini)', desc: '在aistudio.google.com获取API密钥' },
      { name: 'Groq', desc: '在console.groq.com获取API密钥（提供免费层级）' },
    ],
    notes: [
      'API密钥使用AES-GCM加密，安全地存储在您的浏览器中。',
      'AI校正仅向API发送OCR文本。图像永远不会被传输。',
      '历史字体（旧字体）默认保留。',
    ],
    settingsBtn: '打开设置',
    closeBtn: '关闭',
    supportedAIServicesHeading: '支持的AI服务',
    notesHeading: '备注',
  },
  'zh-TW': {
    title: 'AI連接指南',
    intro: 'AI校對功能可自動使用AI校對OCR結果。需要從您選擇的AI服務獲取API密鑰。',
    steps: [
      {
        label: '1. 獲取API密鑰',
        detail: '訪問您喜歡的AI服務（Claude、GPT、Gemini等）的官方網站並生成API密鑰。大多數服務提供免費層級。',
      },
      {
        label: '2. 打開設定',
        detail: '點擊標題中的齒輪圖標（⚙）或按下下面的"打開設定"按鈕。',
      },
      {
        label: '3. 選擇提供者',
        detail: '在設定的"AI提供者"選項卡中選擇要使用的服務。',
      },
      {
        label: '4. 輸入API密鑰',
        detail: '將API密鑰貼上到輸入欄位中。密鑰在瀏覽器中加密，從不發送到外部伺服器。',
      },
      {
        label: '5. 測試連線',
        detail: '按"測試連線"以驗證。成功後，狀態將顯示"AI已連接"。',
      },
    ],
    providers: [
      { name: 'Anthropic (Claude)', desc: '在console.anthropic.com獲取API密鑰' },
      { name: 'OpenAI (GPT)', desc: '在platform.openai.com獲取API密鑰' },
      { name: 'Google (Gemini)', desc: '在aistudio.google.com獲取API密鑰' },
      { name: 'Groq', desc: '在console.groq.com獲取API密鑰（提供免費層級）' },
    ],
    notes: [
      'API密鑰使用AES-GCM加密，安全地存儲在您的瀏覽器中。',
      'AI校對僅向API發送OCR文本。圖像永遠不會被傳輸。',
      '歷史字體（舊字體）默認保留。',
    ],
    settingsBtn: '打開設定',
    closeBtn: '關閉',
    supportedAIServicesHeading: '支持的AI服務',
    notesHeading: '備註',
  },
  ko: {
    title: 'AI 연결 가이드',
    intro: 'AI 교정 기능은 AI를 사용하여 OCR 결과를 자동으로 교정합니다. 선택한 AI 서비스에서 API 키가 필요합니다.',
    steps: [
      {
        label: '1. API 키 가져오기',
        detail: '원하는 AI 서비스(Claude, GPT, Gemini 등)의 공식 웹사이트를 방문하여 API 키를 생성합니다. 대부분의 서비스는 무료 계층을 제공합니다.',
      },
      {
        label: '2. 설정 열기',
        detail: '헤더의 톱니바퀴 아이콘(⚙)을 클릭하거나 아래의 "설정 열기" 버튼을 누릅니다.',
      },
      {
        label: '3. 공급자 선택',
        detail: '설정의 "AI 공급자" 탭에서 사용할 서비스를 선택합니다.',
      },
      {
        label: '4. API 키 입력',
        detail: 'API 키를 입력 필드에 붙여넣습니다. 키는 브라우저에서 암호화되며 외부 서버로 전송되지 않습니다.',
      },
      {
        label: '5. 연결 테스트',
        detail: '"연결 테스트"를 눌러 확인합니다. 성공하면 상태에 "AI 연결됨"이 표시됩니다.',
      },
    ],
    providers: [
      { name: 'Anthropic (Claude)', desc: 'console.anthropic.com에서 API 키 가져오기' },
      { name: 'OpenAI (GPT)', desc: 'platform.openai.com에서 API 키 가져오기' },
      { name: 'Google (Gemini)', desc: 'aistudio.google.com에서 API 키 가져오기' },
      { name: 'Groq', desc: 'console.groq.com에서 API 키 가져오기(무료 계층 사용 가능)' },
    ],
    notes: [
      'API 키는 AES-GCM으로 암호화되어 브라우저에 안전하게 저장됩니다.',
      'AI 교정은 OCR 텍스트만 API로 전송합니다. 이미지는 전송되지 않습니다.',
      '역사적 문자(旧字体)는 기본적으로 유지됩니다.',
    ],
    settingsBtn: '설정 열기',
    closeBtn: '닫기',
    supportedAIServicesHeading: '지원하는 AI 서비스',
    notesHeading: '참고',
  },
  la: {
    title: 'Dux Connexionis AI',
    intro: 'Functio correctionis AI automato OCR resulta emendat. Clavis API ex servitio AI desiderato necessaria est.',
    steps: [
      {
        label: '1. Clavis API suscipe',
        detail: 'In situ officiale servitii AI (Claude, GPT, Gemini, etc.) claves API generas. Plurimi servitia gradus liberos praebent.',
      },
      {
        label: '2. Optiones aperire',
        detail: 'Signum rotae (⚙) in titulo clica vel preme signum "Optiones aperire" infra.',
      },
      {
        label: '3. Praebitorem elegito',
        detail: 'In scheda "Praebitor AI" servitium quod uti vis eligito.',
      },
      {
        label: '4. Clavem API insere',
        detail: 'Clavem in campo facile insere. Claves encryptae in navigatore manent, nunquam mittuntur.',
      },
      {
        label: '5. Connexionem proba',
        detail: 'Signum "Connexionem probare" premi ut confirmes. In successu, status "AI Connexum" monstrat.',
      },
    ],
    providers: [
      { name: 'Anthropic (Claude)', desc: 'Clavem apud console.anthropic.com suscipe' },
      { name: 'OpenAI (GPT)', desc: 'Clavem apud platform.openai.com suscipe' },
      { name: 'Google (Gemini)', desc: 'Clavem apud aistudio.google.com suscipe' },
      { name: 'Groq', desc: 'Clavem apud console.groq.com suscipe (gradus liber praebetur)' },
    ],
    notes: [
      'Claves AES-GCM encryptae tutas in navigatore servantur.',
      'Correctio AI textum OCR tantum mittit, numquam imagines.',
      'Characteres historici (旧字体) apud incisum conservantur.',
    ],
    settingsBtn: 'Optiones aperire',
    closeBtn: 'Claudere',
    supportedAIServicesHeading: 'Servitia AI Praebita',
    notesHeading: 'Adnotationes',
  },
  eo: {
    title: 'AI-Konekta Gvidilo',
    intro: 'Aŭtomata AI-korektado ĝustigas OCR-rezultojn per AI. API-ŝlosilo de via preferata AI-servo estas necesara.',
    steps: [
      {
        label: '1. Akiru API-ŝlosilon',
        detail: 'Vizitu la oficalan retejon de via preferata AI-servo (Claude, GPT, Gemini, ktp) kaj generu API-ŝlosilon. Plej multaj servoj ofertas senpaĝan nivelon.',
      },
      {
        label: '2. Malfermi agordojn',
        detail: 'Klaku la ĝan-simbolon (⚙) en la ĉapo, aŭ premu la butonon "Malfermi agordojn" malsupre.',
      },
      {
        label: '3. Elektu posketon',
        detail: 'En la langeto "AI-Provizanto" de agordoj, elektu la servon kiun vi volas uzi.',
      },
      {
        label: '4. Eniru API-ŝlosilon',
        detail: 'Algluu vian API-ŝlosilon en la eniga kampo. Ŝlosiloj ĉifratas en via retumilo kaj neniam sendatas.',
      },
      {
        label: '5. Provu konekton',
        detail: 'Premu "Provu konekton" por kontroli. Sukcese, la statuso montras "AI-Konektita".',
      },
    ],
    providers: [
      { name: 'Anthropic (Claude)', desc: 'Akiru API-ŝlosilon ĉe console.anthropic.com' },
      { name: 'OpenAI (GPT)', desc: 'Akiru API-ŝlosilon ĉe platform.openai.com' },
      { name: 'Google (Gemini)', desc: 'Akiru API-ŝlosilon ĉe aistudio.google.com' },
      { name: 'Groq', desc: 'Akiru API-ŝlosilon ĉe console.groq.com (senpage nivelo havebla)' },
    ],
    notes: [
      'API-ŝlosiloj estas ĉifrataj kun AES-GCM kaj sekure konservitaj en via retumilo.',
      'AI-korektado nur sendas OCR-tekston al la API. Bildoj neniam transmitatas.',
      'Historiaj karakteroj (旧字体) defaŭlte konservitas.',
    ],
    settingsBtn: 'Malfermi agordojn',
    closeBtn: 'Fermi',
    supportedAIServicesHeading: 'Subtenataj AI-Servoj',
    notesHeading: 'Notoj',
  },
}

export function AIConnectHelp({ lang, onClose, onOpenSettings }: AIConnectHelpProps) {
  const c = content[lang] ?? content['en']

  const handleOpenSettings = () => {
    onClose()
    onOpenSettings()
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="help-page-modal ai-connect-help">
        <div className="help-page-header">
          <h2 className="help-page-title">{c.title}</h2>
          <button className="btn-icon help-page-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="help-page-body">
          <p className="ai-help-intro">{c.intro}</p>

          <div className="ai-help-steps">
            {c.steps.map((step, i) => (
              <div key={i} className="ai-help-step">
                <div className="ai-help-step-label">{step.label}</div>
                <div className="ai-help-step-detail">{step.detail}</div>
              </div>
            ))}
          </div>

          <h3 className="help-section-heading">{c.supportedAIServicesHeading}</h3>
          <div className="ai-help-providers">
            {c.providers.map((prov, i) => (
              <div key={i} className="ai-help-provider">
                <span className="ai-help-provider-name">{prov.name}</span>
                <span className="ai-help-provider-desc">{prov.desc}</span>
              </div>
            ))}
          </div>

          <h3 className="help-section-heading">{c.notesHeading}</h3>
          <div className="ai-help-notes">
            {c.notes.map((note, i) => (
              <p key={i} className="ai-help-note">{note}</p>
            ))}
          </div>

          <div className="ai-help-actions">
            <button className="btn btn-primary" onClick={handleOpenSettings}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              {c.settingsBtn}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              {c.closeBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
