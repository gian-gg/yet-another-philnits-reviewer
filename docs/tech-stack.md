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
| Markdown parse  | gray-matter + remark    | Parse question bank frontmatter + body at build time          |

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

- **Question bank:** markdown files under `data/` in the repo, parsed at build time into a typed index (frontmatter for metadata, body for prompt/choices/explanation).
- **User state:** `localStorage`, versioned schema, no server.

See [data-model.md](./data-model.md).

## What we are NOT using (and why)

- **A backend / database.** MVP is local-only; avoids auth, hosting, and migration cost. Revisit when cross-device sync becomes a real need.
- **A state library (Redux/Zustand).** Session state is local to a route; `useState` + URL state are enough.
- **A test runner.** Not wired yet. When it is, Bun's built-in `bun test` is the default candidate.
- **CSS-in-JS.** Tailwind covers styling; adding a runtime engine would regress on the "speed over visuals" principle.
