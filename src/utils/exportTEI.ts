/**
 * TEI XML (P5) エクスポート
 *
 * OCR結果をTEI P5準拠のXMLとして出力する。
 * <facsimile> に画像・テキスト行の座標を記録し、
 * <body> に読み順で整列されたテキストを <ab>/<lb> で構造化する。
 *
 * 参考: https://tei-c.org/release/doc/tei-p5-doc/en/html/PH.html
 */

import type { OCRResult, TextBlock, PageBlock, TEIMetadata } from '../types/ocr'
import { triggerBlobDownload } from './textExport'

/** XMLの特殊文字をエスケープ */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * OCRResult → TEI P5 XML 文字列
 */
export function generateTEI(result: OCRResult, metadata?: TEIMetadata): string {
  const now = new Date().toISOString()
  const fileName = escapeXml(result.fileName)

  // テキストブロックを読み順にソート
  const sortedBlocks = [...result.textBlocks].sort((a, b) => a.readingOrder - b.readingOrder)

  // <facsimile> 内の <zone> 要素群
  const zones = sortedBlocks.map((block, i) => {
    const zoneId = `zone_${i + 1}`
    return `      <zone xml:id="${zoneId}" ulx="${Math.round(block.x)}" uly="${Math.round(block.y)}" lrx="${Math.round(block.x + block.width)}" lry="${Math.round(block.y + block.height)}"/>`
  }).join('\n')

  // <body> 内: PageBlock があれば <div type="column"> で囲み、なければ単一 <div>
  const bodyContent = buildBodyContent(sortedBlocks, result.pageBlocks)

  // Build titleStmt
  const titleStmtContent = buildTitleStmt(fileName, metadata)

  // Build publicationStmt
  const publicationStmtContent = buildPublicationStmt(metadata)

  // Build sourceDesc
  const sourceDescContent = buildSourceDesc(fileName, now, metadata)

  // Build profileDesc
  const profileDescContent = metadata?.language ? `    <profileDesc>
      <langUsage>
        <language ident="${escapeXml(metadata.language)}">${escapeXml(metadata.language)}</language>
      </langUsage>
    </profileDesc>` : ''

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
${titleStmtContent}
      </titleStmt>
      <publicationStmt>
${publicationStmtContent}
      </publicationStmt>
      <sourceDesc>
${sourceDescContent}
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <appInfo>
        <application ident="ndlocr-lite-web-ai" version="3.6.0">
          <label>NDLOCR-lite Web AI: Ultra Bluepond</label>
        </application>
      </appInfo>
    </encodingDesc>
${profileDescContent}
  </teiHeader>
  <facsimile>
    <surface>
${zones}
    </surface>
  </facsimile>
  <text>
    <body>
${bodyContent}
    </body>
  </text>
</TEI>
`
  return xml
}

/**
 * テキストブロックを <ab> 要素に変換して body コンテンツを構成。
 * PageBlock がある場合は <div type="column"> でグルーピングする。
 */
function buildBodyContent(blocks: TextBlock[], pageBlocks?: PageBlock[]): string {
  if (!pageBlocks || pageBlocks.length === 0) {
    // ページブロックなし: 単一 <div> にすべての行を格納
    const lines = blocks.map((block, i) => {
      const zoneRef = `#zone_${i + 1}`
      return `        <ab facs="${zoneRef}">${escapeXml(block.text)}</ab>`
    })
    return `      <div>\n${lines.join('\n')}\n      </div>`
  }

  // ページブロックあり: 各ブロックがどのカラムに属するか判定
  const columns: Map<number, { block: TextBlock; zoneIndex: number }[]> = new Map()
  blocks.forEach((block, i) => {
    const colIdx = findContainingPageBlock(block, pageBlocks)
    if (!columns.has(colIdx)) columns.set(colIdx, [])
    columns.get(colIdx)!.push({ block, zoneIndex: i })
  })

  const divs: string[] = []
  const sortedKeys = [...columns.keys()].sort((a, b) => a - b)
  for (const colIdx of sortedKeys) {
    const entries = columns.get(colIdx)!
    const lines = entries.map(({ block, zoneIndex }) => {
      const zoneRef = `#zone_${zoneIndex + 1}`
      return `          <ab facs="${zoneRef}">${escapeXml(block.text)}</ab>`
    })
    divs.push(`      <div type="column" n="${colIdx + 1}">\n${lines.join('\n')}\n      </div>`)
  }
  return divs.join('\n')
}

/** テキストブロックの中心が含まれるPageBlockのインデックスを返す */
function findContainingPageBlock(block: TextBlock, pageBlocks: PageBlock[]): number {
  const cx = block.x + block.width / 2
  const cy = block.y + block.height / 2
  for (let i = 0; i < pageBlocks.length; i++) {
    const pb = pageBlocks[i]
    if (cx >= pb.x && cx <= pb.x + pb.width && cy >= pb.y && cy <= pb.y + pb.height) {
      return i
    }
  }
  return 0 // どのブロックにも入らなければ最初のカラムに帰属
}

