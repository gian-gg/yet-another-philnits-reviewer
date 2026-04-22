"use client"

import { CheckIcon, MinusIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { CATEGORIES, topicsByCategory, type TopicId } from "@/lib/topics"
import { cn } from "@/lib/utils"

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
  const [tech, management, strategy] = CATEGORIES
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <CategorySection
        category={tech}
        selected={selected}
        onToggle={onToggle}
        onToggleCategory={onToggleCategory}
      />
      <div className="flex flex-col gap-4">
        <CategorySection
          category={management}
          selected={selected}
          onToggle={onToggle}
          onToggleCategory={onToggleCategory}
        />
        <CategorySection
          category={strategy}
          selected={selected}
          onToggle={onToggle}
          onToggleCategory={onToggleCategory}
        />
      </div>
    </div>
  )
}

interface CategorySectionProps {
  category: (typeof CATEGORIES)[number]
  selected: ReadonlySet<TopicId>
  onToggle: (id: TopicId) => void
  onToggleCategory: (ids: TopicId[], nextChecked: boolean) => void
}

function CategorySection({
  category,
  selected,
  onToggle,
  onToggleCategory,
}: CategorySectionProps) {
  const topics = topicsByCategory(category.id)
  const pickedCount = topics.filter((t) => selected.has(t.id)).length
  const allChecked = topics.length > 0 && pickedCount === topics.length
  const noneChecked = pickedCount === 0
  const headerState: boolean | "indeterminate" = allChecked
    ? true
    : noneChecked
      ? false
      : "indeterminate"

  const handleHeaderToggle = () => {
    onToggleCategory(
      topics.map((t) => t.id),
      !allChecked
    )
  }

  return (
    <section
      aria-labelledby={`cat-${category.id}`}
      className="rounded-lg border bg-card"
    >
      <button
        type="button"
        onClick={handleHeaderToggle}
        className="group flex w-full items-center gap-3 rounded-t-lg border-b px-4 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={`${allChecked ? "Clear" : "Select"} all ${category.label}`}
      >
        <span
          aria-hidden
          data-state={
            headerState === true
              ? "checked"
              : headerState === "indeterminate"
                ? "indeterminate"
                : "unchecked"
          }
          className="relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background text-primary-foreground transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary"
        >
          {headerState === true ? (
            <CheckIcon className="size-3.5" />
          ) : headerState === "indeterminate" ? (
            <MinusIcon className="size-3.5" />
          ) : null}
        </span>
        <h2
          id={`cat-${category.id}`}
          className="flex-1 font-heading text-sm font-semibold tracking-tight"
        >
          {category.label}
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {pickedCount}
          <span className="text-muted-foreground/50">
            {" / "}
            {topics.length}
          </span>
        </span>
      </button>

      <ul className="p-1.5" role="list">
        {topics.map((topic) => {
          const isChecked = selected.has(topic.id)
          return (
            <li key={topic.id}>
              <label
                className={cn(
                  "group flex cursor-pointer items-start gap-3 rounded-md px-2.5 py-2 transition-colors",
                  "hover:bg-accent/60",
                  isChecked && "bg-accent/30"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggle(topic.id)}
                  aria-label={topic.label}
                  className="mt-0.5"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "text-sm leading-snug transition-colors",
                      isChecked
                        ? "text-foreground"
                        : "text-foreground/80 group-hover:text-foreground"
                    )}
                  >
                    {topic.label}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {topic.description}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
