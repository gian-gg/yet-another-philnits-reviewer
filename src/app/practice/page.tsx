import type { Metadata } from "next"

import { PracticeHeader } from "@/components/practice/practice-header"
import { PracticeSetup } from "@/components/practice/practice-setup"

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Pick topics and a question count to drill PhilNITS FE questions with immediate feedback.",
  alternates: { canonical: "/practice" },
}

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-10 pb-28">
      <PracticeHeader />
      <PracticeSetup />
    </main>
  )
}
