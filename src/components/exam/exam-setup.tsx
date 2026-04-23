"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Clock, ListChecks, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  blueprintByCategory,
  FE_AM_BLUEPRINT,
  FE_AM_BLUEPRINT_TOTAL,
} from "@/lib/exam-blueprint"

const QUESTION_COUNT = FE_AM_BLUEPRINT_TOTAL
const DURATION_MINUTES = 90
const BLUEPRINT = blueprintByCategory(FE_AM_BLUEPRINT)
const COVERAGE_SUMMARY = BLUEPRINT.map(
  (row) => `${row.total} ${row.label.toLowerCase()}`
).join(" · ")

export function ExamSetup() {
  const router = useRouter()

  const start = () => {
    router.push("/exam/session")
  }

  return (
    <div className="space-y-5">
      <section aria-label="Exam summary" className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Mock Exam
          </span>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
            {QUESTION_COUNT}Q · {DURATION_MINUTES}m
          </span>
        </div>

        <div className="divide-y">
          <FactRow
            icon={<ListChecks className="size-4" aria-hidden />}
            label="Questions"
            value={`${QUESTION_COUNT}`}
            hint="Fixed count — matches a full mock run."
          />
          <FactRow
            icon={<Clock className="size-4" aria-hidden />}
            label="Duration"
            value={`${DURATION_MINUTES} min`}
            hint="Timer starts the moment you begin. No pausing."
          />
          <FactRow
            icon={<Layers className="size-4" aria-hidden />}
            label="Coverage"
            value={COVERAGE_SUMMARY}
            hint="Topic mix mirrors a real PhilNITS FE AM paper."
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
        <li className="flex gap-2">
          <span
            aria-hidden
            className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60"
          />
          Topic distribution will become more accurate as more questions are
          added to the bank.
        </li>
      </ul>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:gap-6">
          <p className="min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm">
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums sm:text-xs">
              {QUESTION_COUNT}Q · {DURATION_MINUTES}m
            </span>
            <span className="mx-2 hidden text-muted-foreground/40 sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">
              Ready when you are. Timer starts on Start.
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
  value: string
  hint: string
}

function FactRow({ icon, label, value, hint }: FactRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <span className="shrink-0 font-mono text-sm text-foreground tabular-nums">
        {value}
      </span>
    </div>
  )
}
