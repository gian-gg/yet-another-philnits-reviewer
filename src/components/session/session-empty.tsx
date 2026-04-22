import Link from "next/link"
import { ArrowLeft, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TOPICS, type TopicId } from "@/lib/topics"

interface SessionEmptyProps {
  modeLabel: string
  setupHref: string
  /** If topics were filtered, passing them shows what was selected. */
  topics?: readonly TopicId[] | "all"
}

const TOPIC_LABEL: Record<TopicId, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.label])
) as Record<TopicId, string>

export function SessionEmpty({
  modeLabel,
  setupHref,
  topics,
}: SessionEmptyProps) {
  const topicNames =
    topics && topics !== "all"
      ? topics.map((id) => TOPIC_LABEL[id] ?? id)
      : null

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-6 py-16">
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {modeLabel} · No questions
          </span>
        </div>
        <div className="px-4 py-6">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-5" aria-hidden />
          </div>
          <h1 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
            No questions match your filter.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {topicNames
              ? "There aren't any questions yet for the selected topic" +
                (topicNames.length === 1 ? "" : "s") +
                ". Broaden the selection or try a different combination."
              : "The question bank is empty. Add markdown files under the questions/ directory to get started."}
          </p>

          {topicNames && (
            <ul
              className="mt-4 flex flex-wrap gap-1.5"
              role="list"
              aria-label="Selected topics"
            >
              {topicNames.map((name) => (
                <li
                  key={name}
                  className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-end border-t px-4 py-3">
          <Button asChild size="sm">
            <Link href={setupHref}>
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back to setup
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
