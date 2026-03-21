# NDLOCR-Lite Web AI 開発計画書

**AI校正機能付きブラウザ完結型OCR Webアプリケーション**

2026年3月21日

---

## 1. プロジェクト概要

### 1.1 目的

国立国会図書館が開発・公開しているNDLOCR-Liteをベースに、ブラウザ完結型のOCR Webアプリケーションを構築する。OCR結果に対してAIによる校正機能を付加し、歴史的文書のデジタル化精度を向上させることを目指す。

### 1.2 主要機能

- **ブラウザ完結型OCR：** 画像・PDFをドラッグ＆ドロップするだけでテキスト化
- **並列表示UI：** 元画像とOCR結果テキストを左右に配置し、対照しやすいレイアウト
- **AI接続：** MCP経由または直接API経由で任意のAI（Claude、GPT、Gemini等）を接続
- **AI校正：** ボタンクリックでAIがOCRテキストを元画像と比較し、誤認識を修正

### 1.3 配布形態

本アプリケーションはWebアプリとして配布する。配布するのはURLのみであり、ユーザーはそのURLにブラウザ（Chrome、Firefox、Safari、Edge等）でアクセスするだけで利用できる。インストール作業、Pythonの導入、その他のセットアップは一切不要である。

初回アクセス時にOCRモデル（約146MB）がバックグラウンドでダウンロードされ、ブラウザ内蔵のローカルデータベース（IndexedDB）にキャッシュされる。2回目以降のアクセスではこの待ち時間がなくなる。

### 1.4 デプロイ先

**Netlify** を採用する（詳細は第4章にて比較検討の結果を記載）。

---

## 2. 技術的背景

### 2.1 ベースとするリポジトリ

本プロジェクトでは `ndl-lab/ndlocr-lite` を直接フォークするのではなく、**`yuta1984/ndlocrlite-web`** をフォークして開発を進める。

ndlocrlite-webは、橋本雄太氏（国立歴史民俗博物館）がNDLOCR-LiteをWebブラウザのみで動作するよう移植・再実装したものである。OCRモデル（DEIMv2、PARSeq）はNDLOCR-Liteのものをそのまま利用し、ONNX Runtime Web（WASMバックエンド）でブラウザ内推論を実現している。

既にNetlifyにデプロイされ動作実績がある（ `https://ndlocr-liteweb.netlify.app/` ）。

### 2.2 なぜndlocrlite-webをベースにするのか

元の `ndl-lab/ndlocr-lite` はPython + Flet（デスクトップGUIフレームワーク）で構築されており、Webアプリ化するにはOCRエンジンのWASM移植から始める必要がある。ndlocrlite-webはこの移植が完了済みであり、開発工数を大幅に削減できる。

### 2.3 ONNXモデル（約146MB）の詳細

NDLOCR-Lite Web AIが使用する「約146MBのモデル」とは、OCR処理を行うための4つのONNX形式の機械学習モデルファイルの合計である。

| モデル | ファイル名 | サイズ | 用途 |
|--------|-----------|--------|------|
| DEIMv2 | `deim-s-1024x1024.onnx` | 38MB | レイアウト検出（テキスト行の矩形認識） |
| PARSeq-30 | `parseq-ndl-30.onnx` | 34MB | 文字認識（30文字以下の行） |
| PARSeq-50 | `parseq-ndl-50.onnx` | 35MB | 文字認識（50文字以下の行） |
| PARSeq-100 | `parseq-ndl-100.onnx` | 39MB | 文字認識（100文字以下の行） |

DEIMv2がテキスト行の位置と文字数カテゴリを検出し、その結果に応じて3種類のPARSeqモデルを使い分ける「カスケード方式」で文字認識を行う。行の長さに最適なモデルを選択することで精度を向上させる仕組みである。

### 2.4 ブラウザ上のWASMランタイム

**WebAssembly（WASM）** とは、ブラウザ内でネイティブに近い速度でプログラムを実行するための標準技術である。2017年頃から主要ブラウザが標準対応しており、プラグインやインストールは不要である。

