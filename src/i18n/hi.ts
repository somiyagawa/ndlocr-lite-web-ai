import type { Translations } from './ja'

export const hi: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'ब्राउज़र में जापानी OCR उपकरण',
  },
  upload: {
    dropzone: 'फ़ाइलें यहाँ खींचकर छोड़ें, या चुनने के लिए क्लिक करें',
    directoryButton: 'फ़ोल्डर चुनें',
    acceptedFormats: 'समर्थित प्रारूप: JPG, PNG, PDF',
    startButton: 'OCR शुरू करें',
    clearButton: 'साफ़ करें',
  },
  progress: {
    initializing: 'प्रारंभ हो रहा है...',
    loadingLayoutModel: 'लेआउट पहचान मॉडल लोड हो रहा है... {percent}%',
    loadingRecognitionModel: 'पाठ पहचान मॉडल लोड हो रहा है... {percent}%',
    layoutDetection: 'पाठ क्षेत्र पहचाने जा रहे हैं... {percent}%',
    textRecognition: 'पाठ पहचान ({current}/{total} क्षेत्र)',
    readingOrder: 'पठन क्रम संसाधित हो रहा है...',
    generatingOutput: 'आउटपुट बन रहा है...',
    processing: 'संसाधन: {current}/{total} फ़ाइलें',
    done: 'पूर्ण',
  },
  results: {
    copy: 'कॉपी',
    download: 'डाउनलोड',
    downloadAll: 'सभी पाठ डाउनलोड करें',
    copied: 'कॉपी हो गया!',
    noResult: 'कोई परिणाम नहीं',
    regions: '{count} क्षेत्र',
    processingTime: 'संसाधन समय: {time}s',
  },
  history: {
    title: 'इतिहास',
    clearCache: 'कैश साफ़ करें',
    confirmClear: 'सभी संसाधन इतिहास हटाएँ?',
    yes: 'हटाएँ',
    cancel: 'रद्द करें',
    empty: 'कोई संसाधन इतिहास नहीं',
    noText: 'कोई पाठ नहीं',
  },
  settings: {
    title: 'सेटिंग्स',
    modelCache: 'मॉडल कैश',
    clearModelCache: 'मॉडल कैश साफ़ करें',
    confirmClearModel:
      'कैश किए गए ONNX मॉडल हटाएँ? अगली बार शुरू करने पर पुनः डाउनलोड होंगे।',
    clearDone: 'साफ़ हो गया',
  },
  info: {
    privacyNotice:
      'यह ऐप पूरी तरह से आपके वेब ब्राउज़र में चलता है। चयनित छवि फ़ाइलें और OCR परिणाम किसी बाहरी सर्वर पर नहीं भेजे जाते।',
    author:
      'निर्माता: युता हाशिमोतो (जापानी इतिहास राष्ट्रीय संग्रहालय / राष्ट्रीय संसद पुस्तकालय)',
    githubLink: 'GitHub रिपॉज़िटरी',
  },
  language: {
    switchTo: 'हिन्दी',
  },
  error: {
    generic: 'एक त्रुटि हुई',
    modelLoad: 'मॉडल लोड करने में विफल',
    ocr: 'OCR संसाधन के दौरान त्रुटि',
    fileLoad: 'फ़ाइल लोड करने में विफल',
    clipboardNotSupported: 'क्लिपबोर्ड तक पहुँचा नहीं जा सकता',
  },
}
