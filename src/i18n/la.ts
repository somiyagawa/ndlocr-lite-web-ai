import type { Translations } from './ja'

export const la: Translations = {
  app: {
    title: 'NDL(Kotenseki)OCR-lite Web',
    subtitle: 'Instrumentum OCR Linguae Iaponiensis Navigatore Computatorum Perficiendum',
  },
  upload: {
    dropzone: 'Ficheiros huc trahe et dimitte, vel clica ut delige',
    directoryButton: 'Elige Catalogum',
    acceptedFormats: 'Formae Receptae: JPG, PNG, PDF',
    startButton: 'Incipe OCR',
    clearButton: 'Dele',
  },
  progress: {
    initializing: 'Praeparando...',
    loadingLayoutModel: 'Exemplar Detectionis Ordinationis Onerosum... {percent}%',
    loadingRecognitionModel: 'Exemplar Recognitionis Textus Onerosum... {percent}%',
    layoutDetection: 'Regiones Textus Detegendo... {percent}%',
    textRecognition: 'Textum Cognoscendo ({current}/{total} regiones)',
    readingOrder: 'Ordinem Lectionis Tractando...',
    generatingOutput: 'Eventum Generando...',
    processing: 'Tractans: {current}/{total} ficheria',
    done: 'Perfectum',
  },
  results: {
    copy: 'Copia',
    download: 'Deducere',
    downloadAll: 'Omnem Textum Deducere',
    copied: 'Copia Facta!',
    noResult: 'Nullum Eventum',
    regions: '{count} regiones',
    processingTime: 'Tempus Tractationis: {time}s',
  },
  history: {
    title: 'Historia',
    clearCache: 'Dele Thesaurum',
    confirmClear: 'Omnem Historiam Tractationis Delere?',
    yes: 'Dele',
    cancel: 'Obsto',
    empty: 'Nulla Historia Tractationis',
    noText: 'Nullus Textus',
  },
  settings: {
    title: 'Conditiones',
    modelCache: 'Thesaurus Exemplaris',
    clearModelCache: 'Thesaurum Exemplarium ONNX Dele',
    confirmClearModel: 'Exemplaria ONNX in Thesuaro Delere? In incepto proximo iterum deducentur.',
    clearDone: 'Deletum',
  },
  info: {
    privacyNotice: 'Hoc instrumentum omnino in navigatore tuo computatorum perficitur. Ficheria Imaginis Selecta et Eventus OCR ad nullum Servitorem Externum Mittuntur.',
    author: 'Ab Yuta Hashimoto Creatum (Musaeum Nationale Historiae Iaponiensis / Bibliotheca Nationalis Diaetifera)',
    githubLink: 'Depositarium GitHub',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'Error Aliquis Accidi',
    modelLoad: 'Exemplar Onerare Nequivit',
    ocr: 'Error in Tractatione OCR',
    fileLoad: 'Fichera Onerare Nequivit',
    clipboardNotSupported: 'Praetextus Attingere Nequit',
  },
  tooltip: {
    dragPageReorder: 'Trahere ut Reordinare',
  },
}
