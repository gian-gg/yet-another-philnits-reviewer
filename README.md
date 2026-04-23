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
- Image paths in the JSON follow `<year>/<season>/NN.avif` (e.g. `/2025/autumn/01.avif`).
- The aggregate `src/data/questions.ts` is generated — never hand-edit it; run `bun run regen:bank` after changing JSONs.
- Topics are defined in `src/lib/topics.ts`. Use only IDs from the `TopicId` union.

### Image hosting

Question images are served from a separate public repo (`yapr-assets`) via jsDelivr. They are **not** committed to this repo — the ingest pipeline writes to a gitignored `yapr-assets/` directory which acts as a staging area. After ingest, copy new files into your local clone of the assets repo, commit, tag, and push.

`NEXT_PUBLIC_IMAGE_BASE_URL` controls where the app loads images from at runtime:

- **Unset** — paths resolve to `/<year>/<season>/NN.avif` (Next would serve from `public/`). Local dev only works for files you've manually copied into `public/`.
- **Set** — every JSON `image` path is prefixed with this value. Intended use: a public GitHub repo served via jsDelivr.

Example for production:

```
NEXT_PUBLIC_IMAGE_BASE_URL=https://cdn.jsdelivr.net/gh/<user>/yapr-assets@<tag>
```

Pin to a tag (or commit SHA), never `@main`, to avoid jsDelivr's edge-cache returning stale content. `next/image` is rendered with `unoptimized` so Vercel's image optimizer never touches the AVIFs (they're already at final size).

### Classifying new questions

Fresh ingests land with `topic: "uncategorized"`. To assign topics, use the bundled Claude Code skill at `.claude/skills/classify-questions` — invoke it with `/classify-questions` (optionally scoped to one exam, e.g. `/classify-questions 2025A`). The skill reads each question image, picks a `TopicId`, edits the per-exam JSON in place, then runs `bun run regen:bank` and `bun run typecheck`.

## License

[MIT](./LICENSE) © gian-gg
