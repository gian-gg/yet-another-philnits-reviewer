import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  metadataBase: new URL("https://yapr.giann.dev"),
  title: {
    default: "yet-another-philnits-reviewer",
    template: "%s · yet-another-philnits-reviewer",
  },
  description:
    "yet-another-philnits-reviewer — drill PhilNITS FE questions by topic or run a full timed mock exam.",
  applicationName: "yet-another-philnits-reviewer",
  keywords: [
    "PhilNITS",
    "PhilNITS FE",
    "ITPEC",
    "Fundamental IT Engineer",
    "FE exam",
    "IT certification",
    "exam prep",
    "mock exam",
    "practice questions",
  ],
  authors: [{ name: "gian-gg", url: "https://giann.dev" }],
  creator: "gian-gg",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://yapr.giann.dev",
    title: "yet-another-philnits-reviewer",
    description:
      "Drill PhilNITS FE questions by topic or run a full timed mock exam.",
    siteName: "yet-another-philnits-reviewer",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "yet-another-philnits-reviewer",
    description:
      "Drill PhilNITS FE questions by topic or run a full timed mock exam.",
  },
  robots: { index: true, follow: true },
}

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
