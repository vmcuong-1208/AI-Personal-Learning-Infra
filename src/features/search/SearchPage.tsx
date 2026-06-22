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
      <PageHeader eyebrow="Search" title="Reconnect prior notes" description="Find learning entries by concept, topic, and AI-assisted synthesis." />
      <Card style={{ marginBottom: 16 }}>
        <div className="meta-grid">
          <div className="form-field">
            <label htmlFor="search-query">Search query</label>
            <Input id="search-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search concepts, notes, summaries..." />
          </div>
          <div className="form-field">
            <label htmlFor="search-topic">Topic</label>
            <select id="search-topic" className="input" value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="">All topics</option>
              {topics.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Results</label>
            <div className="input" style={{ display: "flex", alignItems: "center", gap: 8 }}><Search size={17} /> {results.length} matches</div>
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
                  <div className="page-actions" style={{ marginTop: 10 }}>
                    {entry.topics.map((item) => <Chip key={item}>{item}</Chip>)}
                  </div>
                </div>
                <span className="mono-label">{entry.score}</span>
              </button>
            ))}
          </div>
        </Card>
        <aside className="stack">
          {selected && (
            <>
              <AiPanel title="Synthesis">
                <p>{selected.title} connects to your broader reliability thread. Compare it with related queue, retry, and deployment notes before the next quiz.</p>
              </AiPanel>
              <Card>
                <div className="section-heading">
                  <h2>{selected.title}</h2>
                  <p>{selected.date}</p>
                </div>
                <p>{selected.content}</p>
              </Card>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
