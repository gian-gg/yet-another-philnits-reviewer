import type { Metadata } from "next"

import { ExamHeader } from "@/components/exam/exam-header"
import { ExamSetup } from "@/components/exam/exam-setup"

export const metadata: Metadata = {
  title: "Mock Exam",
  description:
    "Sit a full PhilNITS FE AM or PM paper under timed conditions, scored at the end.",
  alternates: { canonical: "/exam" },
}

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-10 pb-28">
      <ExamHeader />
      <ExamSetup />
    </main>
  )
}
