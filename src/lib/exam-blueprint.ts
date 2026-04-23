import { CATEGORIES, TOPICS, type CategoryId, type TopicId } from "./topics"

/**
 * Per-topic question count for a mock FE AM paper. Sum equals 60.
 *
 * Values are anchored on averaged per-topic proportions across every
 * FE AM paper from 2020 onward (twelve exams: 2020A–2025S), scaled to
 * 60 questions via largest-remainder rounding. 2020–2023 were 80-question
 * papers; averaging proportions rather than raw counts keeps them
 * comparable with the 60-question 2024–2025 papers.
 */
export const FE_AM_BLUEPRINT: Readonly<Record<TopicId, number>> = {
  uncategorized: 0,
  // technology — 38
  "number-systems": 1,
  "applied-math": 2,
  "discrete-math": 3,
  "computer-architecture": 3,
  "operating-systems": 2,
  "digital-logic": 1,
  "computer-graphics": 1,
  databases: 4,
  networking: 4,
  cybersecurity: 6,
  "software-engineering": 6,
  "software-testing": 2,
  "emerging-tech": 3,
  // management — 11
  "project-management": 4,
  "it-service-management": 3,
  "system-auditing": 1,
  "quality-management": 1,
  "corporate-finance": 2,
  // strategy — 11
  "business-strategy": 7,
  "system-strategy": 2,
  "law-ip": 1,
  "digital-trends": 1,
} as const

export const FE_AM_BLUEPRINT_TOTAL: number = Object.values(
  FE_AM_BLUEPRINT
).reduce((s, n) => s + n, 0)

if (FE_AM_BLUEPRINT_TOTAL !== 60) {
  // Loud error in dev/prod build if the blueprint drifts. Surfaces
  // immediately rather than producing a silently-short mock paper.
  throw new Error(
    `FE_AM_BLUEPRINT must sum to 60, got ${FE_AM_BLUEPRINT_TOTAL}`
  )
}

export interface BlueprintCategoryRow {
  category: CategoryId
  label: string
  total: number
  topics: ReadonlyArray<{ id: TopicId; label: string; count: number }>
}

export function blueprintByCategory(
  blueprint: Readonly<Record<TopicId, number>>
): BlueprintCategoryRow[] {
  return CATEGORIES.map((cat) => {
    const topics = TOPICS.filter(
      (t) => t.category === cat.id && (blueprint[t.id] ?? 0) > 0
    ).map((t) => ({ id: t.id, label: t.label, count: blueprint[t.id] }))
    const total = topics.reduce((s, t) => s + t.count, 0)
    return { category: cat.id, label: cat.label, total, topics }
  }).filter((row) => row.total > 0)
}
