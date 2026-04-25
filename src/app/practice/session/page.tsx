import type { Metadata } from "next"

import {
  getQuestions,
  parseCountParam,
  parseTopicsParam,
  sampleTierQuestions,
  tierQuestionCount,
} from "@/lib/questions"
import { SessionEmpty } from "@/components/session/session-empty"
import { SessionRunner } from "@/components/session/session-runner"

export const metadata: Metadata = {
  title: "Practice Session",
  description:
    "Active PhilNITS FE practice session with immediate feedback after each question.",
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{
    topics?: string
    count?: string
    seed?: string
    track?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const {
    topics: topicsRaw,
    count: countRaw,
    seed: seedRaw,
    track: trackRaw,
  } = await searchParams
  const seedParsed = Number.parseInt(seedRaw ?? "", 10)
  const seed = Number.isFinite(seedParsed) ? seedParsed : undefined

  if (trackRaw === "PM") {
    const max = tierQuestionCount("PM") || 1
    const count = parseCountParam(countRaw, Math.min(25, max), {
      min: 1,
      max,
    })
    const questions = sampleTierQuestions("PM", count, seed)
    if (questions.length === 0) {
      return (
        <SessionEmpty
          modeLabel="Practice · PM"
          setupHref="/practice"
          topics="all"
        />
      )
    }
    return (
      <SessionRunner
        mode="practice"
        questions={questions}
        setupHref="/practice"
        modeLabel="Practice · PM"
      />
    )
  }

  const topics = parseTopicsParam(topicsRaw)
  const count = parseCountParam(countRaw, 25, { min: 1, max: 200 })
  const questions = getQuestions({ topics, count, seed })

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
