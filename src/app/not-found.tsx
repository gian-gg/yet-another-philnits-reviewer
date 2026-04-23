import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "404 — Not found",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        404
      </p>
      <h1 className="mt-3 font-mono text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">go home</Link>
      </Button>
    </main>
  )
}
