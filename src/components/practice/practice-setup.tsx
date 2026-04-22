"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NumberStepper } from "@/components/ui/number-stepper"
import { TOPICS, type TopicId } from "@/lib/topics"

import { TopicPicker } from "./topic-picker"

const ALL_TOPIC_IDS: readonly TopicId[] = TOPICS.map((t) => t.id)
const TOTAL = ALL_TOPIC_IDS.length
const QUESTION_PRESETS = [10, 25, 50, 100] as const
const QUESTION_MIN = 1
const QUESTION_MAX = 200
const QUESTION_DEFAULT = 25

export function PracticeSetup() {
  const router = useRouter()
  const [selected, setSelected] = useState<ReadonlySet<TopicId>>(
    () => new Set(ALL_TOPIC_IDS)
  )
  const [questionCount, setQuestionCount] = useState<number>(QUESTION_DEFAULT)

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
  const canStart = count > 0
  const allSelected = count === TOTAL

  const status = useMemo(() => {
    if (count === 0) return "Select at least one topic to start."
    if (count === TOTAL) return `All ${TOTAL} topics selected.`
    return `${count} of ${TOTAL} topics selected.`
  }, [count])

  const start = () => {
    if (!canStart) return
    const topics = allSelected ? "all" : Array.from(selected).join(",")
    const params = new URLSearchParams({
      topics,
      count: String(questionCount),
    })
    router.push(`/practice/session?${params.toString()}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Default: all topics selected. Deselect any you want to skip — you need
          at least one to start.
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

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6 lg:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p
              className={
                count === 0
                  ? "min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm"
                  : "min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm"
              }
              aria-live="polite"
            >
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums sm:text-xs">
                {count}/{TOTAL}
              </span>
              <span className="mx-2 hidden text-muted-foreground/40 sm:inline">
                ·
              </span>
              <span className="hidden sm:inline">{status}</span>
            </p>
            <div className="sm:hidden">
              <NumberStepper
                value={questionCount}
                min={QUESTION_MIN}
                max={QUESTION_MAX}
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
              value={questionCount}
              min={QUESTION_MIN}
              max={QUESTION_MAX}
              onChange={setQuestionCount}
              aria-label="Number of questions"
            />
            <div
              className="hidden items-center gap-1 md:flex"
              role="group"
              aria-label="Question count presets"
            >
              {QUESTION_PRESETS.map((preset) => {
                const active = questionCount === preset
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
            disabled={!canStart}
            className="w-full sm:w-auto"
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start practice</span>
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
