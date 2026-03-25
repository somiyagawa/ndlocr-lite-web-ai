import type { Translations } from './ja'

export const ru: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'Инструмент японского OCR, работающий в браузере',
  },
  upload: {
    dropzone: 'Перетащите файлы сюда или нажмите для выбора',
    directoryButton: 'Выбрать папку',
    acceptedFormats: 'Поддерживаемые форматы: JPG, PNG, PDF',
    startButton: 'Начать OCR',
    clearButton: 'Очистить',
  },
  progress: {
    initializing: 'Инициализация...',
    loadingLayoutModel: 'Загрузка модели обнаружения макета... {percent}%',
    loadingRecognitionModel: 'Загрузка модели распознавания текста... {percent}%',
    layoutDetection: 'Обнаружение текстовых областей... {percent}%',
    textRecognition: 'Распознавание текста ({current}/{total} областей)',
    readingOrder: 'Обработка порядка чтения...',
    generatingOutput: 'Генерация вывода...',
    processing: 'Обработка: {current}/{total} файлов',
    done: 'Готово',
  },
  results: {
    copy: 'Копировать',
    download: 'Скачать',
    downloadAll: 'Скачать весь текст',
    copied: 'Скопировано!',
    noResult: 'Нет результатов',
    regions: '{count} областей',
    processingTime: 'Время обработки: {time}с',
  },
  history: {
    title: 'История',
    clearCache: 'Очистить кэш',
    confirmClear: 'Удалить всю историю обработки?',
    yes: 'Удалить',
    cancel: 'Отмена',
    empty: 'Нет истории обработки',
    noText: 'Нет текста',
  },
  settings: {
    title: 'Настройки',
    modelCache: 'Кэш моделей',
    clearModelCache: 'Очистить кэш моделей',
    confirmClearModel:
      'Удалить кэшированные модели ONNX? Они будут загружены заново при следующем запуске.',
    clearDone: 'Очищено',
  },
  info: {
    privacyNotice:
      'Это приложение работает полностью в вашем браузере. Выбранные изображения и результаты OCR не отправляются на внешние серверы.',
    author:
      'Автор: Юта Хасимото (Национальный музей японской истории / Национальная парламентская библиотека)',
    githubLink: 'Репозиторий GitHub',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'Произошла ошибка',
    modelLoad: 'Не удалось загрузить модель',
    ocr: 'Ошибка при обработке OCR',
    fileLoad: 'Не удалось загрузить файл',
    clipboardNotSupported: 'Нет доступа к буферу обмена',
  },
  tooltip: {
    dragPageReorder: 'Перетащите для переупорядочения',
  },
}
