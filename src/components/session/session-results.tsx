"use client"

import Link from "next/link"
import { CheckCircle2, Flag, XCircle } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { TOPICS, type TopicId } from "@/lib/topics"
import type { ChoiceId, Question } from "@/lib/questions"

const TOPIC_LABEL: Record<TopicId, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.label])
) as Record<TopicId, string>

interface SessionResultsProps {
  modeLabel: string
  questions: readonly Question[]
  answers: Record<string, ChoiceId | undefined>
  flagged: Set<string>
  setupHref: string
}

export function SessionResults({
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
        <Accordion type="multiple" className="space-y-2">
          {questions.map((q, i) => {
            const chosen = answers[q.id]
            const ok = chosen === q.answerId
            const skipped = chosen == null
            const isFlagged = flagged.has(q.id)
            return (
              <AccordionItem
                key={q.id}
                value={q.id}
                className={cn(
                  ok
                    ? "border-emerald-500/30"
                    : skipped
                      ? "border-border"
                      : "border-destructive/30"
                )}
              >
                <AccordionTrigger>
                  <span className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-1 items-start gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm leading-snug">
                        {q.prompt}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{TOPIC_LABEL[q.topic] ?? q.topic}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>
                          You:{" "}
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
                        <span className="text-muted-foreground/40">·</span>
                        <span>
                          Correct:{" "}
                          <span className="font-mono text-foreground uppercase">
                            {q.answerId}
                          </span>
                        </span>
                        {isFlagged && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Flag className="size-3" aria-hidden />
                              Flagged
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  </span>
                  {ok ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                  ) : skipped ? (
                    <span
                      className="size-4 shrink-0 rounded-full border border-muted-foreground/30"
                      aria-hidden
                    />
                  ) : (
                    <XCircle
                      className="size-4 shrink-0 text-destructive"
                      aria-hidden
                    />
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-snug">{q.prompt}</p>

                  <ul className="mt-3 space-y-1.5" role="list">
                    {q.choices.map((choice) => {
                      const isAnswer = choice.id === q.answerId
                      const isChosen = choice.id === chosen
                      return (
                        <li
                          key={choice.id}
                          className={cn(
                            "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                            isAnswer
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : isChosen
                                ? "border-destructive/40 bg-destructive/5"
                                : "border-border/60 bg-transparent"
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-5 shrink-0 place-items-center rounded-sm border font-mono text-[10px] uppercase",
                              isAnswer
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : isChosen
                                  ? "border-destructive bg-destructive text-white"
                                  : "border-border text-muted-foreground"
                            )}
                          >
                            {choice.id}
                          </span>
                          <span className="min-w-0 flex-1">{choice.text}</span>
                          {isAnswer && (
                            <span className="shrink-0 font-mono text-[10px] text-emerald-600 uppercase dark:text-emerald-400">
                              correct
                            </span>
                          )}
                          {!isAnswer && isChosen && (
                            <span className="shrink-0 font-mono text-[10px] text-destructive uppercase">
                              your pick
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>

                  {q.explanation && (
                    <div className="mt-3 rounded-md border-l-2 border-muted-foreground/30 bg-muted/30 px-3 py-2">
                      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                        Why
                      </p>
                      <p className="mt-1 text-sm text-foreground/85">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </section>
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
