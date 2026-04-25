"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { NumberStepper } from "@/components/ui/number-stepper"
import { TrackTabs, type Track } from "@/components/track-tabs"
import { getAvailableExams, tierQuestionCount } from "@/lib/questions"
import { TOPICS, type TopicId } from "@/lib/topics"

import { TopicPicker } from "./topic-picker"

const ALL_TOPIC_IDS: readonly TopicId[] = TOPICS.map((t) => t.id)
const TOTAL = ALL_TOPIC_IDS.length
const QUESTION_PRESETS = [10, 25, 50, 100] as const
const QUESTION_MIN = 1
const QUESTION_MAX = 200
const QUESTION_DEFAULT = 25

const PM_EXAMS = getAvailableExams().filter((e) => e.tier === "PM")
const PM_TOTAL = tierQuestionCount("PM")

export function PracticeSetup() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [track, setTrack] = useState<Track>("AM")
  const [selected, setSelected] = useState<ReadonlySet<TopicId>>(
    () => new Set(ALL_TOPIC_IDS)
  )
  const [questionCount, setQuestionCount] = useState<number>(QUESTION_DEFAULT)
  const [includeUncategorized, setIncludeUncategorized] =
    useState<boolean>(false)

  const toggle = (id: TopicId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCategory = (ids: TopicId[], nextChecked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (nextChecked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const selectAll = () => setSelected(new Set(ALL_TOPIC_IDS))
  const clearAll = () => setSelected(new Set())

  const count = selected.size
  const allSelected = count === TOTAL

  const pmCountMax = PM_TOTAL || QUESTION_MAX
  const pmCount = Math.min(questionCount, pmCountMax)

  const canStart =
    track === "AM" ? count > 0 || includeUncategorized : PM_EXAMS.length > 0

  const status = useMemo(() => {
    if (track === "PM") {
      if (PM_EXAMS.length === 0) return "No PM papers available."
      return `${pmCount} of ${PM_TOTAL} PM questions, sampled across ${PM_EXAMS.length} papers.`
    }
    if (count === 0) {
      return includeUncategorized
        ? "Uncategorized only."
        : "Select at least one topic to start."
    }
    const base =
      count === TOTAL
        ? `All ${TOTAL} topics selected.`
        : `${count} of ${TOTAL} topics selected.`
    return includeUncategorized ? `${base} + uncategorized` : base
  }, [track, pmCount, count, includeUncategorized])

  const start = () => {
    if (!canStart) return
    if (track === "PM") {
      const params = new URLSearchParams({
        track: "PM",
        count: String(pmCount),
      })
      startTransition(() => {
        router.push(`/practice/session?${params.toString()}`)
      })
      return
    }
    const ids = Array.from(selected) as string[]
    if (includeUncategorized) ids.push("uncategorized")
    const topics = allSelected && !includeUncategorized ? "all" : ids.join(",")
    const params = new URLSearchParams({
      topics,
      count: String(questionCount),
    })
    startTransition(() => {
      router.push(`/practice/session?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-5">
      <TrackTabs
        value={track}
        onChange={setTrack}
        ariaLabel="Practice track"
        tabs={[
          { track: "AM" },
          { track: "PM", disabled: PM_EXAMS.length === 0 },
        ]}
      />

      {track === "AM" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Default: all topics selected. Deselect any you want to skip — you
              need at least one to start.
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={selectAll}
                type="button"
                disabled={allSelected}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={clearAll}
                type="button"
                disabled={count === 0}
              >
                Clear all
              </Button>
            </div>
          </div>

          <TopicPicker
            selected={selected}
            onToggle={toggle}
            onToggleCategory={toggleCategory}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40">
            <Checkbox
              checked={includeUncategorized}
              onCheckedChange={(v) => setIncludeUncategorized(v === true)}
              aria-label="Include uncategorized questions"
              className="mt-0.5"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm leading-snug font-medium">
                Include uncategorized questions
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                Older AM papers (2007–2019) not yet classified by topic.
              </span>
            </span>
          </label>
        </>
      ) : (
        <section className="rounded-lg border bg-card">
          <div className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              PM bank
            </span>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {PM_EXAMS.length} papers · {PM_TOTAL}Q
            </span>
          </div>
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              aria-hidden
              className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                Sampled across all PM papers (2024–2025).
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pick the question count below — questions are drawn at random
                from the full PM bank.
              </p>
            </div>
          </div>
        </section>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p
              className={
                !canStart
                  ? "min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm"
                  : "min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm"
              }
              aria-live="polite"
            >
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums sm:text-xs">
                {track === "AM" ? `${count}/${TOTAL}` : track}
              </span>
              <span className="mx-2 hidden text-muted-foreground/40 sm:inline">
                ·
              </span>
              <span className="hidden sm:inline">{status}</span>
            </p>
            <div className="sm:hidden">
              <NumberStepper
                value={track === "PM" ? pmCount : questionCount}
                min={QUESTION_MIN}
                max={track === "PM" ? pmCountMax : QUESTION_MAX}
                onChange={setQuestionCount}
                aria-label="Number of questions"
              />
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex lg:gap-4">
            <span className="shrink-0 text-sm text-muted-foreground">
              How many questions?
            </span>
            <NumberStepper
              value={track === "PM" ? pmCount : questionCount}
              min={QUESTION_MIN}
              max={track === "PM" ? pmCountMax : QUESTION_MAX}
              onChange={setQuestionCount}
              aria-label="Number of questions"
            />
            <div
              className="hidden items-center gap-1 md:flex"
              role="group"
              aria-label="Question count presets"
            >
              {QUESTION_PRESETS.filter(
                (p) => track === "AM" || p <= pmCountMax
              ).map((preset) => {
                const active =
                  (track === "PM" ? pmCount : questionCount) === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuestionCount(preset)}
                    aria-pressed={active}
                    className={
                      active
                        ? "h-7 rounded-md border border-foreground/20 bg-foreground px-2 font-mono text-xs text-background tabular-nums"
                        : "h-7 rounded-md border border-transparent px-2 font-mono text-xs text-muted-foreground tabular-nums transition-colors hover:border-border hover:text-foreground"
                    }
                  >
                    {preset}
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={start}
            disabled={!canStart || isPending}
            className="w-full sm:w-auto"
          >
            <span className="sm:hidden">
              {isPending ? "Starting…" : "Start"}
            </span>
            <span className="hidden sm:inline">
              {isPending ? "Starting…" : "Start practice"}
            </span>
            {isPending ? (
              <Loader2
                data-icon="inline-end"
                className="animate-spin"
                aria-hidden
              />
            ) : (
              <ArrowRight data-icon="inline-end" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
