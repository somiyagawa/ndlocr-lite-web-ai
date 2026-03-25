import type { Translations } from './ja'

export const en: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'Japanese OCR Tool Running in the Browser',
  },
  upload: {
    dropzone: 'Drag & drop files here, or click to select',
    directoryButton: 'Select Folder',
    acceptedFormats: 'Supported formats: JPG, PNG, PDF',
    startButton: 'Start OCR',
    clearButton: 'Clear',
  },
  progress: {
    initializing: 'Initializing...',
    loadingLayoutModel: 'Loading layout detection model... {percent}%',
    loadingRecognitionModel: 'Loading text recognition model... {percent}%',
    layoutDetection: 'Detecting text regions... {percent}%',
    textRecognition: 'Recognizing text ({current}/{total} regions)',
    readingOrder: 'Processing reading order...',
    generatingOutput: 'Generating output...',
    processing: 'Processing: {current}/{total} files',
    done: 'Done',
  },
  results: {
    copy: 'Copy',
    download: 'Download',
    downloadAll: 'Download All Text',
    copied: 'Copied!',
    noResult: 'No results',
    regions: '{count} regions',
    processingTime: 'Processing time: {time}s',
  },
  history: {
    title: 'History',
    clearCache: 'Clear Cache',
    confirmClear: 'Delete all processing history?',
    yes: 'Delete',
    cancel: 'Cancel',
    empty: 'No processing history',
    noText: 'No text',
  },
  settings: {
    title: 'Settings',
    modelCache: 'Model Cache',
    clearModelCache: 'Clear Model Cache',
    confirmClearModel:
      'Delete cached ONNX models? They will be re-downloaded on next startup.',
    clearDone: 'Cleared',
  },
  info: {
    privacyNotice:
      'This app runs entirely in your web browser. Selected image files and OCR results are not sent to any external server.',
    author:
      'Created by Yuta Hashimoto (National Museum of Japanese History / National Diet Library)',
    githubLink: 'GitHub Repository',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'An error occurred',
    modelLoad: 'Failed to load model',
    ocr: 'Error during OCR processing',
    fileLoad: 'Failed to load file',
    clipboardNotSupported: 'Cannot access clipboard',
  },
  tooltip: {
    dragPageReorder: 'Drag to reorder',
  },
}
