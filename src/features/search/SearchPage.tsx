import { CalendarDays, FileText, Pin, PinOff, Search, Sparkles } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import { getLearningLogs, type LearningLog } from "../journal/journalData";

type RangePreset = "today" | "7" | "30" | "custom";

const rangeLabels: Record<RangePreset, string> = {
  today: "Hôm nay",
  "7": "7 ngày trước",
  "30": "30 ngày trước",
  custom: "Tùy chỉnh"
};

const topicOptions = ["Networking", "Security", "Monitoring", "DevOps", "AI", "Programming"];
const commonTags = ["AWS", "VPC", "NAT Gateway", "CloudWatch", "IAM", "VPN"];
const searchSuggestions = ["NAT Gateway", "CloudWatch Alarms", "VPN", "IAM role error"];
const topicLabels: Record<string, string> = {
  networking: "Networking",
  security: "Security",
  monitoring: "Monitoring",
  devops: "DevOps",
  ai: "AI",
  programming: "Programming"
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getRangeStart(range: RangePreset) {
  if (range === "today") return "2026-06-26";
  if (range === "7") return "2026-06-19";
  if (range === "30") return "2026-05-27";
  return "";
}

function buildSearchUrl(query: string, from: string, to: string, tags: string[]) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (tags.length > 0) params.set("tags", tags.join(","));
  return `/search?${params.toString()}`;
}

function getLogHaystack(log: LearningLog) {
  return [
    log.title,
    log.category,
    log.tags.join(" "),
    log.content,
    log.commands,
    log.errors,
    log.solutions
  ].join(" ");
}

function makeSnippet(log: LearningLog, query: string) {
  const source = log.errors || log.content || log.commands || log.solutions;
  const cleanSource = source.replace(/\s+/g, " ").trim();
  if (!query) return cleanSource.slice(0, 180);

  const index = normalize(cleanSource).indexOf(normalize(query));
  if (index < 0) return cleanSource.slice(0, 180);

  const start = Math.max(0, index - 60);
  const end = Math.min(cleanSource.length, index + query.length + 110);
  return `${start > 0 ? "..." : ""}${cleanSource.slice(start, end)}${end < cleanSource.length ? "..." : ""}`;
}

function HighlightedSnippet({ snippet, query }: { snippet: string; query: string }) {
  if (!query.trim()) return <>{snippet}</>;

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pieces = snippet.split(new RegExp(`(${escaped})`, "ig"));
  return (
    <>
      {pieces.map((piece, index) => normalize(piece) === normalize(query)
        ? <mark key={`${piece}-${index}`}>{piece}</mark>
        : <Fragment key={`${piece}-${index}`}>{piece}</Fragment>)}
    </>
  );
}

function groupResultsByDate(results: LearningLog[]) {
  return results.reduce<Record<string, LearningLog[]>>((groups, log) => {
    groups[log.date] = [...(groups[log.date] ?? []), log];
    return groups;
  }, {});
}

