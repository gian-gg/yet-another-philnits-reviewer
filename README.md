# yet-another-philnits-reviewer

A focused workspace for **PhilNITS FE** exam prep. Drill questions by topic or run a full timed mock exam.

Live at [yapr.giann.dev](https://yapr.giann.dev).

> **Heads up:** this is a drilling tool, not a tutorial. Questions show the correct answer after you submit, but **no explanations or solutions** — you're on your own for the "why". Pair it with your usual study material.

## Coverage

- **AM** — every exam from 2007 through 2025
- **PM** — 2024 and 2025

## Modes

- **Practice** — pick topics (AM) or an exam set (PM) and drill at your own pace, with immediate feedback after each question.
- **Mock Exam** — a full timed run scored at the end, mirroring the real exam's question count and time limit.

## How questions get in

Past exams arrive as PDFs. Two pieces turn them into a usable question bank:

### 1. Ingestion pipeline

`bun run ingest:year <year>` walks a year's PDFs, slices each question into its own image, and writes a per-exam JSON entry (`{ id, topic, image, answer }`) under `src/data/questions/`. Images land in a staging `yapr-assets/` directory that's hosted separately and served via jsDelivr — keeping the app repo light and CDN-cached. `bun run regen:bank` then rolls every per-exam JSON into the aggregate the app reads.

Fresh ingests land with `topic: "uncategorized"` — they're drillable, but not yet filterable by topic.

### 2. The Claude skill

A bundled Claude Code skill at `.claude/skills/classify-questions` handles topic assignment. Run `/classify-questions` (or scope it: `/classify-questions 2025A`) and Claude reads each question image, picks a topic from the canonical list in `src/lib/topics.ts`, edits the JSON in place, then regenerates the bank and typechecks. This replaces the tedious manual step of opening every question and tagging it by hand.

_PS: you might want to convert the generated AVIF files to PNG before classifying — saves a ton of tokens._

## Stack

Next.js (App Router) + React 19, Tailwind v4 + shadcn/ui, Bun runtime, TypeScript end-to-end.

## Getting started

```bash
bun install
bun run dev
```

App runs at `http://localhost:3000`.

## License

[MIT](./LICENSE) © gian-gg
