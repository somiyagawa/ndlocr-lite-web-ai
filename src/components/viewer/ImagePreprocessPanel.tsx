import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { Language } from '../../i18n'
import { L } from '../../i18n'

export interface PreprocessOptions {
  brightness: number
  contrast: number
  sharpness: number
  grayscale: boolean
  binarize: boolean
  binarizeThreshold: number
  denoise: boolean
  invertColors: boolean
  rotation: number
}

export const DEFAULT_PREPROCESS_OPTIONS: PreprocessOptions = {
  brightness: 0,
  contrast: 0,
  sharpness: 0,
  grayscale: false,
  binarize: false,
  binarizeThreshold: 128,
  denoise: false,
  invertColors: false,
  rotation: 0,
}

interface PerspectiveCorners {
  topLeft: { x: number; y: number }
  topRight: { x: number; y: number }
  bottomRight: { x: number; y: number }
  bottomLeft: { x: number; y: number }
}

interface ImagePreprocessPanelProps {
  lang: Language
  imageDataUrl: string
  onProcessed: (dataUrl: string) => void
  onSplitPages?: (pages: string[]) => void
  onReset: () => void
  /** Side panel mode: always open, no accordion header */
  sidePanel?: boolean
  /** Total number of images available for batch processing */
  totalImages?: number
  /** Callback to apply current settings to ALL images */
  onApplyAll?: (options: PreprocessOptions) => void
  /** Perspective crop state lifted to parent (displayed on ImageViewer) */
  perspectiveActive?: boolean
  onPerspectiveToggle?: () => void
  perspectiveCorners?: PerspectiveCorners | null
  onPerspectiveCornersChange?: (corners: PerspectiveCorners) => void
}

type TranslationStrings = {
  imagePreprocessing: string
  brightness: string
  contrast: string
  sharpness: string
  grayscale: string
  blackWhite: string
  binarizeThreshold: string
  denoise: string
  invertColors: string
  dewarp: string
  dewarpTip: string
  deskewAuto: string
  autoCrop: string
  perspectiveCrop: string
  perspectiveCropTip: string
  perspectiveDetect: string
  perspectiveApply: string
  splitCenter: string
  splitAuto: string
  splitCenterTip: string
  splitAutoTip: string
  rotation: string
  apply: string
  applyAll: string
  reset: string
  degrees: string
  processing: string
}

