import { Bot, Trophy } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AiPanel, Button, Card, Chip, PageHeader, ProgressBar } from "../../components/ui";
import { aiInsights, journalEntries } from "../../data/mock/mockData";

export function EntryDetailsPage() {
  const { entryId } = useParams();
  const entry = useMemo(() => journalEntries.find((item) => item.id === entryId) ?? journalEntries[0], [entryId]);
  const related = journalEntries.filter((item) => item.id !== entry.id).slice(0, 2);

  return (
    <>
      <PageHeader
        eyebrow={entry.date}
        title={entry.title}
        description={entry.summary}
        action={<Button to="/coach" variant="ai" icon={<Bot size={17} />}>Ask AI</Button>}
      />
      <div className="detail-grid">
        <Card>
          <div className="page-actions" style={{ marginBottom: 14 }}>
            {entry.topics.map((topic) => <Chip key={topic} tone="primary">{topic}</Chip>)}
            <Chip tone="success">{entry.mood}</Chip>
          </div>
          <article className="article-body">
            <p>{entry.content}</p>
            <p>The most useful pattern is to name what changes state, what can be retried, and what should be reviewed by a human. That framing makes infrastructure notes easier to convert into tests and quiz prompts.</p>
          </article>
        </Card>
        <aside className="stack">
          <AiPanel title="Entry synthesis" action={<Button to="/quiz" variant="secondary" size="sm" icon={<Trophy size={16} />}>Create Quiz</Button>}>
            <p>{aiInsights[0].body}</p>
          </AiPanel>
          <Card>
            <div className="section-heading">
              <h2>Confidence</h2>
              <p>Self-rated understanding after capture.</p>
            </div>
            <ProgressBar value={entry.confidence} />
            <p><strong>{entry.confidence}%</strong> mastery signal</p>
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Related notes</h2>
            </div>
            <div className="entry-list">
              {related.map((item) => (
                <a className="entry-item" href={`/journal/${item.id}`} key={item.id}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
