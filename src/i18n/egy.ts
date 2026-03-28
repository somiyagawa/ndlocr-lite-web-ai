import type { Translations } from './ja'

// Ancient Egyptian Hieroglyphs — Unicode Egyptian Hieroglyphs (U+13000–U+1342F)
// with Egyptian Hieroglyph Format Controls (U+13430–U+1343F):
//   U+13430 = VERTICAL JOINER (stack vertically within quadrat)
//   U+13431 = HORIZONTAL JOINER (place side by side within quadrat)
//   U+13432 = INSERT AT TOP START
//   U+13433 = INSERT AT BOTTOM START
//   U+13434 = INSERT AT TOP END
//   U+13435 = INSERT AT BOTTOM END
//   U+13436 = BEGIN SEGMENT
//   U+13437 = END SEGMENT
// For full glyph rendering, EgyptianOpenType font is recommended:
// https://github.com/microsoft/font-tools/tree/main/EgyptianOpenType
//
// Key signs used:
// 𓂋 = r (D21), 𓏤 = Z1 (stroke), 𓈖 = n (N35), 𓆎 = km (I6),
// 𓅓 = m (G17), 𓏏 = t (X1), 𓊪 = p (Q3), 𓇋 = i (M17),
// 𓂝 = ayin (D36), 𓊃 = s (S29), 𓈙 = š (N29), 𓉐 = pr (O1),
// 𓌃 = sḫm (S42), 𓅱 = w (G43), 𓁹 = ir (D4), 𓄿 = A (G1),
// 𓃀 = b (D58), 𓆑 = f (I9), 𓎛 = ḥ (V28), 𓐍 = ḫ (Aa1),
// 𓍿 = ṯ (V13), 𓋴 = s (S29 var), 𓊹 = nṯr (R8), 𓏺 = II (Z4)
//
// Quadrat examples with control chars:
// 𓅓𓈖 with 𓅓‍𓈖 (ZWJ) = horizontal group
// 𓇋︭𓈖 = 𓇋 stacked above 𓈖