const t: Record<Language, TranslationStrings> = {
  ja: {
    imagePreprocessing: '画像補正',
    brightness: '明度',
    contrast: 'コントラスト',
    sharpness: 'シャープネス',
    grayscale: 'グレースケール',
    blackWhite: '白黒（二値化）',
    binarizeThreshold: '二値化閾値',
    denoise: 'ノイズ除去',
    invertColors: '反転',
    dewarp: '湾曲補正',
    dewarpTip: '本の見開きページの湾曲を平らに補正します',
    deskewAuto: '自動傾き補正',
    autoCrop: '自動裁ち落とし',
    perspectiveCrop: '四隅指定切り出し',
    perspectiveCropTip: '画像内の文書の四隅をドラッグして指定し、台形補正して切り出します',
    perspectiveDetect: '自動検出',
    perspectiveApply: '切り出し実行',
    splitCenter: 'センター分割',
    splitAuto: '自動分割',
    splitCenterTip: '見開き画像を中央で左右2ページに分割します',
    splitAutoTip: '綴じ目（空白の多い縦線）を自動検出して左右2ページに分割します',
    rotation: '回転',
    apply: '適用',
    applyAll: '全画像に適用',
    reset: 'リセット',
    degrees: '度',
    processing: '処理中...',
  },
  en: {
    imagePreprocessing: 'Image Correction',
    brightness: 'Brightness',
    contrast: 'Contrast',
    sharpness: 'Sharpness',
    grayscale: 'Grayscale',
    blackWhite: 'Black & White',
    binarizeThreshold: 'Binarize Threshold',
    denoise: 'Denoise',
    invertColors: 'Invert Colors',
    dewarp: 'Dewarp',
    dewarpTip: 'Flatten curved book page spread',
    deskewAuto: 'Deskew (auto)',
    autoCrop: 'Auto Crop',
    perspectiveCrop: 'Perspective Crop',
    perspectiveCropTip: 'Drag the 4 corners to select a document area, then apply perspective correction',
    perspectiveDetect: 'Auto Detect',
    perspectiveApply: 'Apply Crop',
    splitCenter: 'Split Center',
    splitAuto: 'Split Auto',
    splitCenterTip: 'Split a double-page scan into two pages at the exact center',
    splitAutoTip: 'Auto-detect the binding gap (whitespace column) and split into two pages',
    rotation: 'Rotation',
    apply: 'Apply',
    applyAll: 'Apply to All',
    reset: 'Reset',
    degrees: '°',
    processing: 'Processing...',
  },
  'zh-CN': {
    imagePreprocessing: '图像校正',
    brightness: '亮度',
    contrast: '对比度',
    sharpness: '锐度',
    grayscale: '灰度',
    blackWhite: '黑白二值化',
    binarizeThreshold: '二值化阈值',
    denoise: '降噪',
    invertColors: '反转颜色',
    dewarp: '弯曲校正',
    dewarpTip: '将弯曲的书页展平',
    deskewAuto: '自动去斜',
    autoCrop: '自动裁剪',
    perspectiveCrop: '四角裁剪',
    perspectiveCropTip: '拖动四个角选择文档区域，然后进行透视校正',
    perspectiveDetect: '自动检测',
    perspectiveApply: '执行裁剪',
    splitCenter: '中心分割',
    splitAuto: '自动分割',
    splitCenterTip: '将跨页扫描图像从正中央分割为左右两页',
    splitAutoTip: '自动检测装订缝（空白最多的纵列）并分割为左右两页',
    rotation: '旋转',
    apply: '应用',
    applyAll: '应用到全部',
    reset: '重置',
    degrees: '°',
    processing: '处理中...',
  },
  'zh-TW': {
    imagePreprocessing: '圖像校正',
    brightness: '亮度',
    contrast: '對比度',
    sharpness: '銳度',
    grayscale: '灰度',
    blackWhite: '黑白二值化',
    binarizeThreshold: '二值化閾值',
    denoise: '降噪',
    invertColors: '反轉顏色',
    dewarp: '彎曲校正',
    dewarpTip: '將彎曲的書頁展平',
    deskewAuto: '自動去斜',
    autoCrop: '自動裁剪',
    perspectiveCrop: '四角裁剪',
    perspectiveCropTip: '拖動四個角選擇文件區域，然後進行透視校正',
    perspectiveDetect: '自動偵測',
    perspectiveApply: '執行裁剪',
    splitCenter: '中心分割',
    splitAuto: '自動分割',
    splitCenterTip: '將跨頁掃描圖像從正中央分割為左右兩頁',
    splitAutoTip: '自動偵測裝訂縫（空白最多的縱列）並分割為左右兩頁',
    rotation: '旋轉',
    apply: '應用',
    applyAll: '套用到全部',
    reset: '重置',
    degrees: '°',
    processing: '處理中...',
  },
  ko: {
    imagePreprocessing: '이미지 보정',
    brightness: '밝기',
    contrast: '명암비',
    sharpness: '선명도',
    grayscale: '그레이스케일',
    blackWhite: '검정색 및 흰색',
    binarizeThreshold: '이진화 임계값',
    denoise: '노이즈 제거',
    invertColors: '색 반전',
    dewarp: '곡면 보정',
    dewarpTip: '구부러진 책 페이지를 평평하게 보정합니다',
    deskewAuto: '자동 기울기 보정',
    autoCrop: '자동 자르기',
    perspectiveCrop: '사각 자르기',
    perspectiveCropTip: '네 모서리를 드래그하여 문서 영역을 선택한 후 원근 보정을 적용합니다',
    perspectiveDetect: '자동 감지',
    perspectiveApply: '자르기 실행',
    splitCenter: '중심 분할',
    splitAuto: '자동 분할',
    splitCenterTip: '양면 스캔 이미지를 정중앙에서 좌우 2페이지로 분할합니다',
    splitAutoTip: '제본 틈(공백이 가장 많은 세로줄)을 자동 감지하여 좌우 2페이지로 분할합니다',
    rotation: '회전',
    apply: '적용',
    applyAll: '전체에 적용',
    reset: '재설정',
    degrees: '°',
    processing: '처리 중...',
  },
  la: {
    imagePreprocessing: 'Correctio imaginis',
    brightness: 'Claritas',
    contrast: 'Oppositio',
    sharpness: 'Acuitas',
    grayscale: 'Scala grisea',
    blackWhite: 'Nigrum et album',
    binarizeThreshold: 'Limen binarizationis',
    denoise: 'Strepitum removere',
    invertColors: 'Colores invertere',
    dewarp: 'Complanare',
    dewarpTip: 'Paginam libri curvam complanare',
    deskewAuto: 'Automatice corrigere',
    autoCrop: 'Automatice secare',
    perspectiveCrop: 'Quadrangulare secare',
    perspectiveCropTip: 'Angulos quattuor trahe ut documentum eligas, deinde perspectivam corrige',
    perspectiveDetect: 'Automatice detegere',
    perspectiveApply: 'Sectionem applicare',
    splitCenter: 'In medio dividere',
    splitAuto: 'Automatice dividere',
    splitCenterTip: 'Scansionem gemini folii in medio dividite',
    splitAutoTip: 'Rimam ligaturae automatice invenit et dividit',
    rotation: 'Rotatio',
    apply: 'Applicare',
    applyAll: 'Omnibus applicare',
    reset: 'Restituere',
    degrees: '°',
    processing: 'Processus...',
  },
  eo: {
    imagePreprocessing: 'Bild-korektado',
    brightness: 'Brileco',
    contrast: 'Kontrasto',
    sharpness: 'Akuteco',
    grayscale: 'Grizskalo',
    blackWhite: 'Nigra kaj blanka',
    binarizeThreshold: 'Sojlo de binarigo',
    denoise: 'Forigi bruon',
    invertColors: 'Inversigi kolorojn',
    dewarp: 'Platigi',
    dewarpTip: 'Platigi kurban libran paĝon',
    deskewAuto: 'Aŭtomate korekti',
    autoCrop: 'Aŭtomate tondi',
    perspectiveCrop: 'Kvarlanka tondo',
    perspectiveCropTip: 'Trenu la kvar angulojn por elekti dokumentareon, poste apliku perspektivan korekton',
    perspectiveDetect: 'Aŭtomate detekti',
    perspectiveApply: 'Apliki tondon',
    splitCenter: 'Dividi centre',
    splitAuto: 'Aŭtomate dividi',
    splitCenterTip: 'Dividu duel-paĝan skanaĵon en la centro en du paĝojn',
    splitAutoTip: 'Aŭtomate detektu la bindron-fendron kaj dividu en du paĝojn',
    rotation: 'Rotacio',
    apply: 'Apliki',
    applyAll: 'Apliki al ĉiuj',
    reset: 'Restarigi',
    degrees: '°',
    processing: 'Prilaboras...',
  },
  es: {
    imagePreprocessing: 'Corrección de imagen',
    brightness: 'Brillo',
    contrast: 'Contraste',
    sharpness: 'Nitidez',
    grayscale: 'Escala de grises',
    blackWhite: 'Blanco y negro',
    binarizeThreshold: 'Umbral',
    denoise: 'Reducir ruido',
    invertColors: 'Invertir colores',
    dewarp: 'Aplanar',
    dewarpTip: 'Aplanar página curva de libro',
    deskewAuto: 'Corrección automática',
    autoCrop: 'Recorte automático',
    perspectiveCrop: 'Recorte perspectiva',
    perspectiveCropTip: 'Arrastre las 4 esquinas para seleccionar el documento y aplique corrección de perspectiva',
    perspectiveDetect: 'Detección automática',
    perspectiveApply: 'Aplicar recorte',
    splitCenter: 'Dividir al centro',
    splitAuto: 'División automática',
    splitCenterTip: 'Divide una imagen de dos páginas por el centro en dos páginas',
    splitAutoTip: 'Detecta automáticamente el lomo (línea vertical con espacio) y divide en dos páginas',
    rotation: 'Rotación',
    apply: 'Aplicar',
    applyAll: 'Aplicar a todo',
    reset: 'Restablecer',
    degrees: '°',
    processing: 'Procesando...',
  },
  de: {
    imagePreprocessing: 'Bildkorrektur',
    brightness: 'Helligkeit',
    contrast: 'Kontrast',
    sharpness: 'Schärfe',
    grayscale: 'Graustufen',
    blackWhite: 'Schwarz-Weiß',
    binarizeThreshold: 'Schwellenwert',
    denoise: 'Rauschunterdrückung',
    invertColors: 'Farben invertieren',
    dewarp: 'Entzerren',
    dewarpTip: 'Gewölbte Buchseite begradigen',
    deskewAuto: 'Automatische Entzerrung',
    autoCrop: 'Automatischer Zuschnitt',
    perspectiveCrop: 'Perspektivischer Zuschnitt',
    perspectiveCropTip: 'Ziehen Sie die 4 Ecken, um den Dokumentbereich auszuwählen und die Perspektive zu korrigieren',
    perspectiveDetect: 'Automatisch erkennen',
    perspectiveApply: 'Zuschnitt anwenden',
    splitCenter: 'Mittig teilen',
    splitAuto: 'Automatisch teilen',
    splitCenterTip: 'Teilt ein zweiseitiges Scan-Bild in der Mitte in zwei Seiten',
    splitAutoTip: 'Erkennt automatisch den Bundsteg (Whitespace-Spalte) und teilt in zwei Seiten',
    rotation: 'Drehung',
    apply: 'Anwenden',
    applyAll: 'Auf alle anwenden',
    reset: 'Zurücksetzen',
    degrees: '°',
    processing: 'Verarbeitung...',
  },
  ar: {
    imagePreprocessing: 'تصحيح الصور',
    brightness: 'السطوع',
    contrast: 'التباين',
    sharpness: 'الحدة',
    grayscale: 'تدرج الرمادي',
    blackWhite: 'أبيض وأسود',
    binarizeThreshold: 'العتبة',
    denoise: 'إزالة الضوضاء',
    invertColors: 'عكس الألوان',
    dewarp: 'تسطيح',
    dewarpTip: 'تسطيح صفحة الكتاب المنحنية',
    deskewAuto: 'تصحيح تلقائي',
    autoCrop: 'قص تلقائي',
    perspectiveCrop: 'قص بأربع زوايا',
    perspectiveCropTip: 'اسحب الزوايا الأربع لتحديد منطقة المستند ثم طبق تصحيح المنظور',
    perspectiveDetect: 'كشف تلقائي',
    perspectiveApply: 'تطبيق القص',
    splitCenter: 'تقسيم من المنتصف',
    splitAuto: 'تقسيم تلقائي',
    splitCenterTip: 'تقسيم صورة مسح ثنائية الصفحات من المنتصف إلى صفحتين',
    splitAutoTip: 'التعرف تلقائياً على فجوة الدباسة (عمود المسافات البيضاء) والتقسيم إلى صفحتين',
    rotation: 'تدوير',
    apply: 'تطبيق',
    applyAll: 'تطبيق على الكل',
    reset: 'إعادة تعيين',
    degrees: '°',
    processing: 'جارٍ المعالجة...',
  },
  hi: {
    imagePreprocessing: 'छवि संशोधन',
    brightness: 'चमक',
    contrast: 'कंट्रास्ट',
    sharpness: 'तीक्ष्णता',
    grayscale: 'ग्रेस्केल',
    blackWhite: 'श्वेत-श्याम',
    binarizeThreshold: 'सीमा',
    denoise: 'शोर कम करें',
    invertColors: 'रंग उलटें',
    dewarp: 'समतलीकरण',
    dewarpTip: 'मुड़े हुए पुस्तक पृष्ठ को सपाट करें',
    deskewAuto: 'स्वचालित सुधार',
    autoCrop: 'स्वचालित काट-छाँट',
    perspectiveCrop: 'चार-कोना कतरन',
    perspectiveCropTip: 'दस्तावेज़ क्षेत्र चुनने के लिए 4 कोनों को खींचें, फिर परिप्रेक्ष्य सुधार लागू करें',
    perspectiveDetect: 'स्वचालित पहचान',
    perspectiveApply: 'कतरन लागू करें',
    splitCenter: 'केंद्र से विभाजन',
    splitAuto: 'स्वचालित विभाजन',
    splitCenterTip: 'दो-पृष्ठ स्कैन छवि को केंद्र में दो पृष्ठों में विभाजित करें',
    splitAutoTip: 'बाइंडिंग गैप (व्हाइटस्पेस कॉलम) को स्वचालित रूप से पहचानें और दो पृष्ठों में विभाजित करें',
    rotation: 'घुमाव',
    apply: 'लागू करें',
    applyAll: 'सभी पर लागू करें',
    reset: 'रीसेट',
    degrees: '°',
    processing: 'संसाधन...',
  },
  ru: {
    imagePreprocessing: 'Коррекция изображения',
    brightness: 'Яркость',
    contrast: 'Контрастность',
    sharpness: 'Резкость',
    grayscale: 'Оттенки серого',
    blackWhite: 'Чёрно-белая',
    binarizeThreshold: 'Пороговое значение',
    denoise: 'Удаление шума',
    invertColors: 'Инверсия цветов',
    dewarp: 'Выпрямить',
    dewarpTip: 'Выпрямить изогнутую страницу книги',
    deskewAuto: 'Автоматическое выравнивание',
    autoCrop: 'Автоматическая обрезка',
    perspectiveCrop: 'Обрезка по 4 углам',
    perspectiveCropTip: 'Перетащите 4 угла для выбора области документа, затем примените коррекцию перспективы',
    perspectiveDetect: 'Автоопределение',
    perspectiveApply: 'Применить обрезку',
    splitCenter: 'Разделение по центру',
    splitAuto: 'Автоматическое разделение',
    splitCenterTip: 'Разделите отсканированное двухстраничное изображение по центру на две страницы',
    splitAutoTip: 'Автоматически обнаружить переплет (столбец пустого пространства) и разделить на две страницы',
    rotation: 'Поворот',
    apply: 'Применить',
    applyAll: 'Применить ко всем',
    reset: 'Сброс',
    degrees: '°',
    processing: 'Обработка...',
  },
  el: {
    imagePreprocessing: 'Διόρθωση εικόνας',
    brightness: 'Φωτεινότητα',
    contrast: 'Αντίθεση',
    sharpness: 'Ευκρίνεια',
    grayscale: 'Κλίμακα γκρι',
    blackWhite: 'Μαύρο και λευκό',
    binarizeThreshold: 'Όριο δυαδοποίησης',
    denoise: 'Αφαίρεση θορύβου',
    invertColors: 'Αντιστροφή χρωμάτων',
    dewarp: 'Ισιώνω',
    dewarpTip: 'Ισιώστε τη λυγισμένη σελίδα βιβλίου',
    deskewAuto: 'Αυτόματη διόρθωση κλίσης',
    autoCrop: 'Αυτόματη αποκοπή',
    perspectiveCrop: 'Αποκοπή 4 γωνιών',
    perspectiveCropTip: 'Σύρετε τις 4 γωνίες για να επιλέξετε την περιοχή εγγράφου και εφαρμόστε διόρθωση προοπτικής',
    perspectiveDetect: 'Αυτόματη ανίχνευση',
    perspectiveApply: 'Εφαρμογή αποκοπής',
    splitCenter: 'Διαίρεση κέντρου',
    splitAuto: 'Αυτόματη διαίρεση',
    splitCenterTip: 'Διαιρέστε μια διπλής σελίδας σάρωση εικόνα στο κέντρο σε δύο σελίδες',
    splitAutoTip: 'Αυτόματη ανίχνευση του κενού κόλλησης (στήλη κενού χώρου) και διαίρεση σε δύο σελίδες',
    rotation: 'Περιστροφή',
    apply: 'Εφαρμογή',
    applyAll: 'Εφαρμογή σε όλα',
    reset: 'Επαναφορά',
    degrees: '°',
    processing: 'Επεξεργασία...',
  },
  syc: {
    imagePreprocessing: 'ܬܘܪܨ ܨܘܪ̈ܐ',
    brightness: 'ܢܘܗܪܐ',
    contrast: 'ܦܪܡܐ',
    sharpness: 'ܕܩܝܩܘܬܐ',
    grayscale: 'ܓܘܪܦܐ ܕܪܡܐ',
    blackWhite: 'ܫܚܘܪܐ ܘܦܢܘܪܐ',
    binarizeThreshold: 'ܚܕܓܐ ܕܕܪܪܓ ܬܘܪܠܢܐ',
    denoise: 'ܡܦܩ ܦܪܝܫܐ',
    invertColors: 'ܘܬܪܐ ܓܢܘܢܐ',
    dewarp: 'ܦܫܘܛ',
    dewarpTip: 'ܦܫܘܛ ܕ̈ܦ̈ܐ ܕ̈ܟ̈ܬ̈ܒ̈ ܡ̈ܥ̈ܩ̈ܡ̈ܐ',
    deskewAuto: 'ܬܘܦܪܐ ܓܢܒܐ',
    autoCrop: 'ܩܛܝܥܐ ܓܢܒܐ',
    perspectiveCrop: 'ܩܛܝܥ ܒܐܪ̈ܒܥ ܙ̈ܘ̈ܝ̈ܬ̈ܐ',
    perspectiveCropTip: 'ܓܪ ܐ̈ܪ̈ܒ̈ܥ ܙ̈ܘ̈ܝ̈ܬ̈ܐ ܠ̈ܓ̈ܒ̈ܝ̈ ܐ̈ܬ̈ܪ ܕ̈ܟ̈ܬ̈ܒ̈ܐ',
    perspectiveDetect: 'ܓ̇ܠ̈ܝ̈ ܓ̈ܢ̈ܒ̈ܐ',
    perspectiveApply: 'ܐ̈ܦ̈ܠ̈ܘ ܩ̈ܛ̈ܝ̈ܥ̈ܐ',
    splitCenter: 'ܦܠܓܐ ܒܡܨܥܬܐ',
    splitAuto: 'ܦܠܓܐ ܓܢܒܐ',
    splitCenterTip: 'ܦܠܓ ܓܘܗܡܐ ܕܕܦܐ ܬܪܝܢ ܡܣܩ ܒܡܨܥܬܐ ܠܬܪܝܢ ܕܦܐ',
    splitAutoTip: 'ܐܓܕ ܓܢܒܐ ܦܪܡܐ ܕܡܥܡܕܐ ܘܦܠܓ ܠܬܪܝܢ ܕܦܐ',
    rotation: 'ܓܪܓܦܐ',
    apply: 'ܐܦܠܘ',
    applyAll: 'ܐܦܠܘ ܠܟܠ',
    reset: 'ܚܙܘܪ',
    degrees: '°',
    processing: 'ܦ̈ܘܠܥܢܐ...',
  },
  cop: {
    imagePreprocessing: 'ⲡⲓⲥⲟⲩⲧⲉⲛ ⲛⲧⲉ ⲑⲓⲕⲱⲛ',
    brightness: 'ⲡⲟⲩⲟⲓⲛⲓ',
    contrast: 'ⲡⲫⲱⲣϫ',
    sharpness: 'ⲡⲓⲧⲁⲓⲟ',
    grayscale: 'ⲡⲓⲕⲉⲣⲙⲉ',
    blackWhite: 'ⲕⲉⲙⲓ ⲛⲉⲙ ⲟⲩⲟⲃϣ',
    binarizeThreshold: 'ⲡⲓⲣⲟ',
    denoise: 'ⲃⲱⲗ ⲉⲃⲟⲗ ⲙⲡⲓⲑⲣⲱⲟⲩ',
    invertColors: 'ⲫⲟⲛϩ ⲛⲛⲓⲱⲛ',
    dewarp: 'ⲁⲣⲓⲥⲟⲩⲧⲉⲛ',
    dewarpTip: 'ⲁⲣⲓⲥⲟⲩⲧⲉⲛ ⲛⲧⲉ ⲡⲓϫⲱⲙ ⲉⲧⲕⲩⲗϫ',
    deskewAuto: 'ⲥⲟⲩⲧⲉⲛ',
    autoCrop: 'ϣⲁⲧ',
    perspectiveCrop: 'ϣⲁⲧ ⲛⲇ̅ ⲛⲕⲱⲛⲓⲁ',
    perspectiveCropTip: 'ⲥⲱⲕ ⲛⲛⲓⲕⲱⲛⲓⲁ ⲛⲇ̅ ⲉⲑⲃⲉ ⲡⲓϫⲱⲙ',
    perspectiveDetect: 'ϫⲓⲛⲓ ⲛⲁⲩⲧⲟ',
    perspectiveApply: 'ⲁⲓⲣⲓ ⲡⲓϣⲁⲧ',
    splitCenter: 'ⲫⲱϣ ϧⲉⲛ ⲑⲙⲏⲧⲓ',
    splitAuto: 'ⲫⲱϣ ⲛⲁⲩⲧⲟ',
    splitCenterTip: 'ⲫⲱϣ ⲑⲓⲕⲱⲛ ϧⲉⲛ ⲑⲙⲏⲧⲓ',
    splitAutoTip: 'ⲫⲱϣ ⲑⲓⲕⲱⲛ ⲛⲁⲩⲧⲟ',
    rotation: 'ⲡⲓⲕⲱⲗ',
    apply: 'ⲁⲓⲣⲓ',
    applyAll: 'ⲁⲓⲣⲓ ⲉⲟⲩⲟⲛ ⲛⲓⲃⲉⲛ',
    reset: 'ⲧⲁⲥⲑⲟ',
    degrees: '°',
    processing: 'ⲥⲉⲉⲣϩⲱⲃ...',
  },
  sa: {
    imagePreprocessing: 'चित्रसंशोधनम्',
    brightness: 'दीप्तिः',
    contrast: 'वैषम्यम्',
    sharpness: 'तीक्ष्णता',
    grayscale: 'धूसरवर्णः',
    blackWhite: 'कृष्णश्वेतम्',
    binarizeThreshold: 'द्विमानसीमा',
    denoise: 'शब्दापनयनम्',
    invertColors: 'वर्णव्युत्क्रमणम्',
    dewarp: 'समतलीकरणम्',
    dewarpTip: 'वक्रं पुस्तकपृष्ठं समतलं कुरुत',
    deskewAuto: 'स्वतः ऋजूकरणम्',
    autoCrop: 'स्वतः कर्तनम्',
    perspectiveCrop: 'चतुष्कोण कर्तनम्',
    perspectiveCropTip: 'चत्वारः कोणाः कर्षयित्वा प्रलेखक्षेत्रं चिन्वन्तु',
    perspectiveDetect: 'स्वतः अन्वेषणम्',
    perspectiveApply: 'कर्तनम् आरोपयतु',
    splitCenter: 'मध्ये विभागः',
    splitAuto: 'स्वतः विभागः',
    splitCenterTip: 'चित्रं मध्ये विभजतु',
    splitAutoTip: 'स्वतः चित्रं विभजतु',
    rotation: 'भ्रमणम्',
    apply: 'आरोपयतु',
    applyAll: 'सर्वेषु आरोपयतु',
    reset: 'पुनःस्थापयतु',
    degrees: '°',
    processing: 'संस्क्रियते...',
  },
}

