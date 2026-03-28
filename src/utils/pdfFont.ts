/**
 * PDF エクスポート用 CJK フォントローダー
 *
 * Noto Sans JP SubsetOTF（日本語サブセット、約 4.3 MB）を
 * CDN から直接取得し、IndexedDB にキャッシュする。
 *
 * 旧実装では Google Fonts CSS2 API を使用していたが、
 * CSS2 API は CJK フォントを 100 以上の unicode-range スライスに
 * 分割して返すため、最初のスライスのみしか取得できず、
 * 大半の日本語グリフが欠落していた。
 * 完全な OTF ファイルを直接取得することでこの問題を解決する。
 */

const FONT_CACHE_DB = 'pdf-font-cache'
const FONT_CACHE_STORE = 'fonts'
// キャッシュキーを変更して旧キャッシュ（壊れた woff2 スライス）を無効化
const FONT_KEY = 'NotoSansJP-Regular-SubsetOTF-v3'

/**
 * CDN URL リスト（フォールバック順）
 *
 * 1. jsDelivr — notofonts/noto-cjk リポジトリ SubsetOTF/JP（〜4.3 MB）
 * 2. jsDelivr — notofonts/noto-cjk フル OTF（〜16 MB、フォールバック）
 */
const FONT_URLS = [
  'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/JP/NotoSansJP-Regular.otf',
  'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf',
]

// ---- IndexedDB キャッシュ ----

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FONT_CACHE_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(FONT_CACHE_STORE)) {
        db.createObjectStore(FONT_CACHE_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getCachedFont(): Promise<ArrayBuffer | null> {
  try {
    const db = await openCacheDB()
    return new Promise((resolve) => {
      const tx = db.transaction(FONT_CACHE_STORE, 'readonly')
      const store = tx.objectStore(FONT_CACHE_STORE)
      const getReq = store.get(FONT_KEY)
      getReq.onsuccess = () => resolve(getReq.result ?? null)
      getReq.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function cacheFont(data: ArrayBuffer): Promise<void> {
  try {
    const db = await openCacheDB()
    return new Promise((resolve) => {
      const tx = db.transaction(FONT_CACHE_STORE, 'readwrite')
      const store = tx.objectStore(FONT_CACHE_STORE)
      store.put(data, FONT_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // キャッシュ失敗は無視（次回再取得すればよい）
  }
}

// ---- メモリ内キャッシュ ----
let fontBytesCache: ArrayBuffer | null = null

/**
 * Noto Sans JP フォントバイナリを取得する。
 *
 * 優先順位:
 *   1. メモリキャッシュ
 *   2. IndexedDB キャッシュ
 *   3. CDN からフェッチ → IndexedDB に保存
 *
 * @returns フォントの ArrayBuffer。失敗時は null。
 */
export async function loadCJKFontBytes(): Promise<ArrayBuffer | null> {
  // メモリキャッシュ
  if (fontBytesCache) return fontBytesCache

  try {
    // IndexedDB キャッシュ
    const cached = await getCachedFont()
    if (cached && cached.byteLength > 100_000) {
      console.log(`[pdfFont] CJK font loaded from cache: ${(cached.byteLength / 1024).toFixed(0)} KB`)
      fontBytesCache = cached
      return cached
    }

    // CDN から直接 OTF をフェッチ（フォールバック付き）
    for (const url of FONT_URLS) {
      try {
        console.log('[pdfFont] Fetching CJK font from:', url)
        const res = await fetch(url, { mode: 'cors' })
        if (!res.ok) {
          console.warn(`[pdfFont] Font fetch failed (${res.status}): ${url}`)
          continue
        }

        const data = await res.arrayBuffer()
        // OTF ファイルは最低でも数百 KB はある
        if (data.byteLength < 100_000) {
          console.warn(`[pdfFont] Font data too small (${data.byteLength} bytes): ${url}`)
          continue
        }

        console.log(`[pdfFont] CJK font loaded: ${(data.byteLength / 1024 / 1024).toFixed(1)} MB from ${url}`)

        // キャッシュに保存
        await cacheFont(data)
        fontBytesCache = data
        return data
      } catch (e) {
        console.warn(`[pdfFont] Failed to fetch from ${url}:`, e)
        continue
      }
    }

    console.warn('[pdfFont] All CJK font sources failed')
    return null
  } catch (e) {
    console.warn('[pdfFont] CJK font loading failed:', e)
    return null
  }
}
