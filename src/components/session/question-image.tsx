"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { Maximize2, X } from "lucide-react"

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
  const [zoomed, setZoomed] = useState(false)
  const resolved = resolveImageUrl(src)

  const close = useCallback(() => setZoomed(false), [])

  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [zoomed, close])

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label="View full-size question image"
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border bg-card focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
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
          src={resolved}
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
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/85 px-2 py-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Maximize2 className="size-3" />
          Expand
        </span>
      </button>

      {zoomed ? (
        <ImageLightbox src={resolved} alt={alt} onClose={close} />
      ) : null}
    </>
  )
}

interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
}

function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full-size question image"
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-zoom-out items-start justify-center overflow-auto overscroll-contain bg-background/95 p-4 backdrop-blur-sm sm:items-center sm:p-8"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close full-size view"
        className="fixed top-4 right-4 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <X className="size-4" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="m-auto h-auto max-w-full select-none"
      />
      <p
        aria-hidden
        className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase"
      >
        click anywhere · esc to close
      </p>
    </div>
  )
}
