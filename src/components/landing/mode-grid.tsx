import { ModeCard } from "./mode-card"

export function ModeGrid() {
  return (
    <section aria-label="Choose a mode" className="grid gap-4 sm:grid-cols-2">
      <ModeCard
        href="/practice"
        title="Practice"
        description="Drill by topic with immediate feedback after each question."
      />
      <ModeCard
        href="/exam"
        title="Mock Exam"
        description="Timed full run. Feedback and review after you submit."
      />
    </section>
  )
}
