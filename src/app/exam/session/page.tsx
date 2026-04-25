import type { Metadata } from "next"

import { FE_AM_BLUEPRINT } from "@/lib/exam-blueprint"
import {
  getAvailableExams,
  getExamPaperQuestions,
  getMockExamQuestions,
  paperDurationMinutes,
  sampleTierQuestions,
} from "@/lib/questions"
import { SessionEmpty } from "@/components/session/session-empty"
import { SessionRunner } from "@/components/session/session-runner"

export const metadata: Metadata = {
  title: "Mock Exam Session",
  description: "Active 60-question, 90-minute PhilNITS FE mock exam session.",
  robots: { index: false, follow: false },
}

const BLUEPRINT_DURATION_MINUTES = 90
const PM_RANDOM_COUNT = 20
const PM_RANDOM_DURATION_MINUTES = 100

interface PageProps {
  searchParams: Promise<{ seed?: string; exam?: string; track?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const { seed: seedRaw, exam: examRaw, track: trackRaw } = await searchParams
  const seedParsed = Number.parseInt(seedRaw ?? "", 10)
  const seed = Number.isFinite(seedParsed) ? seedParsed : undefined

  if (trackRaw === "PM") {
    const questions = sampleTierQuestions("PM", PM_RANDOM_COUNT, seed)
    if (questions.length === 0) {
      return (
        <SessionEmpty
          modeLabel="PM Randomized"
          setupHref="/exam"
          topics="all"
        />
      )
    }
    return (
      <SessionRunner
        mode="exam"
        questions={questions}
        durationMinutes={PM_RANDOM_DURATION_MINUTES}
        setupHref="/exam"
        modeLabel="PM Randomized"
      />
    )
  }

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

  const questions = getMockExamQuestions(FE_AM_BLUEPRINT, seed)

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
