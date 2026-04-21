import Link from "next/link"
import { ArrowRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ModeCardProps {
  href: string
  title: string
  description: string
}

export function ModeCard({ href, title, description }: ModeCardProps) {
  return (
    <Link
      href={href}
      className="group/mode-card rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="h-full ring-foreground/10 transition-colors group-hover/mode-card:ring-foreground/40">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight sm:text-2xl">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-6 flex items-center justify-end">
          <ArrowRight
            className="size-5 text-muted-foreground transition-transform group-hover/mode-card:translate-x-1 group-hover/mode-card:text-foreground"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  )
}
