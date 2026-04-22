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
        meta="60Q · 90m"
        title="Mock exam"
        description="Fixed 60-question run, 90-minute timer. Review after submission."
      />
    </section>
  )
}
