import { Bot, Pencil, Trophy } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AiPanel, Button, Card, Chip, PageHeader, ProgressBar } from "../../components/ui";
import { aiInsights } from "../../data/mock/mockData";
import { getLearningLog, getLearningLogs } from "./journalData";

const moodLabels: Record<string, string> = { good: "Tốt", neutral: "Bình thường", tired: "Mệt" };

export function EntryDetailsPage() {
  const { entryId } = useParams();
  const entry = useMemo(() => getLearningLog(entryId ?? "") ?? getLearningLogs()[0], [entryId]);
  const related = getLearningLogs().filter((item) => item.id !== entry?.id).slice(0, 2);

  if (!entry) return null;

  return (
    <>
      <PageHeader
        eyebrow={`${entry.date} · ${entry.startTime ?? "--:--"} - ${entry.endTime ?? "--:--"}`}
        title={entry.title}
        description={`${entry.category} · Tâm trạng: ${moodLabels[entry.mood]} · Độ khó: ${entry.difficulty}/5`}
        action={
          <div className="page-actions">
            <Button to={`/journal/${entry.id}/edit`} variant="ghost" icon={<Pencil size={17} />}>Chỉnh sửa</Button>
            <Button to="/coach" variant="ai" icon={<Bot size={17} />}>Hỏi AI</Button>
          </div>
        }
      />
      <div className="detail-grid">
        <Card>
          <div className="page-actions" style={{ marginBottom: 14 }}>
            {entry.tags.map((tag) => <Chip key={tag} tone="primary">{tag}</Chip>)}
            <Chip tone="success">{moodLabels[entry.mood]}</Chip>
          </div>
          <article className="article-body">
            <h2>Nhật ký chi tiết</h2>
            <p>{entry.content}</p>
            {entry.commands && <><h2>Lệnh / hành động</h2><pre className="detail-code">{entry.commands}</pre></>}
            {entry.errors && <><h2>Lỗi gặp phải</h2><div className="error-highlight">{entry.errors}</div></>}
            {entry.solutions && <><h2>Cách xử lý / sửa lỗi</h2><p>{entry.solutions}</p></>}
          </article>
        </Card>
        <aside className="stack">
          <AiPanel title="Tổng hợp bằng AI" action={<Button to="/quiz" variant="secondary" size="sm" icon={<Trophy size={16} />}>Tạo quiz</Button>}>
            <p>{aiInsights[0].body}</p>
          </AiPanel>
          <Card>
            <div className="section-heading">
              <h2>Độ khó</h2>
              <p>Mức độ phức tạp do bạn tự đánh giá cho buổi học này.</p>
            </div>
            <ProgressBar value={entry.difficulty * 20} />
            <p><strong>{entry.difficulty}/5</strong> tín hiệu độ khó</p>
          </Card>
          <Card>
            <div className="section-heading"><h2>Ghi chú liên quan</h2></div>
            <div className="entry-list">
              {related.map((item) => (
                <Link className="entry-item" to={`/journal/${item.id}`} key={item.id}>
                  <div><h3>{item.title}</h3><p>{item.content.slice(0, 120)}...</p></div>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
