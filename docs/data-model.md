# Data Model

Shapes for the question bank, sessions, and persisted user state. All types are TypeScript-flavored pseudocode — the real source lives in `src/lib/types.ts` when implemented.

## Question bank

Authored as **one Obsidian-flavored markdown file per question**, organized by topic under `data/`. The files are vault-native — they render cleanly in Obsidian and parse cleanly in the app.

### On-disk layout

```
data/
  networking/
    2021A_FE_AM_33.md
    2022S_FE_AM_41.md
  database/
    2021A_FE_AM_45.md
  ...
```

Folder name = topic. The filename stem matches the question id in the H1 heading and must be globally unique.

### File shape

```markdown
Created: 2024-10-18 22:38
Category: #networking
Status: #philnits

# 2021A_FE_AM_33 %% ex. 2024S_FE-A_83 %%

Which of the following is an appropriate explanation of DHCP?

a) It is a protocol for accessing a directory service.
b) It is a protocol for automatically assigning an IP address.
c) It is a protocol for converting a private IP address to a global IP address.
d) It is a protocol for forwarding an e-mail.
?
b) It is a protocol for automatically assigning an IP address.

### Explanation

**DHCP (Dynamic Host Configuration Protocol)** is a protocol used to
automatically assign IP addresses to devices on a network. …

### Why the Others Won't Fit

**a) It is a protocol for accessing a directory service**:

- This describes **LDAP**, which is used to access and manage directory
  services, not to assign IP addresses.

**c) It is a protocol for converting a private IP address to a global IP address**:

- This describes **NAT**, which translates private IP addresses to public
  (global) IP addresses, not the automatic assignment of IP addresses.

**d) It is a protocol for forwarding an e-mail**:

- This describes **SMTP**, which is used to send and forward emails, not for
  IP address assignment.

###

## %% ignore this %%

# References %% add your references here %%

[What is DHCP? …](https://efficientip.com/glossary/what-is-dhcp-and-why-is-it-important/)
```

### Parse rules

The loader walks the file top to bottom:

1. **Header metadata** — `Key: value` lines before the first blank line. Recognized keys: `Created`, `Category`, `Status`. `Category` is a `#tag` whose value (minus the `#`) is the canonical topic. Unknown keys are preserved but ignored.
2. **Obsidian comments** — any `%% … %%` span is stripped before further parsing. Handles inline (`# Title %% note %%`) and block forms.
3. **Question id** — the first `# …` heading after the metadata block. Its stem (before any inline comment) is the `id` and must match the filename.
4. **Prompt** — all content between the H1 and the first choice line.
5. **Choices** — consecutive lines matching `^([a-z])\)\s+(.+)$`. The letter is the choice `id`; the rest is the text.
6. **Answer marker** — a lone `?` line terminates the choices block.
7. **Answer** — the next non-empty line matching `^([a-z])\)\s+.*$`; its letter is `answerId`. The accompanying text is not stored separately (the choice text is the source of truth).
8. **Explanation** — content under the `### Explanation` heading until the next `###` or end-of-body.
9. **Distractor notes** — content under `### Why the Others Won't Fit`, parsed into a map keyed by choice id.
10. **Footer** — everything from the first standalone `---` onward is treated as Obsidian chrome and discarded, except a `# References` block whose links become `references`.

### Parsed shape (in memory)

```ts
type Topic = string // derived from `Category: #...`; validated against an allowlist

type Question = {
  id: string // e.g. "2021A_FE_AM_33"
  topic: Topic
  prompt: string // raw markdown
  choices: Choice[]
  answerId: string // must match one of choices[].id
  explanation?: string // raw markdown
  distractorNotes?: Record<string, string> // keyed by choice id (a, c, d, …)
  references?: Reference[]
  created?: string // ISO-ish date from `Created:`
  aliases?: string[] // extra ids from `%% ex. … %%` in the H1
}

type Choice = {
  id: string // "a" | "b" | "c" | "d" (lowercase)
  text: string // raw markdown
}

type Reference = {
  label: string
  url: string
}
```

Note: there is no `difficulty` field in the source format. If difficulty is needed later, it becomes a new metadata key (`Difficulty: …`) rather than being inferred.

### Invariants

- Filename stem equals the H1 id (case-sensitive).
- Every id is unique across the entire `data/` tree.
- `answerId` matches one of the parsed choice ids.
- Each question has ≥ 2 choices.
- `Category` tag resolves to a topic on the allowlist in `src/lib/topics.ts`.
- A question never appears twice in a single session.

## Session

In-memory value produced and mutated by `src/lib/session.ts`. Only the **summary** is persisted.

```ts
type Mode = "practice" | "exam"

type Session = {
  id: string // uuid, generated at start
  mode: Mode
  startedAt: number // epoch ms
  finishedAt?: number
  topics: Topic[] // filter used to build the pool
  questionIds: string[] // the ordered pool
  answers: Record<string, AnsweredQuestion> // keyed by questionId
  seed?: number // for reproducible ordering
}

type AnsweredQuestion = {
  questionId: string
  chosenId: string | null // null = skipped
  correct: boolean
  answeredAt: number
}
```

### Mode differences

| Aspect             | Practice                      | Exam                                |
| ------------------ | ----------------------------- | ----------------------------------- |
| Feedback timing    | Immediately after each answer | Only after the full session ends    |
| Timer              | None                          | Fixed duration (configurable later) |
| Skipping           | Allowed, can revisit          | Allowed, can revisit until submit   |
| Explanations shown | Inline                        | In the review screen                |

## Persisted state (localStorage)

Single root key: `philnits-vault:v1`. Schema is versioned so a future migration is straightforward.

```ts
type PersistedState = {
  version: 1
  settings: {
    lastMode?: Mode
    preferredTopics?: Topic[]
    theme?: "light" | "dark" | "system"
  }
  history: SessionSummary[] // completed sessions, newest first
  wrongLog: WrongEntry[] // deduped by questionId, newest wins
}

type SessionSummary = {
  id: string
  mode: Mode
  startedAt: number
  finishedAt: number
  topics: Topic[]
  total: number // question count
  correct: number
}

type WrongEntry = {
  questionId: string
  lastMissedAt: number
  missCount: number
}
```

Notes:

- Storage writes happen **only** at session end (or explicit settings change), not on every answer — avoids tearing in private windows and keeps the hot path fast.
- `wrongLog` powers the "revisit mistakes" review flow.

## Validation

- Question bank is validated at build time; a malformed markdown file fails the build loudly in development. In production the generated index is already trusted.
- Persisted state is validated on read; any schema mismatch resets to a fresh default rather than crashing.
