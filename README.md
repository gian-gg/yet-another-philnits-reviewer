# yet-another-philnits-reviewer

A focused workspace for **PhilNITS FE** exam prep. Drill questions by topic or run a full timed mock exam.

Live at [yapr.giann.dev](https://yapr.giann.dev).

> **Heads up:** this is a drilling tool, not a tutorial. Questions show the correct answer after you submit, but **no explanations or solutions** — you're on your own for the "why". Pair it with your usual study material.

## Modes

- **Practice** — pick topics and a question count; immediate feedback after each question.
- **Mock Exam** — fixed 60-question run with a 90-minute timer; scored at the end.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com) primitives
- [Bun](https://bun.sh) as runtime, package manager, and test runner
- TypeScript, ESLint, Prettier, Husky + lint-staged + commitlint

## Getting started

```bash
bun install
bun run dev
```

App runs at `http://localhost:3000`.

## Scripts

| Script                       | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `bun run dev`                | Next dev server (Turbopack)                            |
| `bun run build`              | Production build                                       |
| `bun run start`              | Serve the production build                             |
| `bun run lint`               | ESLint                                                 |
| `bun run format`             | Prettier write                                         |
| `bun run typecheck`          | `tsc --noEmit`                                         |
| `bun run test`               | Bun test runner                                        |
| `bun run ingest:year <year>` | Ingest a year of question PDFs into per-exam JSONs     |
| `bun run regen:bank`         | Regenerate `src/data/questions.ts` from per-exam JSONs |

## Question bank

- Per-exam JSON entries live under `src/data/questions/<examId>.json` with shape `{ id, topic, image, answer }`.
- Question images live under `public/questions/<id>.png`.
- The aggregate `src/data/questions.ts` is generated — never hand-edit it; run `bun run regen:bank` after changing JSONs.
- Topics are defined in `src/lib/topics.ts`. Use only IDs from the `TopicId` union.

### Classifying new questions

Fresh ingests land with `topic: "uncategorized"`. To assign topics, use the bundled Claude Code skill at `.claude/skills/classify-questions` — invoke it with `/classify-questions` (optionally scoped to one exam, e.g. `/classify-questions 2025A`). The skill reads each question image, picks a `TopicId`, edits the per-exam JSON in place, then runs `bun run regen:bank` and `bun run typecheck`.

## License

[MIT](./LICENSE) © gian-gg
