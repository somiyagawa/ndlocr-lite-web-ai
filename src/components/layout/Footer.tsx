import { memo } from 'react'
import type { Language } from '../../i18n'
import { L } from '../../i18n'

interface FooterProps {
  lang: Language
  onBugReport?: () => void
}

export const Footer = memo(function Footer({ lang, onBugReport }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-privacy">
        <span className="privacy-icon">🔒</span>
        {(() => {
          const onnxLink = <a href="https://www.npmjs.com/package/onnxruntime-web" target="_blank" rel="noopener noreferrer">ONNX Web Runtime</a>
          if (lang === 'ja') return <span>このシステムは {onnxLink} 技術を使用しており、Webブラウザで完結して動作します。選択した画像とOCR結果はあなたのPCの外部には送信されません。</span>
          if (lang === 'zh-CN') return <span>该系统使用 {onnxLink} 技术，完全在Web浏览器中运行。您选择的图像和OCR结果不会发送到PC外部。</span>
          if (lang === 'zh-TW') return <span>該系統使用 {onnxLink} 技術，完全在Web瀏覽器中運行。您選擇的圖像和OCR結果不會傳送到PC外部。</span>
          if (lang === 'ko') return <span>이 시스템은 {onnxLink} 기술을 사용하며 웹 브라우저에서 완전히 실행됩니다. 선택한 이미지와 OCR 결과는 PC 외부로 전송되지 않습니다.</span>
          if (lang === 'la') return <span>Hoc systema technologia {onnxLink} utitur et in navigatro interretiali operatur. Imagines selectae et eventus OCR extra computatrum tuum non mittuntur.</span>
          if (lang === 'eo') return <span>Ĉi tiu sistemo uzas {onnxLink} kaj funkcias tute en via retumilo. Elektitaj bildoj kaj OCR-rezultoj neniam estas senditaj ekster via komputilo.</span>
          if (lang === 'es') return <span>Este sistema usa {onnxLink} y funciona completamente en su navegador. Las imágenes y los resultados OCR nunca se envían a ningún servidor externo.</span>
          if (lang === 'de') return <span>Dieses System nutzt {onnxLink} und läuft vollständig in Ihrem Browser. Ausgewählte Bilder und OCR-Ergebnisse werden niemals an einen externen Server gesendet.</span>
          if (lang === 'ar') return <span>يستخدم هذا النظام تقنية {onnxLink} ويعمل بالكامل في متصفحك. لا يتم إرسال الصور المحددة ونتائج OCR إلى أي خادم خارجي.</span>
          if (lang === 'hi') return <span>यह सिस्टम {onnxLink} तकनीक का उपयोग करता है और पूरी तरह आपके ब्राउज़र में चलता है। चयनित छवियाँ और OCR परिणाम कभी किसी बाहरी सर्वर पर नहीं भेजे जाते।</span>
          if (lang === 'ru') return <span>Эта система использует {onnxLink} и работает полностью в вашем браузере. Выбранные изображения и результаты OCR никогда не отправляются на внешний сервер.</span>
          if (lang === 'el') return <span>Αυτό το σύστημα χρησιμοποιεί {onnxLink} και λειτουργεί εξ ολοκλήρου στο πρόγραμμα περιήγησής σας. Οι επιλεγμένες εικόνες και τα αποτελέσματα OCR δεν αποστέλλονται ποτέ σε εξωτερικό διακομιστή.</span>
          if (lang === 'syc') return <span>ܗܢ ܫܘ̈ܠܛ̈ܢ {onnxLink} ܢ̇ܦ̈ܩ ܘ̇ܟ̈ܠ̈ܗ ܒ̈ܡ̈ܕ̈ܒ̈ܪ̈ܢ̈ܐ ܕ̈ܝ̈ܠ̈ܟ ܦ̈ܥ̈ܠ. ܨ̈ܘ̈ܪ̈ܬ̈ܐ ܘ̈ܦ̈ܠ̈ܛ̈ܐ ܕ OCR ܠ̈ܒ̈ܪ ܡ̈ܢ ܡ̈ܚ̈ܫ̈ܒ̈ܬ̈ܟ ܠ̈ܐ ܡ̈ܫ̈ܬ̈ܕ̈ܪ̈ܝ̈ܢ.</span>
          if (lang === 'cop') return <span>ⲡⲁⲓⲥⲩⲥⲧⲏⲙⲁ ⲉϥⲭⲣⲱ ⲙ {onnxLink} ⲟⲩⲟϩ ⲉϥⲉⲣϩⲱⲃ ⲧⲏⲣϥ ϧⲉⲛ ⲡⲉⲕⲃⲣⲁⲩⲥⲉⲣ. ⲛⲓⲉⲓⲕⲱⲛ ⲛⲉⲙ ⲛⲓⲡⲟⲗⲏ ⲛⲧⲉ OCR ⲛⲁⲩⲟⲩⲟⲣⲡⲟⲩ ⲉⲃⲟⲗ ⲁⲛ.</span>
          if (lang === 'sa') return <span>एतत् प्रणालिका {onnxLink} प्रौद्योगिकीं प्रयुङ्क्ते, सम्पूर्णतया भवतः ब्राउज़रे चलति। चित्राणि OCR-फलानि च बाह्यसेवकाय न प्रेष्यन्ते।</span>
          return <span>This system uses {onnxLink} and runs entirely in your browser. Selected images and OCR results are never sent to any external server.</span>
        })()}
      </div>
      <div className="footer-attribution">
        {(() => {
          const ndlocrLink = <a href="https://github.com/ndl-lab/ndlocr-lite" target="_blank" rel="noopener noreferrer">NDLOCR-Lite</a>
          const ndlkotenLink = <a href="https://github.com/ndl-lab/ndlkotenocr-lite" target="_blank" rel="noopener noreferrer">NDL古典籍OCR-Lite</a>
          const hashimotoLink = <a href="https://github.com/yuta1984/ndlocrlite-web" target="_blank" rel="noopener noreferrer">{L(lang, { ja: '橋本雄太', en: 'Yuta Hashimoto', 'zh-CN': '桥本雄太', 'zh-TW': '橋本雄太', ko: '하시모토 유타', la: 'Yuta Hashimoto', eo: 'Yuta Hashimoto', es: 'Yuta Hashimoto', de: 'Yuta Hashimoto', ar: 'يوتا هاشيموتو', hi: 'युता हाशिमोतो', ru: 'Юта Хашимото', el: 'Yuta Hashimoto', syc: 'Yuta Hashimoto', cop: 'Yuta Hashimoto', sa: 'Yuta Hashimoto' })}</a>
          const ogataLink = <a href="https://github.com/ogwata/ndlocr-lite-web-ai" target="_blank" rel="noopener noreferrer">{L(lang, { ja: '小形克宏', en: 'Katsuhiro Ogata', 'zh-CN': '小形克宏', 'zh-TW': '小形克宏', ko: '오가타 가쓰히로', la: 'Katsuhiro Ogata', eo: 'Katsuhiro Ogata', es: 'Katsuhiro Ogata', de: 'Katsuhiro Ogata', ar: 'كاتسوهيرو أوغاتا', hi: 'कात्सुहिरो ओगाटा', ru: 'Кацухиро Огата', el: 'Katsuhiro Ogata', syc: 'Katsuhiro Ogata', cop: 'Katsuhiro Ogata', sa: 'Katsuhiro Ogata' })}</a>
          const miyagawaLink = <a href="https://researchmap.jp/SoMiyagawa" target="_blank" rel="noopener noreferrer">{L(lang, { ja: '宮川創', en: 'So Miyagawa', 'zh-CN': '宫川创', 'zh-TW': '宮川創', ko: '미야가와 소', la: 'So Miyagawa', eo: 'So Miyagawa', es: 'So Miyagawa', de: 'So Miyagawa', ar: 'سو مياغاوا', hi: 'सो मियागावा', ru: 'Со Миягава', el: 'So Miyagawa', syc: 'So Miyagawa', cop: 'So Miyagawa', sa: 'So Miyagawa' })}</a>

          if (lang === 'ja') return (
            <span className="footer-attribution-text">
              本ツールは、国立国会図書館（NDL Lab）が開発した {ndlocrLink} および {ndlkotenLink} を{hashimotoLink}氏（国立歴史民俗博物館）がWebブラウザ版にし、{ogataLink}氏（一般社団法人ビブリオスタイル）がAI校正機能を付け、{miyagawaLink}（筑波大学）がカメラ撮影・ドキュメントスキャナー・画像前処理（明度・コントラスト・二値化・ノイズ除去・傾き補正等）・ダークモード・多言語UI（16言語対応）・縦書き表示・検索置換・TEI XML / hOCR / テキスト付きPDF / DOCXエクスポート・一括保存・処理履歴・差分表示・領域選択OCR・見開きページ分割・IIIF画像読み込み・鳥獣戯画の背景など様々な蛇足な機能を施したものです。
            </span>
          )
          if (lang === 'zh-CN') return (
            <span className="footer-attribution-text">
              本工具基于日本国立国会图书馆（NDL Lab）开发的 {ndlocrLink}，由{hashimotoLink}（国立历史民俗博物馆）制作Web浏览器版本，{ogataLink}（Bibliostyle）添加了AI校正功能，{miyagawaLink}（筑波大学）添加了相机拍摄、文档扫描仪、图像预处理（亮度、对比度、二值化、降噪、倾斜校正等）、深色模式、多语言UI（16种语言）、竖排显示、搜索替换、TEI XML / hOCR / 含文本PDF / DOCX导出、批量保存、处理历史、差异显示、区域选择OCR、跨页分割、鸟兽戏画背景等各种多余的功能。
            </span>
          )
          if (lang === 'zh-TW') return (
            <span className="footer-attribution-text">
              本工具基於日本國立國會圖書館（NDL Lab）開發的 {ndlocrLink}，由{hashimotoLink}（國立歷史民俗博物館）製作Web瀏覽器版本，{ogataLink}（Bibliostyle）添加了AI校正功能，{miyagawaLink}（筑波大學）添加了相機拍攝、文件掃描儀、影像前處理（亮度、對比度、二值化、降噪、傾斜校正等）、深色模式、多語言UI（16種語言）、直書顯示、搜尋取代、TEI XML / hOCR / 含文字PDF / DOCX匯出、批次儲存、處理記錄、差異顯示、區域選取OCR、跨頁分割、鳥獸戲畫背景等各種多餘的功能。
            </span>
          )
          if (lang === 'ko') return (
            <span className="footer-attribution-text">
              이 도구는 일본 국립국회도서관(NDL Lab)이 개발한 {ndlocrLink}을 {hashimotoLink}(국립역사민속박물관)이 웹 브라우저 버전으로 만들고, {ogataLink}(Bibliostyle)이 AI 교정 기능을 추가하고, {miyagawaLink}(쓰쿠바 대학)이 카메라 촬영, 문서 스캐너, 이미지 전처리(밝기·대비·이진화·노이즈 제거·기울기 보정 등), 다크 모드, 다국어 UI(16개 언어), 세로쓰기 표시, 검색·치환, TEI XML / hOCR / 텍스트 포함 PDF / DOCX 내보내기, 일괄 저장, 처리 기록, 차이 표시, 영역 선택 OCR, 양면 페이지 분할, 조수희화 배경 등 다양한 사족 기능을 추가한 것입니다.
            </span>
          )
          if (lang === 'la') return (
            <span className="footer-attribution-text">
              Hoc instrumentum in {ndlocrLink} a Bibliotheca Nationali Diaetae Iaponiae (NDL Lab) elaborata fundatur. {hashimotoLink} (Museum Nationale Historiae Iaponiae) versionem navigatri interretialis fecit, {ogataLink} (Bibliostyle) correctionem AI addidit, et {miyagawaLink} (Universitas Tsukubensis) varia additamenta superflua adiecit: camerae functionem, documentorum scannerium, praeparationem imaginum, modum obscurum, UI multilingue (XVI linguae), textum verticalem, TEI XML / hOCR / PDF / DOCX exportationem, etc.
            </span>
          )
          if (lang === 'eo') return (
            <span className="footer-attribution-text">
              Ĉi tiu ilo baziĝas sur {ndlocrLink} evoluigita de la Nacia Dieta Biblioteko de Japanio (NDL Lab). {hashimotoLink} (Nacia Muzeo de Japana Historio) faris la retumilan version, {ogataLink} (Bibliostyle) aldonis AI-korektadon, kaj {miyagawaLink} (Universitato de Tsukuba) aldonis diversajn superfluajn funkciojn: kameran kapton, dokumentan skanilon, bildpretikon, malluman reĝimon, plurlingvan UI (16 lingvoj), vertikalan tekston, serĉon kaj anstataŭigon, TEI XML / hOCR / PDF / DOCX eksporton, amas-elŝuton, historion, diferencan vidon, regionan OCR, paĝdividon, Choju-giga fonon, ktp.
            </span>
          )
          if (lang === 'es') return (
            <span className="footer-attribution-text">
              Esta herramienta se basa en {ndlocrLink} desarrollado por la Biblioteca Nacional de la Dieta de Japón (NDL Lab). {hashimotoLink} (Museo Nacional de Historia de Japón) creó la versión web, {ogataLink} (Bibliostyle) añadió la corrección con IA, y {miyagawaLink} (Universidad de Tsukuba) añadió diversas funciones superfluas: captura con cámara, escáner de documentos, preprocesamiento de imágenes, modo oscuro, interfaz multilingüe (16 idiomas), texto vertical, buscar y reemplazar, exportación TEI XML / hOCR / PDF / DOCX, descarga por lotes, historial, vista de diferencias, OCR por región, división de páginas dobles y fondo Choju-giga.
            </span>
          )
          if (lang === 'de') return (
            <span className="footer-attribution-text">
              Dieses Tool basiert auf {ndlocrLink}, entwickelt von der Nationalbibliothek des japanischen Parlaments (NDL Lab). {hashimotoLink} (Nationalmuseum für japanische Geschichte) erstellte die Webbrowser-Version, {ogataLink} (Bibliostyle) fügte die KI-Korrektur hinzu, und {miyagawaLink} (Universität Tsukuba) fügte diverse überflüssige Funktionen hinzu: Kameraaufnahme, Dokumentenscanner, Bildvorverarbeitung, Dunkelmodus, mehrsprachige Oberfläche (16 Sprachen), vertikaler Text, Suchen und Ersetzen, TEI XML / hOCR / PDF / DOCX-Export, Stapel-Download, Verlauf, Diff-Ansicht, regionaler OCR, Doppelseitenteilung und Choju-giga-Hintergrund.
            </span>
          )
          if (lang === 'ar') return (
            <span className="footer-attribution-text">
              تستند هذه الأداة إلى {ndlocrLink} التي طورتها المكتبة الوطنية للبرلمان الياباني (NDL Lab). قام {hashimotoLink} (المتحف الوطني للتاريخ الياباني) بإنشاء نسخة متصفح الويب، وأضاف {ogataLink} (Bibliostyle) وظيفة التصحيح بالذكاء الاصطناعي، وأضاف {miyagawaLink} (جامعة تسوكوبا) وظائف زائدة متنوعة: التقاط الكاميرا، ماسح المستندات، معالجة الصور، الوضع الداكن، واجهة متعددة اللغات (16 لغة)، النص العمودي، البحث والاستبدال، تصدير TEI XML / hOCR / PDF / DOCX، التنزيل الجماعي، السجل، عرض الفروق، OCR بالتحديد، تقسيم الصفحات المزدوجة، وخلفية Choju-giga.
            </span>
          )
          if (lang === 'hi') return (
            <span className="footer-attribution-text">
              यह टूल जापान की राष्ट्रीय संसद पुस्तकालय (NDL Lab) द्वारा विकसित {ndlocrLink} पर आधारित है। {hashimotoLink} (जापानी इतिहास का राष्ट्रीय संग्रहालय) ने वेब ब्राउज़र संस्करण बनाया, {ogataLink} (Bibliostyle) ने AI प्रूफ़रीडिंग जोड़ी, और {miyagawaLink} (त्सुकुबा विश्वविद्यालय) ने विभिन्न अतिरिक्त कार्यक्षमताएँ जोड़ीं: कैमरा कैप्चर, डॉक्यूमेंट स्कैनर, इमेज प्रीप्रोसेसिंग, डार्क मोड, बहुभाषी UI (16 भाषाएँ), वर्टिकल टेक्स्ट, खोज और बदलें, TEI XML / hOCR / PDF / DOCX एक्सपोर्ट, बैच डाउनलोड, इतिहास, डिफ़ व्यू, रीजन सिलेक्ट OCR, डबल-पेज स्प्लिटिंग, और Choju-giga पृष्ठभूमि।
            </span>
          )
          if (lang === 'ru') return (
            <span className="footer-attribution-text">
              Этот инструмент основан на {ndlocrLink}, разработанном Национальной библиотекой парламента Японии (NDL Lab). {hashimotoLink} (Национальный музей истории Японии) создал версию для веб-браузера, {ogataLink} (Bibliostyle) добавил функцию корректуры с ИИ, а {miyagawaLink} (Университет Цукуба) добавил различные излишние функции: съёмку камерой, сканер документов, предобработку изображений, тёмный режим, многоязычный интерфейс (16 языков), вертикальный текст, поиск и замену, экспорт TEI XML / hOCR / PDF / DOCX, пакетную загрузку, историю обработки, сравнение различий, OCR выделенной области, разделение разворотов и фон Choju-giga.
            </span>
          )
          if (lang === 'el') return (
            <span className="footer-attribution-text">
              Αυτό το εργαλείο βασίζεται στο {ndlocrLink} που αναπτύχθηκε από την Εθνική Βιβλιοθήκη του Κοινοβουλίου της Ιαπωνίας (NDL Lab). Ο {hashimotoLink} (Εθνικό Μουσείο Ιστορίας της Ιαπωνίας) δημιούργησε την έκδοση για πρόγραμμα περιήγησης, ο {ogataLink} (Bibliostyle) πρόσθεσε τη διόρθωση AI, και ο {miyagawaLink} (Πανεπιστήμιο Tsukuba) πρόσθεσε διάφορες περιττές λειτουργίες: λήψη κάμερας, σαρωτή εγγράφων, προ-επεξεργασία εικόνας, σκοτεινή λειτουργία, πολύγλωσση διεπαφή (16 γλώσσες), κάθετο κείμενο, αναζήτηση και αντικατάσταση, εξαγωγή TEI XML / hOCR / PDF / DOCX, μαζική λήψη, ιστορικό, προβολή διαφορών, OCR περιοχής, διαχωρισμό διπλών σελίδων και φόντο Choju-giga.
            </span>
          )
          if (lang === 'syc') return (
            <span className="footer-attribution-text">
              ܗܢ ܡܐܢ ܥܠ {ndlocrLink} ܕ̇ܣ̈ܝ̈ܡ ܡ̈ܢ ܒ̈ܝ̈ܬ ܐ̈ܪ̈ܟ̈ܐ ܐ̈ܘ̈ܡ̈ܬ̈ܢ̈ܝ̈ܐ ܕ̈ܦ̈ܪ̈ܠ̈ܡ̈ܢ ܕ̈ܝ̈ܦ̈ܘ̈ܢ (NDL Lab). {hashimotoLink} (ܡܘܣܐ ܐܘܡܬܢܐ ܕܬܫܥ̈ܝܬ ܐܦܢܐ) ܣ̈ܡ ܙ̈ܢ̈ܐ ܕ̈ܡ̈ܕ̈ܒ̈ܪ̈ܢ̈ܐ، {ogataLink} (Bibliostyle) ܐ̈ܘ̈ܣ̈ܦ ܬ̈ܘ̈ܪ̈ܨ̈ܐ ܕ AI، ܘ {miyagawaLink} (ܓܒ ܕܛܣܟܘܒܐ) ܐ̈ܘ̈ܣ̈ܦ ܥ̈ܒ̈ܕ̈ܐ ܕ̈ܟ̈ܡ̈ܝ̈ܪ̈ܐ ܘ̈ܬ̈ܘ̈ܪ̈ܨ̈ ܨ̈ܘ̈ܪ̈ܬ̈ܐ ܘ̈ܫ̈ܪ̈ܟ̈ܐ.
            </span>
          )
          if (lang === 'cop') return (
            <span className="footer-attribution-text">
              ⲡⲁⲓⲉⲣⲅⲁⲗⲓⲟⲛ ⲉϥⲕⲏⲧ ⲉϫⲉⲛ {ndlocrLink} ⲉⲧⲁⲩⲑⲁⲙⲓⲟϥ ⲉⲃⲟⲗ ϩⲓⲧⲉⲛ NDL Lab. {hashimotoLink} (ⲡⲓⲧⲱⲡⲉ ⲉⲧⲟⲩⲁⲏⲓ ⲛⲧⲉ ⲧⲟⲏ ⲛ ⲓⲁⲡⲁⲛ) ⲁϥⲑⲁⲙⲓⲟ ⲙⲡⲓⲃⲣⲁⲩⲥⲉⲣ, {ogataLink} (Bibliostyle) ⲁϥⲟⲩⲱϩ ⲙⲡⲓⲥⲟⲩⲧⲉⲛ ⲛⲧⲉ AI, ⲟⲩⲟϩ {miyagawaLink} (ⲡⲓⲡⲁⲛ ⲛⲧⲉ Tsukuba) ⲁϥⲟⲩⲱϩ ⲙⲡⲓⲕⲁⲙⲉⲣⲁ ⲛⲉⲙ ⲡⲓⲥⲟⲩⲧⲉⲛ ⲛⲛⲓⲉⲓⲕⲱⲛ ⲛⲉⲙ ϩⲁⲛⲕⲉⲟⲩⲁⲓ ⲉⲩⲟⲓ.
            </span>
          )
          if (lang === 'sa') return (
            <span className="footer-attribution-text">
              एतत् उपकरणं जापान-राष्ट्रीय-संसद्-पुस्तकालयेन (NDL Lab) विकसितस्य {ndlocrLink} आधारितम्। {hashimotoLink} (जापान-इतिहास-राष्ट्रीय-संग्रहालयम्) वेब-ब्राउज़र-संस्करणम् अकरोत्, {ogataLink} (Bibliostyle) AI-संशोधनं योजयामास, {miyagawaLink} (Tsukuba-विश्वविद्यालयम्) च छायाग्रहण-क्रियां चित्र-संशोधनं विविधानि अतिरिक्तानि कार्याणि च योजयामास।
            </span>
          )
          return (
            <span className="footer-attribution-text">
              This tool is based on {ndlocrLink} and {ndlkotenLink} developed by the National Diet Library of Japan (NDL Lab). {hashimotoLink} (National Museum of Japanese History) created the web browser version, {ogataLink} (Bibliostyle) added AI proofreading, and {miyagawaLink} (University of Tsukuba) added various superfluous features including camera capture, document scanner, image preprocessing (brightness, contrast, binarization, denoising, deskew, etc.), dark mode, multilingual UI (16 languages), vertical text display, search &amp; replace, TEI XML / hOCR / text-embedded PDF / DOCX export, batch download, processing history, diff view, region-select OCR, double-page splitting, IIIF image loading, and the Choju-giga background.
            </span>
          )
        })()}
      </div>
      <div className="footer-frog-credit">
        {(() => {
          const link = <a href="https://researchmap.jp/blue0620" target="_blank" rel="noopener noreferrer">{L(lang, {
            ja: '青池亨',
            en: 'Toru Aoike',
            'zh-CN': '青池亨',
            'zh-TW': '青池亨',
            ko: '아오이케 토오루',
            la: 'Tōru Aoike',
            eo: 'Tōru Aoike',
            es: 'Toru Aoike',
            de: 'Toru Aoike',
            ar: 'تورو أويكي',
            hi: 'तोरु आओइके',
            ru: 'Тору Аойке',
            el: 'Toru Aoike',
            syc: 'Toru Aoike',
            cop: 'Toru Aoike',
            sa: 'Toru Aoike'
          })}</a>
          if (lang === 'ja') return <>🐸 背景の鳥獣戯画模様は NDLOCR 開発者・{link}先生（国立国会図書館）へのオマージュです</>
          if (lang === 'zh-CN') return <>🐸 背景的鸟兽戏画图案是向NDLOCR开发者{link}先生（国立国会图书馆）致敬</>
          if (lang === 'zh-TW') return <>🐸 背景的鳥獸戲畫圖案是向NDLOCR開發者{link}先生（國立國會圖書館）致敬</>
          if (lang === 'ko') return <>🐸 배경의 조수희화 패턴은 NDLOCR 개발자 {link}(국립국회도서관)에 대한 오마주입니다</>
          if (lang === 'la') return <>🐸 Exemplar Choju-giga in fundo est honorarium {link} (Bibliotheca Nationalis Diaetae Iaponiae), creatori NDLOCR</>
          if (lang === 'eo') return <>🐸 La Choju-giga fona ŝablono estas omaĝo al {link} (Nacia Dieta Biblioteko de Japanio), kreinto de NDLOCR</>
          if (lang === 'es') return <>🐸 El patrón de fondo Choju-giga es un tributo a {link} (Biblioteca Nacional de la Dieta de Japón), desarrollador de NDLOCR</>
          if (lang === 'de') return <>🐸 Das Choju-giga-Hintergrundmuster ist eine Hommage an {link} (Nationalbibliothek des japanischen Parlaments), Entwickler von NDLOCR</>
          if (lang === 'ar') return <>🐸 نمط خلفية Choju-giga هو تكريم لـ {link} (المكتبة الوطنية للبرلمان الياباني)، مطور NDLOCR</>
          if (lang === 'hi') return <>🐸 Choju-giga पृष्ठभूमि पैटर्न {link} (जापान की राष्ट्रीय संसद पुस्तकालय), NDLOCR के डेवलपर को श्रद्धांजलि है</>
          if (lang === 'ru') return <>🐸 Узор Choju-giga на фоне — это дань уважения {link} (Национальная библиотека парламента Японии), разработчику NDLOCR</>
          if (lang === 'el') return <>🐸 Το μοτίβο Choju-giga στο φόντο αποτελεί φόρο τιμής στον {link} (Εθνική Βιβλιοθήκη του Κοινοβουλίου της Ιαπωνίας), δημιουργό του NDLOCR</>
          if (lang === 'syc') return <>🐸 ܨܘ̈ܪ̈ܬ Choju-giga ܒ̈ܦ̈ܢ̈ܝ̈ܬ̈ܐ ܐ̈ܝ̈ܩ̈ܪ̈ ܠ {link} (ܒܝܬ ܐܪ̈ܟܐ ܐܘܡܬܢܝܐ ܕܦܪܠܡܢ ܕܝܦܘܢ)، ܒ̈ܪ̈ܘ̈ܝ̈ NDLOCR</>
          if (lang === 'cop') return <>🐸 ⲡⲓⲥⲭⲏⲙⲁ ⲛⲧⲉ Choju-giga ϧⲉⲛ ⲡⲓⲕⲁϩⲓ ⲟⲩⲧⲁⲓⲟ ⲛ {link} (ⲡⲓϫⲟⲙ ⲉⲧⲟⲩⲁⲏⲓ ⲛⲧⲉ ⲙⲟⲛ ⲛ ⲓⲁⲡⲁⲛ), ⲫⲏ ⲉⲧⲁϥⲑⲁⲙⲓⲟ ⲙ NDLOCR</>
          if (lang === 'sa') return <>🐸 पृष्ठभूमौ Choju-giga प्रतिरूपं {link} (जापान-राष्ट्रीय-संसद-पुस्तकालयम्) NDLOCR विकासकस्य सम्मानार्थम् अस्ति</>
          return <>🐸 The Choju-giga background pattern is a tribute to {link} (National Diet Library of Japan), developer of NDLOCR</>
        })()}
      </div>
      <div className="footer-license">
        {(() => {
          const ccby = <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
          const mit = <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT</a>
          const ndl = L(lang, { ja: '国立国会図書館', en: 'NDL', 'zh-CN': '日本国立国会图书馆', 'zh-TW': '日本國立國會圖書館', ko: '일본국립국회도서관', la: 'NDL', eo: 'NDL', es: 'NDL', de: 'NDL', ar: 'NDL', hi: 'NDL', ru: 'NDL', el: 'NDL', syc: 'NDL', cop: 'NDL', sa: 'NDL' })
          const hashi = L(lang, { ja: '橋本雄太', en: 'Y. Hashimoto', 'zh-CN': '桥本雄太', 'zh-TW': '橋本雄太', ko: '하시모토 유타', ru: 'Ю. Хасимото', la: 'Y. Hashimoto', eo: 'Y. Hashimoto', es: 'Y. Hashimoto', de: 'Y. Hashimoto', ar: 'Y. Hashimoto', hi: 'Y. Hashimoto', el: 'Y. Hashimoto', syc: 'Y. Hashimoto', cop: 'Y. Hashimoto', sa: 'Y. Hashimoto' })
          const ogata = L(lang, { ja: '小形克宏', en: 'K. Ogata', 'zh-CN': '小形克宏', 'zh-TW': '小形克宏', ko: '오가타 카쓰히로', ru: 'К. Огата', la: 'K. Ogata', eo: 'K. Ogata', es: 'K. Ogata', de: 'K. Ogata', ar: 'K. Ogata', hi: 'K. Ogata', el: 'K. Ogata', syc: 'K. Ogata', cop: 'K. Ogata', sa: 'K. Ogata' })
          const miya = L(lang, { ja: '宮川創', en: 'S. Miyagawa', 'zh-CN': '宫川创', 'zh-TW': '宮川創', ko: '미야가와 소', ru: 'С. Миягава', la: 'S. Miyagawa', eo: 'S. Miyagawa', es: 'S. Miyagawa', de: 'S. Miyagawa', ar: 'S. Miyagawa', hi: 'S. Miyagawa', el: 'S. Miyagawa', syc: 'S. Miyagawa', cop: 'S. Miyagawa', sa: 'S. Miyagawa' })
          const webLabel = L(lang, { ja: 'Web版', en: 'Web port', 'zh-CN': 'Web版', 'zh-TW': 'Web版', ko: 'Web판', la: 'Web', eo: 'Retversio', es: 'Web', de: 'Web', ar: 'الويب', hi: 'वेब', ru: 'Веб', el: 'Web', syc: 'ܓܘ', cop: 'Web', sa: 'Web' })
          const aiLabel = L(lang, { ja: 'AI校正', en: 'AI proofread', 'zh-CN': 'AI校正', 'zh-TW': 'AI校正', ko: 'AI교정', la: 'AI', eo: 'AI', es: 'AI', de: 'KI', ar: 'AI', hi: 'AI', ru: 'AI', el: 'AI', syc: 'AI', cop: 'AI', sa: 'AI' })
          return (
            <span>
              NDLOCR-Lite: {ccby} ({ndl}) / {webLabel}: {ccby} ({hashi}) / {aiLabel}: {mit} ({ogata}) / Ultra Bluepond: {ccby} ({miya}) / NDL古典籍OCR-Lite: {ccby} ({ndl})
            </span>
          )
        })()}
      </div>
      {onBugReport && (
        <div className="footer-bug-report">
          <button className="footer-bug-report-btn" onClick={onBugReport} type="button">
            {L(lang, {
              ja: '🐛 バグ報告・機能要望',
              en: '🐛 Bug Report / Feature Request',
              'zh-CN': '🐛 错误报告 / 功能建议',
              'zh-TW': '🐛 錯誤報告 / 功能建議',
              ko: '🐛 버그 보고 / 기능 요청',
              la: '🐛 Nuntia errorem',
              eo: '🐛 Raporti cimon',
              es: '🐛 Reportar error',
              de: '🐛 Fehler melden',
              ar: '🐛 تقرير خطأ',
              hi: '🐛 बग रिपोर्ट',
              ru: '🐛 Сообщить об ошибке',
              el: '🐛 Αναφορά σφάλματος',
              syc: '🐛 ܡܘܕܥܢܘܬ ܛܥܝܘܬ',
              cop: '🐛 ⲙⲉⲧⲙⲉⲑⲣⲉ ⲛⲧⲉ ⲡⲓⲥⲟⲃⲓ',
              sa: '🐛 दोषनिवेदनम्',
            })}
          </button>
        </div>
      )}
    </footer>
  )
})
