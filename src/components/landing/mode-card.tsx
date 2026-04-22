import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface ModeCardProps {
  href: string
  index: string
  label: string
  meta: string
  title: string
  description: string
}

export function ModeCard({
  href,
  index,
  label,
  meta,
  title,
  description,
}: ModeCardProps) {
  return (
    <Link
      href={href}
      className="group/mode-card block rounded-lg border bg-card transition-colors hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3 border-b px-4 py-2.5">
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {index}
        </span>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
          {meta}
        </span>
      </div>

      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/mode-card:translate-x-1 group-hover/mode-card:text-foreground"
          aria-hidden
        />
      </div>
    </Link>
  )
}
