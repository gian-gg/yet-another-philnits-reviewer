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
  ImageIcon,
  List,
  Sparkles,
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { TOPICS, type TopicId } from "@/lib/topics"
import { CHOICE_IDS, type ChoiceId, type Question } from "@/lib/questions"
import { copyImageToClipboard } from "@/lib/copy-image"
import { resolveImageUrl } from "@/lib/image"

import { QuestionImage } from "./question-image"
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
  const [navOpen, setNavOpen] = useState(false)

  const total = questions.length
  const current = questions[index]

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

  const [copiedKind, setCopiedKind] = useState<"image" | "prompt" | null>(null)
  const flashCopied = useCallback((kind: "image" | "prompt") => {
    setCopiedKind(kind)
    window.setTimeout(() => setCopiedKind((k) => (k === kind ? null : k)), 1500)
  }, [])

  const copyQuestionImage = useCallback(async () => {
    if (!current) return
    try {
      await copyImageToClipboard(resolveImageUrl(current.image))
      flashCopied("image")
    } catch (err) {
      console.error("copy image failed", err)
    }
  }, [current, flashCopied])

  const copyAskPrompt = useCallback(async () => {
    if (!current) return
    try {
      await navigator.clipboard.writeText(buildAskAiPrompt(current))
      flashCopied("prompt")
    } catch (err) {
      console.error("copy prompt failed", err)
    }
  }, [current, flashCopied])

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

  useEffect(() => {
    if (isFinished || answeredCount === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isFinished, answeredCount])

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
      else if (key === "l") setNavOpen((v) => !v)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectChoice, goPrev, goNext, toggleFlag, revealCurrent, isFinished])

  if (isFinished) {
    return (
      <SessionResults
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
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open question list"
                  title="Open question list (L)"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-[11px] tracking-wide text-muted-foreground uppercase transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <List className="size-3" aria-hidden />
                  List
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle className="sr-only">Questions</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                      Questions · {answeredCount}/{total}
                    </span>
                    <SheetClose
                      className="text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Close"
                    >
                      Close
                    </SheetClose>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    <QuestionNav
                      questions={questions}
                      currentIndex={index}
                      answers={answers}
                      flagged={flagged}
                      onJump={(i) => {
                        goTo(i)
                        setNavOpen(false)
                      }}
                      variant="grid"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
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

            <QuestionImage
              key={current.id}
              src={current.image}
              alt={`Question ${current.id}`}
              priority
              maxHeightClassName="max-h-[55vh]"
            />

            <ul
              className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="list"
            >
              {CHOICE_IDS.map((choiceId) => {
                const isChosen = chosen === choiceId
                const isAnswer = current.answer === choiceId
                const showAsCorrect = isRevealed && isAnswer
                const showAsWrong = isRevealed && isChosen && !isAnswer

                return (
                  <li key={choiceId}>
                    <button
                      type="button"
                      onClick={() => selectChoice(choiceId)}
                      disabled={isRevealed}
                      aria-pressed={isChosen}
                      title={`Press ${choiceId.toUpperCase()}`}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-lg border bg-card px-4 py-4 font-mono text-lg font-semibold uppercase transition-colors",
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
                      <span>{choiceId}</span>
                      {showAsCorrect && (
                        <CheckCircle2
                          className="size-4 text-emerald-500"
                          aria-hidden
                        />
                      )}
                      {showAsWrong && (
                        <XCircle
                          className="size-4 text-destructive"
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
                  Commit when you&apos;re ready — reveal the correct choice. You
                  can still change your pick until you reveal.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={revealCurrent}
                  title="Reveal answer (R)"
                >
                  <Eye data-icon="inline-start" aria-hidden />
                  Reveal answer
                  <span className="hidden sm:contents">
                    <Kbd>R</Kbd>
                  </span>
                </Button>
              </div>
            )}

            {isRevealed && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-card/50 px-4 py-3">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Want a breakdown? Copy the image and the prompt, then paste
                  both into your chatbot.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyQuestionImage}
                    title="Copy question image to clipboard"
                  >
                    <ImageIcon data-icon="inline-start" aria-hidden />
                    {copiedKind === "image" ? "Copied image" : "Copy image"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyAskPrompt}
                    title="Copy ask-AI prompt to clipboard"
                  >
                    <Sparkles data-icon="inline-start" aria-hidden />
                    {copiedKind === "prompt" ? "Copied prompt" : "Copy prompt"}
                  </Button>
                </div>
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
              <span className="inline-flex items-center gap-1">
                <Kbd>L</Kbd>
                <span>list</span>
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
  variant?: "sidebar" | "grid"
}

function QuestionNav({
  questions,
  currentIndex,
  answers,
  flagged,
  onJump,
  variant = "sidebar",
}: QuestionNavProps) {
  const isGrid = variant === "grid"
  return (
    <nav aria-label="Question navigator">
      <ol
        className={cn(
          isGrid
            ? "grid grid-cols-5 gap-1.5"
            : "max-h-[70dvh] space-y-px overflow-y-auto"
        )}
        role="list"
      >
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
                  "flex w-full items-center gap-2 rounded-md text-left font-mono tabular-nums transition-colors",
                  "focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isGrid
                    ? "justify-center border px-2 py-2 text-sm"
                    : "justify-between px-2 py-1 text-[11px]",
                  isCurrent
                    ? isGrid
                      ? "border-foreground bg-accent text-foreground"
                      : "bg-accent text-foreground"
                    : answered
                      ? isGrid
                        ? "border-border/60 bg-accent/30 text-foreground/85 hover:bg-accent/60 hover:text-foreground"
                        : "text-foreground/75 hover:bg-accent/50 hover:text-foreground"
                      : isGrid
                        ? "border-border/40 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {isFlaggedItem && (
                  <Flag
                    className={cn(
                      "shrink-0 text-muted-foreground",
                      isGrid ? "size-3" : "size-2.5"
                    )}
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

function buildAskAiPrompt(q: Question): string {
  return `Attached is a multiple-choice question (choices a, b, c, d). The correct answer is ${q.answer.toUpperCase()}. Explain why that's the right choice, walk me through the reasoning, and briefly explain why each other option is wrong.

(ref: ${q.id})`
}
