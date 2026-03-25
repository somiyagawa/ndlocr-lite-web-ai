// as const を使わずに string型にすることでen.tsとの互換性を持たせる
export const ja: Record<string, Record<string, string>> = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'ブラウザで動く日本語OCRツール',
  },
  upload: {
    dropzone: 'ここにファイルをドラッグ＆ドロップ、またはクリックして選択',
    directoryButton: 'フォルダを選択',
    acceptedFormats: '対応形式: JPG, PNG, PDF',
    startButton: 'OCR開始',
    clearButton: 'クリア',
  },
  progress: {
    initializing: '初期化中...',
    loadingLayoutModel: 'レイアウト検出モデルを読み込み中... {percent}%',
    loadingRecognitionModel: '文字認識モデルを読み込み中... {percent}%',
    layoutDetection: 'レイアウト検出中... {percent}%',
    textRecognition: '文字認識中 ({current}/{total} 領域)',
    readingOrder: '読み順処理中...',
    generatingOutput: '出力生成中...',
    processing: '処理中: {current}/{total} ファイル',
    done: '完了',
  },
  results: {
    copy: 'コピー',
    download: 'ダウンロード',
    downloadAll: '全テキストをダウンロード',
    copied: 'コピーしました！',
    noResult: '結果なし',
    regions: '{count} 領域',
    processingTime: '処理時間: {time}秒',
  },
  history: {
    title: '処理履歴',
    clearCache: 'キャッシュをクリア',
    confirmClear: 'すべての処理履歴を削除しますか？',
    yes: '削除する',
    cancel: 'キャンセル',
    empty: '処理履歴がありません',
    noText: 'テキストなし',
  },
  settings: {
    title: '設定',
    modelCache: 'モデルキャッシュ',
    clearModelCache: 'モデルキャッシュをクリア',
    confirmClearModel: 'キャッシュされたONNXモデルを削除しますか？次回起動時に再ダウンロードが必要です。',
    clearDone: 'クリアしました',
  },
  info: {
    privacyNotice:
      'このアプリはWebブラウザで完結して動作します。選択した画像ファイルとOCR結果は外部に送信されません。',
    author:
      '作成者: 橋本雄太（国立歴史民俗博物館、国立国会図書館 非常勤調査員）',
    githubLink: 'GitHubリポジトリ',
  },
  language: {
    switchTo: 'English',
  },
  error: {
    generic: 'エラーが発生しました',
    modelLoad: 'モデルの読み込みに失敗しました',
    ocr: 'OCR処理中にエラーが発生しました',
    fileLoad: 'ファイルの読み込みに失敗しました',
    clipboardNotSupported: 'クリップボードへのアクセスができません',
  },
  tooltip: {
    dragPageReorder: 'ドラッグして並び替え可能',
  },
} as const

export type Translations = Record<string, Record<string, string>>
