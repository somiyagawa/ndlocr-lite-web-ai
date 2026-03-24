import type { Translations } from './ja'

export const es: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'Herramienta OCR japonesa en el navegador',
  },
  upload: {
    dropzone: 'Arrastra archivos aquí o haz clic para seleccionar',
    directoryButton: 'Seleccionar carpeta',
    acceptedFormats: 'Formatos admitidos: JPG, PNG, PDF',
    startButton: 'Iniciar OCR',
    clearButton: 'Limpiar',
  },
  progress: {
    initializing: 'Inicializando...',
    loadingLayoutModel: 'Cargando modelo de detección de diseño... {percent}%',
    loadingRecognitionModel: 'Cargando modelo de reconocimiento de texto... {percent}%',
    layoutDetection: 'Detectando regiones de texto... {percent}%',
    textRecognition: 'Reconociendo texto ({current}/{total} regiones)',
    readingOrder: 'Procesando orden de lectura...',
    generatingOutput: 'Generando salida...',
    processing: 'Procesando: {current}/{total} archivos',
    done: 'Completado',
  },
  results: {
    copy: 'Copiar',
    download: 'Descargar',
    downloadAll: 'Descargar todo el texto',
    copied: '¡Copiado!',
    noResult: 'Sin resultados',
    regions: '{count} regiones',
    processingTime: 'Tiempo de procesamiento: {time}s',
  },
  history: {
    title: 'Historial',
    clearCache: 'Limpiar caché',
    confirmClear: '¿Eliminar todo el historial de procesamiento?',
    yes: 'Eliminar',
    cancel: 'Cancelar',
    empty: 'Sin historial de procesamiento',
    noText: 'Sin texto',
  },
  settings: {
    title: 'Configuración',
    modelCache: 'Caché de modelos',
    clearModelCache: 'Limpiar caché de modelos',
    confirmClearModel:
      '¿Eliminar modelos ONNX en caché? Se descargarán de nuevo en el próximo inicio.',
    clearDone: 'Limpiado',
  },
  info: {
    privacyNotice:
      'Esta aplicación funciona completamente en su navegador. Los archivos de imagen seleccionados y los resultados OCR no se envían a ningún servidor externo.',
    author:
      'Creado por Yuta Hashimoto (Museo Nacional de Historia Japonesa / Biblioteca Nacional de la Dieta)',
    githubLink: 'Repositorio GitHub',
  },
  language: {
    switchTo: 'Español',
  },
  error: {
    generic: 'Se produjo un error',
    modelLoad: 'Error al cargar el modelo',
    ocr: 'Error durante el procesamiento OCR',
    fileLoad: 'Error al cargar el archivo',
    clipboardNotSupported: 'No se puede acceder al portapapeles',
  },
}
