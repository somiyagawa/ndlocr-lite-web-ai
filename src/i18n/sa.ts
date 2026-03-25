import type { Translations } from './ja'

export const sa: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'जापानभाषाया: OCR उपकरणं ब्राउज़रे चलति',
  },
  upload: {
    dropzone: 'सञ्चिकाः अत्र आकर्षयतु अथवा चयनाय क्लिक् कुरुत',
    directoryButton: 'सञ्चयं चिनुत',
    acceptedFormats: 'स्वीकृतप्रारूपाणि: JPG, PNG, PDF',
    startButton: 'OCR आरभत',
    clearButton: 'शोधयत',
  },
  progress: {
    initializing: 'आरम्भयति...',
    loadingLayoutModel: 'विन्यासप्रतिमानम् आवहति... {percent}%',
    loadingRecognitionModel: 'अक्षरज्ञानप्रतिमानम् आवहति... {percent}%',
    layoutDetection: 'पाठक्षेत्राणि अन्विष्यन्ति... {percent}%',
    textRecognition: 'पाठं ज्ञायते ({current}/{total} क्षेत्राणि)',
    readingOrder: 'पठनक्रमं संस्करोति...',
    generatingOutput: 'निर्गमं जनयति...',
    processing: 'संस्क्रियते: {current}/{total} सञ्चिकाः',
    done: 'सम्पन्नम्',
  },
  results: {
    copy: 'प्रतिलिपिः',
    download: 'अवतारयत',
    downloadAll: 'सर्वपाठम् अवतारयत',
    copied: 'प्रतिलिपिकृतम्!',
    noResult: 'फलानि नास्ति',
    regions: '{count} क्षेत्राणि',
    processingTime: 'संस्करणकालः: {time}क्ष',
  },
  history: {
    title: 'इतिहासः',
    clearCache: 'सञ्चयं शोधयत',
    confirmClear: 'सर्वम् इतिहासं विलोपयति वा?',
    yes: 'विलोपयत',
    cancel: 'निरस्यत',
    empty: 'इतिहासो नास्ति',
    noText: 'पाठो नास्ति',
  },
  settings: {
    title: 'विन्यासाः',
    modelCache: 'प्रतिमानसञ्चयः',
    clearModelCache: 'प्रतिमानसञ्चयं शोधयत',
    confirmClearModel:
      'ONNX प्रतिमानानि विलोपयति वा? पुनः अवतरणम् आवश्यकम्.',
    clearDone: 'शोधितम्',
  },
  info: {
    privacyNotice:
      'इदम् अनुप्रयोगः सम्पूर्णतया भवतः ब्राउज़रे चलति। चित्रसञ्चिकाः OCR-फलानि च बाह्यसेवकाय न प्रेष्यन्ते।',
    author:
      'निर्माता: Yuta Hashimoto (जापानेतिहासस्य राष्ट्रिय-सङ्ग्रहालयः / राष्ट्रिय-संसद्-पुस्तकालयः)',
    githubLink: 'GitHub भण्डारम्',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'दोषः जातः',
    modelLoad: 'प्रतिमानम् आवहनम् अपराद्धम्',
    ocr: 'OCR संस्करणे दोषः',
    fileLoad: 'सञ्चिकावहनम् अपराद्धम्',
    clipboardNotSupported: 'अङ्कपटलिका अलभ्या',
  },
  tooltip: {
    dragPageReorder: 'आकर्षयत पुनः व्यवस्थयनाय',
  },
}
