"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Flag, ImageIcon, Sparkles, XCircle } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TOPICS, type TopicId } from "@/lib/topics"
import { CHOICE_IDS, type ChoiceId, type Question } from "@/lib/questions"

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
    (acc, q) => (answers[q.id] === q.answer ? acc + 1 : acc),
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
    if (answers[q.id] === q.answer) bucket.correct++
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
            const ok = chosen === q.answer
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
                      <span className="block truncate font-mono text-xs text-foreground">
                        {q.id}
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
                            {q.answer}
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
                  <div className="relative w-full overflow-hidden rounded-lg border bg-card">
                    <Image
                      src={q.image}
                      alt={`Question ${q.id}`}
                      width={1200}
                      height={1600}
                      className="h-auto max-h-[50vh] w-full object-contain"
                    />
                  </div>

                  <ul
                    className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
                    role="list"
                  >
                    {CHOICE_IDS.map((choiceId) => {
                      const isAnswer = choiceId === q.answer
                      const isChosen = choiceId === chosen
                      return (
                        <li
                          key={choiceId}
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 font-mono text-sm font-semibold uppercase",
                            isAnswer
                              ? "border-emerald-500/60 bg-emerald-500/10 text-foreground"
                              : isChosen
                                ? "border-destructive/60 bg-destructive/10 text-foreground"
                                : "border-border/60 text-muted-foreground"
                          )}
                        >
                          <span>{choiceId}</span>
                          {isAnswer && (
                            <span className="font-sans text-[9px] font-normal tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                              correct
                            </span>
                          )}
                          {!isAnswer && isChosen && (
                            <span className="font-sans text-[9px] font-normal tracking-widest text-destructive uppercase">
                              yours
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>

                  <AskAiRow question={q} />
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </section>
    </main>
  )
}

function AskAiRow({ question }: { question: Question }) {
  const [copiedKind, setCopiedKind] = useState<"image" | "prompt" | null>(null)

  const flash = useCallback((kind: "image" | "prompt") => {
    setCopiedKind(kind)
    window.setTimeout(() => setCopiedKind((k) => (k === kind ? null : k)), 1500)
  }, [])

  const copyImage = useCallback(async () => {
    try {
      const res = await fetch(question.image)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/png"]: blob }),
      ])
      flash("image")
    } catch (err) {
      console.error("copy image failed", err)
    }
  }, [question.image, flash])

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildAskAiPrompt(question))
      flash("prompt")
    } catch (err) {
      console.error("copy prompt failed", err)
    }
  }, [question, flash])

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-card/50 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">
        Want a breakdown? Paste both into your chatbot.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={copyImage}
          title="Copy question image to clipboard"
        >
          <ImageIcon data-icon="inline-start" aria-hidden />
          {copiedKind === "image" ? "Copied image" : "Copy image"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={copyPrompt}
          title="Copy ask-AI prompt to clipboard"
        >
          <Sparkles data-icon="inline-start" aria-hidden />
          {copiedKind === "prompt" ? "Copied prompt" : "Copy prompt"}
        </Button>
      </div>
    </div>
  )
}

function buildAskAiPrompt(q: Question): string {
  return `Attached is a multiple-choice question (choices a, b, c, d). The correct answer is ${q.answer.toUpperCase()}. Explain why that's the right choice, walk me through the reasoning, and briefly explain why each other option is wrong.

(ref: ${q.id})`
}

function headline(pct: number): string {
  if (pct >= 90) return "Near perfect run."
  if (pct >= 75) return "Strong session."
  if (pct >= 60) return "Solid ground, a few gaps."
  if (pct >= 40) return "Plenty to shore up."
  return "Good signal — drill the weak spots."
}
