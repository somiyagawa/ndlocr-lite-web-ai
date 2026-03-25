import type { Translations } from './ja'

export const eo: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'Japana Ilo de OCR Funkcianta en la Foliumilo',
  },
  upload: {
    dropzone: 'Tragu kaj demetu dosierojn ĉi tie, aŭ klaku por elekti',
    directoryButton: 'Elektu Dosierujon',
    acceptedFormats: 'Subtenataj formatoj: JPG, PNG, PDF',
    startButton: 'Komenci OCR',
    clearButton: 'Malplenigu',
  },
  progress: {
    initializing: 'Iniciatado...',
    loadingLayoutModel: 'Ŝargante strukturan modelon... {percent}%',
    loadingRecognitionModel: 'Ŝargante tekstan modelon de rekonado... {percent}%',
    layoutDetection: 'Detektante tekstajn regionojn... {percent}%',
    textRecognition: 'Rekonante tekston ({current}/{total} regionoj)',
    readingOrder: 'Traktante legordon...',
    generatingOutput: 'Generante rezulton...',
    processing: 'Traktante: {current}/{total} dosieroj',
    done: 'Farita',
  },
  results: {
    copy: 'Kopiu',
    download: 'Elŝutu',
    downloadAll: 'Elŝutu Ĉiun Tekston',
    copied: 'Kopiita!',
    noResult: 'Neniu rezulto',
    regions: '{count} regionoj',
    processingTime: 'Traktotempo: {time}s',
  },
  history: {
    title: 'Historiko',
    clearCache: 'Malplenigu Kaŝmemoron',
    confirmClear: 'Ĉu forigi ĉiun historikon de traktado?',
    yes: 'Forigu',
    cancel: 'Nuligi',
    empty: 'Neniu historiko de traktado',
    noText: 'Neniu teksto',
  },
  settings: {
    title: 'Agordoj',
    modelCache: 'Kaŝmemoro de Modelo',
    clearModelCache: 'Malplenigu Kaŝmemoron de ONNX-modeloj',
    confirmClearModel: 'Ĉu forigi kaŝmemorajn ONNX-modelojn? Ili estos denove elŝutitaj dum sekvanta startado.',
    clearDone: 'Malplenigita',
  },
  info: {
    privacyNotice: 'Ĉi tiu ilo funkcias entute en via foliumilo. Elektitaj bilddosieroj kaj OCR-rezultoj ne estas sendataj al iu ajn ekstera servilo.',
    author: 'Kreita de Yuta Hashimoto (Nacia Japana Historio-muzeo / Nacia Dieta Biblioteko)',
    githubLink: 'GitHub-depozitaro',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'Eraro okazis',
    modelLoad: 'Malsukceso ŝargi modelon',
    ocr: 'Eraro dum OCR-traktado',
    fileLoad: 'Malsukceso ŝargi dosieron',
    clipboardNotSupported: 'Ne eblas aliri poŝojon',
  },
  tooltip: {
    dragPageReorder: 'Treni por reordigi',
  },
}
