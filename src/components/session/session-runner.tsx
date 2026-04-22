"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Flag,
  XCircle,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
type PracticeFeedbackMode = "instant" | "deferred"

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
  const router = useRouter()
  const [confirm, setConfirm] = useState<null | "exit" | "submit" | "finish">(
    null
  )
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [revealed, setRevealed] = useState<Record<string, true | undefined>>({})
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set())
  const [submitted, setSubmitted] = useState(false)
  const [feedbackMode, setFeedbackMode] =
    useState<PracticeFeedbackMode>("deferred")
  const [timerHidden, setTimerHidden] = useState(false)

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
      if (mode === "practice" && revealed[current.id]) return
      setAnswers((prev) => ({ ...prev, [current.id]: choiceId }))
      if (mode === "practice" && feedbackMode === "instant") {
        setRevealed((prev) => ({ ...prev, [current.id]: true }))
      }
    },
    [current, isFinished, mode, revealed, feedbackMode]
  )

  const revealCurrent = useCallback(() => {
    if (!current || mode !== "practice") return
    if (answers[current.id] == null) return
    setRevealed((prev) => ({ ...prev, [current.id]: true }))
  }, [current, mode, answers])

  const toggleFeedbackMode = useCallback(() => {
    setFeedbackMode((prev) => (prev === "instant" ? "deferred" : "instant"))
  }, [])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1))
  }, [total])

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return
      setIndex(next)
    },
    [total]
  )

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

  const requestExit = useCallback(() => {
    if (answeredCount === 0) {
      router.push(setupHref)
      return
    }
    setConfirm("exit")
  }, [answeredCount, router, setupHref])

  const requestSubmit = useCallback(() => {
    setConfirm("submit")
  }, [])

  const requestFinish = useCallback(() => {
    setConfirm("finish")
  }, [])

  const confirmExit = useCallback(() => {
    setConfirm(null)
    router.push(setupHref)
  }, [router, setupHref])

  const confirmSubmit = useCallback(() => {
    setConfirm(null)
    submit()
  }, [submit])

  // Warn on refresh / close when progress exists.
  useEffect(() => {
    if (isFinished || answeredCount === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Required by some browsers to trigger the prompt.
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isFinished, answeredCount])

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
      else if (key === "r") revealCurrent()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectChoice, goPrev, goNext, toggleFlag, revealCurrent, isFinished])

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
  const isRevealed = mode === "practice" && revealed[current.id] === true
  const isCorrect = chosen != null && chosen === current.answerId
  const isFlagged = flagged.has(current.id)
  const progressPct = ((index + 1) / total) * 100
  const canReveal =
    mode === "practice" &&
    feedbackMode === "deferred" &&
    chosen != null &&
    !isRevealed

  const canSubmit = mode === "exam"
  const lowTime = msRemaining !== null && msRemaining < 60_000

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top sticky bar */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={requestExit}
            className="inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Exit
          </button>
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
              <button
                type="button"
                onClick={() => setTimerHidden((v) => !v)}
                aria-label={
                  timerHidden ? "Show remaining time" : "Hide remaining time"
                }
                aria-pressed={timerHidden}
                title={
                  timerHidden ? "Show remaining time" : "Hide remaining time"
                }
                className={cn(
                  "group relative inline-flex w-[3.25rem] items-center justify-center rounded-md border px-2 py-0.5 transition-colors",
                  timerHidden
                    ? "border-border text-muted-foreground hover:text-foreground"
                    : lowTime
                      ? "border-destructive/40 text-destructive"
                      : "border-border text-foreground hover:bg-muted/50"
                )}
                aria-live={!timerHidden && lowTime ? "assertive" : "off"}
              >
                {timerHidden ? (
                  <span className="inline-flex h-4 items-center">
                    <Clock className="size-3" aria-hidden />
                  </span>
                ) : (
                  formatTime(msRemaining)
                )}
              </button>
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

      <div className="mx-auto grid w-full grid-cols-1 px-4 sm:px-6 xl:grid-cols-[1fr_minmax(0,48rem)_1fr] xl:gap-6">
        <aside
          aria-label="Question navigator"
          className="hidden self-start pt-16 xl:block xl:justify-self-center"
        >
          <div className="sticky top-24 w-20">
            <QuestionNav
              questions={questions}
              currentIndex={index}
              answers={answers}
              flagged={flagged}
              onJump={goTo}
            />
          </div>
        </aside>

        <div className="min-w-0 pt-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              size="xs"
              variant={isFlagged ? "default" : "outline"}
              onClick={toggleFlag}
              aria-pressed={isFlagged}
              title={isFlagged ? "Unflag question (F)" : "Flag for review (F)"}
            >
              <Flag
                data-icon="inline-start"
                aria-hidden
                className={isFlagged ? "fill-current" : ""}
              />
              {isFlagged ? "Flagged" : "Flag"}
            </Button>

            {mode === "practice" && (
              <Button
                type="button"
                size="xs"
                variant={feedbackMode === "instant" ? "default" : "outline"}
                onClick={toggleFeedbackMode}
                aria-pressed={feedbackMode === "instant"}
                title={
                  feedbackMode === "instant"
                    ? "Feedback shows on answer (press to defer)"
                    : "Reveal answer on demand (press to auto-reveal)"
                }
              >
                {feedbackMode === "instant" ? (
                  <Eye data-icon="inline-start" aria-hidden />
                ) : (
                  <EyeOff data-icon="inline-start" aria-hidden />
                )}
                Feedback: {feedbackMode === "instant" ? "Instant" : "On reveal"}
              </Button>
            )}
          </div>

          {/* Question body */}
          <div className="pt-5 pb-32">
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
                const showAsCorrect = isRevealed && isAnswer
                const showAsWrong = isRevealed && isChosen && !isAnswer

                return (
                  <li key={choice.id}>
                    <button
                      type="button"
                      onClick={() => selectChoice(choice.id)}
                      disabled={isRevealed}
                      aria-pressed={isChosen}
                      title={`Press ${choice.id.toUpperCase()}`}
                      className={cn(
                        "group flex w-full items-start gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors",
                        "hover:bg-accent/40 disabled:cursor-default disabled:hover:bg-card",
                        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                        isChosen &&
                          !isRevealed &&
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
                            !isRevealed &&
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

            {canReveal && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-card/50 px-4 py-3">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Commit when you&apos;re ready — reveal the correct choice and
                  explanation. You can still change your pick until you reveal.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={revealCurrent}
                  title="Reveal answer (R)"
                >
                  <Eye data-icon="inline-start" aria-hidden />
                  Reveal answer
                  <Kbd>R</Kbd>
                </Button>
              </div>
            )}

            {isRevealed && (
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
                    <CheckCircle2
                      className="size-4 text-emerald-500"
                      aria-hidden
                    />
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

            <div className="mt-8 hidden flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground sm:flex">
              <span className="font-mono tracking-widest uppercase">Keys</span>
              <span className="inline-flex items-center gap-1">
                <Kbd>A</Kbd>
                <span className="text-muted-foreground/60">–</span>
                <Kbd>D</Kbd>
                <span>pick</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
                <span>nav</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>↵</Kbd>
                <span>next</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>F</Kbd>
                <span>flag</span>
              </span>
              {mode === "practice" && (
                <span className="inline-flex items-center gap-1">
                  <Kbd>R</Kbd>
                  <span>reveal</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div aria-hidden className="hidden xl:block" />
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
            title="Previous question (←)"
          >
            <ArrowLeft data-icon="inline-start" aria-hidden />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          <span className="mx-auto font-mono text-[11px] text-muted-foreground tabular-nums">
            {answeredCount}/{total} answered
          </span>

          {canSubmit && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestSubmit}
              type="button"
            >
              Submit
            </Button>
          )}

          {index < total - 1 ? (
            <Button
              size="sm"
              onClick={goNext}
              type="button"
              title="Next question (→ or Enter)"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          ) : (
            <Button size="sm" onClick={requestFinish} type="button">
              Finish
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog
        open={confirm === "exit"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit session?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve answered {answeredCount} of {total} questions. Leaving
              now discards this session — your answers won&apos;t be saved or
              scored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmExit}>
              Exit anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirm === "submit"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this mock exam?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < total ? (
                <>
                  You have{" "}
                  <span className="font-mono text-foreground tabular-nums">
                    {total - answeredCount}
                  </span>{" "}
                  unanswered{" "}
                  {total - answeredCount === 1 ? "question" : "questions"}.
                  Unanswered questions are marked wrong. You can&apos;t change
                  answers after submitting.
                </>
              ) : (
                <>
                  All {total} questions answered. You can&apos;t change answers
                  after submitting.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep answering</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirm === "finish"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish and see results?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < total ? (
                <>
                  You have{" "}
                  <span className="font-mono text-foreground tabular-nums">
                    {total - answeredCount}
                  </span>{" "}
                  unanswered{" "}
                  {total - answeredCount === 1 ? "question" : "questions"}. They
                  will be marked wrong.
                </>
              ) : (
                <>
                  You&apos;ve answered all {total} questions. Ready to review?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface QuestionNavProps {
  questions: readonly Question[]
  currentIndex: number
  answers: AnswerMap
  flagged: ReadonlySet<string>
  onJump: (index: number) => void
}

function QuestionNav({
  questions,
  currentIndex,
  answers,
  flagged,
  onJump,
}: QuestionNavProps) {
  return (
    <nav aria-label="Question navigator">
      <ol className="max-h-[70dvh] space-y-px overflow-y-auto" role="list">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex
          const answered = answers[q.id] != null
          const isFlaggedItem = flagged.has(q.id)

          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left font-mono text-[11px] tabular-nums transition-colors",
                  "focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isCurrent
                    ? "bg-accent text-foreground"
                    : answered
                      ? "text-foreground/75 hover:bg-accent/50 hover:text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {isFlaggedItem && (
                  <Flag
                    className="size-2.5 shrink-0 text-muted-foreground"
                    aria-label="Flagged"
                  />
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px] leading-none text-muted-foreground">
      {children}
    </kbd>
  )
}

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