/**
 * Build titleStmt XML content from metadata
 */
function buildTitleStmt(fileName: string, metadata?: TEIMetadata): string {
  const lines: string[] = []

  if (metadata?.title) {
    lines.push(`        <title>${escapeXml(metadata.title)}</title>`)
  } else {
    lines.push(`        <title>OCR output: ${fileName}</title>`)
  }

  if (metadata?.author) {
    lines.push(`        <author>${escapeXml(metadata.author)}</author>`)
  }

  if (metadata?.editor) {
    lines.push(`        <editor>${escapeXml(metadata.editor)}</editor>`)
  }

  return lines.join('\n')
}

/**
 * Build publicationStmt XML content from metadata
 */
function buildPublicationStmt(metadata?: TEIMetadata): string {
  const lines: string[] = []

  if (metadata?.publisher) {
    lines.push(`        <publisher>${escapeXml(metadata.publisher)}</publisher>`)
  }

  if (metadata?.date) {
    lines.push(`        <date>${escapeXml(metadata.date)}</date>`)
  }

  if (!metadata?.publisher && !metadata?.date) {
    lines.push(`        <p>Generated by NDLOCR-lite Web AI: Ultra Bluepond</p>`)
  }

  return lines.join('\n')
}

/**
 * Build sourceDesc XML content from metadata
 */
function buildSourceDesc(fileName: string, now: string, metadata?: TEIMetadata, isBatch: boolean = false): string {
  const lines: string[] = []

  if (metadata?.sourceInstitution || metadata?.sourceIdno) {
    lines.push(`        <msDesc>`)
    lines.push(`          <msIdentifier>`)
    if (metadata?.sourceInstitution) {
      lines.push(`            <institution>${escapeXml(metadata.sourceInstitution)}</institution>`)
    }
    if (metadata?.sourceIdno) {
      lines.push(`            <idno>${escapeXml(metadata.sourceIdno)}</idno>`)
    }
    lines.push(`          </msIdentifier>`)
    lines.push(`        </msDesc>`)
  }

  if (metadata?.notes) {
    lines.push(`        <p>${escapeXml(metadata.notes)}</p>`)
  }

  if (lines.length === 0) {
    if (isBatch) {
      lines.push(`        <p>Generated by NDLOCR-lite Web AI: Ultra Bluepond</p>`)
    } else {
      lines.push(`        <p>OCR of ${fileName}, processed at ${now}</p>`)
    }
  }

  return lines.join('\n')
}

/**
 * TEI XML をファイルとしてダウンロード
 */
export function downloadTEI(result: OCRResult, metadata?: TEIMetadata): void {
  const xml = generateTEI(result, metadata)
  const baseName = result.fileName.replace(/\.[^/.]+$/, '')
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  triggerBlobDownload(url, `${baseName}_ocr.xml`)
}

/**
 * 複数ページのOCR結果を1つのTEI XMLファイルとしてダウンロード
 * 各ページを <div type="page"> としてまとめる
 */
export function downloadBatchTEI(results: OCRResult[], metadata?: TEIMetadata): void {
  if (results.length === 0) return
  const now = new Date().toISOString()

  const pages = results.map((result, pageIdx) => {
    const sortedBlocks = [...result.textBlocks].sort((a, b) => a.readingOrder - b.readingOrder)
    const lines = sortedBlocks.map((block) => {
      return `          <ab>${escapeXml(block.text)}</ab>`
    })
    return `      <div type="page" n="${pageIdx + 1}">
        <head>${escapeXml(result.fileName)}</head>
${lines.join('\n')}
      </div>`
  })

  // Build titleStmt for batch
  const titleStmtContent = metadata?.title
    ? `        <title>${escapeXml(metadata.title)}</title>`
    : `        <title>OCR output: ${results.length} pages</title>`

  // Build publicationStmt for batch
  const publicationStmtContent = buildPublicationStmt(metadata)

  // Build sourceDesc for batch
  const sourceDescContent = metadata && (metadata.sourceInstitution || metadata.sourceIdno || metadata.notes)
    ? buildSourceDesc('', now, metadata, true)
    : `        <p>Batch OCR of ${results.length} pages, processed at ${now}</p>`

  // Build profileDesc for batch
  const profileDescContent = metadata?.language ? `    <profileDesc>
      <langUsage>
        <language ident="${escapeXml(metadata.language)}">${escapeXml(metadata.language)}</language>
      </langUsage>
    </profileDesc>` : ''

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
${titleStmtContent}
      </titleStmt>
      <publicationStmt>
${publicationStmtContent}
      </publicationStmt>
      <sourceDesc>
${sourceDescContent}
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <appInfo>
        <application ident="ndlocr-lite-web-ai" version="3.6.0">
          <label>NDLOCR-lite Web AI: Ultra Bluepond</label>
        </application>
      </appInfo>
    </encodingDesc>
${profileDescContent}
  </teiHeader>
  <text>
    <body>
${pages.join('\n')}
    </body>
  </text>
</TEI>
`
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  triggerBlobDownload(url, 'ocr_all_pages.xml')
}
