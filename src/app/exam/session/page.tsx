import type { Metadata } from "next"

import { FE_AM_BLUEPRINT } from "@/lib/exam-blueprint"
import {
  getAvailableExams,
  getExamPaperQuestions,
  getMockExamQuestions,
  paperDurationMinutes,
} from "@/lib/questions"
import { SessionEmpty } from "@/components/session/session-empty"
import { SessionRunner } from "@/components/session/session-runner"

export const metadata: Metadata = {
  title: "Mock Exam Session",
  description: "Active 60-question, 90-minute PhilNITS FE mock exam session.",
  robots: { index: false, follow: false },
}

const BLUEPRINT_DURATION_MINUTES = 90

interface PageProps {
  searchParams: Promise<{ seed?: string; exam?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const { seed: seedRaw, exam: examRaw } = await searchParams
  const seed = Number.parseInt(seedRaw ?? "", 10)

  const availableExams = getAvailableExams()
  const paper = examRaw
    ? availableExams.find((e) => e.id === examRaw)
    : undefined

  if (paper) {
    const questions = getExamPaperQuestions(paper.id)
    if (questions.length === 0) {
      return (
        <SessionEmpty modeLabel={paper.label} setupHref="/exam" topics="all" />
      )
    }
    const durationMinutes = paperDurationMinutes(paper.id, questions.length)
    return (
      <SessionRunner
        mode="exam"
        questions={questions}
        durationMinutes={durationMinutes}
        setupHref="/exam"
        modeLabel={paper.label}
      />
    )
  }

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
      durationMinutes={BLUEPRINT_DURATION_MINUTES}
      setupHref="/exam"
      modeLabel="Mock Exam"
    />
  )
}
