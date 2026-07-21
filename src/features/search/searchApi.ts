import { apiRequest } from "../../lib/apiClient";

export type SearchFilters = {
  q?: string;
  topic?: string;
  tags?: string[];
  from?: string;
  to?: string;
};

export type SearchResultItem = {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  date: string;
  snippet: string;
};

type BackendSearchResult = {
  id?: string;
  logId?: string;
  log_id?: string;
  entryId?: string;
  entry_id?: string;
  title?: string;
  topic?: string;
  category?: string;
  tags?: unknown;
  date?: string;
  createdAt?: string;
  created_at?: string;
  snippet?: string;
  summary?: string;
  content?: string;
};

type BackendSearchResponse = {
  results?: BackendSearchResult[];
  items?: BackendSearchResult[];
  data?: BackendSearchResult[];
  count?: number;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readTags(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readResults(response: BackendSearchResponse | BackendSearchResult[]) {
  if (Array.isArray(response)) return response;
  return response.results ?? response.items ?? response.data ?? [];
}

function normalizeSearchResult(result: BackendSearchResult): SearchResultItem {
  const id = readString(result.id ?? result.logId ?? result.log_id ?? result.entryId ?? result.entry_id);
  const createdDate = readString(result.createdAt ?? result.created_at).slice(0, 10);

  return {
    id,
    title: readString(result.title, "Untitled journal log"),
    topic: readString(result.topic ?? result.category, "Khac"),
    tags: readTags(result.tags),
    date: readString(result.date, createdDate || new Date().toISOString().slice(0, 10)),
    snippet: readString(result.snippet ?? result.summary ?? result.content)
  };
}

export function buildSearchPath(filters: SearchFilters) {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  const topic = filters.topic?.trim();

  if (q) params.set("q", q);
  if (topic) params.set("topic", topic);
  if (filters.tags && filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function searchLearningLogs(filters: SearchFilters) {
  return apiRequest<BackendSearchResponse | BackendSearchResult[]>(buildSearchPath(filters))
    .then((response) => readResults(response).map(normalizeSearchResult).filter((result) => result.id))
    .then((results) => results.sort((a, b) => b.date.localeCompare(a.date)));
}
