<p align="center">
  <img src="https://img.shields.io/badge/version-3.0.0-teal?style=for-the-badge" alt="v3.0.0" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/browser-100%25_client--side-green?style=for-the-badge" alt="Client-side" />
  <img src="https://img.shields.io/badge/lang-JP_EN_ZH_KO_LA_EO-orange?style=for-the-badge" alt="Multilingual" />
</p>

# NDLOCR-lite Web AI: Model BLUEPOND

### ブラウザ完結型 日本語OCR＋AI校正ツール

> **旧称 NDLOCR-Lite Web AI Ultra** — v3.0 より **Model BLUEPOND** に改称しました。名称は北海道美瑛町の青い池（Blue Pond）に由来します。

画像やPDFをブラウザにドロップするだけで日本語OCRを実行し、AIが誤認識を自動校正します。
**画像データはサーバーに送信されません。** すべての処理がブラウザ内で完結します。

---

## 概要

国立国会図書館（NDL）が開発した **[NDLOCR-Lite](https://github.com/ndl-lab/ndlocr-lite)** のOCRモデルを、ONNX Runtime Web（WASM）でブラウザ内実行する日本語OCRツールです。

橋本雄太氏（国立歴史民俗博物館）による **[ndlocrlite-web](https://github.com/yuta1984/ndlocrlite-web)** のWeb移植をベースに、小形克宏氏（一般社団法人ビブリオスタイル）による **[NDLOCR-Lite Web AI](https://github.com/ogwata/ndlocr-lite-web-ai)** のAI校正機能を統合し、宮川創（筑波大学）がUIデザイン・画像前処理・縦書き対応・多言語UI・エクスポート拡張等の **BLUEPOND 機能** を追加しました。

---

## 主要機能

### OCR処理

DEIMv2によるレイアウト検出と、PARSeq×3モデルのカスケード文字認識をブラウザ内で実行します。行の文字数に応じてPARSeq-30 / PARSeq-50 / PARSeq-100を自動選択し、認識精度を最適化します。

対応形式: **JPG** · **PNG** · **TIFF** · **HEIC** · **PDF**（複数ページ）

### AI校正

| プロバイダ | 接続方式 |
|:---:|:---:|
| Anthropic (Claude) | Direct API |
| OpenAI (GPT) | Direct API |
| Google (Gemini) | Direct API |
| Groq | Direct API |
| カスタムエンドポイント | Direct API |
| 任意のAI | MCP Server |

AIがOCRテキストと元画像を比較し、誤認識を検出します。差分はインラインハイライト（<span style="background:#fdd">削除＝赤</span>・<span style="background:#dfd">追加＝緑</span>）で表示され、修正箇所ごとに accept / reject を選択できます。デフォルトプロンプトは**旧字体を保持**する設計で、歴史的文書のデジタル化に適しています。

### 画像前処理

OCR前に画像を補正して認識精度を向上させます。

| 基本調整 | 高度な処理 |
|:---|:---|
| 明るさ・コントラスト・シャープネス | 自動傾き補正（射影プロファイル分散最大化法） |
| グレースケール変換 | 自動クロップ（余白自動除去） |
| 白黒二値化（大津の方法） | ページ分割（中心線 / 自動検出） |
| ノイズ除去（メディアンフィルタ） | 回転（-180°〜+180°） |
| 色反転 | |

### 画像ビューア

| 操作 | 説明 |
|:---|:---|
| ホイール / ピンチ | カーソル中心ズーム（10%〜800%） |
| ダブルクリック | 2倍ズーム / フィットにリセット |
| ドラッグ | パン（画像移動） |
| スペースキー長押し | 一時パンモード（Photoshop風） |
| 矩形ドラッグ | 領域選択 → 部分OCR |

ブロッククリックでエディタ内の対応箇所に自動スクロール＆ハイライト表示されます。

### テキストエディタ

| 機能 | 詳細 |
|:---|:---|
| 縦書き表示 | `writing-mode: vertical-rl` 切替、縦書き行番号対応 |
| フォント | Monospace / 明朝 / ゴシック、10–28px スライダー |
| 行番号 | 横書き・縦書き両対応 |
| 検索と置換 | Ctrl+F、マッチ数表示、前後ナビゲーション、一括置換 |
| テキスト操作 | 空行削除、行結合、元に戻す |
| Undo / Redo | カーソル位置復元付き（Ctrl+Z / Ctrl+Shift+Z） |

### エクスポート

| 形式 | 特徴 |
|:---|:---|
| **プレーンテキスト** (.txt) | 編集済みテキストをそのまま出力 |
| **TEI XML** (.xml) | TEI P5準拠、座標付き `<facsimile>` + 読み順 `<body>` |
| **hOCR** (.hocr) | バウンディングボックス付きHTML形式 |
| **テキスト付きPDF** (.pdf) | 元画像＋透明テキストレイヤー → PDF内検索・選択可能 |

### ダークモード

ヘッダーの月/太陽アイコンで切替。OS設定に自動追従し、選択はlocalStorageに保存されます。ライトテーマはティール系、ダークテーマはネイビー＋アンバーの配色です。

### 多言語UI

| 🇯🇵 日本語 | 🇬🇧 English | 🇨🇳 简体中文 | 🇭🇰 繁體中文 | 🇰🇷 한국어 | 🏛️ Latina | 🌍 Esperanto |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|

ブラウザのロケールから初期言語を自動検出します。7言語に対応（日本語・英語・簡体字中国語・繁体字中国語・韓国語・ラテン語・エスペラント語）。

### プライバシー

画像・OCRテキストは外部に送信されません。AI校正時のみ、ユーザーが設定したAPIエンドポイントに送信されます。APIキーはWeb Crypto API（AES-GCM）で暗号化してlocalStorageに保存されます。

---

## クイックスタート

**1.** ブラウザでアプリにアクセス → 初回のみONNXモデル（約146MB）を自動ダウンロード（IndexedDBにキャッシュ）

**2.** 画像またはPDFをドラッグ＆ドロップ → 「OCRを開始」

**3.** 右パネルにOCR結果が表示 → テキスト編集・コピー・ダウンロード

**4.**（任意）設定でAIプロバイダ・APIキーを入力 → 「AI校正」で誤認識を自動修正

**5.**（任意）左パネルの「画像前処理」で画像を補正してからOCRを再実行

---

## 対応環境

**推奨:** デスクトップPC / タブレット横向き（画面幅768px以上）

**ブラウザ:** Chrome · Firefox · Safari · Edge 最新版（WebAssembly + IndexedDB + Web Worker 必須）

**モバイル:** 画面幅・モデルサイズ・CPU負荷の制約から積極的にはサポートしていません。

---

## 技術スタック

| レイヤー | 技術 |
|:---|:---|
| フレームワーク | Vite + React 19 + TypeScript (strict) |
| OCR推論 | ONNX Runtime Web 1.20.0 (WASM CPU) |
| レイアウト検出 | DEIMv2 (38MB) |
| 文字認識 | PARSeq ×3 (34+35+39MB) |
| PDF読み込み | pdfjs-dist 4.9.0 |
| PDF生成 | jsPDF |
| AI校正 | Direct API / MCP Server (Streamable HTTP) |
| 差分表示 | diff-match-patch |
| 暗号化 | Web Crypto API (AES-GCM) |
| 画像前処理 | Canvas API |
| キャッシュ | IndexedDB |
| テーマ | CSS Custom Properties + localStorage |
| デプロイ | Netlify / Vercel (COOP/COEP) |

---

## デプロイ

SharedArrayBufferの使用のため、以下のHTTPヘッダーが**必須**です。

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Netlify** — `netlify.toml` に設定済み。`npm run build` → `netlify deploy --prod`

**Vercel** — `vercel.json` に設定済み。`npm run build` → `vercel --prod`

**その他** — COOP/COEPヘッダーを設定可能なホスティングであれば利用可能。GitHub Pagesでは [coi-serviceworker](https://github.com/niccokunzmann/coi-serviceworker) が必要。

---

## ローカル開発

```bash
npm install

# ONNXモデルを public/models/ に配置（ndlocr-lite から取得）
# deim-s-1024x1024.onnx, parseq-ndl-30/50/100.onnx

npm run dev          # 開発サーバー（localhost:5173）
npm run build        # プロダクションビルド
npm run preview      # ビルドプレビュー
npm run test         # テスト実行
npm run mcp-server   # MCPモックサーバー（localhost:3456）
```

> `file://` プロトコルでは動作しません。必ず開発サーバー経由でアクセスしてください。

---

## 更新記録

### v3.0.0 — 2026-03-24 🏞️ Model BLUEPOND

**名称変更:** NDLOCR-Lite Web AI Ultra → **NDLOCR-lite Web AI: Model BLUEPOND** に改称しました。北海道美瑛町の青い池（Blue Pond）に因む名称です。

**多言語対応強化（7言語）** — ラテン語・エスペラント語を新規追加。既存の中国語（簡体字/繁体字）・韓国語の翻訳を全コンポーネントで完全対応。インライン翻訳を全面的に多言語ヘルパー関数に移行し、翻訳品質を向上。

**行間調整スライダー** — テキストエディタのステータスバーに行間（line-height）調整スライダーを追加。縦書き表示時の行間を1.0〜3.0の範囲で調整可能に。

**ローディング画面刷新** — 青い池の背景画像上に「Model BLUEPOND」タイトルをアニメーション表示。

**パフォーマンス最適化** — React.lazy/Suspenseによるモーダル類の遅延ロード（メインバンドル65%削減: 812KB→283KB）。React.memoによるHeader/Footer/ProgressBar/BottomToolbarの再レンダリング抑制。Viteチャンク分割最適化（React/PDF/TIFF/差分ライブラリの独立チャンク化）。

**ツールバー改善** — 空行削除・行結合ボタンにテキストラベルを追加し、機能の視認性を向上。

**ヘルプ機能** — ユーザーガイド（全機能の使い方）とAI接続ガイドを追加。ヘッダーの「?」ボタンからアクセス可能。AI未接続時のステータスクリックでAI接続方法を表示。

**UI改善** — 鳥獣戯画背景パターンの改良（相撲場面）、ヘッダー/フッターの方眼パターン、言語選択の国旗アイコン化。

### v0.2.0 — 2026-03-23 ✨ Ultra

**名称変更:** NDLOCR-Lite Web AI Deluxe → **NDLOCR-Lite Web AI Ultra** に改称しました。

**テキスト付きPDFエクスポート** — 元画像＋透明テキストレイヤーによるPDF生成。PDF内でのテキスト検索・選択が可能になりました。

**画像ビューア刷新** — カーソル中心ズーム、ピンチズーム、ダブルクリック、ドラッグパン、スペースキー一時パンモード。ズーム範囲10%〜800%。

**ブロック選択連動** — 画像上のテキストブロッククリックでエディタ内の対応箇所に自動スクロール＆ハイライト。横書き・縦書き両対応。

**縦書き行番号** — 縦書きモード時に上部ストリップとして右→左に表示。

**UIレイアウト改善** — サイドバー削除、2ペイン簡素化、モーダル修正、処理履歴パネル刷新。

**Undo/Redo修正** — Functional state updaterによるstale closure解消。「元に戻す」ボタン追加。

### v0.1.0 — 2026-03-22

初回リリース。画像前処理パネル、縦書き表示、ダークモード、多言語UI（5言語）、テキストエディタ拡張（フォント切替・行番号・検索置換・空行削除・行結合・Undo/Redo）、処理履歴、TEI XML/hOCRエクスポート、ユニバーサルデザイン対応。

---

## ライセンス

本プロジェクトの追加コードには **MIT License** を適用します。

| 対象 | ライセンス | 権利者 |
|:---|:---:|:---|
| NDLOCR-Lite（OCRモデル・アルゴリズム） | CC BY 4.0 | 国立国会図書館 |
| ndlocrlite-web（Web移植） | LICENSE準拠 | 橋本雄太氏 |
| NDLOCR-Lite Web AI（AI校正機能） | MIT | 小形克宏氏（一般社団法人ビブリオスタイル） |
| NDLOCR-lite Web AI: Model BLUEPOND（その他蛇足機能） | MIT | 宮川創（筑波大学） |

---

## クレジット

**OCRエンジン**
[NDLOCR-Lite](https://github.com/ndl-lab/ndlocr-lite) — 国立国会図書館

**Web移植**
[ndlocrlite-web](https://github.com/yuta1984/ndlocrlite-web) — 橋本雄太氏（国立歴史民俗博物館）

**AI校正機能**
[NDLOCR-Lite Web AI](https://github.com/ogwata/ndlocr-lite-web-ai) — 小形克宏氏（一般社団法人ビブリオスタイル）
AI校正機能（Direct API / MCP Server接続、差分表示、accept/reject UI）、AI設定パネル、APIキー暗号化保存（Web Crypto API）の設計・実装

**その他蛇足機能**
[宮川創](https://researchmap.jp/SoMiyagawa)（筑波大学）
ダークモード（OS自動追従・CSSカスタムプロパティ）、UIデザイン全面改修（ヘッダー、ツールバー、SplitView、モーダル、ガラスモーフィズム、アニメーション）、画像前処理パネル（明るさ・コントラスト・シャープネス、グレースケール、二値化〔大津の方法〕、ノイズ除去〔メディアン〕、色反転、回転、自動傾き補正〔射影プロファイル〕、自動クロップ、ページ分割〔中心線・自動検出〕）、画像ビューア（カーソル中心ズーム、ピンチズーム、ダブルクリック、ドラッグパン、スペースキーパン、10%–800%範囲）、縦書き表示（vertical-rl切替、縦書き行番号、行間調整）、テキストエディタ拡張（フォント切替、行番号〔横/縦〕、検索置換〔Ctrl+F〕、空行削除、行結合、Undo/Redo〔カーソル復元〕、文字数/行数カウント）、ブロック選択連動（自動スクロール＋ハイライト）、多言語UI（日本語・英語・簡体字中国語・繁体字中国語・韓国語・ラテン語・エスペラント語、ロケール自動検出）、エクスポート（TXT、TEI XML〔P5〕、hOCR、テキスト付きPDF）、処理履歴パネル（IndexedDB、最大100件）、Google Analytics 4、ユニバーサルデザイン（WCAG準拠、aria-label）、レスポンシブレイアウト、キーボードショートカット（Ctrl+F/S/Z/Shift+Z/Esc）

**機械学習モデル**
[DEIMv2](https://github.com/ShihuaHuang95/DEIM) · [PARSeq](https://github.com/baudm/parseq) · 文字セット NDLmoji.yaml（国立国会図書館）