**ONNX Runtime Web** は、Microsoftが開発した機械学習推論エンジンのブラウザ版である。本アプリではonnxruntime-web 1.20.0のWASM CPUバックエンドを使用し、通常ならPython＋ローカルPCで実行する推論処理をブラウザのタブ内で完結させる。

OCR処理はWeb Worker上で実行されるため、処理中もUIがフリーズせず非同期に進行する。ユーザーから見れば「ブラウザで画像をドロップしたらテキストが出てくる」だけで、Pythonもサーバーも不要である。サーバーに画像を送信しないため、プライバシー面でも安心できる設計となっている。

### 2.5 COOP/COEPヘッダーの必要性

ONNX Runtime WASMはSharedArrayBufferを使用するため、ホスティングサーバーが以下の2つのHTTPレスポンスヘッダーを返す必要がある。

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

これらのヘッダーを設定できないプラットフォーム（GitHub Pages等）はデプロイ先として使用できない。NetlifyおよびVercelはいずれもカスタムヘッダーに対応しており、この要件を満たす。

### 2.6 技術スタック

| 要素 | 技術 |
|------|------|
| フレームワーク | Vite + React 19 + TypeScript |
| OCRランタイム | onnxruntime-web 1.20.0（WASM CPUバックエンド） |
| PDF処理 | pdfjs-dist 4.9.0 |
| OCR処理 | Web Worker（UIをブロックしない非同期処理） |
| モデルキャッシュ | IndexedDB |
| 差分表示 | diff-match-patch |
| 状態管理 | React Context + useReducer |
| デプロイ | Netlify（COOP/COEPヘッダー対応） |

---

## 3. UI設計

### 3.1 メイン画面構成

メイン画面は以下の3つの領域で構成する。

#### ヘッダーバー

- アプリ名、バージョン表示
- AI接続ステータス（connected / disconnected）
- 設定ボタン（Settings）

#### メインコンテンツ（左右分割）

- **左パネル（ImagePanel）：** 元画像の表示。OCRで検出されたテキスト行の矩形をオーバーレイ表示。ページ送り、ズーム/パン機能。
- **右パネル（TextEditor）：** OCR結果の編集可能テキストエリア。monospaceフォント、line-height: 1.9で一覧性を確保。「AI校正」「コピー」「ダウンロード」ボタンを配置。校正後は差分をインラインハイライト（削除＝赤背景、追加＝緑背景）で表示。
- **SplitView：** 左右パネルのリサイズ可能なスプリッタ。デフォルト50:50。

#### ボトムツールバー

- 画像/PDFアップロードボタン
- OCR処理時間、AI校正時間、修正件数の表示

### 3.2 設定パネル

Settingsボタンからモーダルで表示する設定パネルには以下の項目を含む。

#### 接続モード切替

- **Direct API：** ブラウザから直接AI APIを呼び出す方式。プロバイダ選択（Anthropic / OpenAI / Google / Groq / カスタム）、APIキー入力、モデル選択が可能。
- **MCP Server：** MCPサーバーのURL（SSEエンドポイント）を指定して接続する方式。ユーザーが自前のMCPサーバーを立てていれば、そこ経由で任意のAIに接続可能。

#### 共通設定

- 校正用プロンプトのカスタマイズ（デフォルトで旧字体保存を指示）
- Test connectionボタンによる接続テスト
- APIキーはlocalStorageに保存（Web Crypto APIで暗号化、サーバーには送信しない）

### 3.3 テキストエリアのサイズ設計

「元画像のテキストが概ね一覧できる程度」の設計方針として、以下の仕様とする。

- ビューポート高さの70〜80%を使用し、`overflow-y: auto` でスクロール可能
- フォントサイズ13〜14px、行間1.9
- A4サイズの文書1ページ分のテキストが数スクロールで概観できる程度を目安とする

---

## 4. デプロイ先比較：Netlify vs Vercel

### 4.1 比較表

