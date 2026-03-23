# NDLOCR-Lite Web AI Ultra (旧称：Deluxe) エヌディーエルオーシーアール・ライト・ウェブ・エーアイ・ウルトラ

**前処理機能・AI校正機能付き ブラウザ完結型 日本語OCRツール**

国立国会図書館（NDL）が開発・公開している [NDLOCR-Lite](https://github.com/ndl-lab/ndlocr-lite) をベースに、橋本雄太氏（国立歴史民俗博物館）による [ndlocrlite-web](https://github.com/yuta1984/ndlocrlite-web) をフォークして開発したWebアプリケーションです。小形克宏氏（一般社団法人ビブリオスタイル）がAI校正機能を付加した [NDLOCR-Lite Web AI](https://github.com/ogwata/ndlocr-lite-web-ai) に、宮川創（筑波大学）が画像前処理・縦書き表示・ダークモード・多言語UI・ユニバーサルデザインなどの機能を追加し、**Deluxe** 版としました。

画像やPDFをブラウザにドロップするだけで日本語OCRを実行し、AI校正で誤認識を修正できます。画像データはサーバーに送信されず、すべての処理がブラウザ内で完結します。

---

## 主な機能

**OCR処理** — DEIMv2によるレイアウト検出と、PARSeq×3モデルのカスケード文字認識をONNX Runtime Web（WASM）でブラウザ内実行します。JPG、PNG、TIFF、HEIC、PDF（複数ページ）に対応しています。

**AI校正** — Anthropic (Claude)、OpenAI (GPT)、Google (Gemini)、Groq、カスタムエンドポイント、MCP Serverに対応。AIがOCRテキストと元画像を比較し、誤認識箇所を検出します。差分はインラインハイライト（削除＝赤、追加＝緑）で表示され、修正箇所ごとにaccept/rejectを選択できます。デフォルトの校正プロンプトは旧字体を保持する設計です。

**画像前処理** — OCR前に画像を補正して認識精度を向上させます。明るさ・コントラスト・シャープネスのスライダー調整、グレースケール変換、白黒二値化（大津の方法）、ノイズ除去（メディアンフィルタ）、回転、自動傾き補正（射影プロファイル分散最大化法）、自動クロップ、ページ分割（中心線分割／自動検出分割）を備えています。

**縦書き表示** — テキストエディタを `writing-mode: vertical-rl` に切り替えて、日本語古典籍の縦書きテキストを自然な方向で確認できます。行番号も縦書きに対応し、上部ストリップに右から左へ表示されます。

**高度なテキスト編集** — フォントサイズスライダー（10–28px）、フォント切替（Monospace／明朝／ゴシック）、行番号表示、検索と置換（Ctrl+F）、空行削除、行結合、Undo/Redo。

**多彩なエクスポート** — プレーンテキスト(.txt)、TEI XML(.xml)、hOCR(.hocr)に加え、テキスト情報を埋め込んだPDF(.pdf)をダウンロードできます。テキスト付きPDFでは元画像の上に透明テキストレイヤーを重ねるため、PDF上でのテキスト検索・選択が可能です。

**画像ビューア** — カーソル中心のホイールズーム、トラックパッドのピンチズーム、ダブルクリックでズーム/リセット、クリック＆ドラッグによるパン操作、スペースキー長押しの一時パンモード（Photoshop風）。OCR検出矩形のオーバーレイ表示と、領域選択による部分OCRにも対応しています。

**ダークモード** — ヘッダーの月/太陽アイコンで切替。OS設定に自動追従し、選択はlocalStorageに保存されます。

**多言語UI** — 日本語・英語・簡体字中国語・繁体字中国語・韓国語の5言語に対応。ブラウザのロケールから初期言語を自動検出します。

**プライバシー** — 画像・OCRテキストは外部に送信されません。AI校正時のみ、ユーザーが設定したAPIエンドポイントに送信されます。APIキーはWeb Crypto API（AES-GCM）で暗号化してlocalStorageに保存されます。

---

## 使い方

ブラウザでアプリにアクセスすると、初回起動時にONNXモデル（計約146MB）が自動ダウンロードされ、IndexedDBにキャッシュされます。2回目以降はキャッシュから即座にロードされます。

画像（JPG/PNG/TIFF/HEIC）またはPDFをドラッグ＆ドロップするか、アップロードボタンから選択してください。「OCRを開始」でテキスト化され、右パネルに結果が表示されます。テキストは直接編集可能です。画像上でドラッグして範囲を選択すれば、その部分だけのOCRも実行できます。

AI校正を使うには、設定（歯車アイコン）からAIプロバイダとAPIキーを設定し、接続テストを行ってください。OCR結果画面の「AI校正」ボタンで校正を実行すると、差分がハイライト表示されます。

画像前処理は、画像アップロード後に左パネルの「画像前処理」アコーディオンから利用できます。

### AI接続モード

Direct API モードでは、ブラウザからAI APIを直接呼び出します。MCP Server モードでは、ユーザーが用意したMCPサーバー（Streamable HTTPエンドポイント）経由で任意のAIに接続できます。

---

## 対応環境

デスクトップPC またはタブレット横向き（画面幅768px以上）を推奨します。Chrome、Firefox、Safari、Edge の最新版で動作します（WebAssembly + IndexedDB + Web Worker 対応が必須）。スマートフォンは画面幅・モデルサイズ・CPU負荷の制約から積極的にはサポートしていません。

---

## 技術情報

### 使用モデル

NDLOCR-Lite のOCRモデル4種（計約146MB）をONNX形式で使用します。DEIMv2（38MB）がテキスト行の矩形を検出し、行の文字数カテゴリに応じてPARSeq-30（34MB）、PARSeq-50（35MB）、PARSeq-100（39MB）のいずれかで文字認識を行います。

### 技術スタック

フレームワークはVite + React 19 + TypeScript、OCR推論にonnxruntime-web 1.20.0（WASM CPUバックエンド）、PDF読み込みにpdfjs-dist 4.9.0、PDF生成にjsPDF、差分表示にdiff-match-patch、画像前処理はCanvas API（外部ライブラリ不要）を使用しています。テーマ切替はCSS Custom Properties + localStorage、デプロイはNetlify/Vercel（COOP/COEPヘッダー対応）を想定しています。

### OCR処理フロー

入力ファイルは imageLoader または pdfLoader で ImageData に変換され、任意の画像前処理を経た後、Web Worker に送られます。Worker 内では DEIMv2 でレイアウト検出、PARSeq×3モデルでカスケード文字認識を行い、読み順（縦書き右→左）にソートしてメインスレッドに返却します。結果はIndexedDBに保存され、必要に応じてAI校正が適用されます。

---

## デプロイ

このアプリはSharedArrayBufferを使用するため、以下のHTTPレスポンスヘッダーが必須です。

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Netlify

`netlify.toml` に設定済みです。GitHubリポジトリを連携するか、Netlify CLIで手動デプロイしてください。

```bash
npm run build
netlify deploy --prod
```

### Vercel

`vercel.json` にCOOP/COEPヘッダーとSPAフォールバックが設定済みです。

```bash
npm run build
vercel --prod
```

### その他

COOP/COEPヘッダーを設定できるホスティングであれば利用可能です。GitHub Pagesは任意のHTTPヘッダーを設定できないため、[coi-serviceworker](https://github.com/niccokunzmann/coi-serviceworker) の利用が必要です。

---

## ローカル開発

```bash
npm install

# ONNXモデルファイルを public/models/ に配置（ndlocr-lite から取得）
# deim-s-1024x1024.onnx, parseq-ndl-30.onnx, parseq-ndl-50.onnx, parseq-ndl-100.onnx

npm run dev          # 開発サーバー起動（localhost:5173）
npm run build        # プロダクションビルド
npm run preview      # ビルド結果のプレビュー
npm run test         # ユニットテスト実行
npm run mcp-server   # MCPテスト用モックサーバー起動（localhost:3456）
```

COOP/COEPヘッダーが必要なため、`file://` プロトコルでは動作しません。`npm run dev` で起動した開発サーバーで動作確認してください。

---

## 注意事項

初回起動時に約146MBのONNXモデルをダウンロードします（2回目以降はIndexedDBキャッシュから読み込み）。OCR処理時間はハードウェア性能に依存し、GPU加速なしのCPU推論のため1枚あたり数十秒かかる場合があります。AI校正機能を使用するには各AIプロバイダのAPIキーが必要です。

---

## ライセンス

本プロジェクト（NDLOCR-Lite Web AI Deluxe）の追加コードには MIT License を適用します。

| 対象 | ライセンス | 権利者 |
|------|-----------|--------|
| NDLOCR-Lite（OCRモデル・アルゴリズム） | CC BY 4.0 | 国立国会図書館 |
| ndlocrlite-web（Web移植コード） | LICENSEファイルに準拠 | 橋本雄太氏 |
| NDLOCR-Lite Web AI（AI校正機能追加） | MIT License | 小形克宏（一般社団法人ビブリオスタイル） |
| NDLOCR-Lite Web AI Deluxe（Deluxe機能追加） | MIT License | 宮川創（筑波大学） |

## 更新記録

### v0.2.0（2026-03-23）

**エクスポート機能の拡充** — テキスト情報を埋め込んだPDF(.pdf)のダウンロードに対応しました。元画像の上に透明テキストレイヤーを重ねて生成するため、PDFビューアでのテキスト検索・選択が可能です。既存のプレーンテキスト(.txt)、TEI XML(.xml)、hOCR(.hocr)に加え、4種類のエクスポート形式が選択できます。

**選択ブロック表示の改善** — 画像上でテキストブロックをクリックした際の表示を、エディタ上部に被さる浮動オーバーレイ方式に変更しました。従来はエディタ本体が一段下がる挙動でしたが、テキストエリアの位置が変わらなくなりました。

**縦書き行番号** — 縦書きモード時に行番号が上部ストリップとして右から左に表示されるようになりました。従来は縦書き時に行番号が非表示でした。

**画像ビューアの操作性向上** — カーソル位置を中心としたホイールズーム、トラックパッドのピンチズーム、ダブルクリックで2倍ズーム/リセット、クリック＆ドラッグによるパン操作、スペースキー長押しの一時パンモード（Photoshop風）を実装しました。ズーム範囲は10%〜800%で、100%未満への縮小にも対応しています。

**UIレイアウト調整** — 左サイドバーのサムネイル一覧を削除し、メインの画像ビューアとテキストエディタの2ペイン構成に簡素化しました。設定モーダルと処理履歴モーダルの表示不具合を修正しました。処理履歴パネルのレイアウトを見やすく整理し、ファイル名・日付・メタ情報・テキストプレビューを一覧表示するようにしました。

### v0.1.0（2026-03-22）

初回リリース。NDLOCR-Lite Web AI をフォークし、以下の機能を追加しました。

画像前処理パネル（明るさ・コントラスト・シャープネス調整、グレースケール変換、白黒二値化、ノイズ除去、回転、自動傾き補正、自動クロップ、ページ分割）。縦書きテキスト表示。ダークモード（OS設定自動追従）。多言語UI（日本語・英語・簡体字中国語・繁体字中国語・韓国語）。フォントサイズ・フォント種別切替。行番号表示。検索と置換。空行削除・行結合。Undo/Redo。処理履歴。TEI XML・hOCRエクスポート。ユニバーサルデザイン対応。

---

## クレジット

- **NDLOCR-Lite:** [ndl-lab/ndlocr-lite](https://github.com/ndl-lab/ndlocr-lite)（国立国会図書館）
- **ndlocrlite-web:** [yuta1984/ndlocrlite-web](https://github.com/yuta1984/ndlocrlite-web)（橋本雄太氏、国立歴史民俗博物館）
- **NDLOCR-Lite Web AI:** [ogwata/ndlocr-lite-web-ai](https://github.com/ogwata/ndlocr-lite-web-ai)（小形克宏氏、一般社団法人ビブリオスタイル）— AI校正機能（Direct API / MCP Server接続、差分表示、accept/reject UI）、AI設定パネル、APIキー暗号化保存（Web Crypto API）の設計・実装
- **NDLOCR-Lite Web AI Deluxe（Ultra機能）:** 宮川創（筑波大学）— ダークモード（OS設定自動追従・CSS Custom Properties によるテーマ切替）、UIデザイン全面改修（ヘッダーバー、ボトムツールバー、SplitView リサイズ、モーダルパネル、ガラスモーフィズム装飾、パルス・シマー等のアニメーション）、画像前処理パネル（明るさ・コントラスト・シャープネスのスライダー調整、グレースケール変換、白黒二値化〔大津の方法〕、ノイズ除去〔メディアンフィルタ〕、色反転、回転、自動傾き補正〔射影プロファイル分散最大化法〕、自動クロップ、ページ分割〔中心線分割・自動検出分割〕）、画像ビューアの操作性向上（カーソル中心ホイールズーム、トラックパッドピンチズーム、ダブルクリックズーム/リセット、クリック＆ドラッグパン、スペースキー一時パンモード、10%〜800%ズーム範囲）、縦書きテキスト表示（writing-mode: vertical-rl 切替、縦書き対応行番号）、テキストエディタ拡張（フォントサイズ・フォント種別切替、行番号表示〔横書き・縦書き両対応〕、検索と置換〔Ctrl+F〕、空行削除、行結合、Undo/Redo〔カーソル位置復元付き〕、文字数・行数カウント）、画像ブロック選択連動（エディタ自動スクロール＋ハイライト表示）、多言語UI（日本語・英語・簡体字中国語・繁体字中国語・韓国語の5言語、ブラウザロケール自動検出）、エクスポート機能（プレーンテキスト .txt、TEI XML .xml〔P5準拠〕、hOCR .hocr、テキスト埋め込みPDF .pdf〔透明テキストレイヤー付き〕）、処理履歴パネル（IndexedDB 保存、サムネイル・メタ情報・テキストプレビュー付き一覧表示、最大100件キャッシュ）、Google Analytics 4 イベント計測、ユニバーサルデザイン対応（WCAG準拠カラーコントラスト、フォーカスリング、aria-label 属性）、レスポンシブレイアウト（モバイル警告表示）、キーボードショートカット（Ctrl+F / Ctrl+S / Ctrl+Z / Ctrl+Shift+Z / Escape）
- **DEIMv2:** [ShihuaHuang95/DEIM](https://github.com/ShihuaHuang95/DEIM)
- **PARSeq:** [baudm/parseq](https://github.com/baudm/parseq)
- **文字セット（NDLmoji.yaml）:** 国立国会図書館
