import type { Metadata } from "next"

import { FE_AM_BLUEPRINT } from "@/lib/exam-blueprint"
import { getMockExamQuestions } from "@/lib/questions"
import { SessionEmpty } from "@/components/session/session-empty"
import { SessionRunner } from "@/components/session/session-runner"

export const metadata: Metadata = {
  title: "Mock Exam Session",
  description: "Active 60-question, 90-minute PhilNITS FE mock exam session.",
  robots: { index: false, follow: false },
}

const EXAM_DURATION_MINUTES = 90

interface PageProps {
  searchParams: Promise<{ seed?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const { seed: seedRaw } = await searchParams
  const seed = Number.parseInt(seedRaw ?? "", 10)
  const questions = getMockExamQuestions(
    FE_AM_BLUEPRINT,
    Number.isFinite(seed) ? seed : undefined
  )

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
