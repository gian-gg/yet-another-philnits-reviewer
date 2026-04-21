# Architecture

High-level architecture for **philnits-vault**, a minimal PhilNITS review app. For product intent see [project.md](./project.md).

## Guiding constraints

- Simplicity over complexity — fewest moving parts that deliver the core experience.
- Speed over visuals — interactive paths must stay under a page load's worth of work.
- Local-first — the app should be usable without an account or a backend.

## Application shape

Single Next.js (App Router) app, rendered mostly on the client for the interactive question flows. No separate backend service in the MVP.

```
Browser
  └── Next.js app (App Router, RSC where cheap, CSR for session flows)
        ├── Question bank loader  ── parses markdown files from /data
        ├── Session engine        ── in-memory state machine (practice/exam)
        ├── Persistence layer     ── localStorage (progress, settings)
        └── UI (shadcn + Tailwind)
```

## Folder layout

```
src/
  app/                 Route segments (/, /practice, /exam, /review, …)
  components/          UI components (feature folders + ui/ primitives)
  hooks/               Reusable hooks (useSession, useReducedMotion, …)
  lib/                 Pure utilities (question sampling, scoring, storage)
data/                  Static question bank (Markdown files), authored by hand
docs/                  Source-of-truth docs (this folder)
public/                Static assets
```

See [data-model.md](./data-model.md) for the question bank shape and [tech-stack.md](./tech-stack.md) for tool choices.

## Core subsystems

### Question bank loader (`src/lib/questions.ts`)

- Reads markdown files from `data/` at build time and emits a typed, in-memory index.
- Parses frontmatter for metadata (id, topic, difficulty, answer, source) and the markdown body for prompt/choices/explanation.
- Validates the parsed index once; a malformed file fails the build loudly in dev.
- Exposes filtered views: by topic, by difficulty, by "unseen / wrong only".
- No network calls in the MVP.

### Session engine (`src/lib/session.ts`)

- Pure functions over a `Session` value (see data-model).
- Deterministic: same inputs → same questions/order (seedable for reproducibility).
- Two modes: `practice` (immediate feedback) and `exam` (feedback at end).

### Persistence (`src/lib/storage.ts`)

- Thin wrapper over `localStorage` with schema versioning.
- Stores: user settings (topics, last-mode), session history, wrong-answer log.
- Survives reload; never blocks the first paint.

### Routing

- `/` — landing, mode picker
- `/practice` — topic selection → practice session → results
- `/exam` — topic selection → timed exam → score + review
- `/review` — revisit wrong answers across past sessions
- `/settings` — preferences (optional, later)

## Data flow (practice session)

1. User picks topics on `/practice`.
2. `questions.filter({topics})` returns a pool.
3. `session.start(pool, {mode: "practice"})` produces a `Session`.
4. Each answer calls `session.answer(id, choice)` → new session value.
5. On finish, summary is written via `storage.saveSession(session)`.
6. Wrong answers are appended to the review log.

No server round-trips for any step above.

## What is explicitly NOT in this architecture (MVP)

- No auth, no accounts, no server DB.
- No realtime, no multiplayer, no social.
- No analytics beyond what the browser gives us.
- No i18n layer yet (copy is hard-coded English).

## Open decisions

- **Question bank source of truth.** Markdown files in-repo, parsed at build time into a typed index. If the bank grows large, the parser output can be precomputed and cached rather than re-parsed per build.
- **Progress sync across devices.** Deferred. Would require auth + a hosted DB; design the storage layer so the backend swap is additive.
