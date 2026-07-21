import { apiRequest } from "../../lib/apiClient";

export type AnalyticsTopic = {
  id: string;
  name: string;
  count: number;
  share: number;
};

export type AnalyticsSummary = {
  weeklyEntries: number;
  totalMinutes: number;
  streak: number;
  accuracyPercentage: number;
  topicDistribution: AnalyticsTopic[];
  weakAreas: string[];
  totalLogs: number;
};

type BackendAnalyticsSummary = {
  weeklyEntries?: number;
  weekly_entries?: number;
  totalMinutes?: number;
  total_minutes?: number;
  streak?: number;
  accuracyPercentage?: number;
  accuracy_percentage?: number;
  topicDistribution?: Record<string, number>;
  topic_distribution?: Record<string, number>;
  weakAreas?: unknown;
  weak_areas?: unknown;
  totalLogs?: number;
  total_logs?: number;
};

function readNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function slugifyTopic(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "topic";
}

function readTopicDistribution(value: unknown): AnalyticsTopic[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([name, count]) => ({ name, count: readNumber(count) }))
    .filter((topic) => topic.name && topic.count > 0);
  const total = entries.reduce((sum, topic) => sum + topic.count, 0);

  return entries
    .map((topic) => ({
      id: slugifyTopic(topic.name),
      name: topic.name,
      count: topic.count,
      share: total > 0 ? Math.round((topic.count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

export function normalizeAnalyticsSummary(summary: BackendAnalyticsSummary): AnalyticsSummary {
  return {
    weeklyEntries: readNumber(summary.weeklyEntries ?? summary.weekly_entries),
    totalMinutes: readNumber(summary.totalMinutes ?? summary.total_minutes),
    streak: readNumber(summary.streak),
    accuracyPercentage: readNumber(summary.accuracyPercentage ?? summary.accuracy_percentage),
    topicDistribution: readTopicDistribution(summary.topicDistribution ?? summary.topic_distribution),
    weakAreas: readStringArray(summary.weakAreas ?? summary.weak_areas),
    totalLogs: readNumber(summary.totalLogs ?? summary.total_logs)
  };
}

export function getAnalyticsSummary() {
  return apiRequest<BackendAnalyticsSummary>("/analytics/summary").then(normalizeAnalyticsSummary);
}