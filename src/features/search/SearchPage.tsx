import { CalendarDays, FileText, Pin, PinOff, Search, Sparkles } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import { searchLearningLogs, type SearchResultItem } from "./searchApi";

type RangePreset = "all" | "today" | "7" | "30" | "custom";

const rangeLabels: Record<RangePreset, string> = {
  all: "Tất cả thời gian",
  today: "Hôm nay",
  "7": "7 ngày trước",
  "30": "30 ngày trước",
  custom: "Tùy chỉnh"
};

const topicOptions = ["AWS", "VPC", "IAM", "CloudWatch", "NAT Gateway", "VPN", "Networking", "Security", "Monitoring", "DevOps", "AI", "Programming"];
const commonTags = ["AWS", "VPC", "NAT Gateway", "CloudWatch", "IAM", "VPN"];
const topicLabels: Record<string, string> = {
  aws: "AWS",
  vpc: "VPC",
  iam: "IAM",
  cloudwatch: "CloudWatch",
  "nat gateway": "NAT Gateway",
  vpn: "VPN",
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

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRangeStart(range: RangePreset) {
  const date = new Date();
  if (range === "today") return toDateInputValue(date);
  if (range === "7") {
    date.setDate(date.getDate() - 7);
    return toDateInputValue(date);
  }
  if (range === "30") {
    date.setDate(date.getDate() - 30);
    return toDateInputValue(date);
  }
  return "";
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

function groupResultsByDate(results: SearchResultItem[]) {
  return results.reduce<Record<string, SearchResultItem[]>>((groups, log) => {
    groups[log.date] = [...(groups[log.date] ?? []), log];
    return groups;
  }, {});
}

export function SearchPage() {
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [range, setRange] = useState<RangePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const hasSearched = submittedQuery.trim().length > 0 || tags.length > 0 || Boolean(topic || customTopic || dateFrom || dateTo);

  const searchFrom = range === "custom" ? dateFrom : getRangeStart(range);
  const searchTo = range === "custom" ? dateTo : "";
  const selectedTopic = topic === "custom" ? customTopic : topic;
  useEffect(() => {
    if (!hasSearched) {
      setResults([]);
      setSearchError("");
      return;
    }

    let ignore = false;

    async function runSearch() {
      setIsSearching(true);
      setSearchError("");
      try {
        const nextResults = await searchLearningLogs({
          q: submittedQuery,
          topic: selectedTopic,
          from: searchFrom,
          to: searchTo,
          tags
        });
        if (!ignore) setResults(nextResults);
      } catch (error) {
        if (!ignore) {
          setResults([]);
          setSearchError(error instanceof Error ? error.message : "Chưa tìm kiếm được nhật ký.");
        }
      } finally {
        if (!ignore) setIsSearching(false);
      }
    }

    runSearch();
    return () => {
      ignore = true;
    };
  }, [hasSearched, searchFrom, searchTo, selectedTopic, submittedQuery, tags]);

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

  function removeTag(tag: string) {
    setTags((current) => current.filter((item) => item !== tag));
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
        description="Tìm lại ghi chú theo từ khóa, chủ đề, thẻ hoặc khoảng thời gian để ôn lại nhanh hơn."
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
          <Button type="submit" icon={<Search size={17} />} disabled={isSearching}>{isSearching ? "Đang tìm..." : "Search"}</Button>
        </form>

        <div className="search-filter-grid user-search-filter-grid">
          <div className="form-field">
            <label htmlFor="search-range">Khoảng thời gian</label>
            <select id="search-range" className="input" value={range} onChange={(event) => { setRange(event.target.value as RangePreset); setSelectedId(null); }}>
              {(Object.keys(rangeLabels) as RangePreset[]).map((item) => <option key={item} value={item}>{rangeLabels[item]}</option>)}
            </select>
          </div>

          {range === "custom" && (
            <>
              <div className="form-field">
                <label htmlFor="search-from">Từ ngày</label>
                <Input id="search-from" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setSelectedId(null); }} />
              </div>
              <div className="form-field">
                <label htmlFor="search-to">Đến ngày</label>
                <Input id="search-to" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setSelectedId(null); }} />
              </div>
            </>
          )}

          <div className="form-field">
            <label htmlFor="search-topic">Chủ đề / danh mục</label>
            <select id="search-topic" className="input" value={topic} onChange={(event) => { setTopic(event.target.value); setSelectedId(null); }}>
              <option value="">Tất cả chủ đề</option>
              {topicOptions.map((item) => <option key={item} value={item.toLowerCase()}>{item}</option>)}
              <option value="custom">Nhập chủ đề khác</option>
            </select>
          </div>

          {topic === "custom" && (
            <div className="form-field">
              <label htmlFor="search-custom-topic">Chủ đề tự nhập</label>
              <Input id="search-custom-topic" value={customTopic} onChange={(event) => { setCustomTopic(event.target.value); setSelectedId(null); }} placeholder="Ví dụ: serverless" />
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
            {tags.map((tag) => <button className="tag-removable" key={tag} type="button" onClick={() => removeTag(tag)}>{tag} x</button>)}
          </div>
        )}
      </Card>

      {searchError && <div className="settings-message settings-message-error" role="alert">{searchError}</div>}

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
              <p>Nhập từ khóa, tag hoặc chủ đề để tìm trong nhật ký học của bạn.</p>
            </div>
          )}

          {hasSearched && results.length === 0 && (
            <div className="search-empty">
              <FileText size={30} />
              <p>{isSearching ? "Đang tìm kiếm trong nhật ký..." : "Không tìm thấy ghi chú phù hợp. Thử đổi từ khóa hoặc khoảng thời gian."}</p>
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
                            <span>{log.topic}</span>
                          </div>
                          <h4>{log.title}</h4>
                          <div className="page-actions">
                            <Chip tone="primary">{topicLabels[normalize(log.topic)] ?? log.topic}</Chip>
                            {log.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
                          </div>
                          <p className="search-snippet"><HighlightedSnippet snippet={log.snippet} query={submittedQuery} /></p>
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
                <p><CalendarDays size={14} /> {selected.date} - {selected.topic}</p>
              </div>
              <div className="page-actions">{selected.tags.map((tag) => <Chip key={tag} tone="ai">{tag}</Chip>)}</div>
              <p className="article-body">{selected.snippet || "Chưa có đoạn xem nhanh cho kết quả này."}</p>
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