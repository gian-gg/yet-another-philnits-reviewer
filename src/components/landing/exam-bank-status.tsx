import { getAvailableExams } from "@/lib/questions"

export function ExamBankStatus() {
  const exams = getAvailableExams()
  const totalQuestions = exams.reduce((sum, e) => sum + e.questionCount, 0)
  const pmExams = exams.filter((e) => e.tier === "PM")

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
      <ul className="mt-2 space-y-2" role="list">
        <li className="flex gap-2">
          <span
            aria-hidden
            className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              All FE AM papers from 2007–2025, Spring and Autumn.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Only 2020–2025 are classified by topic; earlier years are
              available as uncategorized.
            </p>
          </div>
        </li>
        {pmExams.length > 0 ? (
          <li className="flex gap-2">
            <span
              aria-hidden
              className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                FE PM 2024–2025 ({pmExams.length} papers).
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Standalone MCQ in the post-2023 PM format.
              </p>
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  )
}
