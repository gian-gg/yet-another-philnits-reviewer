import { isTopicId, type TopicId } from "./topics"

export type ChoiceId = "a" | "b" | "c" | "d"

export interface Choice {
  id: ChoiceId
  text: string
}

export interface Question {
  id: string
  topic: TopicId
  prompt: string
  choices: Choice[]
  answerId: ChoiceId
  explanation: string
}

// Temporary placeholder bank. The real bank is authored as markdown in /data
// and parsed at build time (see docs/data-model.md). Until that loader lands,
// these samples let the session UI be built and exercised end-to-end.
const SAMPLE_BANK: readonly Question[] = [
  {
    id: "FE_SAMPLE_001",
    topic: "number-systems",
    prompt: "Convert the binary number 1011 to decimal.",
    choices: [
      { id: "a", text: "9" },
      { id: "b", text: "10" },
      { id: "c", text: "11" },
      { id: "d", text: "12" },
    ],
    answerId: "c",
    explanation:
      "1011₂ = 1×2³ + 0×2² + 1×2¹ + 1×2⁰ = 8 + 0 + 2 + 1 = 11. Option (c) is correct.",
  },
  {
    id: "FE_SAMPLE_002",
    topic: "networking",
    prompt: "Which of the following is an appropriate explanation of DHCP?",
    choices: [
      { id: "a", text: "A protocol for accessing a directory service." },
      {
        id: "b",
        text: "A protocol for automatically assigning an IP address.",
      },
      {
        id: "c",
        text: "A protocol for converting a private IP to a global IP.",
      },
      { id: "d", text: "A protocol for forwarding email." },
    ],
    answerId: "b",
    explanation:
      "DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices. LDAP handles directory services, NAT converts private↔public IPs, and SMTP forwards email.",
  },
  {
    id: "FE_SAMPLE_003",
    topic: "databases",
    prompt:
      "Which SQL clause is used to filter rows AFTER aggregation has been applied?",
    choices: [
      { id: "a", text: "WHERE" },
      { id: "b", text: "GROUP BY" },
      { id: "c", text: "HAVING" },
      { id: "d", text: "ORDER BY" },
    ],
    answerId: "c",
    explanation:
      "HAVING filters aggregated results (post-GROUP BY). WHERE filters rows before aggregation. GROUP BY forms the groups; ORDER BY sorts the final output.",
  },
  {
    id: "FE_SAMPLE_004",
    topic: "operating-systems",
    prompt:
      "Under round-robin CPU scheduling, a process that exceeds its time quantum is:",
    choices: [
      { id: "a", text: "Terminated immediately." },
      { id: "b", text: "Moved to the head of the ready queue." },
      { id: "c", text: "Preempted and moved to the tail of the ready queue." },
      { id: "d", text: "Promoted to a higher priority." },
    ],
    answerId: "c",
    explanation:
      "Round-robin preempts any process that uses its full time quantum and enqueues it at the tail, giving other processes a fair turn.",
  },
  {
    id: "FE_SAMPLE_005",
    topic: "discrete-math",
    prompt:
      "What is the time complexity of binary search on a sorted array of n elements?",
    choices: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(log n)" },
      { id: "c", text: "O(n)" },
      { id: "d", text: "O(n log n)" },
    ],
    answerId: "b",
    explanation:
      "Binary search halves the search space each step, so it runs in O(log n) comparisons in the worst case.",
  },
  {
    id: "FE_SAMPLE_006",
    topic: "cybersecurity",
    prompt:
      "Which cryptographic property ensures that a message has not been altered in transit?",
    choices: [
      { id: "a", text: "Confidentiality" },
      { id: "b", text: "Integrity" },
      { id: "c", text: "Availability" },
      { id: "d", text: "Non-repudiation" },
    ],
    answerId: "b",
    explanation:
      "Integrity (typically via a MAC or digital signature) proves the message was not modified. Confidentiality hides contents; availability keeps systems reachable; non-repudiation prevents denying an action.",
  },
  {
    id: "FE_SAMPLE_007",
    topic: "software-engineering",
    prompt:
      "In the waterfall model, which activity immediately follows requirements definition?",
    choices: [
      { id: "a", text: "Coding" },
      { id: "b", text: "Testing" },
      { id: "c", text: "External design (system design)" },
      { id: "d", text: "Deployment" },
    ],
    answerId: "c",
    explanation:
      "Classical waterfall flows: requirements → external design → internal design → coding → testing → deployment. Design activities come right after the requirements are frozen.",
  },
  {
    id: "FE_SAMPLE_008",
    topic: "project-management",
    prompt:
      "A critical-path activity on a project schedule has which defining property?",
    choices: [
      { id: "a", text: "It has the most resources assigned." },
      { id: "b", text: "Its slack/float is zero." },
      { id: "c", text: "It is always the longest task." },
      { id: "d", text: "It can be delayed without impact." },
    ],
    answerId: "b",
    explanation:
      "Critical-path activities have zero slack — any delay on them directly delays the project finish date.",
  },
  {
    id: "FE_SAMPLE_009",
    topic: "business-strategy",
    prompt:
      "In a SWOT analysis, competitor pricing pressure is most naturally classified as a:",
    choices: [
      { id: "a", text: "Strength" },
      { id: "b", text: "Weakness" },
      { id: "c", text: "Opportunity" },
      { id: "d", text: "Threat" },
    ],
    answerId: "d",
    explanation:
      "External factors that could harm the organization are Threats. Strengths and Weaknesses are internal; Opportunities are external but favorable.",
  },
  {
    id: "FE_SAMPLE_010",
    topic: "law-ip",
    prompt:
      "Which right in most jurisdictions protects the original expression of a computer program automatically, without registration?",
    choices: [
      { id: "a", text: "Patent" },
      { id: "b", text: "Trademark" },
      { id: "c", text: "Copyright" },
      { id: "d", text: "Trade secret" },
    ],
    answerId: "c",
    explanation:
      "Copyright arises automatically on creation and protects original expression, including source code. Patents require filing; trademarks protect brand identifiers; trade secrets require active secrecy.",
  },
]

export interface GetQuestionsOptions {
  topics?: readonly TopicId[] | "all"
  count: number
  seed?: number
}

export function parseTopicsParam(
  raw: string | null | undefined
): TopicId[] | "all" {
  if (!raw || raw === "all") return "all"
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is TopicId => isTopicId(s))
  return ids.length > 0 ? ids : "all"
}

export function parseCountParam(
  raw: string | null | undefined,
  fallback: number,
  { min = 1, max = 200 }: { min?: number; max?: number } = {}
): number {
  const parsed = Number.parseInt(raw ?? "", 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

// Deterministic LCG so server and client agree on ordering from a seed.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function getQuestions({
  topics,
  count,
  seed = Date.now() & 0xffffffff,
}: GetQuestionsOptions): Question[] {
  const rand = mulberry32(seed)
  const pool =
    !topics || topics === "all"
      ? SAMPLE_BANK.slice()
      : SAMPLE_BANK.filter((q) => topics.includes(q.topic))

  // Fall back to the full bank if the filter left us with nothing.
  const source = pool.length > 0 ? pool : SAMPLE_BANK.slice()

  const shuffled = shuffle(source, rand)

  // Cycle with suffixed ids if the bank is smaller than requested count.
  const out: Question[] = []
  for (let i = 0; i < count; i++) {
    const base = shuffled[i % shuffled.length]
    if (i < shuffled.length) {
      out.push(base)
    } else {
      const cycle = Math.floor(i / shuffled.length) + 1
      out.push({ ...base, id: `${base.id}-r${cycle}` })
    }
  }
  return out
}
