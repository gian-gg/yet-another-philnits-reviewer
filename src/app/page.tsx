import type { Metadata } from "next"

import { ExamBankStatus } from "@/components/landing/exam-bank-status"
import { LandingHero } from "@/components/landing/landing-hero"
import { ModeGrid } from "@/components/landing/mode-grid"

export const metadata: Metadata = {
  title: {
    absolute: "yet-another-philnits-reviewer",
  },
  description:
    "Pick a study mode: drill PhilNITS FE questions by topic or take a full 60-question, 90-minute mock exam.",
}

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-16">
      <LandingHero />
      <ModeGrid />
      <ExamBankStatus />

      <footer className="mt-16 flex flex-col items-center gap-2 text-[11px] text-muted-foreground">
        <p>
          another thing by{" "}
          <a
            href="https://giann.dev"
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground underline-offset-4 hover:underline"
          >
            gian-gg
          </a>
        </p>
        <p className="hidden items-center gap-1.5 font-mono tracking-wide sm:inline-flex">
          press
          <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/70 bg-muted/60 px-1 text-[10px] leading-none text-muted-foreground">
            T
          </kbd>
          to change theme
        </p>
      </footer>
    </main>
  )
}