| 観点 | Netlify | Vercel |
|------|---------|--------|
| COOP/COEP | `netlify.toml` で設定済み（実績あり） | `vercel.json` で設定可能（新規作成が必要） |
| 帯域（無料枠） | 100 GB | 100 GB |
| 日本CDN拠点 | 限定的（アジアはシンガポール中心） | 東京エッジノードあり |
| ビルド時間 | 2〜3分 | 1〜2分 |
| 静的アセット上限 | ファイル単体の上限なし | 制限あり |
| 無料枠の商用利用 | 許可 | 禁止（Hobby限定） |
| フレームワーク | 非依存（何でも可） | Next.js最適化（Viteも可） |
| 移行コスト | ゼロ（既存設定をそのまま利用） | `vercel.json` 新規作成＋動作確認が必要 |

### 4.2 選定理由

**結論：Netlifyを採用する。** 理由は以下の3点である。

#### （1）動作実績

既存のndlocrlite-webがNetlifyで動作実績がある。COOP/COEPヘッダー設定は外部リソース読み込みとの組み合わせで問題が生じやすく、実績のある構成をそのまま使えることは大きなアドバンテージである。

#### （2）移行コストゼロ

フォーク後、Netlifyのダッシュボードでリポジトリを接続するだけでデプロイ可能である。`netlify.toml` によるヘッダー設定も既存のものをそのまま利用できる。

#### （3）商用利用の柔軟性

将来的に公開範囲を広げたい場合、Vercelの無料枠ではPro（月額$20）への移行が必要になる。Netlifyの無料枠は商用利用が許可されており、柔軟性が高い。

### 4.3 帯域消費に関する注意

本アプリは初回アクセスで約146MBのモデルをダウンロードするため、帯域消費が大きい。無料枠100GBでは約680人の初回アクセスで上限に達する。ただし2回目以降はIndexedDBキャッシュから読み込むため、リピーターが多ければ実質的な消費は大幅に減少する。

日本からのレイテンシが気になる場合は、モデルファイルだけをCloudflare R2やHugging Face Hubなど別のCDNに配置するハイブリッド構成で対応可能である。

---

## 5. 開発計画

### Phase 1：フォーク＆プロジェクトセットアップ（1〜2日）

ndlocrlite-webをフォークし、ローカル開発環境を構築。Netlifyデプロイの動作確認を行う。

- リポジトリのフォーク
- ローカルで `npm install` → `npm run dev` で動作確認
- Netlifyダッシュボードでリポジトリ接続 → 初回デプロイ
- COOP/COEPヘッダーの動作確認（SharedArrayBufferが有効であること）

### Phase 2：レイアウト改修 — 画像＋テキスト並列表示（3〜5日）

現在のndlocrlite-webのシンプルな結果表示を、元画像とテキストエリアの左右並列表示に改修する。

- **ImagePanel：** 元画像表示、OCR検出矩形のオーバーレイ、ページ送り、ズーム/パン
- **TextEditor：** OCR結果の編集可能テキストエリア、monospaceフォント、差分ハイライト機能
- **SplitView：** 左右パネルのリサイズ可能スプリッタ（デフォルト50:50）

### Phase 3：AI接続機能 — 設定パネル＆コネクタ（5〜7日）

Direct APIモードとMCP Serverモードの2つの接続方式を実装する。

#### Direct APIモード

- 対応プロバイダ：Anthropic / OpenAI / Google / Groq / カスタムエンドポイント
- プロバイダごとにリクエストフォーマッタを用意
- APIキーはlocalStorageにWeb Crypto APIで暗号化保存

#### MCP Serverモード

- MCPサーバーURL（SSEエンドポイント）の指定
- MCPプロトコルに従ったツール一覧取得→校正ツール呼び出し

#### AI Connectorインターフェース

```typescript
interface AIConnector {
  proofread(ocrText: string, imageBase64: string): Promise<ProofreadResult>;
  testConnection(): Promise<boolean>;
}

interface ProofreadResult {
  correctedText: string;
  changes: Array<{
    original: string;
    corrected: string;
    position: number;
    reason?: string;
  }>;
}
```

### Phase 4：AI校正機能の実装（3〜5日）

