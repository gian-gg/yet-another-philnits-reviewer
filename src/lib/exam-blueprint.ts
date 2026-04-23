import { CATEGORIES, TOPICS, type CategoryId, type TopicId } from "./topics"

/**
 * Per-topic question count for a mock FE AM paper. Sum equals 60.
 *
 * Values are anchored on averages of the two real exams currently in the
 * bank (2025A + 2025S FE AM) and gently rounded so each topic appears at
 * least once where it appears in real papers.
 */
export const FE_AM_BLUEPRINT: Readonly<Record<TopicId, number>> = {
  uncategorized: 0,
  // technology — 40
  "number-systems": 2,
  "applied-math": 2,
  "discrete-math": 3,
  "computer-architecture": 4,
  "operating-systems": 3,
  "digital-logic": 1,
  "computer-graphics": 1,
  databases: 5,
  networking: 4,
  cybersecurity: 5,
  "software-engineering": 5,
  "software-testing": 3,
  "emerging-tech": 2,
  // management — 10
  "project-management": 3,
  "it-service-management": 3,
  "system-auditing": 2,
  "quality-management": 1,
  "corporate-finance": 1,
  // strategy — 10
  "business-strategy": 5,
  "system-strategy": 2,
  "law-ip": 1,
  "digital-trends": 2,
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
