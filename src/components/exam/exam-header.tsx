import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function ExamHeader() {
  return (
    <header className="mb-6 space-y-3">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Back
      </Link>
      <div>
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          simulate-the-real-thing
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Sit a full AM or PM paper under timed conditions, scored at the end.
        </p>
      </div>
    </header>
  )
}
