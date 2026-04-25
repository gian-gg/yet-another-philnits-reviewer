"use client"

import { cn } from "@/lib/utils"

export type Track = "AM" | "PM"

interface TrackTab {
  track: Track
  disabled?: boolean
}

interface TrackTabsProps {
  value: Track
  onChange: (next: Track) => void
  tabs: readonly [TrackTab, TrackTab]
  ariaLabel?: string
}

export function TrackTabs({
  value,
  onChange,
  tabs,
  ariaLabel = "Track",
}: TrackTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-6 border-b"
    >
      {tabs.map((tab) => {
        const active = tab.track === value
        return (
          <button
            key={tab.track}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => onChange(tab.track)}
            className={cn(
              "relative -mb-px py-2 font-mono text-[11px] tracking-widest uppercase transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              tab.disabled &&
                "cursor-not-allowed opacity-40 hover:text-muted-foreground"
            )}
          >
            {tab.track}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 h-px bg-foreground transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
