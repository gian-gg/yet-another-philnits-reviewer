import { getQuestions } from "@/lib/questions"
import { SessionEmpty } from "@/components/session/session-empty"
import { SessionRunner } from "@/components/session/session-runner"

const EXAM_QUESTION_COUNT = 60
const EXAM_DURATION_MINUTES = 90

interface PageProps {
  searchParams: Promise<{ seed?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const { seed: seedRaw } = await searchParams
  const seed = Number.parseInt(seedRaw ?? "", 10)
  const questions = getQuestions({
    topics: "all",
    count: EXAM_QUESTION_COUNT,
    seed: Number.isFinite(seed) ? seed : undefined,
  })

  if (questions.length === 0) {
    return <SessionEmpty modeLabel="Mock Exam" setupHref="/exam" topics="all" />
  }

  return (
    <SessionRunner
      mode="exam"
      questions={questions}
      durationMinutes={EXAM_DURATION_MINUTES}
      setupHref="/exam"
      modeLabel="Mock Exam"
    />
  )
}
