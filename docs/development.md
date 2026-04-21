# Development

How to run, check, and commit **philnits-vault** locally.

## Prerequisites

- **Bun** ≥ 1.2 (package manager + script runner)
- **Node** ≥ 20 (for tools that shell out)
- **Git** ≥ 2.30

## First-time setup

```bash
bun install          # installs deps and runs `husky` via the prepare script
```

That single command also wires up git hooks (`.husky/pre-commit`, `.husky/commit-msg`). Verify:

```bash
git config core.hooksPath   # should print ".husky"
```

## Day-to-day scripts

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `bun run dev`       | Next.js dev server (Turbopack)    |
| `bun run build`     | Production build                  |
| `bun run start`     | Serve the production build        |
| `bun run lint`      | ESLint on the repo                |
| `bun run format`    | Prettier write on `**/*.{ts,tsx}` |
| `bun run typecheck` | `tsc --noEmit`                    |

## Git workflow

Commits follow **Conventional Commits**. Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

```
feat: add topic filter to practice mode
fix(exam): stop timer when user submits early
```

On every `git commit`:

1. **pre-commit** — runs `bun run typecheck`, then `bunx lint-staged` (eslint + prettier on staged files).
2. **commit-msg** — runs commitlint against `@commitlint/config-conventional`.

A commit is rejected if any step fails. Fix the underlying issue and re-commit — do **not** skip hooks with `--no-verify`.

## Path aliases

`@/*` maps to `./src/*` (see `tsconfig.json`). Prefer `@/components/...` over deep relative paths.

## Where things live

- Routes → `src/app/`
- UI components → `src/components/`
- Hooks → `src/hooks/`
- Pure logic / utilities → `src/lib/`
- Static question bank (markdown, one question per file) → `data/`
- Docs (this folder) → `docs/`

See [architecture.md](./architecture.md) for the full picture.

## Troubleshooting

- **"husky: command not found"** — run `bun install` again; the `prepare` script wires hooks.
- **Prettier rewrites half the repo** — make sure your editor isn't using a different Prettier version; the repo config in `.prettierrc` is authoritative.
- **Commit rejected with "subject may not be empty"** — your commit message isn't Conventional Commits shaped. See examples above.
