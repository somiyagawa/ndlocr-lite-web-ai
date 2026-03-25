import type { Translations } from './ja'

export const el: Translations = {
  app: {
    title: 'NDLOCR-Lite Web',
    subtitle: 'Εργαλείο ιαπωνικής OCR στον περιηγητή',
  },
  upload: {
    dropzone: 'Σύρετε αρχεία εδώ ή κάντε κλικ για επιλογή',
    directoryButton: 'Επιλογή φακέλου',
    acceptedFormats: 'Υποστηριζόμενες μορφές: JPG, PNG, PDF',
    startButton: 'Έναρξη OCR',
    clearButton: 'Εκκαθάριση',
  },
  progress: {
    initializing: 'Αρχικοποίηση...',
    loadingLayoutModel: 'Φόρτωση μοντέλου ανίχνευσης διάταξης... {percent}%',
    loadingRecognitionModel: 'Φόρτωση μοντέλου αναγνώρισης κειμένου... {percent}%',
    layoutDetection: 'Ανίχνευση περιοχών κειμένου... {percent}%',
    textRecognition: 'Αναγνώριση κειμένου ({current}/{total} περιοχές)',
    readingOrder: 'Επεξεργασία σειράς ανάγνωσης...',
    generatingOutput: 'Δημιουργία εξόδου...',
    processing: 'Επεξεργασία: {current}/{total} αρχεία',
    done: 'Ολοκληρώθηκε',
  },
  results: {
    copy: 'Αντιγραφή',
    download: 'Λήψη',
    downloadAll: 'Λήψη όλου του κειμένου',
    copied: 'Αντιγράφηκε!',
    noResult: 'Κανένα αποτέλεσμα',
    regions: '{count} περιοχές',
    processingTime: 'Χρόνος επεξεργασίας: {time}δ',
  },
  history: {
    title: 'Ιστορικό',
    clearCache: 'Εκκαθάριση κρυφής μνήμης',
    confirmClear: 'Διαγραφή όλου του ιστορικού επεξεργασίας;',
    yes: 'Διαγραφή',
    cancel: 'Ακύρωση',
    empty: 'Κανένα ιστορικό επεξεργασίας',
    noText: 'Κανένα κείμενο',
  },
  settings: {
    title: 'Ρυθμίσεις',
    modelCache: 'Κρυφή μνήμη μοντέλων',
    clearModelCache: 'Εκκαθάριση κρυφής μνήμης μοντέλων',
    confirmClearModel:
      'Διαγραφή αποθηκευμένων μοντέλων ONNX; Θα ληφθούν ξανά κατά την επόμενη εκκίνηση.',
    clearDone: 'Εκκαθαρίστηκε',
  },
  info: {
    privacyNotice:
      'Αυτή η εφαρμογή εκτελείται εξ ολοκλήρου στον περιηγητή σας. Τα αρχεία εικόνων και τα αποτελέσματα OCR δεν αποστέλλονται σε κανέναν εξωτερικό διακομιστή.',
    author:
      'Δημιουργός: Yuta Hashimoto (Εθνικό Μουσείο Ιαπωνικής Ιστορίας / Εθνική Κοινοβουλευτική Βιβλιοθήκη)',
    githubLink: 'Αποθετήριο GitHub',
  },
  language: {
    switchTo: '日本語',
  },
  error: {
    generic: 'Παρουσιάστηκε σφάλμα',
    modelLoad: 'Αποτυχία φόρτωσης μοντέλου',
    ocr: 'Σφάλμα κατά την επεξεργασία OCR',
    fileLoad: 'Αποτυχία φόρτωσης αρχείου',
    clipboardNotSupported: 'Δεν είναι δυνατή η πρόσβαση στο πρόχειρο',
  },
  tooltip: {
    dragPageReorder: 'Σύρετε για αναδιάταξη',
  },
}
