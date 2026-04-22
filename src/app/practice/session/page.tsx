import {
  getQuestions,
  parseCountParam,
  parseTopicsParam,
} from "@/lib/questions"
import { SessionEmpty } from "@/components/session/session-empty"
import { SessionRunner } from "@/components/session/session-runner"

interface PageProps {
  searchParams: Promise<{ topics?: string; count?: string; seed?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const {
    topics: topicsRaw,
    count: countRaw,
    seed: seedRaw,
  } = await searchParams
  const topics = parseTopicsParam(topicsRaw)
  const count = parseCountParam(countRaw, 25, { min: 1, max: 200 })
  const seed = Number.parseInt(seedRaw ?? "", 10)
  const questions = getQuestions({
    topics,
    count,
    seed: Number.isFinite(seed) ? seed : undefined,
  })

  if (questions.length === 0) {
    return (
      <SessionEmpty
        modeLabel="Practice"
        setupHref="/practice"
        topics={topics}
      />
    )
  }

  return (
    <SessionRunner
      mode="practice"
      questions={questions}
      setupHref="/practice"
      modeLabel="Practice"
    />
  )
}
