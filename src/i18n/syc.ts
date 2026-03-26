import type { Translations } from './ja'

export const syc: Translations = {
  app: {
    title: 'NDL(Kotenseki)OCR-lite Web',
    subtitle: 'ܡܐܢܐ ܕ OCR ܝܦܘܢܝܐ ܒܡܨܦܝܢܐ',
  },
  upload: {
    dropzone: 'ܓܪܘܪ ܩ̈ܛܝܡܐ ܠܗܪܟܐ ܐܘ ܕܘܨ ܠܓܒܝܬܐ',
    directoryButton: 'ܓܒܝ ܣܕܪܐ',
    acceptedFormats: 'ܛܘ̈ܦܣܐ ܡܩܒ̈ܠܐ: JPG, PNG, PDF',
    startButton: 'ܫܪܝ OCR',
    clearButton: 'ܡܚܝ',
  },
  progress: {
    initializing: 'ܡܫܪܐ...',
    loadingLayoutModel: 'ܛܥܢ ܛܘܦܣܐ ܕܣܕܪܐ... {percent}%',
    loadingRecognitionModel: 'ܛܥܢ ܛܘܦܣܐ ܕܝܕܥܬ ܟܬܒ̈ܬܐ... {percent}%',
    layoutDetection: 'ܡܫܟܚ ܐܬܪ̈ܘܬܐ ܕܟܬܒ̈ܬܐ... {percent}%',
    textRecognition: 'ܡܫܬܘܕܥ ܟܬܒ̈ܬܐ ({current}/{total} ܐܬܪ̈ܘܬܐ)',
    readingOrder: 'ܡܣܕܪ ܛܟܣ ܩܪܝܢܐ...',
    generatingOutput: 'ܡܘܠܕ ܦܠ̈ܛܐ...',
    processing: 'ܡܦܠܚ: {current}/{total} ܩ̈ܛܝܡܐ',
    done: 'ܫܠܡ',
  },
  results: {
    copy: 'ܢܣܚ',
    download: 'ܐܚܬ',
    downloadAll: 'ܐܚܬ ܟܠ ܟܬܒ̈ܬܐ',
    copied: '!ܐܬܢܣܚ',
    noResult: 'ܠܝܬ ܦܠ̈ܛܐ',
    regions: '{count} ܐܬܪ̈ܘܬܐ',
    processingTime: 'ܙܒܢ ܦܘܠܚܢܐ: {time}ܫ',
  },
  history: {
    title: 'ܬܫܥܝܬܐ',
    clearCache: 'ܡܚܝ ܡܛܫܝܬܐ',
    confirmClear: 'ܫܘܦ ܟܠ ܬܫ̈ܥܝܬܐ ܕܦܘܠܚܢܐ؟',
    yes: 'ܫܘܦ',
    cancel: 'ܒܛܠ',
    empty: 'ܠܝܬ ܬܫ̈ܥܝܬܐ ܕܦܘܠܚܢܐ',
    noText: 'ܠܝܬ ܟܬܒ̈ܬܐ',
  },
  settings: {
    title: 'ܛܘ̈ܟܣܐ',
    modelCache: 'ܡܛܫܝܬ ܛܘ̈ܦܣܐ',
    clearModelCache: 'ܡܚܝ ܡܛܫܝܬ ܛܘ̈ܦܣܐ',
    confirmClearModel:
      'ܫܘܦ ܛܘ̈ܦܣܐ ܕ ONNX ܕܡܛ̈ܫܝܢ؟ ܢܬܬܥܢܘܢ ܡܢ ܕܪܝܫ ܒܫܘܪܝ ܐ̱ܚܪܢܐ.',
    clearDone: 'ܐܬܡܚܝ',
  },
  info: {
    privacyNotice:
      'ܗܕ ܬܘܩܢܐ ܦܠܚ ܟܠ ܒܟܠ ܒܡܨܦܝܢܟ. ܩ̈ܛܝܡܐ ܕܨܘܪ̈ܬܐ ܘܦܠ̈ܛܐ ܕ OCR ܠܐ ܡܫܬܕܪܝܢ ܠܫܡ̈ܫܐ ܒܪ̈ܝܐ.',
    author:
      'ܒܪܝ: Yuta Hashimoto (ܒܝܬ ܥܬ̈ܩܐ ܐܘ̈ܡܬܢܝܐ ܕܬܫܥܝܬ ܝܦܘܢ / ܒܝܬ ܟ̈ܬܒܐ ܕܟܢܘܫܬ ܐܘ̈ܡܬܐ)',
    githubLink: 'ܒܝܬ ܓܙ̈ܐ ܕ GitHub',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'ܓܕܫ ܛܘܥܝ',
    modelLoad: 'ܠܐ ܐܬܡܨܝ ܠܡܛܥܢ ܛܘܦܣܐ',
    ocr: 'ܛܘܥܝ ܒܦܘܠܚܢ OCR',
    fileLoad: 'ܠܐ ܐܬܡܨܝ ܠܡܛܥܢ ܩܛܝܡܐ',
    clipboardNotSupported: 'ܠܐ ܡܬܡܨܝܢ ܠܡܡܛܐ ܠܠܘ̈ܚܐ ܕܢܣ̈ܚܐ',
  },
  tooltip: {
    dragPageReorder: 'ܥܛܘܦ ܠܬܘܟܡܐ ܕܪܗܝܛܐ',
  },
}
