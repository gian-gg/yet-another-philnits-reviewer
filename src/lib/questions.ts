import { CATEGORIES, isTopicId, TOPICS, type TopicId } from "./topics"
import { QUESTIONS as questionsData } from "@/data/questions"

export type ChoiceId = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"

export const CHOICE_IDS: readonly ChoiceId[] = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
] as const

export interface Question {
  id: string
  topic: TopicId
  image: string
  answer: ChoiceId
}

export type ExamTier = "AM" | "PM"

export function tierOf(id: string): ExamTier {
  return id.includes("_FE_PM") ? "PM" : "AM"
}

export function choiceCountFor(question: Pick<Question, "id">): number {
  return tierOf(question.id) === "PM" ? 8 : 4
}

/**
 * Official sit duration for a past paper, in minutes.
 * AM: 80Q papers are 150m, smaller papers (incl. blueprint) are 90m.
 * PM: 100m, regardless of question count.
 */
export function paperDurationMinutes(
  examId: string,
  questionCount: number
): number {
  if (tierOf(examId) === "PM") return 100
  return questionCount >= 70 ? 150 : 90
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
    .filter((s): s is TopicId => isTopicId(s) || s === "uncategorized")
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
  .filter(
    (q): q is (typeof questionsData)[number] & { topic: TopicId } =>
      isTopicId(q.topic) || q.topic === "uncategorized"
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
  tier: ExamTier
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
      tier: tierOf(id),
    }))
})()

export function getAvailableExams(): readonly ExamSummary[] {
  return AVAILABLE_EXAMS
}

/**
 * Return every question from a specific past paper in bank order.
 * `examId` uses the `<year><season>_<level>_<session>` form, e.g.
 * `2015A_FE_AM`. Unknown ids return an empty array.
 */
export function getExamPaperQuestions(examId: string): Question[] {
  const prefix = `${examId}_`
  return BANK.filter((q) => q.id.startsWith(prefix)).map((q) => ({ ...q }))
}

/**
 * Deterministically sample `count` questions from every paper in a given tier.
 * Used by tier-wide practice (e.g. drill all PM questions across 2024–2025).
 */
export function sampleTierQuestions(
  tier: ExamTier,
  count: number,
  seed: number = Date.now() & 0xffffffff
): Question[] {
  const pool = BANK.filter((q) => tierOf(q.id) === tier)
  if (pool.length === 0) return []
  const rand = mulberry32(seed)
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

export function tierQuestionCount(tier: ExamTier): number {
  return BANK.filter((q) => tierOf(q.id) === tier).length
}

// ---------- Public API ----------

export function getQuestions({
  topics,
  count,
  seed = Date.now() & 0xffffffff,
}: GetQuestionsOptions): Question[] {
  const rand = mulberry32(seed)
  // Topic-based queries only ever sample from the AM tier — PM is paper-only.
  const amBank = BANK.filter((q) => tierOf(q.id) === "AM")
  const pool =
    !topics || topics === "all"
      ? amBank.filter((q) => q.topic !== "uncategorized")
      : amBank.filter((q) => topics.includes(q.topic))

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

/**
 * Build a mock-exam question list whose per-topic counts match `blueprint`,
 * ordered by category (technology → management → strategy) so the result
 * mirrors a real PhilNITS FE AM paper rather than a uniform random draw.
 *
 * Within each topic, questions are deterministically shuffled from the bank
 * pool. Topics whose blueprint count exceeds the bank pool are padded with
 * cycle-suffixed clones (same fallback used by `getQuestions`). Topics with
 * zero bank questions are skipped with a console warning — the resulting
 * paper is short by that many questions.
 */
export function getMockExamQuestions(
  blueprint: Readonly<Record<TopicId, number>>,
  seed: number = Date.now() & 0xffffffff
): Question[] {
  // Blueprint targets the AM paper shape — never sample PM into a mock AM run.
  const amBank = BANK.filter((q) => tierOf(q.id) === "AM")
  const byTopic = new Map<TopicId, Question[]>()
  for (const q of amBank) {
    const arr = byTopic.get(q.topic)
    if (arr) arr.push(q)
    else byTopic.set(q.topic, [q])
  }

  // Stable category-ordered topic list: technology first, then management,
  // then strategy, preserving TOPICS declaration order within each category.
  const orderedTopics = CATEGORIES.flatMap((cat) =>
    TOPICS.filter((t) => t.category === cat.id).map((t) => t.id)
  )

  const out: Question[] = []
  let topicIndex = 0
  for (const topic of orderedTopics) {
    const want = blueprint[topic] ?? 0
    if (want <= 0) continue

    const pool = byTopic.get(topic) ?? []
    if (pool.length === 0) {
      console.warn(
        `[mock-exam] no bank questions for topic "${topic}" (wanted ${want}); skipping`
      )
      continue
    }

    // Per-topic seed so reshuffling one topic doesn't cascade into others.
    const rand = mulberry32(seed + topicIndex * 0x9e3779b1)
    const shuffled = shuffle(pool, rand)

    for (let i = 0; i < want; i++) {
      const base = shuffled[i % shuffled.length]
      if (i < shuffled.length) {
        out.push(base)
      } else {
        const cycle = Math.floor(i / shuffled.length) + 1
        out.push({ ...base, id: `${base.id}-r${cycle}` })
      }
    }
    topicIndex++
  }

  return out
}
