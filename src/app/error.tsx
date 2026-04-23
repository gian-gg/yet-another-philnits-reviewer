"use client"

import Link from "next/link"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        error
      </p>
      <h1 className="mt-3 font-mono text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. You can try again or head back home.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-[10px] text-muted-foreground">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex gap-2">
        <Button onClick={reset}>try again</Button>
        <Button asChild variant="outline">
          <Link href="/">go home</Link>
        </Button>
      </div>
    </main>
  )
}
