import { ModeCard } from "./mode-card"

export function ModeGrid() {
  return (
    <section aria-label="Choose a mode" className="flex flex-col gap-3">
      <ModeCard
        href="/practice"
        index="01"
        label="Practice"
        meta="22 topics"
        title="Topic practice"
        description="Drill by topic with immediate feedback after each question."
      />
      <ModeCard
        href="/exam"
        index="02"
        label="Mock Exam"
        meta="Timed"
        title="Mock exam"
        description="Timed full run. Feedback and review after you submit."
      />
    </section>
  )
}
