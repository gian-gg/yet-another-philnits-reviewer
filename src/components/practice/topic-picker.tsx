"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { CATEGORIES, topicsByCategory, type TopicId } from "@/lib/topics"

interface TopicPickerProps {
  selected: ReadonlySet<TopicId>
  onToggle: (id: TopicId) => void
  onToggleCategory: (ids: TopicId[], nextChecked: boolean) => void
}

export function TopicPicker({
  selected,
  onToggle,
  onToggleCategory,
}: TopicPickerProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-3">
      {CATEGORIES.map((category) => {
        const topics = topicsByCategory(category.id)
        const pickedCount = topics.filter((t) => selected.has(t.id)).length
        const allChecked = topics.length > 0 && pickedCount === topics.length

        return (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <header className="mb-3 flex items-baseline justify-between border-b pb-2">
              <h2
                id={`cat-${category.id}`}
                className="font-heading text-sm font-medium"
              >
                {category.label}
              </h2>
              <button
                type="button"
                onClick={() =>
                  onToggleCategory(
                    topics.map((t) => t.id),
                    !allChecked
                  )
                }
                className="font-mono text-[11px] text-muted-foreground tabular-nums transition-colors hover:text-foreground"
                aria-label={`${
                  allChecked ? "Clear" : "Select"
                } all ${category.label}`}
              >
                {pickedCount}
                <span className="text-muted-foreground/50">
                  {" / "}
                  {topics.length}
                </span>
              </button>
            </header>

            <ul className="space-y-1" role="list">
              {topics.map((topic) => {
                const isChecked = selected.has(topic.id)
                return (
                  <li key={topic.id}>
                    <label className="group flex cursor-pointer items-center gap-3 py-0.5">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggle(topic.id)}
                        aria-label={topic.label}
                      />
                      <span
                        className={
                          isChecked
                            ? "text-sm text-foreground"
                            : "text-sm text-muted-foreground transition-colors group-hover:text-foreground"
                        }
                      >
                        {topic.label}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
