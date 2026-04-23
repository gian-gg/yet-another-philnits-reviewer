# Data Model

Shapes for the question bank and session state. The real types live in `src/lib/questions.ts` and `src/lib/topics.ts`.

## Question bank

Questions are **screenshot-based**. Each question is a single cropped PNG rendered from an official ITPEC FE PDF, paired with metadata: id, topic, image path, correct answer letter. There is no authored markdown, no prompt text, no explanation text — the image is the question.

### On-disk layout

```
previous-exams/              Source PDFs (read-only input to the pipeline)
  2025A_FE/
    2025A_FE-A_Questions.pdf
    2025A_FE-A_Answers.pdf
  2022S_FE/
    2022S_FE_AM_Questions.pdf
    2022S_FE_AM_Answer.pdf
  …

public/questions/            Generated per-question PNGs (served statically)
  2025A_FE_AM_01.png
  2025A_FE_AM_02.png
  …

src/data/questions/          Per-exam JSON outputs (generated)
  2025A_FE_AM.json
  2025S_FE_AM.json
  …

src/data/questions.ts        Auto-generated aggregate, imported by the app
```

### Generated shape

Per-exam JSON (`src/data/questions/<examId>.json`):

```json
[
  {
    "id": "2025A_FE_AM_01",
    "topic": "uncategorized",
    "image": "/questions/2025A_FE_AM_01.png",
    "answer": "d"
  },
  …
]
```

Runtime type (`src/lib/questions.ts`):

```ts
type ChoiceId = "a" | "b" | "c" | "d"

interface Question {
  id: string // "<year><season>_FE_AM_<NN>", NN zero-padded
  topic: TopicId // see src/lib/topics.ts
  image: string // absolute path under /public, e.g. "/questions/<id>.png"
  answer: ChoiceId
}
```

### Invariants

- `id` is globally unique and matches the PNG filename stem.
- `answer` is one of `"a" | "b" | "c" | "d"`.
- `topic` is a valid `TopicId` from `src/lib/topics.ts`. The ingestion pipeline writes `"uncategorized"` for every question; a real topic is assigned manually later.
- `image` points at an existing file under `public/`. If the PNG is missing, the UI renders a broken-image placeholder.

## Ingestion pipeline

Invocation: `bun run ingest:year <year-code>` where `<year-code>` matches `YYYY[AS]` (e.g. `2025A`, `2022S`, `2010S`).

Steps:

1. **Resolve PDFs.** Glob `previous-exams/<year>_FE/` for the MCQ pair using regex that tolerates filename drift (`_AM_Questions.pdf`, `_FE-A_Questions.pdf`, `Answer` / `Answers`, older `2007Oct_` prefixes, etc.).
2. **Parse answers.** Load the answer PDF, concatenate text across pages, extract `(?:Q)?(\d+)\.?\s+([a-d])` pairs into a `Map<number, ChoiceId>`.
3. **Find question markers.** For each page of the questions PDF, use `pdfjs-dist` `getTextContent()` to find items matching `^Q\d+\.?$` whose `transform[4]` (x-coord) is in the left 15% of the page. Collect `{ questionNo, page, yTop }`.
4. **Render pages.** Each page rendered at 2× scale via `@napi-rs/canvas`, compressed to PNG by `sharp`.
5. **Crop per question.** For each marker, crop from its y-coord down to the next marker's y-coord (with `PAD_TOP = 40` px above the baseline to capture the full `Q<n>.` line). When the next marker is on a later page, slices are stitched vertically.
6. **Emit outputs.** Write `public/questions/<examId>_NN.png`, per-exam `src/data/questions/<examId>.json`, then regenerate `src/data/questions.ts` by concatenating every `*.json` under `src/data/questions/` into a single typed `QUESTIONS` constant.

The pipeline is deterministic — re-running overwrites in place. The aggregate TS file carries an `AUTO-GENERATED` banner with the regeneration timestamp and the list of source exams.

### Coverage

- **AM / A-set only** (MCQ papers). `PM` and `B-set` are out of scope.
- Older years (≤ 2023) have 80 questions; 2024+ Subject A has 60 questions.

## Session state

In-memory only (no persistence). Lives in `src/components/session/session-runner.tsx` via React state.

```ts
type SessionMode = "practice" | "exam"

// Keyed by question.id
type AnswerMap = Record<string, ChoiceId | undefined>

// Runner state (conceptual)
interface SessionState {
  mode: SessionMode
  questions: readonly Question[]
  index: number // current position
  answers: AnswerMap // user picks
  revealed: Record<string, true | undefined> // practice-mode reveals
  flagged: Set<string> // user-flagged ids
  submitted: boolean
  startedAt: number | null // exam mode only
}
```

### Mode differences

| Aspect          | Practice                                                   | Exam                                     |
| --------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Feedback timing | Configurable: instant or on demand (`R`)                   | Only on the results screen               |
| Timer           | None                                                       | Fixed duration (`durationMinutes`)       |
| Skipping        | Allowed, revisit freely                                    | Allowed, revisit until submit            |
| Visual cue      | Chosen button is outlined; revealed button tints red/green | Chosen button outlined only until submit |

## Topics

`src/lib/topics.ts` exports `TopicId` (string union) and `TOPICS` (labelled metadata). Current ingestion output assigns every question to the `"uncategorized"` topic; real topic assignment is a manual backfill step. The topic picker shows "Uncategorized" so sessions can still filter to the ingested bank.

## Validation

- Ingestion logs a warning if the parsed answer count ≠ marker count, or if a question has no mapped answer (that question is skipped, not written).
- Runtime: `src/lib/questions.ts` filters out entries whose `topic` isn't a known `TopicId`. An unknown topic in the JSON therefore silently drops the question — keep `TopicId` in sync with the topics your data uses.
