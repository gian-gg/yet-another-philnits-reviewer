import fs from "node:fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"

export type ChoiceId = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i"

export async function parseAnswersPdf(
  pdfPath: string
): Promise<Map<number, ChoiceId>> {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc = await pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    isEvalSupported: false,
  }).promise

  let fullText = ""
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    fullText +=
      " " +
      tc.items.map((it) => ("str" in it ? (it.str as string) : "")).join(" ")
  }

  const answers = new Map<number, ChoiceId>()
  // Match both "1 a" and "Q1 a" (also tolerates periods: "Q1." or "1.")
  const re = /(?:Q)?(\d{1,3})\.?\s+([a-i])\b/gi
  for (const m of fullText.matchAll(re)) {
    const n = Number.parseInt(m[1], 10)
    const letter = m[2].toLowerCase() as ChoiceId
    // Guard against the "40th" / "33rd" header matching — check neighbors.
    // Already filtered by \b + required letter.
    if (!Number.isFinite(n) || n < 1 || n > 120) continue
    if (!answers.has(n)) answers.set(n, letter)
  }

  return answers
}
