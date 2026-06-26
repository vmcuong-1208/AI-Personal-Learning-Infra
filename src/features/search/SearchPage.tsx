import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AiPanel, Card, Chip, Input, PageHeader } from "../../components/ui";
import { journalEntries, topics } from "../../data/mock/mockData";
import { filterEntries } from "../../lib/search";

export function SearchPage() {
  const [query, setQuery] = useState("redis");
  const [topic, setTopic] = useState("");
  const results = useMemo(() => filterEntries(journalEntries, query, topic), [query, topic]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = results.find((item) => item.id === selectedId) ?? results[0];

  return (
    <>
      <PageHeader eyebrow="Tìm kiếm" title="Kết nối lại các ghi chú cũ" description="Tìm nhật ký học theo khái niệm, chủ đề và tổng hợp AI." />
      <Card style={{ marginBottom: 16 }}>
        <div className="meta-grid">
          <div className="form-field">
            <label htmlFor="search-query">Từ khóa tìm kiếm</label>
            <Input id="search-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm khái niệm, ghi chú, tóm tắt..." />
          </div>
          <div className="form-field">
            <label htmlFor="search-topic">Chủ đề</label>
            <select id="search-topic" className="input" value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="">Tất cả chủ đề</option>
              {topics.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Kết quả</label>
            <div className="input" style={{ display: "flex", alignItems: "center", gap: 8 }}><Search size={17} /> {results.length} kết quả</div>
          </div>
        </div>
      </Card>
      <div className="search-grid">
        <Card>
          <div className="entry-list">
            {results.map((entry) => (
              <button className={`search-result${selected?.id === entry.id ? " is-selected" : ""}`} key={entry.id} onClick={() => setSelectedId(entry.id)}>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <div className="page-actions" style={{ marginTop: 10 }}>{entry.topics.map((item) => <Chip key={item}>{item}</Chip>)}</div>
                </div>
                <span className="mono-label">{entry.score}</span>
              </button>
            ))}
          </div>
        </Card>
        <aside className="stack">
          {selected && (
            <>
              <AiPanel title="Tổng hợp">
                <p>{selected.title} liên quan đến mạch kiến thức về độ tin cậy. Hãy so sánh với các ghi chú về queue, retry và deployment trước buổi ôn tập tiếp theo.</p>
              </AiPanel>
              <Card>
                <div className="section-heading"><h2>{selected.title}</h2><p>{selected.date}</p></div>
                <p>{selected.content}</p>
              </Card>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
