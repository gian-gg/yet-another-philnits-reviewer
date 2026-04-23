"use client"

import Image from "next/image"
import { useState } from "react"

import { resolveImageUrl } from "@/lib/image"
import { cn } from "@/lib/utils"

interface QuestionImageProps {
  src: string
  alt: string
  priority?: boolean
  /** Tailwind class for the image's max-height, e.g. "max-h-[55vh]". */
  maxHeightClassName?: string
}

export function QuestionImage({
  src,
  alt,
  priority,
  maxHeightClassName = "max-h-[55vh]",
}: QuestionImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative w-full overflow-hidden rounded-lg border bg-card">
      {!loaded ? (
        <div
          className="pointer-events-none absolute inset-0 flex min-h-32 items-center justify-center"
          aria-hidden
        >
          <div
            role="status"
            className="size-6 animate-spin rounded-full border-2 border-border border-t-foreground"
          />
          <span className="sr-only">Loading question image</span>
        </div>
      ) : null}
      <Image
        src={resolveImageUrl(src)}
        alt={alt}
        width={1200}
        height={1600}
        priority={priority}
        unoptimized
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-auto w-full object-contain transition-opacity duration-200",
          maxHeightClassName,
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}
