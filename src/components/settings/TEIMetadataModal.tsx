import { useState } from 'react'
import type { TEIMetadata } from '../../types/ocr'
import type { Language } from '../../i18n'
import { L } from '../../i18n'

interface TEIMetadataModalProps {
  onClose: () => void
  onSave: (metadata: TEIMetadata) => void
  lang: Language
  initialMetadata?: TEIMetadata
}

export function TEIMetadataModal({
  onClose,
  onSave,
  lang,
  initialMetadata,
}: TEIMetadataModalProps) {
  const [metadata, setMetadata] = useState<TEIMetadata>(
    initialMetadata || {
      title: '',
      author: '',
      editor: '',
      publisher: '',
      date: '',
      sourceInstitution: '',
      sourceIdno: '',
      language: '',
      notes: '',
    }
  )

  const handleChange = (key: keyof TEIMetadata, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave(metadata)
    onClose()
  }

  const fields: Array<{ key: keyof TEIMetadata; label: Partial<Record<Language, string>> }> = [
    {
      key: 'title',
      label: {
        ja: '文書タイトル',
        en: 'Document Title',
        'zh-CN': '文档标题',
        'zh-TW': '文檔標題',
        ko: '문서 제목',
        la: 'Titulus Documenti',
        eo: 'Titolo de Dokumento',
        es: 'Título del Documento',
        de: 'Dokumenttitel',
        ar: 'عنوان المستند',
        hi: 'दस्तावेज़ का शीर्षक',
        ru: 'Название документа',
        el: 'Τίτλος Εγγράφου',
        syc: 'ܫܡܐ ܕܟܬܒܐ',
        cop: 'ⲥⲁ ⲙⲡⲕⲟϩ',
        sa: 'लेखस्य नाम',
      },
    },
    {
      key: 'author',
      label: {
        ja: '著者',
        en: 'Author',
        'zh-CN': '作者',
        'zh-TW': '作者',
        ko: '저자',
        la: 'Auctor',
        eo: 'Aŭtoro',
        es: 'Autor',
        de: 'Autor',
        ar: 'المؤلف',
        hi: 'लेखक',
        ru: 'Автор',
        el: 'Συγγραφέας',
        syc: 'ܡܚܒܪܐ',
        cop: 'ⲟⲩϥⲁⲓ',
        sa: 'कर्तृ',
      },
    },
    {
      key: 'editor',
      label: {
        ja: '編者・校訂者',
        en: 'Editor',
        'zh-CN': '编辑',
        'zh-TW': '編輯',
        ko: '편집자',
        la: 'Editor',
        eo: 'Redaktoro',
        es: 'Editor',
        de: 'Editor',
        ar: 'المحرر',
        hi: 'संपादक',
        ru: 'Редактор',
        el: 'Επιμελητής',
        syc: 'ܦܢܩܐ',
        cop: 'ⲡⲟⲩϫⲁⲓ',
        sa: 'सम्पादक',
      },
    },
    {
      key: 'publisher',
      label: {
        ja: '出版者',
        en: 'Publisher',
        'zh-CN': '出版者',
        'zh-TW': '出版者',
        ko: '출판자',
        la: 'Typographus',
        eo: 'Eldonisto',
        es: 'Editorial',
        de: 'Verlag',
        ar: 'الناشر',
        hi: 'प्रकाशक',
        ru: 'Издатель',
        el: 'Εκδότης',
        syc: 'ܦܫܩܐ',
        cop: 'ⲡⲓⲙⲧⲙⲧⲛ',
        sa: 'प्रकाशक',
      },
    },
    {
      key: 'date',
      label: {
        ja: '年代・日付',
        en: 'Date',
        'zh-CN': '日期',
        'zh-TW': '日期',
        ko: '날짜',
        la: 'Data',
        eo: 'Dato',
        es: 'Fecha',
        de: 'Datum',
        ar: 'التاريخ',
        hi: 'तारीख',
        ru: 'Дата',
        el: 'Ημερομηνία',
        syc: 'ܝܘܡܐ',
        cop: 'ⲣⲟϫ',
        sa: 'तिथि',
      },
    },
    {
      key: 'sourceInstitution',
      label: {
        ja: '所蔵機関',
        en: 'Holding Institution',
        'zh-CN': '收藏机构',
        'zh-TW': '收藏機構',
        ko: '소장 기관',
        la: 'Institutio Custodiae',
        eo: 'Ĉefa Institucio',
        es: 'Institución Depositaria',
        de: 'Aufbewahrungsinstitution',
        ar: 'المؤسسة الحافظة',
        hi: 'संग्रह संस्था',
        ru: 'Учреждение-хранитель',
        el: 'Ίδρυμα Διαφύλαξης',
        syc: 'ܬܕܡܪܬܐ ܕܠܗܘܬܐ',
        cop: 'ⲡⲓⲕⲟⲉⲓ ⲛⲉⲧⲉ',
        sa: 'सङ्ग्रहणसंस्था',
      },
    },
    {
      key: 'sourceIdno',
      label: {
        ja: '請求記号・資料番号',
        en: 'Call Number / Shelfmark',
        'zh-CN': '索书号',
        'zh-TW': '索書號',
        ko: '청구기호',
        la: 'Numerus Catalogus',
        eo: 'Kataloga Numero',
        es: 'Número de Catálogo',
        de: 'Signatur',
        ar: 'رقم الفهرس',
        hi: 'सूचकांक संख्या',
        ru: 'Шифр',
        el: 'Αριθμός Κ/Κ',
        syc: 'ܡܢܝܢܐ ܡܫܡܠܬܐ',
        cop: 'ⲛⲁϥϫⲟⲙ ⲙⲡϩⲟⲟⲩ',
        sa: 'संख्या',
      },
    },
    {
      key: 'language',
      label: {
        ja: '言語',
        en: 'Language',
        'zh-CN': '语言',
        'zh-TW': '語言',
        ko: '언어',
        la: 'Lingua',
        eo: 'Lingvo',
        es: 'Idioma',
        de: 'Sprache',
        ar: 'اللغة',
        hi: 'भाषा',
        ru: 'Язык',
        el: 'Γλώσσα',
        syc: 'ܠܫܢܐ',
        cop: 'ⲡⲛⲟⲃⲓ',
        sa: 'भाषा',
      },
    },
    {
      key: 'notes',
      label: {
        ja: '備考',
        en: 'Notes',
        'zh-CN': '备注',
        'zh-TW': '備註',
        ko: '비고',
        la: 'Notae',
        eo: 'Notoj',
        es: 'Notas',
        de: 'Anmerkungen',
        ar: 'ملاحظات',
        hi: 'नोट्स',
        ru: 'Примечания',
        el: 'Σημειώσεις',
        syc: 'ܥܠܡܐ',
        cop: 'ⲧⲙⲟⲩ',
        sa: 'टिप्पण्या',
      },
    },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {L(lang, {
            ja: 'TEI XMLメタデータ',
            en: 'TEI XML Metadata',
            'zh-CN': 'TEI XML元数据',
            'zh-TW': 'TEI XML元數據',
            ko: 'TEI XML 메타데이터',
            la: 'TEI XML Metadatum',
            eo: 'TEI XML Metaĵaro',
            es: 'Metadatos TEI XML',
            de: 'TEI XML Metadaten',
            ar: 'بيانات TEI XML الوصفية',
            hi: 'TEI XML मेटाडेटा',
            ru: 'Метаданные TEI XML',
            el: 'Μεταδεδομένα TEI XML',
            syc: 'ܣܟܐ ܕ TEI XML',
            cop: 'ⲡⲓⲣⲟ ⲛⲧⲉ TEI XML',
            sa: 'TEI XML विवरणार्थ डेटा',
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {fields.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor={`tei-${key}`} style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                {L(lang, label)}
              </label>
              {key === 'notes' ? (
                <textarea
                  id={`tei-${key}`}
                  value={metadata[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={L(lang, {
                    ja: '入力欄',
                    en: 'Enter text here',
                    'zh-CN': '输入文本',
                    'zh-TW': '輸入文本',
                    ko: '텍스트 입력',
                    la: 'Scribere hic',
                    eo: 'Skribu ĉi tie',
                    es: 'Escriba aquí',
                    de: 'Text hier eingeben',
                    ar: 'أدخل النص هنا',
                    hi: 'यहाँ पाठ दर्ज करें',
                    ru: 'Введите текст здесь',
                    el: 'Εισάγετε κείμενο εδώ',
                    syc: 'ܚܦܪܘ ܡܠܐ',
                    cop: 'ϯ ⲁⲃⲓ ⲧⲉⲩ',
                    sa: 'पाठं लिखत',
                  })}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    resize: 'vertical',
                    minHeight: '4rem',
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text)',
                  }}
                />
              ) : (
                <input
                  id={`tei-${key}`}
                  type="text"
                  value={metadata[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={L(lang, {
                    ja: '入力欄',
                    en: 'Enter text here',
                    'zh-CN': '输入文本',
                    'zh-TW': '輸入文本',
                    ko: '텍스트 입력',
                    la: 'Scribere hic',
                    eo: 'Skribu ĉi tie',
                    es: 'Escriba aquí',
                    de: 'Text hier eingeben',
                    ar: 'أدخل النص هنا',
                    hi: 'यहाँ पाठ दर्ज करें',
                    ru: 'Введите текст здесь',
                    el: 'Εισάγετε κείμενο εδώ',
                    syc: 'ܚܦܪܘ ܡܠܐ',
                    cop: 'ϯ ⲁⲃⲓ ⲧⲉⲩ',
                    sa: 'पाठं लिखत',
                  })}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    backgroundColor: 'var(--color-input-bg)',
                    color: 'var(--color-text)',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn"
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: 'var(--color-surface-variant)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            {L(lang, {
              ja: 'キャンセル',
              en: 'Cancel',
              'zh-CN': '取消',
              'zh-TW': '取消',
              ko: '취소',
              la: 'Dimitte',
              eo: 'Nuligi',
              es: 'Cancelar',
              de: 'Abbrechen',
              ar: 'إلغاء',
              hi: 'रद्द करें',
              ru: 'Отмена',
              el: 'Ακύρωση',
              syc: 'ܫܕܪܘ',
              cop: 'ϣⲟⲡ ⲛⲛⲁⲓ',
              sa: 'लोपयत',
            })}
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
            }}
          >
            {L(lang, {
              ja: '保存',
              en: 'Save',
              'zh-CN': '保存',
              'zh-TW': '保存',
              ko: '저장',
              la: 'Servare',
              eo: 'Konservi',
              es: 'Guardar',
              de: 'Speichern',
              ar: 'حفظ',
              hi: 'बचाएं',
              ru: 'Сохранить',
              el: 'Αποθήκευση',
              syc: 'ܦܘܫ',
              cop: 'ⲁⲩ ⲛⲙⲟⲟⲩ',
              sa: 'रक्ष',
            })}
          </button>
        </div>
      </div>
    </div>
  )
}
