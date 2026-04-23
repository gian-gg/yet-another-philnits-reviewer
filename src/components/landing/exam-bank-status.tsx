import { getAvailableExams } from "@/lib/questions"

export function ExamBankStatus() {
  const exams = getAvailableExams()
  const totalQuestions = exams.reduce((sum, e) => sum + e.questionCount, 0)

  return (
    <section
      aria-label="Active exam bank"
      className="mt-6 rounded-md border border-border/60 bg-muted/20 px-4 py-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          active bank
        </p>
        <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {exams.length} exam{exams.length === 1 ? "" : "s"} · {totalQuestions}{" "}
          questions
        </p>
      </div>
      <p className="mt-2 text-sm text-foreground">
        All FE AM papers from 2007–2025, Spring and Autumn.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Only 2020–2025 are classified by topic; earlier years are available as
        uncategorized.
      </p>
    </section>
  )
}
