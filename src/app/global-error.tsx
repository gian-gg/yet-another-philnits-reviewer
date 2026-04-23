"use client"

import { useEffect } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "#a1a1aa",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            fatal error
          </p>
          <h1
            style={{
              marginTop: "0.75rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "1.5rem",
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            the app crashed
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              color: "#a1a1aa",
            }}
          >
            Something broke at the root. Try reloading the app.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "10px",
                color: "#a1a1aa",
              }}
            >
              ref: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "2.25rem",
              padding: "0 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #fafafa",
              backgroundColor: "#fafafa",
              color: "#0a0a0a",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            try again
          </button>
        </div>
      </body>
    </html>
  )
}