export function SearchPage() {
  const logs = useMemo(() => getLearningLogs(), []);
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [range, setRange] = useState<RangePreset>("30");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const hasSearched = submittedQuery.trim().length > 0 || tags.length > 0 || Boolean(topic || customTopic || dateFrom || dateTo);

  const searchFrom = range === "custom" ? dateFrom : getRangeStart(range);
  const searchTo = range === "custom" ? dateTo : "";
  const apiPreview = buildSearchUrl(submittedQuery, searchFrom, searchTo, tags);

  const results = useMemo(() => {
    if (!hasSearched) return [];

    const query = normalize(submittedQuery);
    const selectedTopic = normalize(topic === "custom" ? customTopic : topic);

    return logs
      .filter((log) => {
        const haystack = normalize(getLogHaystack(log));
        const matchesQuery = !query || haystack.includes(query);
        const matchesRange = (!searchFrom || log.date >= searchFrom) && (!searchTo || log.date <= searchTo);
        const matchesTopic = !selectedTopic || normalize(log.category) === selectedTopic || log.tags.some((tag) => normalize(tag) === selectedTopic);
        const matchesTags = tags.length === 0 || tags.every((tag) => log.tags.some((item) => normalize(item) === normalize(tag)));
        return matchesQuery && matchesRange && matchesTopic && matchesTags;
      })
      .sort((a, b) => `${b.date}${b.startTime ?? ""}`.localeCompare(`${a.date}${a.startTime ?? ""}`));
  }, [customTopic, hasSearched, logs, searchFrom, searchTo, submittedQuery, tags, topic]);

  const groupedResults = useMemo(() => groupResultsByDate(results), [results]);
  const selected = results.find((item) => item.id === selectedId) ?? results[0];
  const pinnedResults = results.filter((item) => favorites.includes(item.id));

  function submitSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSubmittedQuery(draftQuery.trim());
    setSelectedId(null);
  }

  function addTag(tag: string) {
    const value = tag.trim();
    if (!value || tags.some((item) => normalize(item) === normalize(value))) return;
    setTags((current) => [...current, value]);
    setTagInput("");
    setSelectedId(null);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Tìm kiếm"
        title="Tìm kiếm nhật ký học"
        description="Tìm lại learning logs theo từ khóa, tag, chủ đề và khoảng thời gian để mở chi tiết, ôn quiz hoặc tạo báo cáo AI."
      />

      <Card className="search-console">
        <form className="search-bar-large" onSubmit={submitSearch}>
          <Search size={22} />
          <Input
            aria-label="Từ khóa tìm kiếm nhật ký học"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Tìm kiếm theo chủ đề, lỗi, lệnh hoặc ghi chú..."
          />
          <Button type="submit" icon={<Search size={17} />}>Search</Button>
        </form>

        <div className="search-suggestion-row" aria-label="Gợi ý tìm kiếm">
          {searchSuggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => { setDraftQuery(suggestion); setSubmittedQuery(suggestion); setSelectedId(null); }}>{suggestion}</button>
          ))}
        </div>

        <div className="search-filter-grid">
          <div className="form-field">
            <label htmlFor="search-range">Khoảng thời gian</label>
            <select id="search-range" className="input" value={range} onChange={(event) => setRange(event.target.value as RangePreset)}>
              {(Object.keys(rangeLabels) as RangePreset[]).map((item) => <option key={item} value={item}>{rangeLabels[item]}</option>)}
            </select>
          </div>

          {range === "custom" && (
            <>
              <div className="form-field">
                <label htmlFor="search-from">Từ ngày</label>
                <Input id="search-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="search-to">Đến ngày</label>
                <Input id="search-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </div>
            </>
          )}

          <div className="form-field">
            <label htmlFor="search-topic">Chủ đề / danh mục</label>
            <select id="search-topic" className="input" value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="">Tất cả chủ đề</option>
              {topicOptions.map((item) => <option key={item} value={item.toLowerCase()}>{item}</option>)}
              <option value="custom">Nhập chủ đề khác</option>
            </select>
          </div>

          {topic === "custom" && (
            <div className="form-field">
              <label htmlFor="search-custom-topic">Chủ đề tự nhập</label>
              <Input id="search-custom-topic" value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} placeholder="Ví dụ: serverless" />
            </div>
          )}

          <div className="form-field search-tag-field">
            <label htmlFor="search-tags">Tags</label>
            <Input
              id="search-tags"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Nhập tag rồi nhấn Enter"
            />
            <div className="tag-suggestions">
              {commonTags.map((tag) => <button key={tag} type="button" onClick={() => addTag(tag)}>{tag}</button>)}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="search-type">Loại dữ liệu</label>
            <select id="search-type" className="input" value="learning_logs" disabled>
              <option value="learning_logs">Learning logs</option>
            </select>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="page-actions">
            {tags.map((tag) => <button className="tag-removable" key={tag} type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))}>{tag} x</button>)}
          </div>
        )}

        <div className="api-preview">
          <span>API request</span>
          <code>GET {apiPreview}</code>
        </div>
      </Card>

      {pinnedResults.length > 0 && (
        <Card className="favorites-strip">
          <div className="section-heading">
            <span className="mono-label">Favorites</span>
            <h2>Kết quả đã ghim</h2>
          </div>
          <div className="page-actions">
            {pinnedResults.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)}>{item.title}</button>)}
          </div>
        </Card>
      )}

      <div className="search-results-layout">
        <Card>
          <div className="section-heading search-result-summary">
            <div>
              <span className="mono-label">Kết quả</span>
              <h2>{hasSearched ? `${results.length} nhật ký phù hợp` : "Bắt đầu tìm kiếm"}</h2>
            </div>
            <Chip tone="primary">Nhóm theo ngày</Chip>
          </div>

          {!hasSearched && (
            <div className="search-empty">
              <Search size={30} />
              <p>Nhập từ khóa để tìm trong nhật ký học của bạn.</p>
            </div>
          )}

          {hasSearched && results.length === 0 && (
            <div className="search-empty">
              <FileText size={30} />
              <p>Không tìm thấy nhật ký phù hợp. Thử đổi từ khóa hoặc khoảng thời gian.</p>
            </div>
          )}

          {hasSearched && results.length > 0 && (
            <div className="grouped-results">
              {Object.entries(groupedResults).map(([date, items]) => (
                <section key={date}>
                  <h3>{date} ({items.length} entries)</h3>
                  <div className="entry-list">
                    {items.map((log) => (
                      <article className={`search-log-card${selected?.id === log.id ? " is-selected" : ""}`} key={log.id}>
                        <button className="search-log-main" type="button" onClick={() => setSelectedId(log.id)}>
                          <div className="journal-log-meta">
                            <span>{log.date}</span>
                            <span>{log.startTime ?? "--:--"} - {log.endTime ?? "--:--"}</span>
                          </div>
                          <h4>{log.title}</h4>
                          <div className="page-actions">
                            <Chip tone="primary">{topicLabels[log.category] ?? log.category}</Chip>
                            {log.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
                          </div>
                          <p className="search-snippet"><HighlightedSnippet snippet={makeSnippet(log, submittedQuery)} query={submittedQuery} /></p>
                        </button>
                        <div className="search-log-actions">
                          <IconPinButton active={favorites.includes(log.id)} onClick={() => toggleFavorite(log.id)} />
                          <Link to={`/journal/${log.id}`}>Xem chi tiết</Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Card>

        <aside className="search-detail-panel">
          {selected ? (
            <Card>
              <div className="section-heading">
                <span className="mono-label">Chi tiết nhanh</span>
                <h2>{selected.title}</h2>
                <p><CalendarDays size={14} /> {selected.date} · {selected.startTime ?? "--:--"} - {selected.endTime ?? "--:--"}</p>
              </div>
              <div className="page-actions">{selected.tags.map((tag) => <Chip key={tag} tone="ai">{tag}</Chip>)}</div>
              <p className="article-body">{selected.content}</p>
              {selected.commands && <pre className="detail-code">{selected.commands}</pre>}
              {selected.errors && <div className="error-highlight">Lỗi gặp phải: {selected.errors}</div>}
              <div className="search-quick-actions">
                <Button to={`/journal/${selected.id}`} variant="primary">Xem chi tiết</Button>
                <Button to={`/journal/${selected.id}/edit`} variant="ghost">Mở lại lab</Button>
                <Button to="/quiz" variant="secondary" icon={<Sparkles size={17} />}>Tạo quiz</Button>
                <Button to="/coach" variant="ai">Tạo AI report</Button>
              </div>
            </Card>
          ) : (
            <Card className="search-empty">
              <FileText size={30} />
              <p>Chọn một kết quả để xem nhanh nội dung và hành động tiếp theo.</p>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}

function IconPinButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button className="pin-button" type="button" onClick={onClick} aria-label={active ? "Bỏ ghim kết quả" : "Ghim kết quả"}>
      {active ? <PinOff size={16} /> : <Pin size={16} />}
    </button>
  );
}
