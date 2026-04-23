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
      <ul className="mt-2 flex flex-col gap-1">
        {exams.map((exam) => (
          <li
            key={exam.id}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="text-foreground">{exam.label}</span>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {exam.questionCount}Q
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
