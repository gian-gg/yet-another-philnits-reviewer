import { getQuestions } from "@/lib/questions"
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
