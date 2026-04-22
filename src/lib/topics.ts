export type CategoryId = "technology" | "management" | "strategy"

export type TopicId =
  | "number-systems"
  | "applied-math"
  | "discrete-math"
  | "computer-architecture"
  | "operating-systems"
  | "digital-logic"
  | "computer-graphics"
  | "databases"
  | "networking"
  | "cybersecurity"
  | "software-engineering"
  | "software-testing"
  | "emerging-tech"
  | "project-management"
  | "it-service-management"
  | "system-auditing"
  | "quality-management"
  | "corporate-finance"
  | "business-strategy"
  | "system-strategy"
  | "law-ip"
  | "digital-trends"

export interface Category {
  id: CategoryId
  label: string
}

export interface Topic {
  id: TopicId
  label: string
  description: string
  category: CategoryId
}

export const CATEGORIES: readonly Category[] = [
  { id: "technology", label: "Technology" },
  { id: "management", label: "Management" },
  { id: "strategy", label: "Strategy" },
] as const

export const TOPICS: readonly Topic[] = [
  {
    id: "number-systems",
    label: "Number Systems & Data Representation",
    description: "Binary, hex, encoding, fixed/floating point",
    category: "technology",
  },
  {
    id: "applied-math",
    label: "Applied Mathematics",
    description: "Probability, statistics, numerical methods",
    category: "technology",
  },
  {
    id: "discrete-math",
    label: "Discrete Math & Algorithms",
    description: "Logic, sets, graphs, complexity",
    category: "technology",
  },
  {
    id: "computer-architecture",
    label: "Computer Architecture & Hardware",
    description: "CPU, memory, I/O, storage",
    category: "technology",
  },
  {
    id: "operating-systems",
    label: "Operating Systems",
    description: "Processes, scheduling, memory, file systems",
    category: "technology",
  },
  {
    id: "digital-logic",
    label: "Digital Logic",
    description: "Gates, circuits, boolean algebra",
    category: "technology",
  },
  {
    id: "computer-graphics",
    label: "Computer Graphics",
    description: "Rendering, color models, image processing",
    category: "technology",
  },
  {
    id: "databases",
    label: "Databases",
    description: "Relational models, SQL, transactions",
    category: "technology",
  },
  {
    id: "networking",
    label: "Networking",
    description: "Protocols, OSI, TCP/IP, routing",
    category: "technology",
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    description: "Cryptography, access control, threats",
    category: "technology",
  },
  {
    id: "software-engineering",
    label: "Software Engineering & Design",
    description: "SDLC, design patterns, architecture",
    category: "technology",
  },
  {
    id: "software-testing",
    label: "Software Testing",
    description: "Test strategies, coverage, QA",
    category: "technology",
  },
  {
    id: "emerging-tech",
    label: "Emerging Technologies",
    description: "AI, IoT, blockchain, cloud",
    category: "technology",
  },
  {
    id: "project-management",
    label: "Project Management",
    description: "Planning, estimation, risk",
    category: "management",
  },
  {
    id: "it-service-management",
    label: "IT Service Management (ITSM)",
    description: "Operations, SLAs, incident response",
    category: "management",
  },
  {
    id: "system-auditing",
    label: "System Auditing",
    description: "Controls, compliance, audit process",
    category: "management",
  },
  {
    id: "quality-management",
    label: "Quality Management",
    description: "QA/QC, standards, continuous improvement",
    category: "management",
  },
  {
    id: "corporate-finance",
    label: "Corporate Finance",
    description: "Accounting, budgeting, financial analysis",
    category: "management",
  },
  {
    id: "business-strategy",
    label: "Business Strategy",
    description: "Management, marketing, OR",
    category: "strategy",
  },
  {
    id: "system-strategy",
    label: "System Strategy",
    description: "IT planning, solution design",
    category: "strategy",
  },
  {
    id: "law-ip",
    label: "Law & Intellectual Property",
    description: "Laws, standards, compliance",
    category: "strategy",
  },
  {
    id: "digital-trends",
    label: "Digital Trends",
    description: "DX, emerging business tech",
    category: "strategy",
  },
] as const

export function isTopicId(value: string): value is TopicId {
  return TOPICS.some((topic) => topic.id === value)
}

export function topicsByCategory(category: CategoryId): Topic[] {
  return TOPICS.filter((topic) => topic.category === category)
}
