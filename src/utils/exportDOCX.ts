/**
 * DOCX エクスポート
 *
 * OCR結果をWord文書（.docx）としてダウンロードする。
 * docx-js (npm: docx) を使用してブラウザ内で生成。
 */

import { triggerBlobDownload } from './textExport'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  AlignmentType,
  PageNumber,
} from 'docx'
import type { OCRResult } from '../types/ocr'

/**
 * OCR結果からDOCX文書を生成・ダウンロード
 *
 * @param result - OCR結果
 * @param options - オプション（ファイル名ヘッダー、改行除去）
 */
export async function downloadDOCX(
  result: OCRResult,
  options?: {
    includeFileName?: boolean
    ignoreNewlines?: boolean
  }
): Promise<void> {
  const { includeFileName = false, ignoreNewlines = false } = options ?? {}

  let text = result.fullText
  if (ignoreNewlines) {
    text = text.replace(/\n/g, '')
  }

  // テキストを段落に分割（空行も保持）
  const lines = text.split('\n')

  const children: Paragraph[] = []

  // ファイル名ヘッダー
  if (includeFileName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `=== ${result.fileName} ===`,
            bold: true,
            size: 24, // 12pt
            font: 'Yu Mincho',
          }),
        ],
        spacing: { after: 200 },
      })
    )
  }

  // 本文段落
  for (const line of lines) {
    if (line.trim() === '') {
      // 空行
      children.push(new Paragraph({ children: [] }))
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
              font: 'Yu Mincho',
            }),
          ],
          spacing: { line: 360 }, // 1.5倍行間
        })
      )
    }
  }

  const baseName = result.fileName.replace(/\.[^/.]+$/, '')

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Yu Mincho',
            size: 24, // 12pt
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4
              height: 16838,
            },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${baseName} — NDL(Kotenseki)OCR-lite Web AI`,
                    size: 16, // 8pt
                    color: '999999',
                    font: 'Yu Gothic',
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '999999',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  // Blob生成 & ダウンロード
  const buffer = await Packer.toBlob(doc)
  const url = URL.createObjectURL(buffer)
  triggerBlobDownload(url, `${baseName}_ocr.docx`)
}
