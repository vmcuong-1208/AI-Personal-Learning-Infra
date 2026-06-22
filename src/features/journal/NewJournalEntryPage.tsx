import { Save, Sparkles } from "lucide-react";
import { useState } from "react";
import { AiPanel, Button, Card, Chip, Input, PageHeader, Textarea } from "../../components/ui";
import { topics } from "../../data/mock/mockData";

export function NewJournalEntryPage() {
  const [title, setTitle] = useState("What I learned about reliable AI enrichment jobs");
  const [body, setBody] = useState("Today I connected Redis Streams and BullMQ retry behavior to the same reliability question: how does work move forward without losing context?");
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Capture"
        title="New journal entry"
        description="A calm writing space for turning fresh learning into durable knowledge."
        action={<Button variant={saved ? "success" : "primary"} icon={<Save size={17} />} onClick={() => setSaved(true)}>{saved ? "Draft Saved" : "Save Draft"}</Button>}
      />
      <div className="journal-grid">
        <Card className="editor-card">
          <div className="form-field">
            <label htmlFor="entry-title">Title</label>
            <Input id="entry-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="meta-grid">
            <div className="form-field">
              <label htmlFor="entry-topic">Primary topic</label>
              <select id="entry-topic" className="input" defaultValue="Redis">
                {topics.map((topic) => <option key={topic.id}>{topic.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="entry-mood">Mood</label>
              <select id="entry-mood" className="input" defaultValue="Focused">
                <option>Focused</option>
                <option>Curious</option>
                <option>Stuck</option>
                <option>Confident</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="entry-confidence">Confidence</label>
              <Input id="entry-confidence" type="number" min="0" max="100" defaultValue="74" />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="entry-body">Notes</label>
            <Textarea id="entry-body" value={body} onChange={(event) => setBody(event.target.value)} />
          </div>
          <div className="page-actions">
            <Button icon={<Sparkles size={17} />} variant="ai">Generate AI Summary</Button>
            <Button variant="ghost">Attach Concept</Button>
          </div>
        </Card>
        <aside className="stack">
          <AiPanel title="Writing prompts">
            <p>Capture the distinction, the failure mode, and one example you could explain without notes tomorrow.</p>
          </AiPanel>
          <Card>
            <div className="section-heading">
              <h2>Suggested tags</h2>
              <p>Keep tags specific enough for search and recall.</p>
            </div>
            <div className="page-actions">
              <Chip tone="primary">Redis</Chip>
              <Chip tone="ai">Queues</Chip>
              <Chip tone="success">Reliability</Chip>
              <Chip>Backoff</Chip>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
