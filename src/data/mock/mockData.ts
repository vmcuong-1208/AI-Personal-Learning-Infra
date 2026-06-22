import type { AiInsight, AnalyticsSummary, JournalEntry, LearningTopic, QuizQuestion } from "./types";

export const topics: LearningTopic[] = [
  { id: "redis", name: "Redis", mastery: 78, color: "#4f46e5" },
  { id: "bullmq", name: "BullMQ", mastery: 64, color: "#8b5cf6" },
  { id: "terraform", name: "Terraform", mastery: 58, color: "#10b981" },
  { id: "system-design", name: "System Design", mastery: 71, color: "#f59e0b" },
  { id: "kubernetes", name: "Kubernetes", mastery: 49, color: "#0ea5e9" }
];

export const journalEntries: JournalEntry[] = [
  {
    id: "redis-streams",
    title: "Redis Streams for durable learning queues",
    date: "2026-06-22",
    summary: "Compared streams, consumer groups, and simple lists for a resilient study pipeline.",
    content: "Redis Streams are a useful middle ground when a learning workflow needs append-only event history and replay. Consumer groups help separate capture, summarization, and quiz-generation workers without losing state.",
    topics: ["Redis", "System Design"],
    confidence: 82,
    minutes: 45,
    mood: "focused"
  },
  {
    id: "bullmq-retries",
    title: "BullMQ retry strategy notes",
    date: "2026-06-21",
    summary: "Mapped retry, backoff, and dead-letter behavior for AI enrichment jobs.",
    content: "BullMQ gives predictable retry behavior for background AI tasks. Exponential backoff is a better default for transient provider failures, while validation errors should go directly to review.",
    topics: ["BullMQ", "Redis"],
    confidence: 68,
    minutes: 32,
    mood: "curious"
  },
  {
    id: "terraform-modules",
    title: "Terraform module boundaries",
    date: "2026-06-20",
    summary: "Sketched rules for keeping modules small, reusable, and readable.",
    content: "A useful Terraform module should own a coherent infrastructure concept. Inputs should be explicit, outputs should support composition, and environment drift should be visible in review.",
    topics: ["Terraform"],
    confidence: 61,
    minutes: 38,
    mood: "confident"
  },
  {
    id: "kubernetes-probes",
    title: "Kubernetes probes and rollout confidence",
    date: "2026-06-19",
    summary: "Clarified readiness vs liveness checks and when startup probes reduce noisy restarts.",
    content: "Readiness probes protect traffic, liveness probes recover stuck processes, and startup probes give slow services breathing room. The key is matching probe timing to real app behavior.",
    topics: ["Kubernetes", "System Design"],
    confidence: 54,
    minutes: 29,
    mood: "stuck"
  }
];

export const aiInsights: AiInsight[] = [
  {
    id: "connect-queues",
    title: "Connect queues to recall",
    body: "Your Redis and BullMQ notes both point to the same mental model: durable work state. Turn that into two quiz prompts today.",
    relatedEntryId: "bullmq-retries"
  },
  {
    id: "probe-gap",
    title: "Probe timing is the weak spot",
    body: "Kubernetes confidence is below your average. Review failure modes before adding new deployment topics.",
    relatedEntryId: "kubernetes-probes"
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    topic: "Redis",
    prompt: "Which Redis Streams feature lets multiple workers coordinate progress independently?",
    options: ["Sorted sets", "Consumer groups", "Pub/sub channels", "Key expiration"],
    answerIndex: 1,
    explanation: "Consumer groups track delivery and acknowledgements for cooperating consumers."
  },
  {
    id: "q2",
    topic: "Kubernetes",
    prompt: "Which probe should prevent traffic from reaching a pod before it is ready?",
    options: ["Readiness probe", "Liveness probe", "Startup probe", "Node probe"],
    answerIndex: 0,
    explanation: "Readiness controls whether the pod is included in service endpoints."
  },
  {
    id: "q3",
    topic: "Terraform",
    prompt: "What is the best sign a Terraform module boundary is healthy?",
    options: ["It has no variables", "It owns one coherent infrastructure concept", "It hides every output", "It changes every environment at once"],
    answerIndex: 1,
    explanation: "Small, coherent modules are easier to reuse and review."
  }
];

export const analyticsSummary: AnalyticsSummary = {
  streak: 12,
  weeklyMinutes: 214,
  recallAccuracy: 76,
  entriesThisWeek: 8
};

export const weeklyActivity = [
  { day: "Mon", minutes: 24, entries: 1 },
  { day: "Tue", minutes: 38, entries: 2 },
  { day: "Wed", minutes: 28, entries: 1 },
  { day: "Thu", minutes: 52, entries: 2 },
  { day: "Fri", minutes: 31, entries: 1 },
  { day: "Sat", minutes: 18, entries: 1 },
  { day: "Sun", minutes: 23, entries: 0 }
];