// SVG icons
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 6 8 10 12 6"></polyline>
  </svg>
)

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 10 8 6 4 10"></polyline>
  </svg>
)

export function ImagePreprocessPanel({
  lang,
  imageDataUrl,
  onProcessed,
  onSplitPages,
  onReset,
  sidePanel = false,
  totalImages,
  onApplyAll,
  perspectiveActive,
  onPerspectiveToggle,
  perspectiveCorners,
  onPerspectiveCornersChange,
}: ImagePreprocessPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<PreprocessOptions>(DEFAULT_PREPROCESS_OPTIONS)
  const [isProcessing, setIsProcessing] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const strings = t[lang]

  // ── Perspective crop: use lifted state if available, otherwise local fallback ──
  const showPerspective = perspectiveActive ?? false

  // Debounced preview update
  const updatePreview = useCallback((newOptions: PreprocessOptions) => {
    setIsProcessing(true)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      applyPreprocess(imageDataUrl, newOptions)
        .then((result) => {
          onProcessed(result)
          setIsProcessing(false)
        })
        .catch((err) => {
          console.error('Preprocessing error:', err)
          setIsProcessing(false)
        })
    }, 300)
  }, [imageDataUrl, onProcessed])

  const handleSliderChange = useCallback(
    (key: keyof PreprocessOptions, value: number) => {
      const newOptions = { ...options, [key]: value }
      setOptions(newOptions)
      updatePreview(newOptions)
    },
    [options, updatePreview]
  )

  const handleToggleChange = useCallback(
    (key: keyof PreprocessOptions) => {
      const newOptions = { ...options, [key]: !options[key] }
      setOptions(newOptions)
      updatePreview(newOptions)
    },
    [options, updatePreview]
  )

  const handleApply = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result = await applyPreprocess(imageDataUrl, options)
      onProcessed(result)
    } catch (err) {
      console.error('Apply preprocessing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, options, onProcessed])

  const handleDewarp = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result = await dewarpImage(imageDataUrl)
      onProcessed(result)
    } catch (err) {
      console.error('Dewarp error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, onProcessed])

  const handleReset = useCallback(() => {
    setOptions(DEFAULT_PREPROCESS_OPTIONS)
    onReset()
  }, [onReset])

  const handleDeskew = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result = await deskewImage(imageDataUrl)
      onProcessed(result)
    } catch (err) {
      console.error('Deskew error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, onProcessed])

  const handleAutoCrop = useCallback(async () => {
    setIsProcessing(true)
    try {
      const result = await autoCrop(imageDataUrl)
      onProcessed(result)
    } catch (err) {
      console.error('Auto crop error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, onProcessed])

  // ── Perspective crop handlers (using lifted state via props) ──
  const handlePerspectiveToggle = useCallback(() => {
    if (onPerspectiveToggle) {
      onPerspectiveToggle()
    }
  }, [onPerspectiveToggle])

  const handlePerspectiveDetect = useCallback(async () => {
    if (!onPerspectiveCornersChange) return
    setIsProcessing(true)
    try {
      const { detectDocument } = await import('../../utils/documentScanner')
      const corners = await detectDocument(imageDataUrl)
      onPerspectiveCornersChange(corners)
    } catch (err) {
      console.error('Perspective detect error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, onPerspectiveCornersChange])

  const handlePerspectiveApply = useCallback(async () => {
    if (!perspectiveCorners) return
    setIsProcessing(true)
    try {
      const { correctPerspective } = await import('../../utils/documentScanner')
      const result = await correctPerspective(imageDataUrl, perspectiveCorners)
      onProcessed(result)
      // Close perspective mode after applying
      if (onPerspectiveToggle) onPerspectiveToggle()
    } catch (err) {
      console.error('Perspective crop error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, perspectiveCorners, onProcessed, onPerspectiveToggle])

  const handleSplitCenter = useCallback(async () => {
    setIsProcessing(true)
    try {
      const pages = await splitPageCenter(imageDataUrl)
      if (onSplitPages) {
        onSplitPages(pages)
      }
    } catch (err) {
      console.error('Split center error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, onSplitPages])

  const handleSplitAuto = useCallback(async () => {
    setIsProcessing(true)
    try {
      const pages = await splitPageAuto(imageDataUrl)
      if (onSplitPages) {
        onSplitPages(pages)
      }
    } catch (err) {
      console.error('Split auto error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [imageDataUrl, onSplitPages])

  const sliderControlData = useMemo(() => [
    { key: 'brightness' as const, label: strings.brightness, min: -100, max: 100, step: 1 },
    { key: 'contrast' as const, label: strings.contrast, min: -100, max: 100, step: 1 },
    { key: 'sharpness' as const, label: strings.sharpness, min: 0, max: 100, step: 1 },
    ...(options.binarize ? [{ key: 'binarizeThreshold' as const, label: strings.binarizeThreshold, min: 0, max: 255, step: 1 }] : []),
    { key: 'rotation' as const, label: strings.rotation, min: -5, max: 5, step: 0.5 },
  ], [options.binarize, strings])

  const toggleControlData = useMemo(() => [
    { key: 'grayscale' as const, label: strings.grayscale },
    { key: 'binarize' as const, label: strings.blackWhite },
    { key: 'denoise' as const, label: strings.denoise },
    { key: 'invertColors' as const, label: strings.invertColors },
  ], [strings])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const showBody = sidePanel || isOpen

  return (
    <div className={`preprocess-panel${sidePanel ? ' preprocess-panel-side' : ''}${showBody ? ' open' : ''}`}>
      {!sidePanel && (
        <button
          className="preprocess-panel-header"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <span className="preprocess-panel-header-text">{strings.imagePreprocessing}</span>
          <span className="preprocess-panel-header-icon">
            {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </span>
        </button>
      )}
      {sidePanel && (
        <div className="preprocess-panel-side-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="14.5 2 18 6 7.5 16.5 4 17 4.5 13.5 14.5 2" />
          </svg>
          <span>{strings.imagePreprocessing}</span>
        </div>
      )}

      {showBody && (
        <div className="preprocess-panel-body">
          {/* Slider Controls */}
          <div className="preprocess-controls">
            <label className="preprocess-controls-group-label">
              {L(lang, { ja: 'スライダー', en: 'Adjustments', 'zh-CN': '调整', 'zh-TW': '調整', ko: '조정', la: 'Coagulationes', eo: 'Ĝustigoj' })}
            </label>
            {sliderControlData.map(({ key, label, min, max, step }) => (
              <div key={key} className="preprocess-slider">
                <label htmlFor={`slider-${key}`}>
                  <span>{label}</span>
                  <span className="preprocess-slider-value">{options[key]}{key === 'rotation' ? strings.degrees : ''}</span>
                </label>
                <input
                  id={`slider-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={options[key]}
                  onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                  disabled={isProcessing}
                />
              </div>
            ))}
          </div>

          {/* Toggle Controls */}
          <div className="preprocess-toggles">
            {toggleControlData.map(({ key, label }) => (
              <label key={key} className="preprocess-toggle">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => handleToggleChange(key)}
                  disabled={isProcessing}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="preprocess-actions">
            <button
              className="preprocess-btn preprocess-btn-secondary"
              onClick={handleDewarp}
              disabled={isProcessing}
              type="button"
              title={strings.dewarpTip}
            >
              {isProcessing ? strings.processing : strings.dewarp}
            </button>
            <button
              className="preprocess-btn preprocess-btn-secondary"
              onClick={handleDeskew}
              disabled={isProcessing}
              type="button"
            >
              {isProcessing ? strings.processing : strings.deskewAuto}
            </button>
            <button
              className="preprocess-btn preprocess-btn-secondary"
              onClick={handleAutoCrop}
              disabled={isProcessing}
              type="button"
            >
              {isProcessing ? strings.processing : strings.autoCrop}
            </button>
          </div>

          {/* Perspective Crop */}
          <div className="preprocess-actions">
            <button
              className={`preprocess-btn ${showPerspective ? 'preprocess-btn-primary' : 'preprocess-btn-secondary'}`}
              onClick={handlePerspectiveToggle}
              disabled={isProcessing}
              type="button"
              title={strings.perspectiveCropTip}
            >
              {strings.perspectiveCrop}
            </button>
          </div>
          {showPerspective && perspectiveCorners && (
            <div className="preprocess-actions" style={{ marginTop: '0.4rem' }}>
              <button
                className="preprocess-btn preprocess-btn-secondary"
                onClick={handlePerspectiveDetect}
                disabled={isProcessing}
                type="button"
              >
                {isProcessing ? strings.processing : strings.perspectiveDetect}
              </button>
              <button
                className="preprocess-btn preprocess-btn-primary"
                onClick={handlePerspectiveApply}
                disabled={isProcessing}
                type="button"
              >
                {isProcessing ? strings.processing : strings.perspectiveApply}
              </button>
            </div>
          )}

          {/* Split Actions */}
          <div className="preprocess-actions">
            <button
              className="preprocess-btn preprocess-btn-secondary"
              onClick={handleSplitCenter}
              disabled={isProcessing || !onSplitPages}
              type="button"
              title={strings.splitCenterTip}
            >
              {isProcessing ? strings.processing : strings.splitCenter}
            </button>
            <button
              className="preprocess-btn preprocess-btn-secondary"
              onClick={handleSplitAuto}
              disabled={isProcessing || !onSplitPages}
              type="button"
              title={strings.splitAutoTip}
            >
              {isProcessing ? strings.processing : strings.splitAuto}
            </button>
          </div>

          {/* Apply/Reset Actions */}
          <div className="preprocess-actions">
            <button
              className="preprocess-btn preprocess-btn-primary"
              onClick={handleApply}
              disabled={isProcessing}
              type="button"
            >
              {isProcessing ? strings.processing : strings.apply}
            </button>
            {onApplyAll && totalImages != null && totalImages > 1 && (
              <button
                className="preprocess-btn preprocess-btn-accent"
                onClick={() => onApplyAll(options)}
                disabled={isProcessing}
                type="button"
                title={`${strings.applyAll} (${totalImages})`}
              >
                {isProcessing ? strings.processing : `${strings.applyAll} (${totalImages})`}
              </button>
            )}
            <button
              className="preprocess-btn preprocess-btn-secondary"
              onClick={handleReset}
              disabled={isProcessing}
              type="button"
            >
              {strings.reset}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Image Processing Utility Functions
// =====================================================

export async function applyPreprocess(
  imageDataUrl: string,
  options: PreprocessOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        // Draw image with rotation
        if (options.rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((options.rotation * Math.PI) / 180)
          ctx.translate(-canvas.width / 2, -canvas.height / 2)
        }

        ctx.drawImage(img, 0, 0)

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Apply filters
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i]
          let g = data[i + 1]
          let b = data[i + 2]
          let a = data[i + 3]

          // Grayscale
          if (options.grayscale) {
            const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)
            r = g = b = gray
          }

          // Invert colors
          if (options.invertColors) {
            r = 255 - r
            g = 255 - g
            b = 255 - b
          }

          // Brightness
          if (options.brightness !== 0) {
            r = Math.max(0, Math.min(255, r + options.brightness))
            g = Math.max(0, Math.min(255, g + options.brightness))
            b = Math.max(0, Math.min(255, b + options.brightness))
          }

          // Contrast
          if (options.contrast !== 0) {
            const factor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast))
            r = Math.max(0, Math.min(255, factor * (r - 128) + 128))
            g = Math.max(0, Math.min(255, factor * (g - 128) + 128))
            b = Math.max(0, Math.min(255, factor * (b - 128) + 128))
          }

          // Binarize
          if (options.binarize) {
            const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)
            const bw = gray > options.binarizeThreshold ? 255 : 0
            r = g = b = bw
          }

          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
          data[i + 3] = a
        }

        // Apply sharpness via convolution
        if (options.sharpness > 0) {
          applySharpness(imageData, options.sharpness)
        }

        // Apply denoise
        if (options.denoise) {
          applyDenoise(imageData)
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

function applySharpness(imageData: ImageData, amount: number): void {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const kernel = [0, -1, 0, -1, 4 + amount * 0.1, -1, 0, -1, 0]
  const divisor = 4 + amount * 0.1

  const tempData = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }
        const idx = (y * width + x) * 4 + c
        data[idx] = Math.max(0, Math.min(255, sum / divisor))
      }
    }
  }
}

function applyDenoise(imageData: ImageData): void {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const tempData = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const neighbors: number[] = []
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            neighbors.push(tempData[idx])
          }
        }
        neighbors.sort((a, b) => a - b)
        const median = neighbors[4]
        const idx = (y * width + x) * 4 + c
        data[idx] = median
      }
    }
  }
}

async function dewarpImage(imageDataUrl: string): Promise<string> {
  const { dewarpPage } = await import('../../utils/documentScanner')
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = dewarpPage(imageData)
        const outCanvas = document.createElement('canvas')
        outCanvas.width = result.width
        outCanvas.height = result.height
        const outCtx = outCanvas.getContext('2d')!
        outCtx.putImageData(result, 0, 0)
        resolve(outCanvas.toDataURL('image/jpeg', 0.92))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

async function deskewImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Simple deskew: detect edges and estimate angle
        const angle = estimateSkewAngle(imageData)

        const deskewCanvas = document.createElement('canvas')
        const deskewCtx = deskewCanvas.getContext('2d')
        if (!deskewCtx) throw new Error('Failed to get deskew context')

        deskewCanvas.width = canvas.width
        deskewCanvas.height = canvas.height

        deskewCtx.translate(canvas.width / 2, canvas.height / 2)
        deskewCtx.rotate((angle * Math.PI) / 180)
        deskewCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)

        resolve(deskewCanvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

function estimateSkewAngle(imageData: ImageData): number {
  // Projection profile method: test rotations from -5 to +5 degrees,
  // find the angle that maximizes horizontal projection variance
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  // Convert to binary row projection at the original angle first
  const getProjectionVariance = (angleDeg: number): number => {
    const angleRad = (angleDeg * Math.PI) / 180
    const cosA = Math.cos(angleRad)
    const sinA = Math.sin(angleRad)
    const cx = width / 2
    const cy = height / 2

    // Count dark pixels per row after virtual rotation
    const rowCounts = new Int32Array(height)
    // Sample every 2nd pixel for speed
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        // Rotate point back to find source
        const dx = x - cx
        const dy = y - cy
        const sx = Math.round(cosA * dx + sinA * dy + cx)
        const sy = Math.round(-sinA * dx + cosA * dy + cy)
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const idx = (sy * width + sx) * 4
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
          if (brightness < 160) rowCounts[y]++
        }
      }
    }

    // Calculate variance of row counts
    let sum = 0
    let sumSq = 0
    let count = 0
    for (let y = 0; y < height; y += 2) {
      sum += rowCounts[y]
      sumSq += rowCounts[y] * rowCounts[y]
      count++
    }
    if (count === 0) return 0
    const mean = sum / count
    return sumSq / count - mean * mean
  }

  let bestAngle = 0
  let bestVariance = 0

  // Coarse search: -5 to +5 in 0.5 deg steps
  for (let angle = -5; angle <= 5; angle += 0.5) {
    const v = getProjectionVariance(angle)
    if (v > bestVariance) {
      bestVariance = v
      bestAngle = angle
    }
  }

  // Fine search around best: ±0.5 in 0.1 deg steps
  const fineStart = bestAngle - 0.5
  const fineEnd = bestAngle + 0.5
  for (let angle = fineStart; angle <= fineEnd; angle += 0.1) {
    const v = getProjectionVariance(angle)
    if (v > bestVariance) {
      bestVariance = v
      bestAngle = angle
    }
  }

  // Return negative to counter the detected skew
  return -bestAngle
}

async function autoCrop(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const bounds = findContentBounds(imageData)

        const croppedCanvas = document.createElement('canvas')
        croppedCanvas.width = bounds.right - bounds.left
        croppedCanvas.height = bounds.bottom - bounds.top

        const croppedCtx = croppedCanvas.getContext('2d')
        if (!croppedCtx) throw new Error('Failed to get cropped context')

        croppedCtx.drawImage(
          canvas,
          bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top,
          0, 0, bounds.right - bounds.left, bounds.bottom - bounds.top
        )

        resolve(croppedCanvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
}

function findContentBounds(imageData: ImageData): Bounds {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  // まずグレースケールヒストグラムを構築
  const histogram = new Uint32Array(256)
  for (let i = 0; i < data.length; i += 4) {
    const brightness = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)
    histogram[brightness]++
  }

  // 大津の方法でコンテンツ/背景の閾値を自動算出
  const totalPixels = width * height
  let sumAll = 0
  for (let i = 0; i < 256; i++) sumAll += i * histogram[i]

  let sumBg = 0, weightBg = 0
  let maxVariance = 0, threshold = 200

  for (let t = 0; t < 256; t++) {
    weightBg += histogram[t]
    if (weightBg === 0) continue
    const weightFg = totalPixels - weightBg
    if (weightFg === 0) break

    sumBg += t * histogram[t]
    const meanBg = sumBg / weightBg
    const meanFg = (sumAll - sumBg) / weightFg
    const variance = weightBg * weightFg * (meanBg - meanFg) ** 2
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  // 閾値を少し余裕をもたせる（背景側に5加算、ただし最大250）
  threshold = Math.min(250, threshold + 5)

  let minX = width, maxX = 0
  let minY = height, maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      if (brightness < threshold) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  // コンテンツが検出されなかった場合は元画像の全域を返す
  if (maxX <= minX || maxY <= minY) {
    return { left: 0, right: width, top: 0, bottom: height }
  }

  // マージン（画像サイズの1%、最低5px）
  const margin = Math.max(5, Math.round(Math.min(width, height) * 0.01))
  return {
    left: Math.max(0, minX - margin),
    right: Math.min(width, maxX + margin),
    top: Math.max(0, minY - margin),
    bottom: Math.min(height, maxY + margin),
  }
}

async function splitPageCenter(imageDataUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const centerX = img.width / 2
        const leftCanvas = document.createElement('canvas')
        leftCanvas.width = centerX
        leftCanvas.height = img.height

        const rightCanvas = document.createElement('canvas')
        rightCanvas.width = img.width - centerX
        rightCanvas.height = img.height

        const leftCtx = leftCanvas.getContext('2d')
        const rightCtx = rightCanvas.getContext('2d')

        if (!leftCtx || !rightCtx) {
          throw new Error('Failed to get canvas context')
        }

        leftCtx.drawImage(img, 0, 0, centerX, img.height, 0, 0, centerX, img.height)
        rightCtx.drawImage(img, centerX, 0, img.width - centerX, img.height, 0, 0, img.width - centerX, img.height)

        // 日本語の本は右→左で読むため、右半分をページ1にする
        resolve([
          rightCanvas.toDataURL('image/png'),
          leftCanvas.toDataURL('image/png'),
        ])
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

async function splitPageAuto(imageDataUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Find vertical line with most whitespace
        const splitX = findAutoSplitPosition(imageData)

        const leftCanvas = document.createElement('canvas')
        leftCanvas.width = splitX
        leftCanvas.height = img.height

        const rightCanvas = document.createElement('canvas')
        rightCanvas.width = img.width - splitX
        rightCanvas.height = img.height

        const leftCtx = leftCanvas.getContext('2d')
        const rightCtx = rightCanvas.getContext('2d')

        if (!leftCtx || !rightCtx) {
          throw new Error('Failed to get canvas context')
        }

        leftCtx.drawImage(img, 0, 0, splitX, img.height, 0, 0, splitX, img.height)
        rightCtx.drawImage(img, splitX, 0, img.width - splitX, img.height, 0, 0, img.width - splitX, img.height)

        // 日本語の本は右→左で読むため、右半分をページ1にする
        resolve([
          rightCanvas.toDataURL('image/png'),
          leftCanvas.toDataURL('image/png'),
        ])
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

function findAutoSplitPosition(imageData: ImageData): number {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  let maxWhitespace = 0
  let splitPos = width / 2

  // Find vertical line with most white pixels
  for (let x = width * 0.3; x < width * 0.7; x++) {
    let whitespace = 0
    for (let y = 0; y < height; y++) {
      const idx = (y * width + Math.floor(x)) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      if (brightness > 200) whitespace++
    }
    if (whitespace > maxWhitespace) {
      maxWhitespace = whitespace
      splitPos = x
    }
  }

  return Math.floor(splitPos)
}
