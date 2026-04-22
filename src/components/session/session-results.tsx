"use client"

import Link from "next/link"
import { CheckCircle2, Flag, RotateCcw, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TOPICS, type TopicId } from "@/lib/topics"
import type { ChoiceId, Question } from "@/lib/questions"

import type { SessionMode } from "./session-runner"

const TOPIC_LABEL: Record<TopicId, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.label])
) as Record<TopicId, string>

interface SessionResultsProps {
  mode: SessionMode
  modeLabel: string
  questions: readonly Question[]
  answers: Record<string, ChoiceId | undefined>
  flagged: Set<string>
  setupHref: string
}

export function SessionResults({
  mode,
  modeLabel,
  questions,
  answers,
  flagged,
  setupHref,
}: SessionResultsProps) {
  const total = questions.length
  const correct = questions.reduce(
    (acc, q) => (answers[q.id] === q.answerId ? acc + 1 : acc),
    0
  )
  const answered = questions.reduce(
    (acc, q) => (answers[q.id] != null ? acc + 1 : acc),
    0
  )
  const scorePct = total === 0 ? 0 : Math.round((correct / total) * 100)

  const byTopic = new Map<TopicId, { total: number; correct: number }>()
  for (const q of questions) {
    const bucket = byTopic.get(q.topic) ?? { total: 0, correct: 0 }
    bucket.total++
    if (answers[q.id] === q.answerId) bucket.correct++
    byTopic.set(q.topic, bucket)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-6 space-y-3">
        <Link
          href={setupHref}
          className="inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          ← Back
        </Link>
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {modeLabel} · Results
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {headline(scorePct)}
          </h1>
        </div>
      </header>

      <section aria-label="Score summary" className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Score
          </span>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
            {correct}/{total} · {answered}/{total} answered
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-5">
          <div className="font-mono text-4xl font-semibold tabular-nums sm:text-5xl">
            {scorePct}
            <span className="text-xl text-muted-foreground">%</span>
          </div>
          <div className="flex-1">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scorePct}
            >
              <div
                className={cn(
                  "h-full",
                  scorePct >= 70
                    ? "bg-emerald-500"
                    : scorePct >= 50
                      ? "bg-amber-500"
                      : "bg-destructive"
                )}
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {correct} correct · {total - correct} wrong or skipped
            </p>
          </div>
        </div>
      </section>

      {byTopic.size > 1 && (
        <section
          aria-label="By topic"
          className="mt-4 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              By topic
            </span>
          </div>
          <ul className="divide-y" role="list">
            {[...byTopic.entries()]
              .sort((a, b) => b[1].total - a[1].total)
              .map(([topicId, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100)
                return (
                  <li
                    key={topicId}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="flex-1 text-sm">
                      {TOPIC_LABEL[topicId] ?? topicId}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {stats.correct}/{stats.total}
                    </span>
                    <span
                      className={cn(
                        "w-10 text-right font-mono text-xs tabular-nums",
                        pct >= 70
                          ? "text-emerald-600 dark:text-emerald-400"
                          : pct >= 50
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-destructive"
                      )}
                    >
                      {pct}%
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      <section aria-label="Review" className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold tracking-tight">
            Review
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {total} questions
          </span>
        </div>
        <ol className="space-y-2" role="list">
          {questions.map((q, i) => {
            const chosen = answers[q.id]
            const ok = chosen === q.answerId
            const skipped = chosen == null
            return (
              <li
                key={q.id}
                className={cn(
                  "rounded-lg border bg-card",
                  ok
                    ? "border-emerald-500/30"
                    : skipped
                      ? "border-border"
                      : "border-destructive/30"
                )}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{q.prompt}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {TOPIC_LABEL[q.topic] ?? q.topic}
                      {flagged.has(q.id) && (
                        <>
                          <span className="mx-1.5 text-muted-foreground/50">
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Flag className="size-3" aria-hidden />
                            Flagged
                          </span>
                        </>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground">
                        Your answer:{" "}
                        <span
                          className={cn(
                            "font-mono uppercase",
                            skipped
                              ? "text-muted-foreground"
                              : ok
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                          )}
                        >
                          {chosen ?? "—"}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Correct:{" "}
                        <span className="font-mono text-foreground uppercase">
                          {q.answerId}
                        </span>
                      </span>
                    </div>
                    {!ok && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                  {ok ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                  ) : skipped ? null : (
                    <XCircle
                      className="size-4 shrink-0 text-destructive"
                      aria-hidden
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={setupHref}>
            <RotateCcw data-icon="inline-start" aria-hidden />
            Back to setup
          </Link>
        </Button>
        <Button asChild>
          <Link href={mode === "practice" ? "/practice" : "/exam"}>
            Start a new {mode === "practice" ? "session" : "mock exam"}
          </Link>
        </Button>
      </div>
    </main>
  )
}

function headline(pct: number): string {
  if (pct >= 90) return "Near perfect run."
  if (pct >= 75) return "Strong session."
  if (pct >= 60) return "Solid ground, a few gaps."
  if (pct >= 40) return "Plenty to shore up."
  return "Good signal — drill the weak spots."
}
