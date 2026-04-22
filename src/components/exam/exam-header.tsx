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
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Mock Exam
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Simulate the real thing.
        </h1>
      </div>
    </header>
  )
}