export const egy: Translations = {
  app: {
    title: 'NDL(Kotenseki)OCR-lite Web',
    // mdw-nṯr n OCR m sšr = "hieroglyphs of OCR in the browser"
    subtitle: '𓌃𓂧𓅱\u{13430}𓊹𓂋 𓈖 OCR 𓅓 𓊃\u{13430}𓈙𓂋',
  },
  upload: {
    // iny ꜥ.t r st tn = "bring files to this place"
    dropzone: '𓇋\u{13430}𓈖\u{13431}𓏤 𓂝\u{13430}𓏏 𓂋 𓊃\u{13430}𓏏 𓏏\u{13430}𓈖, 𓇋𓅓 𓋴\u{13430}𓏏𓊪',
    directoryButton: '𓊃\u{13430}𓏏𓊪 𓉐\u{13430}𓏤',
    acceptedFormats: '𓊃\u{13430}𓈙\u{13430}𓈖: JPG, PNG, PDF',
    // sḫr OCR = "begin OCR"
    startButton: '𓊃\u{13430}𓐍𓂋 OCR',
    // m-ꜥ = "remove"
    clearButton: '𓅓\u{13430}𓂝\u{13430}𓏤',
  },
  progress: {
    initializing: '𓊃\u{13430}𓐍𓂋 𓅓 𓇋\u{13430}𓂋\u{13430}𓏏...',
    loadingLayoutModel: '𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓈖 𓏏\u{13430}𓅱 𓅓\u{13430}𓂝\u{13430}𓈖... {percent}%',
    loadingRecognitionModel: '𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓈖 𓂋\u{13430}𓐍 𓅓\u{13430}𓂝\u{13430}𓈖... {percent}%',
    layoutDetection: '𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓊃\u{13430}𓏏 𓈖 𓅓\u{13430}𓏏\u{13430}𓈖... {percent}%',
    textRecognition: '𓂋\u{13430}𓐍 𓅓\u{13430}𓏏\u{13430}𓈖 ({current}/{total} 𓊃\u{13430}𓏏)',
    readingOrder: '𓊃\u{13430}𓐍𓂋 𓈖 𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏...',
    generatingOutput: '𓇋\u{13430}𓂋\u{13430}𓏏 𓅓 𓊪\u{13430}𓂋\u{13430}𓏏...',
    processing: '𓊃\u{13430}𓐍𓂋: {current}/{total} 𓊪\u{13430}𓂋\u{13430}𓏏',
    // nfr = "good/complete"
    done: '𓈖\u{13430}𓆑\u{13430}𓂋',
  },
  results: {
    // sš = "write/copy"
    copy: '𓋴\u{13430}𓈙',
    // šdi = "take/download"
    download: '𓈙\u{13430}𓂧\u{13430}𓇋',
    downloadAll: '𓈙\u{13430}𓂧\u{13430}𓇋 𓈖\u{13430}𓃀\u{13430}𓏏',
    copied: '𓋴\u{13430}𓈙!',
    // nn wn = "there is not"
    noResult: '𓈖\u{13430}𓈖 𓊪\u{13430}𓂋\u{13430}𓏏',
    regions: '{count} 𓊃\u{13430}𓏏',
    processingTime: '𓇳\u{13430}𓏺: {time}𓊃',
  },
  history: {
    // sšw mdt = "record of words"
    title: '𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓅓\u{13430}𓏏\u{13430}𓈖',
    clearCache: '𓅓\u{13430}𓂝\u{13430}𓏤 𓉐\u{13430}𓏤',
    confirmClear: '𓅓\u{13430}𓂝\u{13430}𓏤 𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓈖\u{13430}𓃀\u{13430}𓏏?',
    yes: '𓅓\u{13430}𓂝\u{13430}𓏤',
    cancel: '𓊃\u{13430}𓈙\u{13430}𓈖',
    empty: '𓈖\u{13430}𓈖 𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏',
    noText: '𓈖\u{13430}𓈖 𓅓\u{13430}𓏏\u{13430}𓈖',
  },
  settings: {
    title: '𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏',
    modelCache: '𓉐\u{13430}𓏤 𓈖 𓏏\u{13430}𓅱',
    clearModelCache: '𓅓\u{13430}𓂝\u{13430}𓏤 𓉐\u{13430}𓏤 𓈖 𓏏\u{13430}𓅱',
    confirmClearModel: '𓅓\u{13430}𓂝\u{13430}𓏤 ONNX 𓏏\u{13430}𓅱? 𓊃\u{13430}𓈙\u{13430}𓈖 𓅓 𓂋\u{13430}𓐍 𓇋\u{13430}𓂋\u{13430}𓏏.',
    clearDone: '𓅓\u{13430}𓂝\u{13430}𓏤',
  },
  info: {
    // prt tn sḫr m sšr. sšnw m OCR n sšnwt n prt n iwt.
    privacyNotice: '𓊪\u{13430}𓂋\u{13430}𓏏 𓏏\u{13430}𓈖 𓊃\u{13430}𓐍𓂋 𓅓 𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓏤. 𓊃\u{13430}𓈙\u{13430}𓈖 𓅓 OCR 𓈖 𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓈖 𓊪\u{13430}𓂋\u{13430}𓏏 𓈖 𓇋\u{13430}𓅱\u{13430}𓏏.',
    author: '𓇋\u{13430}𓂋\u{13430}𓏏: Yuta Hashimoto',
    githubLink: 'GitHub 𓉐\u{13430}𓏤',
  },
  language: { switchTo: '日本語' },
  error: {
    generic: '𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓈖 𓊪\u{13430}𓂋\u{13430}𓏏',
    modelLoad: '𓈖\u{13430}𓈖 𓊃\u{13430}𓈙\u{13430}𓈖 𓏏\u{13430}𓅱',
    ocr: '𓊃\u{13430}𓈙\u{13430}𓈖\u{13430}𓏏 𓈖 OCR',
    fileLoad: '𓈖\u{13430}𓈖 𓊃\u{13430}𓈙\u{13430}𓈖 𓊪\u{13430}𓂋\u{13430}𓏏',
    clipboardNotSupported: '𓈖\u{13430}𓈖 𓊃\u{13430}𓈙\u{13430}𓈖 clipboard',
  },
  tooltip: { dragPageReorder: '𓊃\u{13430}𓈙\u{13430}𓈖 𓅓 𓊃\u{13430}𓐍𓂋' },
  header: {
    changelog: 'Changelog',
    subtitle: 'Modern print to kuzushiji',
    sectionModern: '── Modern ──',
    sectionModernExp: '── Modern (experimental) ──',
    sectionClassicalExp: '── Classical (experimental) ──',
    badgeBeta: 'beta',
    uiLanguage: 'UI Language',
    ocrAutoTitle: 'Analyze image and auto-select Modern or Classical OCR',
    ocrAutoLabel: 'Auto',
    ocrModernTitle: 'Modern Japanese OCR (books & printed text)',
    ocrModernLabel: 'Modern',
    ocrKotenTitle: 'Kuzushiji/Classical OCR (manuscripts & old texts)',
    ocrKotenLabel: 'Kuzushiji/Classical',
    privacyFull: 'This system runs entirely in your browser. Images and OCR results are never sent to any external server.',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },
  footer: {
    madeBy: 'Made by',
    webPort: 'Web port:',
    aiFeatures: 'AI features:',
    license: 'License',
    frogCredit: 'Choju-giga frog illustration tribute to Toru Aoike',
    privacyBrowser: 'Runs entirely in your browser — images never leave your device.',
    bugReport: 'Bug Report',
  },
  editor: {
    save: 'Save',
    saveAs: 'Save As',
    export: 'Export',
    exportTEI: 'TEI XML',
    exportHOCR: 'hOCR',
    exportPDF: 'Text PDF',
    exportDOCX: 'DOCX',
    undo: 'Undo',
    joinLines: 'Join Lines',
    deleteBlankLines: 'Delete Blank Lines',
    vertical: 'Vertical',
    horizontal: 'Horizontal',
    lineSpacing: 'Line Spacing',
    fontSize: 'Font Size',
    fontFamily: 'Font',
    ignoreNewlines: 'Ignore Newlines',
    showFilename: 'Show Filename',
    findReplace: 'Find & Replace',
    find: 'Find',
    replace: 'Replace',
    replaceAll: 'Replace All',
    noMatch: 'No match',
    readingOrder: 'Reading Order',
    editReadingOrder: 'Edit Reading Order',
    textOverlay: 'Text Overlay',
    confidence: 'Confidence',
    regionSelect: 'Select region for OCR',
    aiProofread: 'AI Proofread',
    aiProofreading: 'AI Proofreading...',
    acceptAll: 'Accept All',
    rejectAll: 'Reject All',
    diffView: 'Diff View',
    copyAll: 'Copy All',
    selectAll: 'Select All',
    autoFitFont: 'Auto-fit Font',
  },
  camera: {
    title: 'Camera',
    capture: 'Capture',
    retake: 'Retake',
    use: 'Use Photo',
    switchCamera: 'Switch Camera',
    documentScan: 'Document Scan',
    cameraNotAvailable: 'Camera not available',
  },
  viewer: {
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitToWidth: 'Fit to Width',
    fitToHeight: 'Fit to Height',
    resetZoom: 'Reset Zoom',
    rotate: 'Rotate',
  },
  iiif: {
    title: 'IIIF Image Loader',
    manifestUrl: 'IIIF Manifest URL',
    load: 'Load',
    loading: 'Loading manifest...',
    selectImages: 'Select images to load',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    loadSelected: 'Load Selected',
    noImages: 'No images found in manifest',
    error: 'Failed to load IIIF manifest',
  },
}
