"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TOPICS, type TopicId } from "@/lib/topics"
import type { ChoiceId, Question } from "@/lib/questions"

import { SessionResults } from "./session-results"

export type SessionMode = "practice" | "exam"

export interface SessionRunnerProps {
  mode: SessionMode
  questions: readonly Question[]
  /** Only used in exam mode. Minutes. */
  durationMinutes?: number
  /** Where Back nav and post-session "New session" should link. */
  setupHref: string
  /** Short label shown in the eyebrow (e.g. "Practice", "Mock Exam"). */
  modeLabel: string
}

type AnswerMap = Record<string, ChoiceId | undefined>

const TOPIC_LABEL: Record<TopicId, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.label])
) as Record<TopicId, string>

export function SessionRunner({
  mode,
  questions,
  durationMinutes,
  setupHref,
  modeLabel,
}: SessionRunnerProps) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [locked, setLocked] = useState<Record<string, true | undefined>>({})
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set())
  const [submitted, setSubmitted] = useState(false)

  const total = questions.length
  const current = questions[index]

  // Exam timer — startedAt is fixed once on mount.
  const [startedAt] = useState<number | null>(() =>
    mode === "exam" ? Date.now() : null
  )
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    if (mode !== "exam" || submitted || startedAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [mode, submitted, startedAt])

  const durationMs = durationMinutes != null ? durationMinutes * 60_000 : null
  const msRemaining =
    durationMs !== null && startedAt !== null
      ? Math.max(0, durationMs - (now - startedAt))
      : null

  // Auto-submit when the timer hits zero. Treat the view as submitted without
  // needing an effect+setState round-trip.
  const timedOut = mode === "exam" && msRemaining === 0
  const isFinished = submitted || timedOut

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] != null).length,
    [questions, answers]
  )

  const selectChoice = useCallback(
    (choiceId: ChoiceId) => {
      if (!current || isFinished) return
      if (mode === "practice" && locked[current.id]) return
      setAnswers((prev) => ({ ...prev, [current.id]: choiceId }))
      if (mode === "practice") {
        setLocked((prev) => ({ ...prev, [current.id]: true }))
      }
    },
    [current, isFinished, mode, locked]
  )

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1))
  }, [total])

  const toggleFlag = useCallback(() => {
    if (!current) return
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(current.id)) next.delete(current.id)
      else next.add(current.id)
      return next
    })
  }, [current])

  const submit = useCallback(() => {
    setSubmitted(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (isFinished) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }
      const key = e.key.toLowerCase()
      if (key === "a" || key === "1") selectChoice("a")
      else if (key === "b" || key === "2") selectChoice("b")
      else if (key === "c" || key === "3") selectChoice("c")
      else if (key === "d" || key === "4") selectChoice("d")
      else if (key === "arrowleft" || key === "[") goPrev()
      else if (key === "arrowright" || key === "]" || key === "enter") goNext()
      else if (key === "f") toggleFlag()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectChoice, goPrev, goNext, toggleFlag, isFinished])

  if (isFinished) {
    return (
      <SessionResults
        mode={mode}
        modeLabel={modeLabel}
        questions={questions}
        answers={answers}
        flagged={flagged}
        setupHref={setupHref}
      />
    )
  }

  if (!current) return null

  const chosen = answers[current.id]
  const isLocked = mode === "practice" && locked[current.id] === true
  const isCorrect = chosen != null && chosen === current.answerId
  const isFlagged = flagged.has(current.id)
  const progressPct = ((index + 1) / total) * 100

  const canSubmit = mode === "exam"
  const lowTime = msRemaining !== null && msRemaining < 60_000

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top sticky bar */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={setupHref}
            className="inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Exit
          </Link>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {modeLabel}
          </span>
          <span className="ml-auto flex items-center gap-3 font-mono text-xs tabular-nums">
            <span className="text-muted-foreground">
              <span className="text-foreground">{index + 1}</span>
              <span className="text-muted-foreground/50">
                {" / "}
                {total}
              </span>
            </span>
            {msRemaining !== null && (
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5",
                  lowTime
                    ? "border-destructive/40 text-destructive"
                    : "border-border text-foreground"
                )}
                aria-live={lowTime ? "assertive" : "polite"}
              >
                {formatTime(msRemaining)}
              </span>
            )}
          </span>
        </div>
        <div
          className="h-0.5 w-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question body */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-32 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {TOPIC_LABEL[current.topic] ?? current.topic}
          </span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {current.id}
          </span>
        </div>

        <h1 className="font-heading text-lg leading-snug font-semibold tracking-tight sm:text-xl">
          {current.prompt}
        </h1>

        <ul className="mt-6 space-y-2" role="list">
          {current.choices.map((choice) => {
            const isChosen = chosen === choice.id
            const isAnswer = current.answerId === choice.id
            const showAsCorrect = isLocked && isAnswer
            const showAsWrong = isLocked && isChosen && !isAnswer

            return (
              <li key={choice.id}>
                <button
                  type="button"
                  onClick={() => selectChoice(choice.id)}
                  disabled={isLocked}
                  aria-pressed={isChosen}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors",
                    "hover:bg-accent/40 disabled:cursor-default disabled:hover:bg-card",
                    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                    isChosen &&
                      !isLocked &&
                      "border-foreground/60 bg-accent/40",
                    showAsCorrect &&
                      "border-emerald-500/60 bg-emerald-500/10 text-foreground",
                    showAsWrong &&
                      "border-destructive/60 bg-destructive/10 text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border font-mono text-xs uppercase",
                      isChosen &&
                        !isLocked &&
                        "border-foreground bg-foreground text-background",
                      showAsCorrect &&
                        "border-emerald-500 bg-emerald-500 text-white",
                      showAsWrong &&
                        "border-destructive bg-destructive text-white"
                    )}
                  >
                    {choice.id}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm leading-snug sm:text-base">
                      {choice.text}
                    </span>
                  </span>
                  {showAsCorrect && (
                    <CheckCircle2
                      className="size-5 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                  )}
                  {showAsWrong && (
                    <XCircle
                      className="size-5 shrink-0 text-destructive"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {isLocked && (
          <div
            className={cn(
              "mt-6 rounded-lg border p-4",
              isCorrect
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-destructive/40 bg-destructive/5"
            )}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
              ) : (
                <XCircle className="size-4 text-destructive" aria-hidden />
              )}
              <span className="text-sm font-medium">
                {isCorrect ? "Correct." : "Not quite."}
              </span>
              {!isCorrect && (
                <span className="ml-1 text-sm text-muted-foreground">
                  Answer:{" "}
                  <span className="font-mono text-foreground uppercase">
                    {current.answerId}
                  </span>
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {current.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Bottom sticky bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={index === 0}
            type="button"
          >
            <ArrowLeft data-icon="inline-start" aria-hidden />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          <Button
            variant={isFlagged ? "default" : "ghost"}
            size="sm"
            onClick={toggleFlag}
            type="button"
            aria-pressed={isFlagged}
          >
            <Flag
              data-icon="inline-start"
              aria-hidden
              className={isFlagged ? "fill-current" : ""}
            />
            <span className="hidden sm:inline">
              {isFlagged ? "Flagged" : "Flag"}
            </span>
          </Button>

          <span className="mx-auto hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:inline">
            {answeredCount}/{total} answered
          </span>

          {canSubmit && (
            <Button variant="outline" size="sm" onClick={submit} type="button">
              Submit
            </Button>
          )}

          {index < total - 1 ? (
            <Button size="sm" onClick={goNext} type="button">
              <span className="hidden sm:inline">Next</span>
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          ) : (
            <Button size="sm" onClick={submit} type="button">
              Finish
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
