import { ModeCard } from "./mode-card"

export function ModeGrid() {
  return (
    <section aria-label="Choose a mode" className="flex flex-col gap-3">
      <ModeCard
        href="/practice"
        index="01"
        label="Practice"
        meta="22 topics"
        title="practice"
        description="Drill by topic with immediate feedback after each question."
      />
      <ModeCard
        href="/exam"
        index="02"
        label="Mock Exam"
        meta="60Q · 90m"
        title="mock-exam"
        description="Sit a full AM or PM paper under timed conditions."
      />
    </section>
  )
}
