# NDLOCR-lite Web AI: Model BLUEPOND

## プロジェクト概要

NDLOCR-lite Web AI: Model BLUEPOND（旧称 NDLOCR-Lite Web AI Ultra）は、国立国会図書館の NDLOCR-Lite をベースにした、ブラウザ完結型OCR Webアプリケーションである。yuta1984/ndlocrlite-web をフォークし、AI校正機能とその他蛇足機能を追加している。

- ブラウザ内でONNX Runtime Web（WASM）によるOCR推論を実行
- サーバーに画像を送信しない完全クライアントサイド処理
- AI（Claude, GPT, Gemini等）によるOCR結果の校正機能を付加
- 画像前処理・縦書き表示・ダークモード・多言語UI・テキスト付きPDFエクスポート等

詳細な開発計画は `docs/NDLOCR-Lite-Web-AI-開発計画書.md` を参照。

## 技術スタック

- **フレームワーク:** Vite + React 19 + TypeScript
- **OCRランタイム:** onnxruntime-web 1.20.0（WASM CPUバックエンド）
- **PDF処理:** pdfjs-dist 4.9.0（読込）、jsPDF（生成）
- **OCR処理:** Web Worker（非同期）
- **モデルキャッシュ:** IndexedDB
- **差分表示:** diff-match-patch
- **APIキー暗号化:** Web Crypto API（AES-GCM）
- **デプロイ:** Netlify / Vercel（COOP/COEPヘッダー必須）

## コマンド

```bash
npm install          # 依存パッケージのインストール
npm run dev          # 開発サーバー起動（localhost:5173）
npm run build        # プロダクションビルド
npm run preview      # ビルド結果のプレビュー
npm run test         # ユニットテスト実行（Vitest）
npm run test:watch   # テスト監視モード
npm run mcp-server   # MCPテスト用モックサーバー起動（localhost:3456）
```

## ディレクトリ構成

```
ndlocr-lite-web-ai/
├── public/
│   └── models/                    # ONNXモデル（計約146MB）
├── src/
│   ├── App.tsx                    # メインアプリコンポーネント
│   ├── main.tsx                   # エントリポイント
│   ├── index.css                  # グローバルCSS（ライト/ダークテーマ）
│   ├── ai/
│   │   ├── direct-api.ts          # Direct APIコネクタ
│   │   └── mcp-connector.ts       # MCP Serverコネクタ
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SplitView.tsx      # リサイズ可能な左右分割パネル
│   │   │   ├── BottomToolbar.tsx   # ボトムバー
│   │   │   ├── Header.tsx          # ヘッダー
│   │   │   └── Footer.tsx          # フッター（クレジット表示）
│   │   ├── editor/
│   │   │   ├── TextEditor.tsx      # テキストエディタ（縦書き・行番号・検索置換）
│   │   │   └── DiffView.tsx        # 差分表示（accept/reject UI）
│   │   ├── viewer/
│   │   │   ├── ImageViewer.tsx     # 画像ビューア（ズーム/パン/領域選択）
│   │   │   └── ImagePreprocessPanel.tsx # 画像前処理パネル
│   │   ├── settings/SettingsModal.tsx   # AI設定モーダル
│   │   └── results/HistoryPanel.tsx     # 処理履歴パネル
│   ├── hooks/
│   │   ├── useAISettings.ts       # AI設定管理
│   │   ├── useTheme.ts            # ダークモード
│   │   └── useI18n.ts             # 多言語UI
│   ├── i18n/                      # 翻訳ファイル（ja/en/zh-CN/zh-TW/ko）
│   ├── utils/
│   │   ├── textExport.ts          # TXTエクスポート
│   │   ├── exportTEI.ts           # TEI XMLエクスポート
│   │   ├── exportHOCR.ts          # hOCRエクスポート
│   │   ├── exportPDF.ts           # テキスト付きPDFエクスポート
│   │   ├── imagePreprocess.ts     # 画像前処理アルゴリズム
│   │   ├── crypto.ts              # APIキー暗号化
│   │   └── db.ts                  # IndexedDB管理
│   ├── types/
│   │   ├── ocr.ts                 # OCR関連型定義
│   │   └── ai.ts                  # AI関連型定義
│   └── worker/                    # OCR Web Worker
├── CLAUDE.md                      # このファイル
├── README.md                      # プロジェクトREADME
├── netlify.toml                   # Netlifyデプロイ設定
├── vercel.json                    # Vercelデプロイ設定
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 重要な制約・ルール

### COOP/COEPヘッダー

ONNX Runtime WASMがSharedArrayBufferを使うため、以下のレスポンスヘッダーが必須。

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### コーディング規約

- 言語: TypeScript（strict mode）
- コンポーネント: React関数コンポーネント + Hooks
- スタイル: src/index.css にCSS Custom Propertiesで定義（`[data-theme="dark"]` で切替）
- 日本語コメント可（UIテキストは多言語対応、i18n/ の翻訳ファイルを使用）

### AI校正関連の設計方針

- AIへの接続は2モード: Direct API（ブラウザ→AI API直接）と MCP Server
- APIキーはlocalStorage + Web Crypto APIで暗号化保存。サーバーには送信しない
- 歴史的文書の旧字体を現代字体に変換しないこと（デフォルトプロンプトで明示）
- 差分表示: 削除＝赤背景、追加＝緑背景のインラインハイライト

### 対応環境

- **推奨:** デスクトップPC / タブレット横向き（画面幅768px以上）
- **ブラウザ:** Chrome / Firefox / Safari / Edge 最新版
- **モバイル:** 積極的にサポートしない（768px未満で警告表示）

## 上流リポジトリ

- **upstream:** yuta1984/ndlocrlite-web（フォーク元）
- **中間:** ogwata/ndlocr-lite-web-ai（AI校正機能追加）
- **元のOCRエンジン:** ndl-lab/ndlocr-lite
