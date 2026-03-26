import type { Translations } from './ja'

export const cop: Translations = {
  app: {
    title: 'NDL(Kotenseki)OCR-lite Web',
    subtitle: 'ⲡⲓⲉⲣⲅⲁⲗⲓⲟⲛ ⲛⲧⲉ OCR ⲛⲓⲁⲡⲟⲛⲓⲕⲟⲛ ϧⲉⲛ ⲡⲓ browser',
  },
  upload: {
    dropzone: 'ⲥⲱⲕ ⲛⲓⲫⲁⲓⲗ ⲙⲡⲁⲓⲙⲁ ⲓⲉ ϫⲉⲙϫⲟⲙ ⲉⲥⲱⲧⲡ',
    directoryButton: 'ⲥⲱⲧⲡ ⲙⲡⲓⲫⲟⲗⲇⲉⲣ',
    acceptedFormats: 'ⲛⲓⲧⲩⲡⲟⲥ: JPG, PNG, PDF',
    startButton: 'ⲁⲣⲭⲉⲥⲑⲉ ⲛ OCR',
    clearButton: 'ⲧⲟⲩⲃⲟ',
  },
  progress: {
    initializing: 'ⲥⲉⲥⲟⲃⲧⲉ...',
    loadingLayoutModel: 'ⲥⲉϣⲱⲡ ⲙⲡⲓⲙⲟⲇⲉⲗ ⲛⲧⲉ layout... {percent}%',
    loadingRecognitionModel: 'ⲥⲉϣⲱⲡ ⲙⲡⲓⲙⲟⲇⲉⲗ ⲛⲥⲱⲟⲩⲛ ⲛⲓⲥϧⲁⲓ... {percent}%',
    layoutDetection: 'ⲥⲉϫⲓⲙⲓ ⲛⲛⲓⲙⲁ ⲛⲧⲉ ⲛⲓⲥϧⲁⲓ... {percent}%',
    textRecognition: 'ⲥⲉⲥⲱⲟⲩⲛ ⲛⲛⲓⲥϧⲁⲓ ({current}/{total} ⲛⲙⲁ)',
    readingOrder: 'ⲥⲉⲉⲣⲥⲩⲛⲧⲁⲥⲥⲓⲛ ⲙⲡⲓⲧⲁⲝⲓⲥ ⲛⲱϣ...',
    generatingOutput: 'ⲥⲉⲑⲁⲙⲓⲟ ⲙⲡⲓⲉⲃⲟⲗ...',
    processing: 'ⲥⲉⲉⲣϩⲱⲃ: {current}/{total} ⲛⲫⲁⲓⲗ',
    done: 'ⲁϥϫⲱⲕ',
  },
  results: {
    copy: 'ⲕⲟⲡⲓ',
    download: 'ϩⲓⲧⲉⲛ',
    downloadAll: 'ϩⲓⲧⲉⲛ ⲛⲓⲥϧⲁⲓ ⲧⲏⲣⲟⲩ',
    copied: '!ⲁⲩⲕⲟⲡⲓ',
    noResult: 'ⲙⲙⲟⲛ ϩⲟⲧⲁⲛ',
    regions: '{count} ⲛⲙⲁ',
    processingTime: 'ⲡⲓⲥⲏⲟⲩ ⲛⲧⲉ ⲡⲓϩⲱⲃ: {time}ⲥ',
  },
  history: {
    title: 'ⲑⲓⲥⲧⲟⲣⲓⲁ',
    clearCache: 'ⲧⲟⲩⲃⲟ ⲙⲡⲓ cache',
    confirmClear: 'ⲫⲱⲧⲉⲃ ⲛⲑⲓⲥⲧⲟⲣⲓⲁ ⲧⲏⲣⲥ?',
    yes: 'ⲫⲱⲧⲉⲃ',
    cancel: 'ⲕⲁⲥ',
    empty: 'ⲙⲙⲟⲛ ⲑⲓⲥⲧⲟⲣⲓⲁ',
    noText: 'ⲙⲙⲟⲛ ⲥϧⲁⲓ',
  },
  settings: {
    title: 'ⲛⲓⲥⲉⲧⲧⲓⲛⲅⲥ',
    modelCache: 'ⲡⲓ cache ⲛⲧⲉ ⲛⲓⲙⲟⲇⲉⲗ',
    clearModelCache: 'ⲧⲟⲩⲃⲟ ⲙⲡⲓ cache ⲛⲧⲉ ⲛⲓⲙⲟⲇⲉⲗ',
    confirmClearModel:
      'ⲫⲱⲧⲉⲃ ⲛⲛⲓⲙⲟⲇⲉⲗ ⲛⲧⲉ ONNX? ⲥⲉⲛⲁϣⲱⲡ ⲙⲙⲟⲟⲩ ⲟⲛ.',
    clearDone: 'ⲁⲩⲧⲟⲩⲃⲟ',
  },
  info: {
    privacyNotice:
      'ⲡⲁⲓ app ⲥⲉⲉⲣϩⲱⲃ ⲧⲏⲣϥ ϧⲉⲛ ⲡⲉⲕ browser. ⲛⲓⲓⲕⲱⲛ ⲛⲉⲙ ⲛⲓϩⲟⲧⲁⲛ ⲛⲧⲉ OCR ⲛⲥⲉⲟⲩⲱⲣⲡ ⲁⲛ ⲉⲃⲟⲗ.',
    author:
      'ⲁϥⲑⲁⲙⲓⲟϥ: Yuta Hashimoto (National Museum of Japanese History / National Diet Library)',
    githubLink: 'GitHub',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'ⲁⲩⲥϩⲁⲗⲙⲁ ϣⲱⲡⲓ',
    modelLoad: 'ⲙⲡⲟⲩϣϣⲱⲡ ⲙⲡⲓⲙⲟⲇⲉⲗ',
    ocr: 'ⲁⲩⲥϩⲁⲗⲙⲁ ϧⲉⲛ OCR',
    fileLoad: 'ⲙⲡⲟⲩϣϣⲱⲡ ⲙⲡⲓⲫⲁⲓⲗ',
    clipboardNotSupported: 'ⲙⲙⲟⲛ ϣϫⲟⲙ ⲛⲉⲙ ⲡⲓ clipboard',
  },
  tooltip: {
    dragPageReorder: 'ⲥⲱⲕ ⲉⲃⲟⲗ ⲛⲧⲟ ⲁⲅⲟⲩⲛ',
  },
}
