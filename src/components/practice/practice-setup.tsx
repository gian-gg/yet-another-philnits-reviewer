"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type TopicId } from "@/lib/topics"

import { TopicPicker } from "./topic-picker"

export function PracticeSetup() {
  const router = useRouter()
  const [selected, setSelected] = useState<ReadonlySet<TopicId>>(new Set())

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

  const clearAll = () => setSelected(new Set())

  const count = selected.size
  const canStart = count > 0

  const start = () => {
    if (!canStart) return
    const topics = Array.from(selected).join(",")
    router.push(`/practice/session?topics=${topics}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
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

      <TopicPicker
        selected={selected}
        onToggle={toggle}
        onToggleCategory={toggleCategory}
      />

      <div className="mt-8 flex items-center justify-between gap-4 border-t pt-6">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {count === 0
            ? "Select at least one topic to start."
            : `${count} topic${count === 1 ? "" : "s"} selected.`}
        </p>
        <Button type="button" size="lg" onClick={start} disabled={!canStart}>
          Start practice
          <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
