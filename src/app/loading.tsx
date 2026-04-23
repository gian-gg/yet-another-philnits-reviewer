export default function Loading() {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        role="status"
        className="size-6 animate-spin rounded-full border-2 border-border border-t-foreground"
      />
      <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        loading
      </p>
    </main>
  )
}
