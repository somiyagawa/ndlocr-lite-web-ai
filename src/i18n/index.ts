import { ja } from './ja'
import { en } from './en'
import { zhCN } from './zh-CN'
import { zhTW } from './zh-TW'
import { ko } from './ko'
import { la } from './la'
import { eo } from './eo'
import { es } from './es'
import { de } from './de'
import { ar } from './ar'
import { hi } from './hi'
import { ru } from './ru'
import { el } from './el'
import { syc } from './syc'
import { cop } from './cop'
import { sa } from './sa'
import { it } from './it'
import { pt } from './pt'
import { uk } from './uk'
import { pl } from './pl'
import { th } from './th'
import { id } from './id'
import { vi } from './vi'
import { ms } from './ms'
import { fa } from './fa'
import { he } from './he'
import { bn } from './bn'
import { ur } from './ur'
import { am } from './am'
import { my } from './my'
import { km } from './km'
import { sw } from './sw'
import { ha } from './ha'
import { xh } from './xh'
import { grc } from './grc'
import { ang } from './ang'
import { hu } from './hu'
import { cs } from './cs'
import { mt } from './mt'
import { gn } from './gn'
import { got } from './got'
import { cu } from './cu'
import { hit } from './hit'
import { akk } from './akk'
import { sux } from './sux'
import { egy } from './egy'
import { ain } from './ain'
import { ryu } from './ryu'

export type Language =
  | 'ja' | 'en' | 'zh-CN' | 'zh-TW' | 'ko'
  | 'es' | 'pt' | 'it' | 'de' | 'pl' | 'cs' | 'hu' | 'uk' | 'ru'
  | 'el' | 'grc' | 'mt'
  | 'ar' | 'fa' | 'he' | 'ur'
  | 'hi' | 'bn' | 'sa'
  | 'th' | 'vi' | 'ms' | 'id' | 'km' | 'my'
  | 'am' | 'sw' | 'ha' | 'xh'
  | 'syc' | 'cop' | 'egy'
  | 'la' | 'eo' | 'ang' | 'got' | 'cu'
  | 'gn'
  | 'akk' | 'sux' | 'hit'
  | 'ain' | 'ryu'
export type TranslationParams = Record<string, string | number>

/** Display labels for the language selector */
export const LANGUAGE_LABELS: Record<Language, string> = {
  ja: '日本語',
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ko: '한국어',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  de: 'Deutsch',
  pl: 'Polski',
  cs: 'Čeština',
  hu: 'Magyar',
  uk: 'Українська',
  ru: 'Русский',
  el: 'Ελληνικά',
  grc: 'Ἑλληνική (ἀρχ.)',
  mt: 'Malti',
  ar: 'العربية',
  fa: 'فارسی',
  he: 'עברית',
  ur: 'اردو',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  sa: 'संस्कृतम्',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  ms: 'Bahasa Melayu',
  id: 'Bahasa Indonesia',
  km: 'ភាសាខ្មែរ',
  my: 'မြန်မာဘာသာ',
  am: 'አማርኛ',
  sw: 'Kiswahili',
  ha: 'Hausa',
  xh: 'isiXhosa',
  syc: 'ܣܘܪܝܝܐ',
  cop: 'ⲙⲉⲧⲣⲉⲙⲛⲕⲏⲙⲉ',
  la: 'Latina',
  eo: 'Esperanto',
  ang: 'Englisc (eald)',
  got: '𐌲𐌿𐍄𐌹𐍃𐌺',
  cu: 'Словѣ́ньскъ',
  gn: "Avañe'ẽ",
  akk: '𒀝𒅗𒁺𒌑 (Akkadû)',
  sux: '𒅴𒂠 (Emegir)',
  hit: '𒉈𒅆𒇷 (Nešili)',
  egy: '𓂋𓏤𓈖𓆎𓅓𓏏 (Mdw-nṯr)',
  ain: 'アイヌ イタㇰ',
  ryu: 'ウチナーグチ',
}

/** All supported language codes, in display order */
export const LANGUAGES: Language[] = [
  'ja', 'en', 'zh-CN', 'zh-TW', 'ko',
  'es', 'pt', 'it', 'de', 'pl', 'cs', 'hu', 'uk', 'ru',
  'el', 'grc', 'mt',
  'ar', 'fa', 'he', 'ur',
  'hi', 'bn', 'sa',
  'th', 'vi', 'ms', 'id', 'km', 'my',
  'am', 'sw', 'ha', 'xh',
  'syc', 'cop',
  'la', 'eo', 'ang', 'got', 'cu',
  'gn',
  'akk', 'sux', 'hit', 'egy',
  'ain', 'ryu',
]

const translations: Record<Language, Record<string, Record<string, string>>> = {
  ja, en,
  'zh-CN': zhCN, 'zh-TW': zhTW,
  ko, es, pt, it, de, pl, cs, hu, uk, ru,
  el, grc, mt,
  ar, fa, he, ur,
  hi, bn, sa,
  th, vi, ms, id, km, my,
  am, sw, ha, xh,
  syc, cop, egy,
  la, eo, ang, got, cu,
  gn,
  akk, sux, hit,
  ain, ryu,
}

