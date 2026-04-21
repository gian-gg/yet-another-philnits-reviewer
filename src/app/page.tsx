import { LandingHero } from "@/components/landing/landing-hero"
import { ModeGrid } from "@/components/landing/mode-grid"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <LandingHero />
      <ModeGrid />
    </main>
  )
}
