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
  Topic?: string;
  category?: string;
  Category?: string;
  tags?: unknown;
  Tags?: unknown;
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
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesText(value: string, query: string) {
  if (!query.trim()) return true;
  return normalizeText(value).includes(normalizeText(query));
}

function resultMatchesFilters(result: SearchResultItem, filters: SearchFilters) {
  const topic = filters.topic?.trim() ?? "";
  const tags = filters.tags ?? [];
  const from = filters.from?.trim() ?? "";
  const to = filters.to?.trim() ?? "";
  const searchableTopic = [result.topic, result.title, result.snippet, ...result.tags].join(" ");

  if (topic && !matchesText(searchableTopic, topic)) return false;
  if (tags.length > 0 && !tags.every((tag) => result.tags.some((item) => normalizeText(item) === normalizeText(tag)))) return false;
  if (from && result.date < from) return false;
  if (to && result.date > to) return false;

  return true;
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
    topic: readString(result.topic ?? result.Topic ?? result.category ?? result.Category, "Khac"),
    tags: readTags(result.tags ?? result.Tags),
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

function buildBroadSearchPath(filters: SearchFilters) {
  const params = new URLSearchParams();
  const q = filters.q?.trim();

  if (q) params.set("q", q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function searchLearningLogs(filters: SearchFilters) {
  return apiRequest<BackendSearchResponse | BackendSearchResult[]>(buildBroadSearchPath(filters))
    .then((response) => readResults(response).map(normalizeSearchResult).filter((result) => result.id))
    .then((results) => results.filter((result) => resultMatchesFilters(result, filters)))
    .then((results) => results.sort((a, b) => b.date.localeCompare(a.date)));
}
