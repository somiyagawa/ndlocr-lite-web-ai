import type { Translations } from './ja'

export const ar: Translations = {
  app: {
    title: 'NDL(Kotenseki)OCR-lite Web',
    subtitle: 'أداة التعرف الضوئي على النصوص اليابانية في المتصفح',
  },
  upload: {
    dropzone: 'اسحب الملفات وأفلتها هنا، أو انقر للتحديد',
    directoryButton: 'اختر مجلداً',
    acceptedFormats: 'الصيغ المدعومة: JPG, PNG, PDF',
    startButton: 'بدء OCR',
    clearButton: 'مسح',
  },
  progress: {
    initializing: 'جارٍ التهيئة...',
    loadingLayoutModel: 'جارٍ تحميل نموذج اكتشاف التخطيط... {percent}%',
    loadingRecognitionModel: 'جارٍ تحميل نموذج التعرف على النص... {percent}%',
    layoutDetection: 'جارٍ اكتشاف مناطق النص... {percent}%',
    textRecognition: 'جارٍ التعرف على النص ({current}/{total} منطقة)',
    readingOrder: 'جارٍ معالجة ترتيب القراءة...',
    generatingOutput: 'جارٍ إنشاء المخرجات...',
    processing: 'المعالجة: {current}/{total} ملفات',
    done: 'تم',
  },
  results: {
    copy: 'نسخ',
    download: 'تنزيل',
    downloadAll: 'تنزيل كل النص',
    copied: 'تم النسخ!',
    noResult: 'لا توجد نتائج',
    regions: '{count} منطقة',
    processingTime: 'وقت المعالجة: {time}ث',
  },
  history: {
    title: 'السجل',
    clearCache: 'مسح الذاكرة المؤقتة',
    confirmClear: 'هل تريد حذف كل سجل المعالجة؟',
    yes: 'حذف',
    cancel: 'إلغاء',
    empty: 'لا يوجد سجل معالجة',
    noText: 'لا يوجد نص',
  },
  settings: {
    title: 'الإعدادات',
    modelCache: 'ذاكرة النماذج المؤقتة',
    clearModelCache: 'مسح ذاكرة النماذج المؤقتة',
    confirmClearModel:
      'هل تريد حذف نماذج ONNX المخزنة مؤقتاً؟ سيتم تنزيلها مرة أخرى عند التشغيل التالي.',
    clearDone: 'تم المسح',
  },
  info: {
    privacyNotice:
      'يعمل هذا التطبيق بالكامل في متصفحك. لا يتم إرسال ملفات الصور المحددة ونتائج OCR إلى أي خادم خارجي.',
    author:
      'من إعداد يوتا هاشيموتو (المتحف الوطني للتاريخ الياباني / مكتبة البرلمان الوطني)',
    githubLink: 'مستودع GitHub',
  },
  language: {
    switchTo: 'العربية',
  },
  error: {
    generic: 'حدث خطأ',
    modelLoad: 'فشل تحميل النموذج',
    ocr: 'خطأ أثناء معالجة OCR',
    fileLoad: 'فشل تحميل الملف',
    clipboardNotSupported: 'لا يمكن الوصول إلى الحافظة',
  },
  tooltip: {
    dragPageReorder: 'اسحب لإعادة الترتيب',
  },
}
