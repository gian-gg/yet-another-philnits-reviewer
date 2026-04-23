# Architecture

High-level architecture for **philnits-vault**, a minimal PhilNITS review app. For product intent see [project.md](./project.md).

## Guiding constraints

- Simplicity over complexity — fewest moving parts that deliver the core experience.
- Speed over visuals — interactive paths must stay under a page load's worth of work.
- Local-first — the app should be usable without an account or a backend.

## Application shape

Single Next.js (App Router) app, rendered mostly on the client for the interactive question flows. No separate backend service.

Questions are rendered as **screenshots** rather than reconstructed text. A build-time Bun pipeline ingests official ITPEC FE PDFs, crops one image per question, and emits a typed bank. The UI loads that bank and presents a full-bleed question image with A / B / C / D buttons.

```
Offline ingestion                         Runtime
──────────────────                        ───────
previous-exams/<year>_FE/*.pdf            Browser
  │                                         └── Next.js app (App Router)
  ▼ bun run ingest:year <year>                  ├── Question bank  (src/data/questions.ts)
public/questions/<id>.png   ◀──────────── ──────┤   ↳ generated, typed, bundled
src/data/questions/<id>.json                    ├── Session engine (in-memory state)
src/data/questions.ts  (aggregated)             └── UI: <Image> + A/B/C/D
```

## Folder layout

```
previous-exams/          Source PDFs, one folder per exam year (read-only input)
scripts/                 Ingestion pipeline
  ingest-year.ts         CLI: `bun run ingest:year <year>`
  lib/
    pdf-answers.ts       Answer-key parsing
    pdf-questions.ts     Per-question boundary detection + cropping
    emit-data.ts         JSON + aggregated TS emitters
public/questions/        Generated per-question PNGs (served as static assets)
src/
  app/                   Route segments (/, /practice, /exam)
  components/            UI components (feature folders + ui/ primitives)
  lib/                   Pure utilities (question sampling, topics, utils)
  data/
    questions/<id>.json  Per-exam outputs of the ingestion pipeline
    questions.ts         Auto-generated aggregate imported by the app
docs/                    Source-of-truth docs (this folder)
```

See [data-model.md](./data-model.md) for the question shape and ingestion details, and [tech-stack.md](./tech-stack.md) for tool choices.

## Core subsystems

### Ingestion pipeline (`scripts/ingest-year.ts`)

- Invoked per year: `bun run ingest:year 2025A`.
- Locates the MCQ question + answer PDFs in `previous-exams/<year>_FE/` via regex (tolerates `AM/PM`, `-A/-B`, `Question/Questions`, `Answer/Answers` naming variants).
- Parses the answers PDF to a `Map<questionNo, ChoiceId>`.
- Parses the questions PDF for `Qn.` markers at the left margin (using `pdfjs-dist` text layer), renders each page to a PNG with `@napi-rs/canvas`, and crops each question's bounding box (stitching across page breaks when needed) via `sharp`.
- Writes `public/questions/<examId>_NN.png`, per-exam `src/data/questions/<examId>.json`, then regenerates `src/data/questions.ts` by merging all per-exam JSON files under `src/data/questions/`.
- Topic classification is deferred: every question is written with `topic: "uncategorized"` and reclassified manually later.

### Question bank loader (`src/lib/questions.ts`)

- Imports the bundled `QUESTIONS` constant from the auto-generated `src/data/questions.ts`.
- Filters by `TopicId`, shuffles deterministically (`mulberry32`), and returns a slice of size `count`. Cycles with suffixed ids when the bank is smaller than requested.
- No filesystem access at runtime — everything is compile-time data.

### Session engine (inline in `src/components/session/session-runner.tsx`)

- Holds index, answers, flagged, reveal, timer state in React state.
- Two modes: `practice` (optional reveal per question) and `exam` (timer, deferred scoring).
- Keyboard shortcuts: `A`–`D` pick, `←/→` nav, `Enter` next, `F` flag, `R` reveal.

### Routing

- `/` — landing, mode picker
- `/practice` — topic selection → practice session → results
- `/exam` — topic selection → timed exam → score + review

No persistence layer in the current build — sessions are ephemeral. A `localStorage` layer can be added later without touching the data shape.

## Data flow (practice session)

1. User picks topics on `/practice`.
2. `getQuestions({ topics, count })` filters and shuffles the in-memory bank.
3. `SessionRunner` renders the current question's image + four letter buttons.
4. On submit/finish, `SessionResults` computes score and renders the review list with per-question images and correct/chosen letters.

No server round-trips, no network calls.

## What is explicitly NOT in this architecture

- No auth, accounts, or server DB.
- No runtime text extraction — questions are images. Accessibility is degraded until alt text or per-question metadata is authored.
- No persistence (localStorage deferred).
- No i18n.

## Open decisions

- **Cross-device progress sync.** Deferred. Would require auth + a hosted DB.
- **Topic classification.** Currently manual/deferred. Options under consideration: hardcoded question-number → topic map (FE AM follows a stable syllabus order), or LLM-assisted classification from extracted question text.
- **PM and B-set ingestion.** Out of scope in the current pipeline; MCQ AM/A-set only.
