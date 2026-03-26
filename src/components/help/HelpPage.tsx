import type { Language } from '../../i18n'

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
          'NDLOCR-lite Web AI: Ultra Bluepond は、国立国会図書館の NDLOCR-Lite をベースにしたブラウザ完結型の OCR（光学文字認識）Web アプリです。画像内の文字をテキストに変換します。画像はサーバーに送信されず、すべてブラウザ内で処理されます。',
      },
      {
        heading: '画像の読み込み',
        body:
          'トップ画面でファイルをドラッグ＆ドロップするか、「ファイルを選択」ボタンで画像（PNG, JPEG, TIFF, HEIC, PDF）を読み込みます。「フォルダ選択」でフォルダ内の全画像を一括読み込みもできます。「クリップボードから貼り付け」でスクリーンショットも処理できます。',
      },
      {
        heading: '画像補正',
        body:
          '読み込んだ画像に対して、明度・コントラスト・シャープネスの調整、グレースケール化、白黒二値化、ノイズ除去、自動傾き補正、自動裁ち落とし、四隅指定切り出しなどの補正を適用できます。画像補正パネルは画像ビューア上部のボタンから開きます。',
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
          'OCR 結果はテキストエディタに表示されます。縦書き・横書きの切替、フォントの変更（Monospace / 明朝 / ゴシック / UD教科書体）、フォントサイズの調整が可能です。直接編集も可能で、「変更あり」の表示とともに元に戻す（リセット）こともできます。',
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
          'NDLOCR-lite Web AI: Ultra Bluepond is a browser-based OCR (Optical Character Recognition) web application based on the National Diet Library\'s NDLOCR-Lite. It converts text within images into editable text. All processing happens in your browser — no images are sent to a server.',
      },
      {
        heading: 'Loading Images',
        body:
          'Drag and drop files on the home screen, or use the file picker to load images (PNG, JPEG, TIFF, HEIC, PDF). You can also use "Select Folder" to batch-load all images in a directory, or "Paste from Clipboard" for screenshots.',
      },
      {
        heading: 'Image Correction',
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
  'zh-CN': {
    title: '使用说明',
    sections: [
      {
        heading: '概述',
        body:
          'NDLOCR-lite Web AI: Ultra Bluepond 是基于日本国立国会图书馆 NDLOCR-Lite 开发的浏览器完整型 OCR（光学字符识别）网络应用。它可以将图像中的文字转换为可编辑的文本。所有处理都在浏览器中完成——图像不会被发送到任何服务器。',
      },
      {
        heading: '加载图像',
        body:
          '在主屏幕上拖放文件，或使用文件选择器加载图像（PNG、JPEG、TIFF、HEIC、PDF）。您还可以使用"选择文件夹"批量加载目录中的所有图像，或使用"从剪贴板粘贴"来处理屏幕截图。',
      },
      {
        heading: '图像校正',
        body:
          'OCR 之前，您可以应用预处理，如亮度/对比度/锐度调整、灰度转换、黑白二值化、去噪、自动倾斜矫正和自动裁剪。从图像查看器上方的按钮打开预处理面板。',
      },
      {
        heading: '中心分割 / 自动分割',
        body:
          '这些功能可将双页扫描的图像分割为两个单独的页面。"中心分割"在图像的水平中心精确二分。"自动分割"在图像宽度的30-70%范围内扫描，找到空白最多的竖列（装订处），并在该处分割。',
      },
      {
        heading: '运行 OCR',
        body:
          '按下"运行 OCR"按钮开始识别。首次运行需要下载模型文件（约146 MB），随后会缓存在 IndexedDB 中。处理在 Web Worker 中异步执行，因此 UI 保持响应状态。',
      },
      {
        heading: '区域选择 OCR',
        body:
          '在图像查看器上拖动矩形选择区域，然后仅在该区域上运行 OCR。这对于从表格或图片标题等特定区域提取文本很有用。',
      },
      {
        heading: '文本编辑器',
        body:
          'OCR 结果显示在文本编辑器中。您可以在竖排和横排书写模式之间切换，更改字体（等宽 / 衬线 / 哥特式），并调整字体大小。支持直接编辑和撤销/重置选项。',
      },
      {
        heading: '搜索和替换',
        body:
          '使用文本编辑器中的搜索（Ctrl+F / Cmd+F）和替换功能来批量修正 OCR 识别错误。',
      },
      {
        heading: '导出选项（文件名 / 忽略换行）',
        body:
          '文本编辑器下方的复选框控制导出行为。"文件名"在复制或保存时将源文件名作为标题前缀。"忽略换行"移除所有换行符以生成单行文本——适用于移除 OCR 行折返工件。',
      },
      {
        heading: '可搜索的 PDF 导出',
        body:
          '将 OCR 结果导出为可搜索的 PDF，在原始图像上叠加透明文本，在 PDF 查看器中启用文本搜索和复制。',
      },
      {
        heading: '其他导出格式',
        body:
          '还可以导出为纯文本（.txt）、TEI XML 和 hOCR 格式。TEI XML 和 hOCR 包含坐标信息，适合研究用途。',
      },
      {
        heading: 'AI 校对',
        body:
          '在"设置"中输入 AI API 密钥（Claude、GPT、Gemini 等）以校对 OCR 结果。更改以差异视图显示（红色为删除，绿色为添加），可以逐个接受或拒绝。API 密钥在浏览器中加密，从不发送到服务器。历史字体（旧字体）默认保留。',
      },
      {
        heading: '历史记录',
        body:
          '从标题中的时钟图标打开历史记录面板，以查看和重用过去的 OCR 结果。',
      },
      {
        heading: '深色模式',
        body:
          '使用标题中的太阳/月亮图标在浅色和深色主题之间切换。您的偏好保存在浏览器中。',
      },
      {
        heading: '多语言 UI',
        body:
          '支持日语、英语、中文（简体和繁体）和韩语。使用标题右端的语言选择器进行切换。',
      },
      {
        heading: '推荐环境',
        body:
          '建议使用桌面电脑或横向平板电脑（屏幕宽度 768px 以上）。兼容 Chrome、Firefox、Safari 和 Edge 的最新版本。',
      },
      {
        heading: '关于鸟兽戯画背景',
        body:
          '背景的鸟兽戯画图案是对 NDLOCR 开发者青池亨的敬意。鸟兽戯画是 12 世纪的日本绘卷物和国宝，描绘了拟人化的青蛙、兔子和猴子。',
      },
    ],
  },
  'zh-TW': {
    title: '使用說明',
    sections: [
      {
        heading: '概述',
        body:
          'NDLOCR-lite Web AI: Ultra Bluepond 是基於日本國立國會圖書館 NDLOCR-Lite 開發的瀏覽器完整型 OCR（光學字符識別）網路應用。它可以將圖像中的文字轉換為可編輯的文本。所有處理都在瀏覽器中完成——圖像不會被發送到任何伺服器。',
      },
      {
        heading: '加載圖像',
        body:
          '在主屏幕上拖放文件，或使用文件選擇器加載圖像（PNG、JPEG、TIFF、HEIC、PDF）。您還可以使用"選擇文件夾"批量加載目錄中的所有圖像，或使用"從剪貼簿貼上"來處理螢幕截圖。',
      },
      {
        heading: '圖像校正',
        body:
          'OCR 之前，您可以應用預處理，如亮度/對比度/銳度調整、灰度轉換、黑白二值化、去噪、自動傾斜矯正和自動裁剪。從圖像查看器上方的按鈕打開預處理面板。',
      },
      {
        heading: '中心分割 / 自動分割',
        body:
          '這些功能可將雙頁掃描的圖像分割為兩個單獨的頁面。"中心分割"在圖像的水平中心精確二分。"自動分割"在圖像寬度的30-70%範圍內掃描，找到空白最多的豎列（裝訂處），並在該處分割。',
      },
      {
        heading: '運行 OCR',
        body:
          '按下"運行 OCR"按鈕開始識別。首次運行需要下載模型文件（約146 MB），隨後會緩存在 IndexedDB 中。處理在 Web Worker 中非同步執行，因此 UI 保持回應狀態。',
      },
      {
        heading: '區域選擇 OCR',
        body:
          '在圖像查看器上拖動矩形選擇區域，然後僅在該區域上運行 OCR。這對於從表格或圖片標題等特定區域提取文本很有用。',
      },
      {
        heading: '文本編輯器',
        body:
          'OCR 結果顯示在文本編輯器中。您可以在豎排和橫排書寫模式之間切換，更改字體（等寬 / 襯線 / 哥德式），並調整字體大小。支持直接編輯和撤銷/重置選項。',
      },
      {
        heading: '搜尋和取代',
        body:
          '使用文本編輯器中的搜尋（Ctrl+F / Cmd+F）和取代功能來批量修正 OCR 識別錯誤。',
      },
      {
        heading: '匯出選項（文件名 / 忽略換行）',
        body:
          '文本編輯器下方的複選框控制匯出行為。"文件名"在複製或保存時將源文件名作為標題前綴。"忽略換行"移除所有換行符以生成單行文本——適用於移除 OCR 行摺返工件。',
      },
      {
        heading: '可搜尋的 PDF 匯出',
        body:
          '將 OCR 結果匯出為可搜尋的 PDF，在原始圖像上疊加透明文本，在 PDF 查看器中啟用文本搜尋和複製。',
      },
      {
        heading: '其他匯出格式',
        body:
          '還可以匯出為純文本（.txt）、TEI XML 和 hOCR 格式。TEI XML 和 hOCR 包含坐標信息，適合研究用途。',
      },
      {
        heading: 'AI 校對',
        body:
          '在"設定"中輸入 AI API 密鑰（Claude、GPT、Gemini 等）以校對 OCR 結果。更改以差異視圖顯示（紅色為刪除，綠色為添加），可以逐個接受或拒絕。API 密鑰在瀏覽器中加密，從不發送到伺服器。歷史字體（舊字體）默認保留。',
      },
      {
        heading: '歷史記錄',
        body:
          '從標題中的時鐘圖標打開歷史記錄面板，以查看和重用過去的 OCR 結果。',
      },
      {
        heading: '深色模式',
        body:
          '使用標題中的太陽/月亮圖標在淺色和深色主題之間切換。您的偏好保存在瀏覽器中。',
      },
      {
        heading: '多語言 UI',
        body:
          '支持日語、英語、中文（簡體和繁體）和韓語。使用標題右端的語言選擇器進行切換。',
      },
      {
        heading: '推薦環境',
        body:
          '建議使用桌面電腦或橫向平板電腦（螢幕寬度 768px 以上）。兼容 Chrome、Firefox、Safari 和 Edge 的最新版本。',
      },
      {
        heading: '關於鳥獸戲畫背景',
        body:
          '背景的鳥獸戲畫圖案是對 NDLOCR 開發者青池亨的敬意。鳥獸戲畫是 12 世紀的日本繪卷物和國寶，描繪了擬人化的青蛙、兔子和猴子。',
      },
    ],
  },
  ko: {
    title: '사용 설명서',
    sections: [
      {
        heading: '개요',
        body:
          'NDLOCR-lite Web AI: Ultra Bluepond는 일본 국립국회도서관의 NDLOCR-Lite를 기반으로 개발된 브라우저 기반 OCR(광학 문자 인식) 웹 애플리케이션입니다. 이미지 내의 텍스트를 편집 가능한 텍스트로 변환합니다. 모든 처리는 브라우저에서 완료되며 이미지는 서버로 전송되지 않습니다.',
      },
      {
        heading: '이미지 로드',
        body:
          '홈 화면에서 파일을 드래그 앤 드롭하거나 파일 선택기를 사용하여 이미지(PNG, JPEG, TIFF, HEIC, PDF)를 로드합니다. "폴더 선택"을 사용하여 디렉토리의 모든 이미지를 일괄 로드하거나 "클립보드에서 붙여넣기"로 스크린샷을 처리할 수 있습니다.',
      },
      {
        heading: '이미지 보정',
        body:
          'OCR 전에 밝기/대비/선명도 조정, 그레이스케일 변환, 흑백 이진화, 노이즈 제거, 자동 기울기 보정 및 자동 자르기 등의 전처리를 적용할 수 있습니다. 이미지 뷰어 위의 버튼에서 전처리 패널을 엽니다.',
      },
      {
        heading: '중심 분할 / 자동 분할',
        body:
          '이러한 기능은 양면 스캔 이미지를 두 개의 개별 페이지로 분할합니다. "중심 분할"은 이미지의 수평 중심에서 정확히 이등분합니다. "자동 분할"은 이미지 너비의 30-70% 범위에서 공백이 가장 많은 세로 선(제본 부분)을 찾아 분할합니다.',
      },
      {
        heading: 'OCR 실행',
        body:
          '"OCR 실행" 버튼을 눌러 인식을 시작합니다. 첫 실행에는 모델 파일(약 146MB) 다운로드가 필요하며, 그 후 IndexedDB에 캐시됩니다. 처리는 Web Worker에서 비동기적으로 실행되므로 UI는 반응 상태를 유지합니다.',
      },
      {
        heading: '영역 선택 OCR',
        body:
          '이미지 뷰어에서 직사각형을 드래그하여 영역을 선택한 후 해당 영역에서만 OCR을 실행합니다. 표 또는 캡션과 같은 특정 영역에서 텍스트를 추출할 때 유용합니다.',
      },
      {
        heading: '텍스트 편집기',
        body:
          'OCR 결과는 텍스트 편집기에 표시됩니다. 세로쓰기와 가로쓰기 모드 간 전환, 글꼴 변경(등폭 / 세리프 / 고딕), 글꼴 크기 조정이 가능합니다. 직접 편집과 실행 취소/재설정 옵션이 지원됩니다.',
      },
      {
        heading: '검색 및 바꾸기',
        body:
          '텍스트 편집기에서 검색(Ctrl+F / Cmd+F) 및 바꾸기 기능을 사용하여 OCR 오인식을 일괄 수정합니다.',
      },
      {
        heading: '내보내기 옵션(파일명 / 줄바꿈 무시)',
        body:
          '텍스트 편집기 하단의 확인란이 내보내기 동작을 제어합니다. "파일명"은 복사 또는 저장 시 소스 파일명을 헤더로 앞에 붙입니다. "줄바꿈 무시"는 모든 줄바꿈을 제거하여 단일 연속 텍스트 줄을 생성합니다.',
      },
      {
        heading: '검색 가능한 PDF 내보내기',
        body:
          'OCR 결과를 원본 이미지에 투명 텍스트를 겹친 검색 가능한 PDF로 내보냅니다. PDF 뷰어에서 텍스트 검색 및 복사를 활성화합니다.',
      },
      {
        heading: '기타 내보내기 형식',
        body:
          '순수 텍스트(.txt), TEI XML 및 hOCR 형식으로도 내보낼 수 있습니다. TEI XML과 hOCR에는 좌표 정보가 포함되어 있어 연구용으로 적합합니다.',
      },
      {
        heading: 'AI 교정',
        body:
          '설정에서 AI API 키(Claude, GPT, Gemini 등)를 입력하여 OCR 결과를 교정합니다. 변경 사항은 차이 보기(빨강은 삭제, 녹색은 추가)로 표시되며 개별적으로 수락 또는 거절할 수 있습니다. API 키는 브라우저에서 암호화되고 서버로 전송되지 않습니다.',
      },
      {
        heading: '기록',
        body:
          '헤더의 시계 아이콘에서 기록 패널을 열어 과거 OCR 결과를 검토하고 재사용합니다.',
      },
      {
        heading: '다크 모드',
        body:
          '헤더의 태양/달 아이콘을 사용하여 밝은 테마와 어두운 테마 간에 전환합니다. 환경설정은 브라우저에 저장됩니다.',
      },
      {
        heading: '다국어 UI',
        body:
          '일본어, 영어, 중국어(간체 및 번체) 및 한국어를 지원합니다. 헤더 오른쪽 끝의 언어 선택기를 사용하여 전환합니다.',
      },
      {
        heading: '권장 환경',
        body:
          '데스크톱 PC 또는 가로 모드 태블릿(화면 너비 768px 이상)을 권장합니다. Chrome, Firefox, Safari 및 Edge의 최신 버전과 호환됩니다.',
      },
      {
        heading: '조수희화 배경 정보',
        body:
          '배경의 조수희화 패턴은 NDLOCR 개발자 아오이케 도루에 대한 경의입니다. 조수희화는 12세기 일본 회권으로 의인화된 개구리, 토끼 및 원숭이를 묘사한 국보입니다.',
      },
    ],
  },
  la: {
    title: 'Liber Ductus',
    sections: [
      {
        heading: 'Sententia',
        body:
          'NDLOCR-lite Web AI: Ultra Bluepond est applicationem retis (OCR - Cognitio Characterum Optica) in navigatore constructum, ex NDLOCR-Lite Bibliothecae Nationalis Iaponiae. Imagines in textum mutantur. Omnes processus in navigatore accidunt; imagines ad servatorem non mittuntur.',
      },
      {
        heading: 'Imagines imponere',
        body:
          'Imagines (PNG, JPEG, TIFF, HEIC, PDF) in homi pagina trahe et deponito, vel eligito imagines. Potes etiam imagines omnes in cartula unius elegantem mittere, vel screenshots ex clipboard inserere.',
      },
      {
        heading: 'Praeparatio Imaginis',
        body:
          'Ante OCR, potes varias emendationes adhibere: luciditatem, contrastum, nitorem, convertionem graecam, binarizationem nigram-albam, denoisationem, deskew automaticum, et culturilium.' ,
      },
      {
        heading: 'Recognitio OCR',
        body:
          'Preme signum "Recognitionem incipere" ad recognitionem incipiendum. Prima executio requirit nexum modelorum (circiter 146 MB), qui deinde in IndexedDB repositus erit. Processus asynchrone exsecuitur, ut UI respondens maneat.',
      },
      {
        heading: 'Editor Textus',
        body:
          'Resulta OCR in editore texti apparent. Potes inter scripturam verticalem et horizontalem mutare, characteres mutare, et magnum characterum componere. Editio directa sustentatur cum optione undo/reset.',
      },
      {
        heading: 'Exportatio PDF',
        body:
          'Resulta OCR exporta ut PDF quaerendum, quod textum transparentem super imaginem originalem imponit. PDF lectores textum quaerere et copiare possunt.',
      },
    ],
  },
  eo: {
    title: 'Gvidilo de Uzo',
    sections: [
      {
        heading: 'Superrigardo',
        body:
          'NDLOCR-lite Web AI: Ultra Bluepond estas retumila OCR (Optika Karaktero Rekono) aplikaĵo bazita sur NDLOCR-Lite de la Nacia Biblioteko de Japanio. Ĝi konvertas tekstojn en bildoj al redaktebla teksto. Ĉiuj procezoj okazas en via retumilo—bildoj ne estas senditaj al servilo.',
      },
      {
        heading: 'Ŝargi Bildojn',
        body:
          'Altrenu dosierojn al la ĉefa paĝo aŭ uzu la dosiera elektilo por ŝargi bildojn (PNG, JPEG, TIFF, HEIC, PDF). Vi ankaŭ povas uzi "Elekti Dosierujon" por masa ŝargado aŭ "Alglui el Poŝo" por ekraŭkopioj.',
      },
      {
        heading: 'Antaŭtraktado de Bildoj',
        body:
          'Antaŭ OCR, vi povas apliki antaŭtraktadon: klarigon, kontrastojn, akregon, grizigon, duumaligon, malbruon, aŭtodeskuon, kaj aŭtokropon.',
      },
      {
        heading: 'Rulaj OCR',
        body:
          'Premu la butonon "Ruli OCR-on" por komenci reknoson. La unua rulado postulas elŝargon de modelaj dosieroj (ĉ. 146 MB), kiuj poste estas kaŝitaj en IndexedDB. Procezado okazas asinkrone, do la interfaco restas respondanta.',
      },
      {
        heading: 'Tekstoredaktilo',
        body:
          'OCR-rezultoj aperas en tekstoredaktilo. Vi povas ŝanĝi inter vertikalaj kaj horizontalaj skribmodoj, ŝanĝi tiparojn, kaj ĝustigi tiparograndojn. Direkta redakto estas subtenata kun malfaro/restarigo-elekto.',
      },
      {
        heading: 'Eligo de PDF',
        body:
          'Elportado de OCR-rezultoj kiel serĉebla PDF, kiu algluas tralucan tekstumon al la originala bildo. PDF-legilo povas serĉi kaj kopii tekstojn.',
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
