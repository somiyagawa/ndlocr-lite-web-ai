import { memo } from 'react'
import type { Language } from '../../i18n'
import { L } from '../../i18n'

interface FooterProps {
  lang: Language
}

export const Footer = memo(function Footer({ lang }: FooterProps) {
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
          return <span>This system uses {onnxLink} and runs entirely in your browser. Selected images and OCR results are never sent to any external server.</span>
        })()}
      </div>
      <div className="footer-attribution">
        {(() => {
          const ndlocrLink = <a href="https://github.com/ndl-lab/ndlocr-lite" target="_blank" rel="noopener noreferrer">NDLOCR-Lite</a>
          if (lang === 'ja') return <span className="footer-attribution-text">本ツールは国立国会図書館（NDL Lab）が開発した {ndlocrLink} のWebブラウザ版です。OCRモデルはNDLOCR-Liteのものを使用しています。</span>
          if (lang === 'zh-CN') return <span className="footer-attribution-text">本工具是日本国立国会图书馆（NDL Lab）开发的 {ndlocrLink} 的Web浏览器版本。OCR模型来自NDLOCR-Lite。</span>
          if (lang === 'zh-TW') return <span className="footer-attribution-text">本工具是日本國立國會圖書館（NDL Lab）開發的 {ndlocrLink} 的Web瀏覽器版本。OCR模型來自NDLOCR-Lite。</span>
          if (lang === 'ko') return <span className="footer-attribution-text">이 도구는 일본 국립국회도서관(NDL Lab)이 개발한 {ndlocrLink}의 웹 브라우저 버전입니다. OCR 모델은 NDLOCR-Lite에서 가져왔습니다.</span>
          if (lang === 'la') return <span className="footer-attribution-text">Hoc instrumentum est versio navigatri interretialis {ndlocrLink} a Bibliotheca Nationali Diaetae Iaponiae (NDL Lab) elaborata.</span>
          if (lang === 'eo') return <span className="footer-attribution-text">Ĉi tiu ilo estas retumila versio de {ndlocrLink} evoluigita de la Nacia Dieta Biblioteko de Japanio (NDL Lab). OCR-modeloj estas de NDLOCR-Lite.</span>
          return <span className="footer-attribution-text">This tool is a web browser port of {ndlocrLink} developed by the National Diet Library of Japan (NDL Lab). OCR models are from NDLOCR-Lite.</span>
        })()}
      </div>
      <div className="footer-credits">
        <div className="footer-credit-line">
          {L(lang, {
            ja: 'OCRエンジン: ',
            en: 'OCR engine: ',
            'zh-CN': 'OCR引擎：',
            'zh-TW': 'OCR引擎：',
            ko: 'OCR 엔진: ',
            la: 'Machina OCR: ',
            eo: 'OCR-motoro: '
          })}
          <a href="https://github.com/ndl-lab/ndlocr-lite" target="_blank" rel="noopener noreferrer">
            NDLOCR-Lite
          </a>
          {L(lang, {
            ja: '（国立国会図書館）',
            en: ' (National Diet Library of Japan)',
            'zh-CN': '（日本国立国会图书馆）',
            'zh-TW': '（日本國立國會圖書館）',
            ko: ' (일본 국립국회도서관)',
            la: ' (Bibliotheca Nationalis Diaetae Iaponiae)',
            eo: ' (Nacia Dieta Biblioteko de Japanio)'
          })}
        </div>
        <div className="footer-credit-line">
          {L(lang, {
            ja: 'Web移植: ',
            en: 'Web port: ',
            'zh-CN': 'Web移植：',
            'zh-TW': 'Web移植：',
            ko: 'Web 포팅: ',
            la: 'Translatio ad Rete: ',
            eo: 'Reta versio: '
          })}
          <a href="https://github.com/yuta1984/ndlocrlite-web" target="_blank" rel="noopener noreferrer">
            {L(lang, {
              ja: '橋本雄太',
              en: 'Yuta Hashimoto',
              'zh-CN': '桥本雄太',
              'zh-TW': '橋本雄太',
              ko: '하시모토 유타',
              la: 'Yuta Hashimoto',
              eo: 'Yuta Hashimoto'
            })}
          </a>
          {L(lang, {
            ja: '（国立歴史民俗博物館）',
            en: ' (National Museum of Japanese History)',
            'zh-CN': '（国立历史民俗博物馆）',
            'zh-TW': '（國立歷史民俗博物館）',
            ko: ' (국립역사민속박물관)',
            la: ' (Museum Nationale Historiae Iaponiae)',
            eo: ' (Nacia Muzeo de Japana Historio)'
          })}
        </div>
        <div className="footer-credit-line">
          {L(lang, {
            ja: 'AI校正機能: ',
            en: 'AI proofreading: ',
            'zh-CN': 'AI校正功能：',
            'zh-TW': 'AI校正功能：',
            ko: 'AI 교정 기능: ',
            la: 'Correctio AI: ',
            eo: 'AI-korektado: '
          })}
          <a href="https://github.com/ogwata/ndlocr-lite-web-ai" target="_blank" rel="noopener noreferrer">
            {L(lang, {
              ja: '小形克宏',
              en: 'Katsuhiro Ogata',
              'zh-CN': '小形克宏',
              'zh-TW': '小形克宏',
              ko: '오가타 가쓰히로',
              la: 'Katsuhiro Ogata',
              eo: 'Katsuhiro Ogata'
            })}
          </a>
          {L(lang, {
            ja: '（一般社団法人ビブリオスタイル）',
            en: ' (Bibliostyle)',
            'zh-CN': '（Bibliostyle）',
            'zh-TW': '（Bibliostyle）',
            ko: ' (Bibliostyle)',
            la: ' (Bibliostyle)',
            eo: ' (Bibliostyle)'
          })}
        </div>
        <div className="footer-credit-line">
          {L(lang, {
            ja: 'その他蛇足機能（ダークモード、UIデザイン改修、画像前処理、縦書き表示、多言語UI、エクスポート拡張、処理履歴等）: ',
            en: 'Other bells & whistles (dark mode, UI design, image preprocessing, vertical text, i18n, export, history, etc.): ',
            'zh-CN': '其他锦上添花功能（深色模式、UI设计改进、图像预处理、竖排文字、多语言UI、导出扩展、处理历史等）：',
            'zh-TW': '其他錦上添花功能（深色模式、UI設計改進、影像前處理、直書顯示、多語言UI、匯出擴充、處理紀錄等）：',
            ko: '기타 부가 기능 (다크모드, UI 디자인 개선, 이미지 전처리, 세로쓰기, 다국어 UI, 내보내기 확장, 처리 기록 등): ',
            la: 'Alia additamenta (modus obscurus, designatio UI, praeparatio imaginum, textus verticalis, UI multilingue, exportatio, historia, etc.): ',
            eo: 'Aliaj aldonaĵoj (malluma reĝimo, UI-dezajno, bildpretigo, vertikala teksto, plurlingva UI, eksporto, historio, ktp.): '
          })}
          <a href="https://researchmap.jp/SoMiyagawa" target="_blank" rel="noopener noreferrer">
            {L(lang, {
              ja: '宮川創',
              en: 'So Miyagawa',
              'zh-CN': '宫川创',
              'zh-TW': '宮川創',
              ko: '미야가와 소',
              la: 'So Miyagawa',
              eo: 'So Miyagawa'
            })}
          </a>
          {L(lang, {
            ja: '（筑波大学）',
            en: ' (University of Tsukuba)',
            'zh-CN': '（筑波大学）',
            'zh-TW': '（筑波大學）',
            ko: ' (쓰쿠바 대학)',
            la: ' (Universitas Tsukubensis)',
            eo: ' (Universitato de Tsukuba)'
          })}
        </div>
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
            eo: 'Tōru Aoike'
          })}</a>
          if (lang === 'ja') return <>🐸 背景の鳥獣戯画模様は NDLOCR 開発者・{link}先生へのオマージュです</>
          if (lang === 'zh-CN') return <>🐸 背景的鸟兽戏画图案是向NDLOCR开发者{link}先生致敬</>
          if (lang === 'zh-TW') return <>🐸 背景的鳥獸戲畫圖案是向NDLOCR開發者{link}先生致敬</>
          if (lang === 'ko') return <>🐸 배경의 조수희화 패턴은 NDLOCR 개발자 {link}에 대한 오마주입니다</>
          if (lang === 'la') return <>🐸 Exemplar Choju-giga in fundo est honorarium {link}, creatori NDLOCR</>
          if (lang === 'eo') return <>🐸 La Choju-giga fona ŝablono estas omaĝo al {link}, kreinto de NDLOCR</>
          return <>🐸 The Choju-giga background pattern is a tribute to {link}, developer of NDLOCR</>
        })()}
      </div>
    </footer>
  )
})
