import type { Translations } from './ja'

export const de: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'Japanisches OCR-Werkzeug im Browser',
  },
  upload: {
    dropzone: 'Dateien hierher ziehen oder klicken zum Auswählen',
    directoryButton: 'Ordner auswählen',
    acceptedFormats: 'Unterstützte Formate: JPG, PNG, PDF',
    startButton: 'OCR starten',
    clearButton: 'Löschen',
  },
  progress: {
    initializing: 'Initialisierung...',
    loadingLayoutModel: 'Layouterkennungsmodell wird geladen... {percent}%',
    loadingRecognitionModel: 'Texterkennungsmodell wird geladen... {percent}%',
    layoutDetection: 'Textbereiche werden erkannt... {percent}%',
    textRecognition: 'Texterkennung ({current}/{total} Bereiche)',
    readingOrder: 'Lesereihenfolge wird verarbeitet...',
    generatingOutput: 'Ausgabe wird erstellt...',
    processing: 'Verarbeitung: {current}/{total} Dateien',
    done: 'Fertig',
  },
  results: {
    copy: 'Kopieren',
    download: 'Herunterladen',
    downloadAll: 'Gesamten Text herunterladen',
    copied: 'Kopiert!',
    noResult: 'Keine Ergebnisse',
    regions: '{count} Bereiche',
    processingTime: 'Verarbeitungszeit: {time}s',
  },
  history: {
    title: 'Verlauf',
    clearCache: 'Cache leeren',
    confirmClear: 'Gesamten Verarbeitungsverlauf löschen?',
    yes: 'Löschen',
    cancel: 'Abbrechen',
    empty: 'Kein Verarbeitungsverlauf',
    noText: 'Kein Text',
  },
  settings: {
    title: 'Einstellungen',
    modelCache: 'Modell-Cache',
    clearModelCache: 'Modell-Cache leeren',
    confirmClearModel:
      'Zwischengespeicherte ONNX-Modelle löschen? Sie werden beim nächsten Start erneut heruntergeladen.',
    clearDone: 'Gelöscht',
  },
  info: {
    privacyNotice:
      'Diese App läuft vollständig in Ihrem Webbrowser. Ausgewählte Bilddateien und OCR-Ergebnisse werden nicht an externe Server gesendet.',
    author:
      'Erstellt von Yuta Hashimoto (Nationalmuseum für Japanische Geschichte / Nationalbibliothek)',
    githubLink: 'GitHub-Repository',
  },
  language: {
    switchTo: 'Deutsch',
  },
  error: {
    generic: 'Ein Fehler ist aufgetreten',
    modelLoad: 'Modell konnte nicht geladen werden',
    ocr: 'Fehler bei der OCR-Verarbeitung',
    fileLoad: 'Datei konnte nicht geladen werden',
    clipboardNotSupported: 'Zugriff auf Zwischenablage nicht möglich',
  },
  tooltip: {
    dragPageReorder: 'Zum Neuordnen ziehen',
  },
}
