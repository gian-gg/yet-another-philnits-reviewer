---
name: classify-questions
description: Categorize PhilNITS FE question screenshots into topics by reading the image and updating the per-exam JSON bank. Invoke when the user wants to backfill `topic` fields on ingested questions (anything marked `"uncategorized"`), classify a specific exam, or reclassify misassigned questions.
---

# Classify Questions

Assign an accurate `topic` to each question in the generated bank by looking at
its screenshot and writing the result back into the per-exam JSON file. The
ingestion pipeline (`bun run ingest:year`) tags every new question with
`topic: "uncategorized"` — this skill is the manual classification pass that
follows.

## Inputs

- **Per-exam JSON files**: `src/data/questions/<examId>.json` — each entry:
  `{ id, topic, image, answer }`.
- **Question images**: `public/questions/<id>.png` — one PNG per question. The
  `image` field in the JSON is the public URL (e.g. `/questions/2025A_FE_AM_01.png`);
  strip the leading slash to get the filesystem path (`public/questions/...`).
- **Topic allowlist**: `src/lib/topics.ts` — the `TopicId` union. Every topic
  the app supports is listed there along with a short description.

## Outputs

- Updated `topic` fields in `src/data/questions/<examId>.json`.
- Regenerated `src/data/questions.ts` via `bun run regen:bank`.

## Topic allowlist (current)

Read `src/lib/topics.ts` at the start of each run in case the list has changed.
These are the canonical IDs — use the exact string (kebab-case, lowercase):

- `number-systems` — Binary, hex, encoding, fixed/floating point
- `applied-math` — Probability, statistics, numerical methods
- `discrete-math` — Logic, sets, graphs, complexity
- `computer-architecture` — CPU, memory, I/O, storage
- `operating-systems` — Processes, scheduling, memory, file systems
- `digital-logic` — Gates, circuits, boolean algebra
- `computer-graphics` — Rendering, color models, image processing
- `databases` — Relational models, SQL, transactions
- `networking` — Protocols, OSI, TCP/IP, routing
- `cybersecurity` — Cryptography, access control, threats
- `software-engineering` — SDLC, design patterns, architecture
- `software-testing` — Test strategies, coverage, QA
- `emerging-tech` — AI, IoT, blockchain, cloud
- `project-management` — Planning, estimation, risk
- `it-service-management` — Operations, SLAs, incident response
- `system-auditing` — Controls, compliance, audit process
- `quality-management` — QA/QC, standards, continuous improvement
- `corporate-finance` — Accounting, budgeting, financial analysis
- `business-strategy` — Management, marketing, OR
- `system-strategy` — IT planning, solution design
- `law-ip` — Laws, standards, compliance
- `digital-trends` — DX, emerging business tech

Never use `uncategorized` as an output. If a question genuinely doesn't fit any
topic, flag it in the run report and leave the existing value so it's easy to
find again.

## Workflow

1. **Determine scope.** If the user named a specific exam (e.g. "classify
   2025A"), limit the run to `src/data/questions/<that>.json`. Otherwise, list
   every JSON under `src/data/questions/` and pick the one(s) with the most
   `"uncategorized"` entries (`grep -c '"uncategorized"' src/data/questions/*.json`).

2. **Reload the topic list** from `src/lib/topics.ts` so classifications stay
   in sync with the source of truth.

3. **For each question entry with `topic: "uncategorized"`:**
   - Read the image file at `public/<image>` (strip the leading slash).
   - Examine the question text and answer choices visible in the image. Use
     the question's subject matter — not the correct answer letter — to pick a
     topic.
   - Pick the single best-fit `TopicId`. Prefer the more specific topic when
     two fit (e.g. `cybersecurity` over `networking` when the question is
     about intrusion detection even if a network diagram appears).
   - Note low-confidence picks in a running list for the summary.

4. **Edit the JSON** in place, changing only the `topic` field on each
   classified entry. Preserve key order, indentation, and the trailing newline.
   Use the Edit tool with a unique `old_string` (include the full entry object
   or the `id` + `topic` lines together) so you don't accidentally match a
   different entry.

5. **Batch commits to the filesystem.** After each JSON file is fully updated,
   move on to the next. Don't regenerate the aggregate until all requested
   files are done.

6. **Regenerate the aggregate bank**: `bun run regen:bank`. This rewrites
   `src/data/questions.ts` from the updated JSONs.

7. **Verify**: `bun run typecheck`. An `unknown topic` warning at build time
   means you used an ID that's not in `TopicId` — fix the JSON and re-run
   `regen:bank`.

8. **Report** back with:
   - Count of entries classified, grouped by topic.
   - List of any entries you left as `uncategorized` (with `id` and reason).
   - List of low-confidence picks the user should spot-check.

## Decision heuristics

- **Question number is a weak hint, not a rule.** FE AM broadly covers
  technology in Q1–50 and management/strategy in Q51+, but topic boundaries
  drift year to year. Always decide from the image content.
- **Short questions with explicit keywords** (e.g. "TCP", "SQL", "UML",
  "CVSS") → pick the obvious topic.
- **Calculation-heavy questions** with no domain wrapping (counting,
  probability, graphs) → `applied-math` or `discrete-math`.
- **Diagrams or flowcharts without a specific IT domain** → look at what the
  boxes represent. ER / table diagrams → `databases`. UML → `software-engineering`.
  Circuit symbols → `digital-logic`. Network topology → `networking`.
- **Process/management questions** that mention PMBOK, WBS, earned value,
  risk matrices → `project-management`. ITIL, SLAs, incident tiers →
  `it-service-management`. Audit controls → `system-auditing`.
- **Business/finance** questions with P/L statements, balance sheets, ROI →
  `corporate-finance`. Market strategy, 4Ps, SWOT → `business-strategy`.
- **Legal / IP / standards** (copyright, trade secret, GDPR analogues) →
  `law-ip`.

## Efficiency tips

- The user may want to skim or approve picks as you go. If they've asked for
  a full exam (60–80 questions), consider reporting progress every ~20
  questions so they can course-correct early.
- If the user asks you to run over many exams, do one exam at a time and
  regenerate the bank after each so each run is safely resumable.
- If you can't read a PNG (file missing, corrupted), log the `id` and skip —
  don't guess. The user may need to re-run `bun run ingest:year <year>`.
