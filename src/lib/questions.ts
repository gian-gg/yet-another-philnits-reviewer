import fs from "node:fs"
import path from "node:path"

import { isTopicId, type TopicId } from "./topics"

export type ChoiceId = "a" | "b" | "c" | "d"

export interface Choice {
  id: ChoiceId
  text: string
}

export interface Question {
  id: string
  topic: TopicId
  prompt: string
  choices: Choice[]
  answerId: ChoiceId
  explanation: string
}

export interface GetQuestionsOptions {
  topics?: readonly TopicId[] | "all"
  count: number
  seed?: number
}

// ---------- URL param parsers ----------

export function parseTopicsParam(
  raw: string | null | undefined
): TopicId[] | "all" {
  if (!raw || raw === "all") return "all"
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is TopicId => isTopicId(s))
  return ids.length > 0 ? ids : "all"
}

export function parseCountParam(
  raw: string | null | undefined,
  fallback: number,
  { min = 1, max = 200 }: { min?: number; max?: number } = {}
): number {
  const parsed = Number.parseInt(raw ?? "", 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

// ---------- Markdown parser ----------

const CHOICE_RE = /^([a-d])\)\s+(.+)$/
const OBSIDIAN_COMMENT = /%%[\s\S]*?%%/g

function stripComments(src: string): string {
  return src.replace(OBSIDIAN_COMMENT, "").replace(/[ \t]+$/gm, "")
}

interface ParsedQuestion {
  id: string
  topic: TopicId
  prompt: string
  choices: Choice[]
  answerId: ChoiceId
  explanation: string
}

function parseQuestionFile(
  source: string,
  topic: TopicId
): ParsedQuestion | null {
  const cleaned = stripComments(source)
  const lines = cleaned.split(/\r?\n/)

  // 1. Header metadata block ends at first blank line.
  let i = 0
  while (i < lines.length && lines[i].trim() !== "") i++
  // Skip blank lines
  while (i < lines.length && lines[i].trim() === "") i++

  // 2. H1 id
  let id: string | null = null
  for (; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(\S+)/)
    if (m) {
      id = m[1].trim()
      i++
      break
    }
  }
  if (!id) return null

  // 3. Prompt until first choice line
  const promptLines: string[] = []
  for (; i < lines.length; i++) {
    if (CHOICE_RE.test(lines[i].trim())) break
    promptLines.push(lines[i])
  }
  const prompt = promptLines.join("\n").trim()
  if (!prompt) return null

  // 4. Choices until a lone `?`
  const choices: Choice[] = []
  for (; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === "?") {
      i++
      break
    }
    const m = line.match(CHOICE_RE)
    if (m) {
      choices.push({ id: m[1] as ChoiceId, text: m[2].trim() })
    }
  }
  if (choices.length < 2) return null

  // 5. Answer line — first non-empty line matching choice pattern
  let answerId: ChoiceId | null = null
  for (; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const m = line.match(CHOICE_RE)
    if (m) {
      answerId = m[1] as ChoiceId
      i++
      break
    }
    // Anything else on this line means no answer was provided
    break
  }
  if (!answerId) return null
  if (!choices.some((c) => c.id === answerId)) return null

  // 6. Explanation under `### Explanation` until next `###` or EOF
  let explanation = ""
  for (; i < lines.length; i++) {
    if (/^###\s+Explanation\b/i.test(lines[i].trim())) {
      i++
      const buf: string[] = []
      for (; i < lines.length; i++) {
        if (/^###/.test(lines[i].trim())) break
        if (/^#\s/.test(lines[i].trim())) break
        buf.push(lines[i])
      }
      explanation = buf.join("\n").trim()
      break
    }
  }

  return {
    id,
    topic,
    prompt,
    choices,
    answerId,
    explanation,
  }
}

// ---------- Bank loader (cached) ----------

const QUESTIONS_DIR = path.join(process.cwd(), "questions")

let cachedBank: readonly Question[] | null = null

function loadBank(): readonly Question[] {
  if (cachedBank) return cachedBank

  const bank: Question[] = []

  let topicDirs: string[] = []
  try {
    topicDirs = fs
      .readdirSync(QUESTIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  } catch {
    cachedBank = []
    return cachedBank
  }

  for (const dirName of topicDirs) {
    if (!isTopicId(dirName)) continue
    const topic = dirName
    const topicPath = path.join(QUESTIONS_DIR, dirName)
    const files = fs.readdirSync(topicPath).filter((f) => f.endsWith(".md"))
    for (const file of files) {
      const source = fs.readFileSync(path.join(topicPath, file), "utf8")
      const parsed = parseQuestionFile(source, topic)
      if (!parsed) continue
      const stem = file.replace(/\.md$/, "")
      if (parsed.id !== stem) {
        // id must match filename; skip mismatched to keep uniqueness invariant.
        continue
      }
      bank.push(parsed)
    }
  }

  cachedBank = bank
  return bank
}

// ---------- Deterministic shuffle ----------

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ---------- Public API ----------

export function getQuestions({
  topics,
  count,
  seed = Date.now() & 0xffffffff,
}: GetQuestionsOptions): Question[] {
  const rand = mulberry32(seed)
  const bank = loadBank()
  const pool =
    !topics || topics === "all"
      ? bank.slice()
      : bank.filter((q) => topics.includes(q.topic))

  // Enforce the filter: if nothing matches, return an empty pool rather than
  // silently falling back to the full bank.
  if (pool.length === 0) return []

  const shuffled = shuffle(pool, rand)

  // Cycle with suffixed ids if the bank is smaller than requested count.
  const out: Question[] = []
  for (let i = 0; i < count; i++) {
    const base = shuffled[i % shuffled.length]
    if (i < shuffled.length) {
      out.push(base)
    } else {
      const cycle = Math.floor(i / shuffled.length) + 1
      out.push({ ...base, id: `${base.id}-r${cycle}` })
    }
  }
  return out
}
