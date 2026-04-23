# Tech Stack

Tooling and rationale for **philnits-vault**. Choices favor speed of iteration and zero operational overhead.

## Runtime & framework

| Piece           | Choice                  | Why                                                           |
| --------------- | ----------------------- | ------------------------------------------------------------- |
| Package manager | Bun                     | Fast installs, single binary, bundled runner for scripts      |
| Framework       | Next.js 16 (App Router) | File-based routing, RSC where useful, easy static export path |
| Language        | TypeScript (strict)     | Type safety on the session/question contracts                 |
| Styling         | Tailwind CSS v4         | Utility-first, zero runtime, Oxide engine is fast             |
| UI primitives   | shadcn/ui + Radix       | Accessible, unopinionated, copy-into-repo (no vendor lock)    |
| Icons           | lucide-react            | Tree-shakeable, consistent set                                |
| Theming         | next-themes             | Dark/light toggle without flash                               |
| Images          | `next/image`            | Served from `public/questions/*.png` at runtime               |

## Ingestion (devDependencies only — not shipped to the client)

| Piece            | Choice            | Why                                                           |
| ---------------- | ----------------- | ------------------------------------------------------------- |
| PDF parsing      | `pdfjs-dist`      | Page text layout + coordinate transforms for marker detection |
| Page rasterizer  | `@napi-rs/canvas` | Node-native canvas backend pdfjs renders into                 |
| Image processing | `sharp`           | Crop, stitch page slices, PNG compression                     |

The ingestion pipeline runs offline via `bun run ingest:year <year>` and writes to `public/questions/` + `src/data/`. Its deps never reach the browser.

## Code quality

| Piece         | Choice                                 |
| ------------- | -------------------------------------- |
| Linter        | ESLint (eslint-config-next)            |
| Formatter     | Prettier + prettier-plugin-tailwindcss |
| Type checking | `tsc --noEmit`                         |
| Git hooks     | husky                                  |
| Staged runner | lint-staged                            |
| Commit policy | commitlint + config-conventional       |

Hook pipeline:

- **pre-commit** → `bun run typecheck` then `bunx lint-staged` (eslint + prettier on staged files).
- **commit-msg** → commitlint (Conventional Commits).

See [development.md](./development.md) for how to run these locally.

## Data

- **Question bank:** generated at ingest time into `src/data/questions.ts`, a typed TS module bundled with the app. Per-question images live under `public/questions/`. See [data-model.md](./data-model.md) for the pipeline.
- **User state:** in-memory only — session state does not survive reload. `localStorage` persistence is deferred.

## What we are NOT using (and why)

- **A backend / database.** The app is local-only; questions are static assets shipped with the build.
- **A state library (Redux/Zustand).** Session state is local to a single route; `useState` + URL state are enough.
- **Runtime markdown / text extraction.** Earlier iterations reconstructed question text from PDFs; extraction was too fragile. Questions are images now — see [architecture.md](./architecture.md).
- **A test runner.** Not wired yet. When it is, Bun's built-in `bun test` is the default candidate.
- **CSS-in-JS.** Tailwind covers styling; adding a runtime engine would regress on the "speed over visuals" principle.