function getNestedValue(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return key
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : key
}

export function createTranslator(lang: Language) {
  return function t(key: string, params?: TranslationParams): string {
    let text = getNestedValue(translations[lang] as unknown as Record<string, unknown>, key)
    // Fallback to English if key not found in target language
    if (text === key && lang !== 'en') {
      text = getNestedValue(translations.en as unknown as Record<string, unknown>, key)
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }
}

export const LANG_STORAGE_KEY = 'ndlocrlite_lang'

export function getStoredLang(): Language {
  const stored = localStorage.getItem(LANG_STORAGE_KEY)
  if (stored && LANGUAGES.includes(stored as Language)) return stored as Language
  // Try to detect from browser locale
  const browserLang = navigator.language
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('ko')) return 'ko'
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('pt')) return 'pt'
  if (browserLang.startsWith('it')) return 'it'
  if (browserLang.startsWith('de')) return 'de'
  if (browserLang.startsWith('pl')) return 'pl'
  if (browserLang.startsWith('cs')) return 'cs'
  if (browserLang.startsWith('hu')) return 'hu'
  if (browserLang.startsWith('uk')) return 'uk'
  if (browserLang.startsWith('ru')) return 'ru'
  if (browserLang.startsWith('el')) return 'el'
  if (browserLang.startsWith('ar')) return 'ar'
  if (browserLang.startsWith('fa')) return 'fa'
  if (browserLang.startsWith('he')) return 'he'
  if (browserLang.startsWith('ur')) return 'ur'
  if (browserLang.startsWith('hi')) return 'hi'
  if (browserLang.startsWith('bn')) return 'bn'
  if (browserLang.startsWith('sa')) return 'sa'
  if (browserLang.startsWith('th')) return 'th'
  if (browserLang.startsWith('vi')) return 'vi'
  if (browserLang.startsWith('ms')) return 'ms'
  if (browserLang.startsWith('id')) return 'id'
  if (browserLang.startsWith('km')) return 'km'
  if (browserLang.startsWith('my')) return 'my'
  if (browserLang.startsWith('am')) return 'am'
  if (browserLang.startsWith('sw')) return 'sw'
  if (browserLang.startsWith('ha')) return 'ha'
  if (browserLang.startsWith('xh')) return 'xh'
  if (browserLang.startsWith('mt')) return 'mt'
  if (browserLang.startsWith('la')) return 'la'
  if (browserLang.startsWith('eo')) return 'eo'
  if (browserLang.startsWith('gn')) return 'gn'
  if (browserLang === 'zh-TW' || browserLang === 'zh-Hant') return 'zh-TW'
  if (browserLang.startsWith('zh')) return 'zh-CN'
  return 'ja'
}

/**
 * Reverse-lookup cache: text value → translation file dot-key (e.g. "upload.startButton")
 * Indexes both English and Japanese values for maximum coverage.
 * Built lazily on first L() miss to avoid startup cost.
 */
let _reverseMap: Map<string, string> | null = null
function getReverseMap(): Map<string, string> {
  if (_reverseMap) return _reverseMap
  _reverseMap = new Map()
  // Index both en and ja for broader matching
  for (const srcLang of ['en', 'ja'] as const) {
    const trans = translations[srcLang]
    for (const section of Object.keys(trans)) {
      const sectionObj = trans[section]
      if (!sectionObj || typeof sectionObj !== 'object') continue
      for (const key of Object.keys(sectionObj)) {
        const dotKey = `${section}.${key}`
        // Don't overwrite — en takes priority
        if (!_reverseMap.has(sectionObj[key])) {
          _reverseMap.set(sectionObj[key], dotKey)
        }
      }
    }
  }
  return _reverseMap
}

/**
 * Helper for inline multi-language text in components that receive `lang` prop.
 *
 * Fallback chain:
 *   1. texts[lang]              — インライン定義にその言語がある場合
 *   2. reverse-lookup (en text) — texts.en を翻訳ファイルのキーに逆引き
 *   3. reverse-lookup (ja text) — texts.ja を翻訳ファイルのキーに逆引き
 *   4. texts.en                 — 英語テキスト
 *   5. texts.ja                 — 日本語テキスト
 */
export function L(lang: Language, texts: Partial<Record<Language, string>>): string {
  // 1. Direct match in inline texts
  if (texts[lang] != null) return texts[lang]!

  // 2. Try reverse lookup from en text, then ja text
  if (lang !== 'en' && lang !== 'ja') {
    const reverseMap = getReverseMap()
    // Try English first, then Japanese
    for (const probe of [texts.en, texts.ja]) {
      if (!probe) continue
      const dotKey = reverseMap.get(probe)
      if (dotKey) {
        const resolved = getNestedValue(
          translations[lang] as unknown as Record<string, unknown>,
          dotKey
        )
        if (resolved !== dotKey) return resolved
      }
    }
  }

  // 3. Fallback to English or Japanese
  return texts.en ?? texts.ja ?? ''
}
