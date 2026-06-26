import { journalEntries } from "../../data/mock/mockData";

export type LearningLog = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  category: string;
  tags: string[];
  content: string;
  commands: string;
  errors: string;
  solutions: string;
  mood: "good" | "neutral" | "tired";
  difficulty: number;
};

export const LEARNING_LOGS_KEY = "learnflow.learning.logs";
export const LEARNING_DRAFT_KEY = "learnflow.learning.draft";

const seededLogs: LearningLog[] = journalEntries.map((entry, index) => ({
  id: entry.id,
  title: entry.title,
  date: entry.date,
  startTime: ["09:00", "13:30", "10:15", "15:00"][index],
  endTime: ["09:45", "14:02", "10:53", "15:29"][index],
  category: entry.topics.includes("Kubernetes") ? "monitoring" : entry.topics.includes("Terraform") ? "devops" : "programming",
  tags: entry.topics.includes("Kubernetes") ? ["CloudWatch", "VPN", "IAM"] : entry.topics.includes("Terraform") ? ["AWS", "VPC"] : ["Redis", "Hàng đợi", "AI"],
  content: entry.content,
  commands: index === 0 ? "XADD learning:events * topic redis" : "",
  errors: index === 3 ? "Thời gian readiness probe quá gắt nên rollout dễ bị nhiễu." : "",
  solutions: index === 3 ? "Điều chỉnh chu kỳ probe theo thời gian khởi động thật của ứng dụng." : "",
  mood: entry.mood === "stuck" ? "tired" : entry.mood === "confident" ? "good" : "neutral",
  difficulty: index === 3 ? 4 : index === 2 ? 3 : 2
}));

function readStoredLogs() {
  try {
    const raw = sessionStorage.getItem(LEARNING_LOGS_KEY);
    return raw ? (JSON.parse(raw) as LearningLog[]) : [];
  } catch {
    return [];
  }
}

export function getLearningLogs() {
  return [...readStoredLogs(), ...seededLogs].sort((a, b) => `${b.date}${b.startTime ?? ""}`.localeCompare(`${a.date}${a.startTime ?? ""}`));
}

export function getLearningLog(id: string) {
  return getLearningLogs().find((log) => log.id === id);
}

export function saveLearningLog(log: LearningLog) {
  const existing = readStoredLogs().filter((item) => item.id !== log.id);
  sessionStorage.setItem(LEARNING_LOGS_KEY, JSON.stringify([log, ...existing]));
}

export function deleteLearningLog(id: string) {
  sessionStorage.setItem(LEARNING_LOGS_KEY, JSON.stringify(readStoredLogs().filter((item) => item.id !== id)));
}