「AI校正」ボタンクリック時の処理フローは以下のとおり。

1. 現在のOCRテキストと元画像（base64エンコード）をAIに送信
2. AIが画像とテキストを比較し、OCR誤認識を修正したテキストを返却
3. 差分エンジン（diff-match-patch）が元テキストと修正テキストをdiff比較
4. テキストエリア上で削除部分（赤背景）と追加部分（緑背景）をインライン表示
5. ユーザーが個別にaccept/rejectできるUI

**プロンプト設計の注意点：** 歴史的文書では旧字体の保存が重要なため、デフォルトプロンプトで「旧字体を現代字体に変換しないこと」を明示する。カスタムプロンプトも設定パネルから変更可能とする。

### Phase 5：仕上げ・デプロイ（2〜3日）

- エラーハンドリング（API接続失敗時のフォールバック、レートリミット対応）
- レスポンシブ対応（モバイルでは上下配置に切り替え）
- i18n（既存の日英対応を維持）
- パフォーマンス最適化（画像の遅延読み込み、差分計算のデバウンス）
- 最終デプロイとテスト

### 5.1 スケジュール概要

| フェーズ | 期間 | 備考 |
|---------|------|------|
| Phase 1：セットアップ | 1〜2日 | フォーク＆初回デプロイ |
| Phase 2：レイアウト改修 | 3〜5日 | 最大工数 |
| Phase 3：AI接続 | 5〜7日 | 2モード実装 |
| Phase 4：AI校正 | 3〜5日 | 差分表示含む |
| Phase 5：仕上げ | 2〜3日 | テスト＆最適化 |
| **合計** | **2〜3週間** | **一人開発の場合** |

---

## 6. ライセンス

### 6.1 成果物のライセンス

本プロジェクト（NDLOCR-Lite Web AI）の成果物には **MIT License** を適用する。

MIT Licenseを選定した理由は以下のとおり。

- **ソフトウェアライセンスとしての標準性：** 依存ライブラリの大半（React、Vite、onnxruntime-web等）がMIT Licenseであり、整合性が高い。CC BY 4.0はCreative Commons自身がソフトウェアへの適用を推奨しておらず、ソフトウェア特有の権利関係（特許、実行、リンク等）をカバーしきれない。
- **上流ライセンスとの互換性：** CC BY 4.0は非コピーレフトライセンスであり、派生物に同じライセンスを適用する義務がない。帰属表示を行えば、MIT Licenseでの再配布が法的に可能である。
- **利用の容易さ：** MIT Licenseはソフトウェア開発者にとって最も広く理解されており、フォークやコントリビューションの障壁が低い。

### 6.2 上流ライセンスへの帰属表示

CC BY 4.0の条件を満たすため、以下の帰属表示をREADMEおよびLICENSEファイルに明記する。

- OCRモデル（DEIMv2、PARSeqの重みファイル）、文字セット（NDLmoji.yaml）、推論アルゴリズムは **NDLOCR-Lite**（国立国会図書館、CC BY 4.0）に帰属する
- Web移植版のベースコードは **ndlocrlite-web**（橋本雄太氏）に帰属する
- 本プロジェクトはこれらの派生物である

### 6.3 ライセンス構成のまとめ

| 対象 | ライセンス | 権利者 |
|------|-----------|--------|
| NDLOCR-Lite（OCRモデル・アルゴリズム） | CC BY 4.0 | 国立国会図書館 |
| ndlocrlite-web（Web移植コード） | LICENSEファイルに準拠 | 橋本雄太氏 |
| NDLOCR-Lite Web AI（本プロジェクトの追加コード） | MIT License | 小形 |

---

## 7. 参考リンク

- **NDLOCR-Lite（元リポジトリ）：** https://github.com/ndl-lab/ndlocr-lite
- **ndlocrlite-web（ベースリポジトリ）：** https://github.com/yuta1984/ndlocrlite-web
- **ndlocrlite-web デモサイト：** https://ndlocr-liteweb.netlify.app/
- **NDLラボ：** https://lab.ndl.go.jp/
