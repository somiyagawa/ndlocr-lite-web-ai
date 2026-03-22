一般社団法人ビブリオスタイルの小形克宏氏がAI機能を追加された NDLOCR-Lite Web AIに画像前処理（コントラスト、シャープネス、自動傾き補正、自動歪み補正など）縦書き表示、ダークモードなど色々加えてデラックスにしました。

# NDLOCR-Lite Web AI Deluxe

**AI校正機能付き ブラウザ完結型 日本語OCRツール**

国立国会図書館（NDL）が開発・公開している **[NDLOCR-Lite](https://github.com/ndl-lab/ndlocr-lite)** をベースに、橋本雄太氏（国立歴史民俗博物館）による **[ndlocrlite-web](https://github.com/yuta1984/ndlocrlite-web)** をフォークして開発したWebアプリケーションです。一般社団法人ビブリオスタイルの小形克宏氏がOCR結果に対してAI（Claude、GPT、Gemini等）による校正機能を付加した **NDLOCR-Lite Web AI** に、宮川創（筑波大学）が画像前処理（コントラスト・シャープネス調整、自動傾き補正、自動歪み補正、ノイズ除去、ページ分割など）、縦書き表示、ダークモード、多言語UI、ユニバーサルデザインなどの機能を追加し、**Deluxe** 版としました。歴史的文書のデジタル化精度を向上させることを目指しています。

## 特徴

### 基本機能

- **ブラウザ完結** — 画像・OCR結果を外部サーバーに送信しません。すべての処理がブラウザ内で完結します
- **AI校正** — ボタン一つでAIがOCRテキストを元画像と比較し、誤認識を修正。差分をインラインハイライトで表示し、個別にaccept/rejectできます
- **複数AIプロバイダ対応** — Anthropic (Claude) / OpenAI (GPT) / Google (Gemini) / Groq / カスタムエンドポイント / MCP Server
- **並列表示UI** — 元画像とOCR結果テキストを左右に配置し、対照しやすいレイアウト（リサイズ可能）
- **高精度レイアウト認識** — DEIMv2モデルによりテキスト行の矩形領域を自動検出
- **カスケード文字認識** — 行の文字数に応じて3種類のPARSeqモデルを使い分け、精度を最適化
- **PDF・複数形式対応** — JPG / PNG / TIFF / HEIC / PDF（複数ページ対応）
- **バッチ処理** — 複数の画像ファイルやフォルダをまとめて処理
- **結果のキャッシュ** — IndexedDBにモデルと処理結果（最新100件）を保存し、再利用可能
- **画像ビューア** — ズーム（+/−ボタン）+スクロールバーで自由に移動、OCR検出矩形のオーバーレイ表示
- **領域選択OCR** — 画像上でマウスドラッグして選択した領域だけをOCR → そのままAI校正も可能

### Deluxe 追加機能

- **画像前処理パネル** — OCR前に画像を補正して認識精度を向上
  - 明るさ・コントラスト・シャープネスのスライダー調整
  - グレースケール変換、白黒二値化（大津の方法）
  - ノイズ除去（メディアンフィルタ 3×3）
  - 色反転
  - 回転スライダー（-180°〜+180°）
  - 自動傾き補正（射影プロファイル分散最大化法）
  - 自動クロップ（余白自動除去）
  - ページ分割（中心線分割 / 自動検出分割）
- **縦書き表示** — テキストエディタで `writing-mode: vertical-rl` に切替可能。日本語古典籍の縦書きテキストを自然な方向で確認できます
- **ダークモード** — Claude風のダークテーマ（オレンジアクセント）。ヘッダーの月/太陽アイコンで切替。OS設定に自動追従し、選択はlocalStorageに保存されます
- **多言語UI** — 日本語・英語・簡体字中国語・繁体字中国語・韓国語の5言語に対応。ブラウザのロケールから初期言語を自動検出します
- **高度なテキスト編集**
  - フォントサイズスライダー（10px〜24px）
  - 行番号表示（スクロール同期ガター）
  - 検索と置換（Ctrl+F、マッチ数表示、前後ナビゲーション、一括置換）
- **方眼ノート風背景** — ライト/ダーク両モードでグリッドパターンの背景を表示
- **ユニバーサルデザイン** — WCAGに準拠したカラーコントラスト、フォーカスリング、`aria-label` 属性の付与

## 使い方

### 基本操作

1. ブラウザでアプリにアクセス
2. 初回起動時にONNXモデル（計約146MB）を自動ダウンロード・IndexedDBにキャッシュ
3. 画像（JPG/PNG/TIFF/HEIC）またはPDFをドラッグ＆ドロップするか、クリックして選択
4. 「OCRを開始」ボタンをクリック（領域をドラッグして選択すると、その部分だけOCRも可能）
5. OCR結果が右パネルに表示される。テキストは編集可能
6. 「コピー」「ダウンロード」ボタンで現在表示中のテキストを出力

### 画像前処理の使い方

1. 画像をアップロードした後、左パネルの「画像前処理」アコーディオンを開く
2. スライダーでコントラスト・シャープネスを調整、またはトグルでグレースケール・白黒変換を適用
3. 「自動傾き補正」ボタンで画像の傾きを自動検出・修正
4. 「自動クロップ」で余白を自動除去
5. 見開き画像の場合、「中心で分割」または「自動分割」でページを分割
6. 前処理適用後の画像に対してOCRが実行されます。「リセット」で元画像に戻せます

### AI校正の使い方

1. 設定（歯車アイコン）からAI接続を構成（プロバイダ選択、APIキー入力、モデル選択）
2. 「接続テスト」で接続を確認（ヘッダーに「AI接続済み」と表示される）
3. OCR結果画面で「AI校正」ボタンをクリック（接続テスト未実施の場合は警告が表示されます）
4. AIが元画像とOCRテキストを比較し、修正テキストを返却
5. 差分がインラインハイライトで表示（削除＝赤背景、追加＝緑背景）
6. 各修正箇所の ✓（適用）/ ✗（却下）ボタンで個別に判断（Ctrl+Zで取り消し可能）、または「全て適用」「全て却下」

> **旧字体の保持:** デフォルトの校正プロンプトでは、歴史的文書の旧字体を現代字体に変換しないよう指示しています。プロンプトは設定パネルからカスタマイズ可能です。

### ダークモード・言語の切替

- **ダークモード:** ヘッダー右側の月アイコン（🌙）をクリックすると、ダークモードに切り替わります。ダークモード中は太陽アイコン（☀）でライトモードに戻せます。初回アクセス時はOSのテーマ設定に自動追従します
- **言語切替:** ヘッダー右端のドロップダウンから日本語・English・简体中文・繁體中文・한국어を選択できます

### AI接続モード

| モード | 説明 |
|--------|------|
| **Direct API** | ブラウザから直接AI APIを呼び出す。APIキーはWeb Crypto APIで暗号化してlocalStorageに保存。サーバーには送信されません |
| **MCP Server** | MCPサーバーのURL（Streamable HTTPエンドポイント）を指定して接続。ユーザーが自前のMCPサーバー経由で任意のAIに接続可能 |

## 対応環境

- **推奨環境:** デスクトップPC / タブレット横向き（画面幅768px以上）
- **対応ブラウザ:** Chrome / Firefox / Safari / Edge の最新版（WebAssembly + IndexedDB + Web Worker対応が必須）
- **モバイル:** スマートフォンは積極的にサポートしていません。768px未満の画面ではPC環境での利用を推奨するメッセージが表示されます

## 対応ファイル形式

| 形式 | 説明 |
|------|------|
| JPEG / PNG | 一般的な画像ファイル |
| TIFF | マルチページ対応 |
| HEIC | iPhoneの写真形式 |
| PDF | 複数ページ対応（各ページを2倍スケールでレンダリング） |

## 技術情報

### 使用モデル（NDLOCR-Lite より）

| モデル | ファイル | サイズ | 用途 |
|--------|---------|--------|------|
| DEIMv2 | `deim-s-1024x1024.onnx` | 38MB | レイアウト検出（テキスト行の矩形認識） |
| PARSeq-30 | `parseq-ndl-30.onnx` | 34MB | 文字認識（≤30文字行） |
| PARSeq-50 | `parseq-ndl-50.onnx` | 35MB | 文字認識（≤50文字行） |
| PARSeq-100 | `parseq-ndl-100.onnx` | 39MB | 文字認識（≤100文字行） |

### 技術スタック

| 要素 | 技術 |
|------|------|
| フレームワーク | Vite + React 19 + TypeScript |
| OCRランタイム | onnxruntime-web 1.20.0（WASM CPUバックエンド） |
| PDF処理 | pdfjs-dist 4.9.0 |
| OCR処理 | Web Worker（UIをブロックしない非同期処理） |
| AI校正 | Direct API（Anthropic/OpenAI/Google/Groq）/ MCP Server |
| 差分表示 | diff-match-patch |
| APIキー保存 | Web Crypto API（AES-GCM暗号化） |
| モデル/結果キャッシュ | IndexedDB |
| 画像前処理 | Canvas API（外部ライブラリ不要） |
| テーマ切替 | CSS Custom Properties + localStorage |
| デプロイ | Netlify（COOP/COEPヘッダー対応） |

### 画像前処理アルゴリズム

| 機能 | アルゴリズム |
|------|------------|
| 白黒二値化 | 大津の方法（Otsu's method）による自動閾値決定 |
| ノイズ除去 | メディアンフィルタ（3×3カーネル） |
| シャープネス | 畳み込みカーネル（Convolution sharpening） |
| 自動傾き補正 | 射影プロファイル分散最大化法（粗探索 -5°〜+5° / 0.5°刻み → 精密探索 ±0.5° / 0.1°刻み） |
| 自動クロップ | コンテンツ境界検出（輝度閾値によるマージン自動計算） |
| ページ自動分割 | 垂直ホワイトスペース走査法 |

### OCR処理フロー

```
入力ファイル（JPG/PNG/TIFF/HEIC/PDF）
  → imageLoader / pdfLoader → ImageData
  → [画像前処理（任意）: コントラスト / シャープネス / 傾き補正 / ノイズ除去 etc.]
  → Web Worker
    1. DEIMv2 レイアウト検出 → テキスト行の矩形 + 文字数カテゴリ
    2. カスケード文字認識（PARSeq × 3モデル）
       charCountCategory=3 → PARSeq-30
       charCountCategory=2 → PARSeq-50
       その他               → PARSeq-100
    3. 読み順ソート（縦書き右→左）
  → メインスレッド → 結果表示 + IndexedDB保存
  → [AI校正（任意）: 元画像 + OCRテキスト → AI → diff表示 → accept/reject]
```

## デプロイ

### Netlify（推奨）

このアプリは SharedArrayBuffer を使用するため、`Cross-Origin-Opener-Policy: same-origin` および `Cross-Origin-Embedder-Policy: require-corp` ヘッダーが必須です。`netlify.toml` にすべて設定済みです。

**方法A: GitHubリポジトリ連携（推奨）**

1. GitHubにリポジトリをpush
2. [app.netlify.com](https://app.netlify.com) にログイン
3. 「Add new site」→「Import an existing project」→ GitHub を選択
4. リポジトリを選択し「Deploy」をクリック
5. `netlify.toml` からビルド設定が自動読み込みされます
6. 以降、mainブランチへのpush時に自動デプロイされます

**方法B: Netlify CLIによる手動デプロイ**

```bash
npm install -g netlify-cli
netlify login
netlify init
npm run build
netlify deploy --prod
```

### その他のホスティング

COOP/COEPヘッダーを設定できるホスティングサービスであれば利用可能です。Cloudflare Pagesは `_headers` ファイル、Vercelは `vercel.json` でヘッダーを設定できます。GitHub Pagesは任意のHTTPヘッダーを設定できないため、[coi-serviceworker](https://github.com/niccokunzmann/coi-serviceworker) を利用する必要があります。

## ローカル開発

```bash
# 依存関係インストール
npm install

# モデルファイルを配置（ndlocr-lite から取得）
cp /path/to/ndlocr-lite/src/model/deim-s-1024x1024.onnx        public/models/
cp /path/to/ndlocr-lite/src/model/parseq-ndl-16x256-30-*.onnx  public/models/parseq-ndl-30.onnx
cp /path/to/ndlocr-lite/src/model/parseq-ndl-16x384-50-*.onnx  public/models/parseq-ndl-50.onnx
cp /path/to/ndlocr-lite/src/model/parseq-ndl-16x768-100-*.onnx public/models/parseq-ndl-100.onnx

# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# ユニットテスト実行
npm run test

# MCPテスト用モックサーバー起動（localhost:3456）
npm run mcp-server
```

> **Note:** COOP/COEPヘッダーが必要なため、`npm run dev` で起動した開発サーバー（`localhost:5173`）で動作確認してください。`file://` プロトコルでは動作しません。

## 注意事項

- 初回起動時に約 **146MB** のONNXモデルをダウンロードします（2回目以降はキャッシュから読み込み）
- 処理時間はハードウェア性能に依存します（GPU加速なしのCPU推論のため、1枚あたり数十秒かかる場合があります）
- AI校正機能を使用するには、各AIプロバイダのAPIキーが必要です
- APIキーはブラウザ内で暗号化して保存されます。サーバーには一切送信されません

## ライセンス

本プロジェクト（NDLOCR-Lite Web AI Deluxe）の追加コードには **MIT License** を適用します。

| 対象 | ライセンス | 権利者 |
|------|-----------|--------|
| NDLOCR-Lite（OCRモデル・アルゴリズム） | CC BY 4.0 | 国立国会図書館 |
| ndlocrlite-web（Web移植コード） | LICENSEファイルに準拠 | 橋本雄太氏 |
| NDLOCR-Lite Web AI（AI校正機能追加） | MIT License | 小形克宏（一般社団法人ビブリオスタイル） |
| NDLOCR-Lite Web AI Deluxe（Deluxe機能追加） | MIT License | 宮川創（筑波大学） |

## 帰属・クレジット

本ツールは以下のプロジェクト・貢献者による派生物です。

- **NDLOCR-Lite:** [ndl-lab/ndlocr-lite](https://github.com/ndl-lab/ndlocr-lite)（国立国会図書館）
- **ndlocrlite-web:** [yuta1984/ndlocrlite-web](https://github.com/yuta1984/ndlocrlite-web)（橋本雄太氏、国立歴史民俗博物館）
- **NDLOCR-Lite Web AI:** [ogwata/ndlocr-lite-web-ai](https://github.com/ogwata/ndlocr-lite-web-ai)（小形克宏氏、一般社団法人ビブリオスタイル）— AI校正機能の設計・実装
- **NDLOCR-Lite Web AI Deluxe:** 宮川創（筑波大学）— 画像前処理、ダークモード、多言語UI、縦書き表示、ユニバーサルデザイン等の追加
- **DEIMv2:** [ShihuaHuang95/DEIM](https://github.com/ShihuaHuang95/DEIM)
- **PARSeq:** [baudm/parseq](https://github.com/baudm/parseq)
- **文字セット（NDLmoji.yaml）:** 国立国会図書館
