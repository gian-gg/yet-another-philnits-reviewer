import type { Metadata } from "next"

import {
  getQuestions,
  parseCountParam,
  parseTopicsParam,
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
