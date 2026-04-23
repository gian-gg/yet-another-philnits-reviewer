import type { Metadata } from "next"

import { ExamHeader } from "@/components/exam/exam-header"
import { ExamSetup } from "@/components/exam/exam-setup"

export const metadata: Metadata = {
  title: "Mock Exam",
  description:
    "Run a full PhilNITS FE mock exam: 60 questions, 90-minute timer, scored at the end.",
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
