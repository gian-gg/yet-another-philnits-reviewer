"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Clock, ListChecks, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  blueprintByCategory,
  FE_AM_BLUEPRINT,
  FE_AM_BLUEPRINT_TOTAL,
} from "@/lib/exam-blueprint"
import { getAvailableExams } from "@/lib/questions"

const BLUEPRINT_VALUE = "blueprint"
const BLUEPRINT_QUESTION_COUNT = FE_AM_BLUEPRINT_TOTAL
const BLUEPRINT_DURATION_MINUTES = 90
const BLUEPRINT_ROWS = blueprintByCategory(FE_AM_BLUEPRINT)
const BLUEPRINT_COVERAGE = BLUEPRINT_ROWS.map(
  (row) => `${row.total} ${row.label.toLowerCase()}`
).join(" · ")

const AVAILABLE_EXAMS = getAvailableExams()

const LEGACY_EXAMS = AVAILABLE_EXAMS.filter((e) => {
  const year = Number.parseInt(e.id.slice(0, 4), 10)
  return year <= 2019
})
const MODERN_EXAMS = AVAILABLE_EXAMS.filter((e) => {
  const year = Number.parseInt(e.id.slice(0, 4), 10)
  return year >= 2020
})

function durationForCount(count: number): number {
  return count === 80 ? 150 : 90
}

export function ExamSetup() {
  const router = useRouter()
  const [paperId, setPaperId] = useState<string>(BLUEPRINT_VALUE)

  const selection = useMemo(() => {
    if (paperId === BLUEPRINT_VALUE) {
      return {
        kind: "blueprint" as const,
        count: BLUEPRINT_QUESTION_COUNT,
        duration: BLUEPRINT_DURATION_MINUTES,
        coverage: BLUEPRINT_COVERAGE,
      }
    }
    const paper = AVAILABLE_EXAMS.find((e) => e.id === paperId)
    if (!paper) {
      return {
        kind: "blueprint" as const,
        count: BLUEPRINT_QUESTION_COUNT,
        duration: BLUEPRINT_DURATION_MINUTES,
        coverage: BLUEPRINT_COVERAGE,
      }
    }
    return {
      kind: "paper" as const,
      count: paper.questionCount,
      duration: durationForCount(paper.questionCount),
      coverage: `Full paper · ${paper.questionCount} questions in original order`,
      label: paper.label,
    }
  }, [paperId])

  const start = () => {
    if (selection.kind === "paper") {
      router.push(`/exam/session?exam=${encodeURIComponent(paperId)}`)
    } else {
      router.push("/exam/session")
    }
  }

  return (
    <div className="space-y-5">
      <section aria-label="Paper selection" className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor="exam-paper"
            className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase"
          >
            Paper
          </label>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground/70 uppercase">
            {selection.kind === "paper" ? "Past paper" : "Blueprint"}
          </span>
        </div>
        <Select value={paperId} onValueChange={setPaperId}>
          <SelectTrigger
            id="exam-paper"
            className="h-11 w-full bg-card text-sm font-medium tabular-nums hover:bg-accent/40"
          >
            <SelectValue placeholder="Choose a paper" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BLUEPRINT_VALUE}>
              Blueprint mix — sampled from 2020+ papers
            </SelectItem>
            {MODERN_EXAMS.length > 0 ? (
              <SelectGroup>
                <SelectLabel>2020–2025 · holdout</SelectLabel>
                {MODERN_EXAMS.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
            {LEGACY_EXAMS.length > 0 ? (
              <SelectGroup>
                <SelectLabel>2007–2019 · legacy</SelectLabel>
                {LEGACY_EXAMS.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Blueprint samples a synthetic 60Q paper from classified 2020+
          questions. Pick a specific year to sit that paper verbatim — useful
          for reserving newer papers as an unseen holdout.
        </p>
      </section>

      <section aria-label="Exam summary" className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {selection.kind === "paper" ? selection.label : "Mock Exam"}
          </span>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
            {selection.count}Q · {selection.duration}m
          </span>
        </div>

        <div className="divide-y">
          <FactRow
            icon={<ListChecks className="size-4" aria-hidden />}
            label="Questions"
            value={`${selection.count}`}
            hint={
              selection.kind === "paper"
                ? "Administered in the paper's original order."
                : "Fixed count — matches a full mock run."
            }
          />
          <FactRow
            icon={<Clock className="size-4" aria-hidden />}
            label="Duration"
            value={`${selection.duration} min`}
            hint="Timer starts the moment you begin. No pausing."
          />
          <FactRow
            icon={<Layers className="size-4" aria-hidden />}
            label="Coverage"
            hint={
              selection.kind === "paper"
                ? "Exact past paper — no topic shuffling."
                : "Topic mix mirrors a real PhilNITS FE AM paper."
            }
            detail={selection.coverage}
          />
        </div>
      </section>

      <ul
        className="space-y-2 text-xs text-muted-foreground sm:text-sm"
        role="list"
      >
        <li className="flex gap-2">
          <span
            aria-hidden
            className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60"
          />
          No feedback between questions — you see results after submitting.
        </li>
        <li className="flex gap-2">
          <span
            aria-hidden
            className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60"
          />
          You can flag and revisit questions within the time limit.
        </li>
        <li className="flex gap-2">
          <span
            aria-hidden
            className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60"
          />
          A scored review with per-topic breakdown follows submission.
        </li>
        {selection.kind === "blueprint" ? (
          <li className="flex gap-2">
            <span
              aria-hidden
              className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60"
            />
            Topic distribution will become more accurate as more questions are
            added to the bank.
          </li>
        ) : null}
      </ul>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:gap-6">
          <p className="min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm">
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums sm:text-xs">
              {selection.count}Q · {selection.duration}m
            </span>
            <span className="mx-2 hidden text-muted-foreground/40 sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">
              {selection.kind === "paper"
                ? `Sitting ${selection.label}. Timer starts on Start.`
                : "Ready when you are. Timer starts on Start."}
            </span>
          </p>

          <Button
            type="button"
            size="lg"
            onClick={start}
            className="w-full sm:w-auto"
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start mock exam</span>
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface FactRowProps {
  icon: React.ReactNode
  label: string
  hint: string
  value?: string
  detail?: string
}

function FactRow({ icon, label, value, hint, detail }: FactRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        {detail ? (
          <p className="mt-1.5 font-mono text-xs break-words text-foreground/90 tabular-nums">
            {detail}
          </p>
        ) : null}
      </div>
      {value ? (
        <span className="shrink-0 font-mono text-sm text-foreground tabular-nums">
          {value}
        </span>
      ) : null}
    </div>
  )
}
