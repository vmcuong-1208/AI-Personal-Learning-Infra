import { Send } from "lucide-react";
import { useState } from "react";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import { journalEntries, topics } from "../../data/mock/mockData";

type Message = { role: "user" | "assistant"; text: string };

export function AiCoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hãy đưa cho tôi một khái niệm bạn muốn giải thích rõ hơn. Tôi sẽ giúp bạn biến nó thành mô hình tư duy và câu hỏi ôn tập." },
    { role: "user", text: "Mình hay nhầm giữa retry của queue và idempotency." },
    { role: "assistant", text: "Hãy xem retry là cơ chế giao việc lại, còn idempotency là quy tắc an toàn. Retry hỏi: có thử lại được không? Idempotency hỏi: nếu thao tác này đã chạy rồi thì điều gì xảy ra?" }
  ]);
  const [draft, setDraft] = useState("");

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: draft },
      { role: "assistant", text: "Luồng suy nghĩ tốt. Hãy viết một failure case cụ thể, rồi xác định phần sửa nằm ở retry policy, định danh job hay cơ chế chặn side effect." }
    ]);
    setDraft("");
  }

  return (
    <>
      <PageHeader eyebrow="Huấn luyện AI" title="Cùng phân tích ghi chú học tập" description="Trợ lý theo ngữ cảnh giúp biến hiểu biết rời rạc thành lời giải thích bền vững." />
      <div className="coach-grid">
        <Card>
          <div className="chat-thread" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>
            ))}
          </div>
          <div className="composer">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Hỏi về cách giải thích, ví dụ tương tự hoặc câu hỏi ôn tập..." />
            <Button onClick={sendMessage} icon={<Send size={17} />}>Gửi</Button>
          </div>
        </Card>
        <aside className="stack">
          <Card>
            <div className="section-heading"><h2>Gợi ý câu hỏi</h2></div>
            <div className="stack">
              {["Giải thích như trong buổi review thiết kế", "Tạo 3 câu hỏi ôn tập", "Tìm giả định yếu nhất"].map((prompt) => (
                <Button key={prompt} variant="ghost" onClick={() => setDraft(prompt)}>{prompt}</Button>
              ))}
            </div>
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Ngữ cảnh</h2>
              <p>Những ghi chú gần đây mà coach có thể tham chiếu.</p>
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
