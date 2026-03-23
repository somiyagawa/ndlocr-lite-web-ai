import type { Language } from '../../hooks/useI18n'

interface HelpPageProps {
  lang: Language
  onClose: () => void
}

const content: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  ja: {
    title: '使い方ガイド',
    sections: [
      {
        heading: '概要',
        body:
          'NDL-OCR Lite AI Ultra は、国立国会図書館の NDLOCR-Lite をベースにしたブラウザ完結型の OCR（光学文字認識）Web アプリです。画像内の文字をテキストに変換します。画像はサーバーに送信されず、すべてブラウザ内で処理されます。',
      },
      {
        heading: '画像の読み込み',
        body:
          'トップ画面でファイルをドラッグ＆ドロップするか、「ファイルを選択」ボタンで画像（PNG, JPEG, TIFF, HEIC, PDF）を読み込みます。「フォルダ選択」でフォルダ内の全画像を一括読み込みもできます。「クリップボードから貼り付け」でスクリーンショットも処理できます。',
      },
      {
        heading: '画像前処理',
        body:
          '読み込んだ画像に対して、明度・コントラスト・シャープネスの調整、グレースケール化、白黒二値化、ノイズ除去、自動傾き補正、自動裁ち落としなどの前処理を適用できます。前処理パネルは画像ビューア上部のボタンから開きます。',
      },
      {
        heading: 'センター分割・自動分割',
        body:
          '見開きスキャンの画像を左右2ページに分割する機能です。「センター分割」は画像の中央で正確に二分割します。「自動分割」は画像の30〜70%の範囲で最も空白が多い縦列（綴じ目）を自動検出して分割します。',
      },
      {
        heading: 'OCR 認識の実行',
        body:
          '「認識実行」ボタンを押すと OCR 処理が始まります。初回はモデルファイル（約146MB）のダウンロードが必要ですが、2回目以降はブラウザ内（IndexedDB）にキャッシュされます。処理は Web Worker で非同期に実行されるため、UI はフリーズしません。',
      },
      {
        heading: '領域選択 OCR',
        body:
          '画像ビューア上でマウスドラッグにより矩形領域を選択すると、その領域だけを認識できます。表の一部やキャプションなど、特定の箇所を抽出したい場合に便利です。',
      },
      {
        heading: 'テキストエディタ',
        body:
          'OCR 結果はテキストエディタに表示されます。縦書き・横書きの切替、フォントの変更（Monospace / 明朝 / ゴシック）、フォントサイズの調整が可能です。直接編集も可能で、「変更あり」の表示とともに元に戻す（リセット）こともできます。',
      },
      {
        heading: '検索と置換',
        body:
          'テキストエディタ内の検索（Ctrl+F / Cmd+F）および置換機能を使って、OCR 誤認識の一括修正が行えます。',
      },
      {
        heading: 'エクスポートオプション（ファイル名・改行無視）',
        body:
          'テキストエディタ下部のチェックボックスで出力オプションを制御します。「ファイル名」を ON にすると、コピー・保存時にファイル名がヘッダーとして付加されます。「改行無視」を ON にすると、改行を除去して1行のテキストとして出力します（OCR の行折り返しを除去して連続文にする場合に便利です）。',
      },
      {
        heading: 'テキスト付き PDF エクスポート',
        body:
          '認識結果をテキスト付き PDF として出力できます。元画像の上に透明テキストレイヤーを重ねた PDF が生成されるため、PDF ビューアで検索・コピーが可能です。',
      },
      {
        heading: 'その他のエクスポート形式',
        body:
          'プレーンテキスト（.txt）、TEI XML、hOCR 形式でもエクスポートできます。TEI XML と hOCR は座標情報を含むため、研究用途に適しています。',
      },
      {
        heading: 'AI 校正',
        body:
          '設定画面で AI（Claude, GPT, Gemini 等）の API キーを入力すると、OCR 結果を AI に送信して校正を依頼できます。校正結果は差分表示（削除＝赤、追加＝緑）で確認でき、各変更を個別に承認・拒否できます。API キーはブラウザ内で暗号化保存され、サーバーには送信されません。歴史的文書の旧字体は現代字体に変換しない設計です。',
      },
      {
        heading: '処理履歴',
        body:
          'ヘッダーの時計アイコンから処理履歴パネルを開けます。過去の OCR 実行結果を参照・再利用できます。',
      },
      {
        heading: 'ダークモード',
        body:
          'ヘッダーのテーマ切替ボタン（太陽／月アイコン）でライトモードとダークモードを切り替えられます。設定はブラウザに保存されます。',
      },
      {
        heading: '多言語 UI',
        body:
          '日本語・英語・中国語（簡体字・繁体字）・韓国語に対応しています。ヘッダー右端の言語セレクタで切り替えられます。',
      },
      {
        heading: '推奨環境',
        body:
          'デスクトップ PC またはタブレット横向き（画面幅768px以上）を推奨しています。Chrome, Firefox, Safari, Edge の最新版に対応しています。',
      },
      {
        heading: '鳥獣戯画の背景について',
        body:
          '背景の鳥獣戯画模様は、NDLOCR の開発者である青池亨先生へのオマージュです。鳥獣戯画は12世紀の日本の絵巻物で、カエルやウサギが擬人化して描かれた国宝です。',
      },
    ],
  },
  en: {
    title: 'User Guide',
    sections: [
      {
        heading: 'Overview',
        body:
          'NDL-OCR Lite AI Ultra is a browser-based OCR (Optical Character Recognition) web application based on the National Diet Library\'s NDLOCR-Lite. It converts text within images into editable text. All processing happens in your browser — no images are sent to a server.',
      },
      {
        heading: 'Loading Images',
        body:
          'Drag and drop files on the home screen, or use the file picker to load images (PNG, JPEG, TIFF, HEIC, PDF). You can also use "Select Folder" to batch-load all images in a directory, or "Paste from Clipboard" for screenshots.',
      },
      {
        heading: 'Image Preprocessing',
        body:
          'Before OCR, you can apply preprocessing such as brightness/contrast/sharpness adjustments, grayscale conversion, black & white binarization, denoising, auto-deskew, and auto-crop. Open the preprocessing panel from the button above the image viewer.',
      },
      {
        heading: 'Split Center / Split Auto',
        body:
          'These features split a double-page scan into two separate pages. "Split Center" divides the image exactly at the horizontal center. "Split Auto" scans columns between 30–70% of the image width to find the vertical line with the most whitespace (the binding gap) and splits there.',
      },
      {
        heading: 'Running OCR',
        body:
          'Press the "Run OCR" button to start recognition. The first run requires downloading model files (~146 MB), which are then cached in IndexedDB. Processing runs asynchronously in a Web Worker, so the UI remains responsive.',
      },
      {
        heading: 'Region Selection OCR',
        body:
          'Drag a rectangle on the image viewer to select a region, then run OCR on just that region. This is useful for extracting text from specific areas like tables or captions.',
      },
      {
        heading: 'Text Editor',
        body:
          'OCR results are displayed in the text editor. You can switch between vertical and horizontal writing modes, change fonts (Monospace / Serif / Gothic), and adjust font size. Direct editing is supported with an undo/reset option.',
      },
      {
        heading: 'Search & Replace',
        body:
          'Use the search (Ctrl+F / Cmd+F) and replace function in the text editor to batch-correct OCR misrecognitions.',
      },
      {
        heading: 'Export Options (Filename / No Newlines)',
        body:
          'Checkboxes at the bottom of the text editor control export behavior. "Filename" prepends the source filename as a header when copying or saving. "No newlines" removes all line breaks to produce a single continuous line of text — useful for removing OCR line-wrapping artifacts.',
      },
      {
        heading: 'Searchable PDF Export',
        body:
          'Export OCR results as a searchable PDF that overlays transparent text on the original image, enabling text search and copy in PDF viewers.',
      },
      {
        heading: 'Other Export Formats',
        body:
          'Plain text (.txt), TEI XML, and hOCR formats are also available. TEI XML and hOCR include coordinate information, making them suitable for research purposes.',
      },
      {
        heading: 'AI Proofreading',
        body:
          'Enter an AI API key (Claude, GPT, Gemini, etc.) in Settings to proofread OCR results. Changes are shown in a diff view (deletions in red, additions in green) and can be individually accepted or rejected. API keys are encrypted in the browser and never sent to a server. Historical characters (旧字体) are preserved by default.',
      },
      {
        heading: 'History',
        body:
          'Open the history panel from the clock icon in the header to review and reuse past OCR results.',
      },
      {
        heading: 'Dark Mode',
        body:
          'Toggle between light and dark themes using the sun/moon icon in the header. Your preference is saved in the browser.',
      },
      {
        heading: 'Multilingual UI',
        body:
          'Supports Japanese, English, Chinese (Simplified & Traditional), and Korean. Switch languages using the selector at the right end of the header.',
      },
      {
        heading: 'Recommended Environment',
        body:
          'Desktop PC or tablet in landscape mode (screen width 768px+) is recommended. Compatible with the latest versions of Chrome, Firefox, Safari, and Edge.',
      },
      {
        heading: 'About the Choju-giga Background',
        body:
          'The Choju-giga (Scrolls of Frolicking Animals) background pattern is a tribute to Toru Aoike, developer of NDLOCR. Choju-giga is a 12th-century Japanese picture scroll and national treasure, depicting anthropomorphized frogs, rabbits, and monkeys.',
      },
    ],
  },
}

export function HelpPage({ lang, onClose }: HelpPageProps) {
  const c = content[lang] ?? content['en']

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="help-page-modal">
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
          {c.sections.map((sec, i) => (
            <section key={i} className="help-section">
              <h3 className="help-section-heading">{sec.heading}</h3>
              <p className="help-section-body">{sec.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
