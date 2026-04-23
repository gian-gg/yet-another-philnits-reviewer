import { isTopicId, type TopicId } from "./topics"
import { QUESTIONS as questionsData } from "@/data/questions"

export type ChoiceId = "a" | "b" | "c" | "d"

export const CHOICE_IDS: readonly ChoiceId[] = ["a", "b", "c", "d"] as const

export interface Question {
  id: string
  topic: TopicId
  image: string
  answer: ChoiceId
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

// ---------- Bank ----------

const BANK: readonly Question[] = questionsData
  .filter((q): q is (typeof questionsData)[number] & { topic: TopicId } =>
    isTopicId(q.topic)
  )
  .map((q) => ({
    id: q.id,
    topic: q.topic,
    image: q.image,
    answer: q.answer,
  }))

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

// ---------- Available exams ----------

export interface ExamSummary {
  id: string
  label: string
  questionCount: number
}

const SEASON_LABEL: Record<string, string> = {
  S: "Spring",
  A: "Autumn",
}

function formatExamLabel(examId: string): string {
  // examId pattern: <year><season>_<level>_<session>, e.g. 2025A_FE_AM
  const match = /^(\d{4})([A-Z])_([A-Z]+)_([A-Z]+)$/.exec(examId)
  if (!match) return examId
  const [, year, season, level, session] = match
  const seasonLabel = SEASON_LABEL[season] ?? season
  return `${year} ${seasonLabel} · ${level} ${session}`
}

const AVAILABLE_EXAMS: readonly ExamSummary[] = (() => {
  const counts = new Map<string, number>()
  for (const q of BANK) {
    const examId = q.id.replace(/_\d+$/, "")
    counts.set(examId, (counts.get(examId) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, questionCount]) => ({
      id,
      label: formatExamLabel(id),
      questionCount,
    }))
})()

export function getAvailableExams(): readonly ExamSummary[] {
  return AVAILABLE_EXAMS
}

// ---------- Public API ----------

export function getQuestions({
  topics,
  count,
  seed = Date.now() & 0xffffffff,
}: GetQuestionsOptions): Question[] {
  const rand = mulberry32(seed)
  const pool =
    !topics || topics === "all"
      ? BANK.slice()
      : BANK.filter((q) => topics.includes(q.topic))

  if (pool.length === 0) return []

  const shuffled = shuffle(pool, rand)

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
