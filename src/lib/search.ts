import type { JournalEntry, SearchResult } from "../data/mock/types";

export function filterEntries(entries: JournalEntry[], query: string, topic: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedTopic = topic.trim().toLowerCase();

  return entries
    .filter((entry) => {
      const matchesTopic = !normalizedTopic || entry.topics.some((item) => item.toLowerCase() === normalizedTopic);
      const haystack = `${entry.title} ${entry.summary} ${entry.content} ${entry.topics.join(" ")}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesTopic && matchesQuery;
    })
    .map((entry) => ({
      ...entry,
      score: scoreEntry(entry, normalizedQuery, normalizedTopic)
    }))
    .sort((a, b) => b.score - a.score);
}

function scoreEntry(entry: JournalEntry, query: string, topic: string) {
  let score = entry.confidence;
  if (query && entry.title.toLowerCase().includes(query)) score += 20;
  if (topic && entry.topics.some((item) => item.toLowerCase() === topic)) score += 10;
  return score;
}
