/**
 * Ingest one FE exam year — both AM (FE-A) and PM (FE-B) sessions if present.
 *
 * Usage: bun scripts/ingest-year.ts <year-code>
 *   <year-code> = YYYY[AS], e.g. 2025A, 2022S, 2010S
 *
 * Inputs:  previous-exams/<year-code>_FE/*.pdf
 *   AM pair: *_FE-A_Questions.pdf + *_FE-A_Answer(s).pdf  (or legacy *_AM_*)
 *   PM pair: *_FE-B_Questions.pdf + *_FE-B_Answer(s).pdf  (or legacy *_PM_*)
 *
 * Outputs:
 *   AM AVIFs → yapr-assets/<year>/<season>/NN.avif        topic: "uncategorized"
 *   PM AVIFs → yapr-assets/<year>/<season>/pm/NN.avif     topic: "pm"
 *   src/data/questions/<examId>.json (one per session present)
 *   src/data/questions.ts (regenerated)
 *
 * The yapr-assets/ directory is gitignored — it's a staging area for the
 * separate public assets repo served via jsDelivr. After ingest, copy the
 * new files into your local clone of yapr-assets, commit, tag, and push.
 */

import fs from "node:fs"
import path from "node:path"
import { parseAnswersPdf, type ChoiceId } from "./lib/pdf-answers"
import {
  extractChoiceCounts,
  extractQuestionMarkers,
  cropQuestion,
} from "./lib/pdf-questions"
import {
  writeExamJson,
  regenerateAggregate,
  type DataEntry,
} from "./lib/emit-data"

const ROOT = process.cwd()
const SEASON: Record<string, string> = { A: "autumn", S: "spring" }

type Tier = "AM" | "PM"

interface SessionSpec {
  tier: Tier
  questionsPdf: string
  answersPdf: string
}

function findPair(
  files: readonly string[],
  folder: string,
  questionsRe: RegExp,
  answersRe: RegExp
): { questionsPdf: string; answersPdf: string } | null {
  const q = files.find((f) => questionsRe.test(f))
  const a = files.find((f) => answersRe.test(f))
  if (!q || !a) return null
  return {
    questionsPdf: path.join(folder, q),
    answersPdf: path.join(folder, a),
  }
}

async function main() {
  const year = process.argv[2]?.trim()
  if (!year || !/^\d{4}[AS]$/.test(year)) {
    console.error("Usage: bun scripts/ingest-year.ts <year-code>")
    console.error("  year-code format: YYYY[AS], e.g. 2025A, 2022S")
    process.exit(2)
  }

  const folder = path.join(ROOT, "previous-exams", `${year}_FE`)
  if (!fs.existsSync(folder)) {
    console.error(`Folder not found: ${folder}`)
    process.exit(1)
  }

  const files = fs.readdirSync(folder)
  const am = findPair(
    files,
    folder,
    /_(AM|FE-A)_Questions?\.pdf$/i,
    /_(AM|FE-A)_Answers?\.pdf$/i
  )
  const pm = findPair(
    files,
    folder,
    /_(PM|FE-B)_Questions?\.pdf$/i,
    /_(PM|FE-B)_Answers?\.pdf$/i
  )

  if (!am && !pm) {
    console.error(`No AM or PM PDF pairs found in ${folder}`)
    process.exit(1)
  }

  const sessions: SessionSpec[] = []
  if (am) sessions.push({ tier: "AM", ...am })
  else console.warn(`[${year}] no AM pair found — skipping AM ingest`)
  if (pm) sessions.push({ tier: "PM", ...pm })
  else console.warn(`[${year}] no PM pair found — skipping PM ingest`)

  for (const session of sessions) {
    await run({ year, session })
  }

  regenerateAggregate()
  console.log(`[${year}] aggregate → src/data/questions.ts`)
}

async function run({ year, session }: { year: string; session: SessionSpec }) {
  const examId = `${year}_FE_${session.tier}`
  console.log(
    `[${examId}] questions: ${path.relative(ROOT, session.questionsPdf)}`
  )
  console.log(
    `[${examId}] answers:   ${path.relative(ROOT, session.answersPdf)}`
  )

  const examMatch = /^(\d{4})([A-Z])_/.exec(examId)
  if (!examMatch) {
    console.error(`[${examId}] could not parse year/season from examId`)
    process.exit(1)
  }
  const yearNum = examMatch[1]
  const seasonName = SEASON[examMatch[2]]
  if (!seasonName) {
    console.error(`[${examId}] unknown season letter: ${examMatch[2]}`)
    process.exit(1)
  }

  const answers = await parseAnswersPdf(session.answersPdf)
  console.log(`[${examId}] parsed ${answers.size} answers`)

  const { markers, pages } = await extractQuestionMarkers(session.questionsPdf)
  console.log(
    `[${examId}] rendered ${pages.length} pages, found ${markers.length} question markers`
  )
  if (markers.length === 0) {
    console.error(`[${examId}] no question markers detected — aborting`)
    process.exit(1)
  }

  const tierSubdir = session.tier === "PM" ? "pm" : ""
  const outDir = path.join(ROOT, "yapr-assets", yearNum, seasonName, tierSubdir)
  fs.mkdirSync(outDir, { recursive: true })

  const imagePathPrefix =
    session.tier === "PM"
      ? `/${yearNum}/${seasonName}/pm`
      : `/${yearNum}/${seasonName}`
  const topic = session.tier === "PM" ? "pm" : "uncategorized"

  // PM choice cardinality varies per question (a–d up to a–i). AM is always 4.
  const choiceCounts =
    session.tier === "PM"
      ? await extractChoiceCounts(session.questionsPdf)
      : null
  if (choiceCounts) {
    console.log(
      `[${examId}] detected choice counts for ${choiceCounts.size} questions`
    )
  }

  const entries: DataEntry[] = []
  let missingAnswer = 0
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i]
    const next = markers[i + 1]
    const num = String(m.questionNo).padStart(2, "0")
    const id = `${examId}_${num}`
    const buf = await cropQuestion(m, next, pages)
    const outPath = path.join(outDir, `${num}.avif`)
    fs.writeFileSync(outPath, buf)
    const answer = answers.get(m.questionNo)
    if (!answer) {
      missingAnswer++
      console.warn(`[${examId}] no answer for Q${m.questionNo} — skipping`)
      continue
    }
    const entry: DataEntry = {
      id,
      topic,
      image: `${imagePathPrefix}/${num}.avif`,
      answer: answer as ChoiceId,
    }
    const choices = choiceCounts?.get(m.questionNo)
    if (choices != null) entry.choices = choices
    entries.push(entry)
  }

  writeExamJson(examId, entries)

  console.log(
    `[${examId}] wrote ${entries.length} entries (skipped ${missingAnswer} without answer)`
  )
  console.log(
    `[${examId}] AVIFs → yapr-assets/${yearNum}/${seasonName}${
      tierSubdir ? `/${tierSubdir}` : ""
    }/`
  )
  console.log(`[${examId}] JSON  → src/data/questions/${examId}.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
