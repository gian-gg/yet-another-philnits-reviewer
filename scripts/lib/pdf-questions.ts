import fs from "node:fs"
import { createCanvas } from "@napi-rs/canvas"
import sharp from "sharp"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"

const SCALE = 2
const LEFT_MARGIN_MAX = 0.15 // marker must be within left 15% of page width
const PAD_TOP = 40 // px padding above marker baseline (image coords @ SCALE)

export interface QuestionMarker {
  questionNo: number
  page: number
  /** Y top in PDF units (origin bottom-left). */
  yTop: number
}

export interface RenderedPage {
  page: number
  /** Rendered PNG buffer of the full page at SCALE. */
  buffer: Buffer
  width: number
  height: number
  /** PDF viewport height at scale=1 (needed to convert PDF y to image y). */
  pdfHeight: number
}

export async function extractQuestionMarkers(
  pdfPath: string
): Promise<{ markers: QuestionMarker[]; pages: RenderedPage[] }> {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc = await pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    isEvalSupported: false,
  }).promise

  const markers: QuestionMarker[] = []
  const pages: RenderedPage[] = []

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const viewport1 = page.getViewport({ scale: 1 })

    // Extract markers on this page
    const tc = await page.getTextContent()
    for (const it of tc.items) {
      if (!("str" in it)) continue
      const str = (it.str as string)?.trim()
      if (!str) continue
      const m = str.match(/^Q(\d{1,3})\.?$/)
      if (!m) continue
      const transform = (it as { transform: number[] }).transform
      const x = transform[4]
      const yTop = transform[5]
      if (x / viewport1.width > LEFT_MARGIN_MAX) continue
      const n = Number.parseInt(m[1], 10)
      if (!Number.isFinite(n) || n < 1 || n > 200) continue
      markers.push({ questionNo: n, page: p, yTop })
    }

    // Render this page at SCALE
    const viewport = page.getViewport({ scale: SCALE })
    const width = Math.ceil(viewport.width)
    const height = Math.ceil(viewport.height)
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, width, height)
    await page.render({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvasContext: ctx as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas: canvas as any,
      viewport,
    }).promise
    const png = await sharp(canvas.toBuffer("image/png"))
      .png({ compressionLevel: 9 })
      .toBuffer()
    pages.push({
      page: p,
      buffer: png,
      width,
      height,
      pdfHeight: viewport1.height,
    })
  }

  // Deduplicate markers (same question detected twice). Keep earliest (highest yTop).
  const byQ = new Map<number, QuestionMarker>()
  for (const m of markers) {
    const existing = byQ.get(m.questionNo)
    if (
      !existing ||
      m.page < existing.page ||
      (m.page === existing.page && m.yTop > existing.yTop)
    ) {
      byQ.set(m.questionNo, m)
    }
  }
  const sorted = [...byQ.values()].sort((a, b) => a.questionNo - b.questionNo)

  return { markers: sorted, pages }
}

/**
 * Crop one question's image from the rendered pages.
 * If the question spans pages (next marker is on a later page), stitch slices
 * vertically.
 */
export async function cropQuestion(
  marker: QuestionMarker,
  next: QuestionMarker | undefined,
  pages: readonly RenderedPage[]
): Promise<Buffer> {
  const page = pages.find((p) => p.page === marker.page)
  if (!page) throw new Error(`Missing rendered page ${marker.page}`)

  const toImageY = (pdfY: number, pdfHeight: number, imgHeight: number) =>
    Math.round((pdfHeight - pdfY) * (imgHeight / pdfHeight))

  const startY = Math.max(
    0,
    toImageY(marker.yTop, page.pdfHeight, page.height) - PAD_TOP
  )

  // Same page?
  if (!next || next.page === marker.page) {
    const endY = next
      ? Math.min(
          page.height,
          toImageY(next.yTop, page.pdfHeight, page.height) - PAD_TOP
        )
      : page.height
    const h = Math.max(1, endY - startY)
    return sharp(page.buffer)
      .extract({ left: 0, top: startY, width: page.width, height: h })
      .avif({ quality: 80, effort: 6 })
      .toBuffer()
  }

  // Spans pages — collect slices.
  const slices: Buffer[] = []
  const firstH = page.height - startY
  slices.push(
    await sharp(page.buffer)
      .extract({ left: 0, top: startY, width: page.width, height: firstH })
      .png()
      .toBuffer()
  )

  for (let p = marker.page + 1; p < next.page; p++) {
    const mid = pages.find((x) => x.page === p)
    if (!mid) continue
    slices.push(mid.buffer)
  }

  const last = pages.find((p) => p.page === next.page)
  if (last) {
    const endY = Math.min(
      last.height,
      toImageY(next.yTop, last.pdfHeight, last.height) - PAD_TOP
    )
    if (endY > 0) {
      slices.push(
        await sharp(last.buffer)
          .extract({ left: 0, top: 0, width: last.width, height: endY })
          .png()
          .toBuffer()
      )
    }
  }

  // Stitch vertically — assume uniform width (all pages share PDF size).
  const width = page.width
  const totals = await Promise.all(slices.map((b) => sharp(b).metadata()))
  const totalH = totals.reduce((s, m) => s + (m.height ?? 0), 0)
  const composite: sharp.OverlayOptions[] = []
  let y = 0
  for (let i = 0; i < slices.length; i++) {
    composite.push({ input: slices[i], top: y, left: 0 })
    y += totals[i].height ?? 0
  }
  return sharp({
    create: {
      width,
      height: totalH,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composite)
    .avif({ quality: 80, effort: 6 })
    .toBuffer()
}
