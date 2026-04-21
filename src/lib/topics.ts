export type CategoryId = "technology" | "management" | "strategy"

export type TopicId =
  | "hardware"
  | "software"
  | "database"
  | "networking"
  | "security"
  | "algorithms"
  | "system-development"
  | "project-management"
  | "service-management"
  | "system-strategy"
  | "corporate"
  | "legal"

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
    id: "hardware",
    label: "Hardware",
    description: "Computer systems, CPU, memory, I/O",
    category: "technology",
  },
  {
    id: "software",
    label: "Software",
    description: "Basic theory, OS, middleware",
    category: "technology",
  },
  {
    id: "database",
    label: "Database",
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
    id: "security",
    label: "Security",
    description: "Cryptography, access control, threats",
    category: "technology",
  },
  {
    id: "algorithms",
    label: "Algorithms",
    description: "Data structures, complexity, searching",
    category: "technology",
  },
  {
    id: "system-development",
    label: "System Development",
    description: "SDLC, design, testing, maintenance",
    category: "technology",
  },
  {
    id: "project-management",
    label: "Project Management",
    description: "Planning, estimation, risk",
    category: "management",
  },
  {
    id: "service-management",
    label: "Service Management",
    description: "Operations, SLAs, incident response",
    category: "management",
  },
  {
    id: "system-strategy",
    label: "System Strategy",
    description: "IT planning, solution design",
    category: "strategy",
  },
  {
    id: "corporate",
    label: "Corporate & Business",
    description: "Management, accounting, OR",
    category: "strategy",
  },
  {
    id: "legal",
    label: "Legal & Standards",
    description: "Laws, standards, compliance",
    category: "strategy",
  },
] as const

export function isTopicId(value: string): value is TopicId {
  return TOPICS.some((topic) => topic.id === value)
}

export function topicsByCategory(category: CategoryId): Topic[] {
  return TOPICS.filter((topic) => topic.category === category)
}
