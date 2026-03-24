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

export type Language = 'ja' | 'en' | 'zh-CN' | 'zh-TW' | 'ko' | 'la' | 'eo' | 'es' | 'de' | 'ar' | 'hi'
export type TranslationParams = Record<string, string | number>

/** Display labels for the language selector */
export const LANGUAGE_LABELS: Record<Language, string> = {
  ja: '日本語',
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ko: '한국어',
  la: 'Latina',
  eo: 'Esperanto',
  es: 'Español',
  de: 'Deutsch',
  ar: 'العربية',
  hi: 'हिन्दी',
}

/** All supported language codes, in display order */
export const LANGUAGES: Language[] = ['ja', 'en', 'zh-CN', 'zh-TW', 'ko', 'es', 'de', 'ar', 'hi', 'la', 'eo']

const translations: Record<Language, Record<string, Record<string, string>>> = {
  ja,
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ko,
  la,
  eo,
  es,
  de,
  ar,
  hi,
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
  if (browserLang.startsWith('de')) return 'de'
  if (browserLang.startsWith('ar')) return 'ar'
  if (browserLang.startsWith('hi')) return 'hi'
  if (browserLang.startsWith('la')) return 'la'
  if (browserLang.startsWith('eo')) return 'eo'
  if (browserLang === 'zh-TW' || browserLang === 'zh-Hant') return 'zh-TW'
  if (browserLang.startsWith('zh')) return 'zh-CN'
  return 'ja'
}

/** Helper for inline multi-language text in components that receive `lang` prop */
export function L(lang: Language, texts: Partial<Record<Language, string>>): string {
  return texts[lang] ?? texts.en ?? texts.ja ?? ''
}
