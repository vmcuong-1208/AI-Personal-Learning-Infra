import { Send } from "lucide-react";
import { useState } from "react";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import { journalEntries, topics } from "../../data/mock/mockData";

type Message = { role: "user" | "assistant"; text: string };

export function AiCoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Bring me one concept you want to make explainable. I will turn it into a tighter mental model and a recall prompt." },
    { role: "user", text: "I keep mixing up queue retries and idempotency." },
    { role: "assistant", text: "Treat retries as the delivery mechanism and idempotency as the safety rule. A retry asks 'can we try again?' Idempotency asks 'what happens if we did this already?'" }
  ]);
  const [draft, setDraft] = useState("");

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: draft },
      { role: "assistant", text: "Good thread. Write one concrete failure case, then decide whether the fix belongs in retry policy, job identity, or side-effect guards." }
    ]);
    setDraft("");
  }

  return (
    <>
      <PageHeader eyebrow="AI Coach" title="Reason through your notes" description="A context-aware coach for turning loose understanding into durable explanations." />
      <div className="coach-grid">
        <Card>
          <div className="chat-thread" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>
            ))}
          </div>
          <div className="composer">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Ask for an explanation, analogy, or quiz prompt..." />
            <Button onClick={sendMessage} icon={<Send size={17} />}>Send</Button>
          </div>
        </Card>
        <aside className="stack">
          <Card>
            <div className="section-heading">
              <h2>Suggested prompts</h2>
            </div>
            <div className="stack">
              {["Explain this like a design review", "Generate 3 recall questions", "Find the weak assumption"].map((prompt) => (
                <Button key={prompt} variant="ghost" onClick={() => setDraft(prompt)}>{prompt}</Button>
              ))}
            </div>
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Context</h2>
              <p>Recent notes available to the coach.</p>
            </div>
            <div className="entry-list">
              {journalEntries.slice(0, 2).map((entry) => <div className="entry-item" key={entry.id}><div><h3>{entry.title}</h3><p>{entry.summary}</p></div></div>)}
            </div>
          </Card>
          <Card>
            <div className="page-actions">
              {topics.slice(0, 4).map((topic) => <Chip key={topic.id} tone="ai">{topic.name}</Chip>)}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
