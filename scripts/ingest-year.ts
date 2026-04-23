/**
 * Ingest one FE exam year.
 *
 * Usage: bun scripts/ingest-year.ts <year-code>
 *   <year-code> = YYYY[AS], e.g. 2025A, 2022S, 2010S
 *
 * Input:  previous-exams/<year-code>_FE/*.pdf
 * Output: public/questions/<examId>_NN.png
 *         src/data/questions/<examId>.json
 *         src/data/questions.ts  (regenerated)
 */

import fs from "node:fs"
import path from "node:path"
import { parseAnswersPdf, type ChoiceId } from "./lib/pdf-answers"
import { extractQuestionMarkers, cropQuestion } from "./lib/pdf-questions"
import {
  writeExamJson,
  regenerateAggregate,
  type DataEntry,
} from "./lib/emit-data"

const ROOT = process.cwd()

function main() {
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
  const questionsPdf = files.find((f) => /_(AM|FE-A)_Questions?\.pdf$/i.test(f))
  const answersPdf = files.find((f) => /_(AM|FE-A)_Answers?\.pdf$/i.test(f))

  if (!questionsPdf || !answersPdf) {
    console.error(
      `Could not find MCQ PDFs in ${folder}\n` +
        `  questions: ${questionsPdf ?? "MISSING"}\n` +
        `  answers:   ${answersPdf ?? "MISSING"}`
    )
    process.exit(1)
  }

  const examId = `${year}_FE_AM`
  return run({
    examId,
    questionsPdf: path.join(folder, questionsPdf),
    answersPdf: path.join(folder, answersPdf),
  })
}

async function run(opts: {
  examId: string
  questionsPdf: string
  answersPdf: string
}) {
  const { examId, questionsPdf, answersPdf } = opts
  console.log(`[${examId}] questions: ${path.relative(ROOT, questionsPdf)}`)
  console.log(`[${examId}] answers:   ${path.relative(ROOT, answersPdf)}`)

  const answers = await parseAnswersPdf(answersPdf)
  console.log(`[${examId}] parsed ${answers.size} answers`)

  const { markers, pages } = await extractQuestionMarkers(questionsPdf)
  console.log(
    `[${examId}] rendered ${pages.length} pages, found ${markers.length} question markers`
  )
  if (markers.length === 0) {
    console.error(`[${examId}] no question markers detected — aborting`)
    process.exit(1)
  }

  const outDir = path.join(ROOT, "public", "questions")
  fs.mkdirSync(outDir, { recursive: true })

  const entries: DataEntry[] = []
  let missingAnswer = 0
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i]
    const next = markers[i + 1]
    const id = `${examId}_${String(m.questionNo).padStart(2, "0")}`
    const png = await cropQuestion(m, next, pages)
    const outPath = path.join(outDir, `${id}.png`)
    fs.writeFileSync(outPath, png)
    const answer = answers.get(m.questionNo)
    if (!answer) {
      missingAnswer++
      console.warn(`[${examId}] no answer for Q${m.questionNo} — skipping`)
      continue
    }
    entries.push({
      id,
      topic: "uncategorized",
      image: `/questions/${id}.png`,
      answer: answer as ChoiceId,
    })
  }

  writeExamJson(examId, entries)
  regenerateAggregate()

  console.log(
    `[${examId}] wrote ${entries.length} entries (skipped ${missingAnswer} without answer)`
  )
  console.log(`[${examId}] PNGs → public/questions/`)
  console.log(`[${examId}] JSON  → src/data/questions/${examId}.json`)
  console.log(`[${examId}] aggregate → src/data/questions.ts`)
}

main()?.catch((err) => {
  console.error(err)
  process.exit(1)
})
