import { ArrowRight, PenLine, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AiPanel, Button, Card, ChartCard, Chip, MetricCard, PageHeader, ProgressBar } from "../../components/ui";
import { aiInsights, analyticsSummary, journalEntries, topics, weeklyActivity } from "../../data/mock/mockData";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const auth = useAuth();
  const location = useLocation();
  const authMessage = (location.state as { authMessage?: string } | null)?.authMessage;

  return (
    <>
      <PageHeader
        eyebrow="Hôm nay"
        title="Bảng điều khiển học tập"
        description="Không gian tập trung để ghi chép, ôn tập, nhận gợi ý AI và theo dõi tiến độ."
        action={<Button to="/journal/new" icon={<PenLine size={17} />}>Ghi nhật ký mới</Button>}
      />
      {auth.isAuthenticated && auth.user && (
        <div className="login-success" role="status">
          <Sparkles size={17} />
          <span>{authMessage ?? `Đăng nhập thành công: ${auth.user.name}`}</span>
        </div>
      )}
      <section className="metric-row">
        <MetricCard label="Chuỗi học" value={`${analyticsSummary.streak} ngày`} detail="Duy trì thói quen ghi chép" tone="success" />
        <MetricCard label="Tuần này" value={`${analyticsSummary.weeklyMinutes} phút`} detail="Thời gian học sâu" />
        <MetricCard label="Ghi nhớ" value={`${analyticsSummary.recallAccuracy}%`} detail="Độ chính xác quiz" tone="ai" />
        <MetricCard label="Nhật ký" value={`${analyticsSummary.entriesThisWeek}`} detail="Ghi chú đã lưu" />
      </section>
      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="stack">
          <Card className="hero-card">
            <span className="mono-label">HÀNH ĐỘNG TIẾP THEO</span>
            <h2>Ôn lại hàng đợi học tập, rồi biến một điểm yếu thành quiz.</h2>
            <p>Thiết kế hệ thống đang tiến triển tốt. Kubernetes vẫn cần vòng phản hồi chặt hơn trước khi thêm khái niệm mới.</p>
            <Button to="/quiz" variant="success" icon={<ArrowRight size={17} />}>Bắt đầu ôn tập</Button>
          </Card>
          <ChartCard title="Hoạt động trong tuần" detail="Số phút học và nhịp ghi nhật ký theo từng ngày.">
            <div className="mini-chart">
              <ResponsiveContainer>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis width={28} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <Card>
            <div className="section-heading">
              <h2>Nhật ký gần đây</h2>
              <p>Mở một ghi chú để xem tóm tắt, khái niệm chính và hành động tiếp theo.</p>
            </div>
            <div className="entry-list">
              {journalEntries.slice(0, 3).map((entry) => (
                <Link className="entry-item" key={entry.id} to={`/journal/${entry.id}`}>
                  <div>
                    <h3>{entry.title}</h3>
                    <p>{entry.summary}</p>
                  </div>
                  <Chip tone="primary">{entry.confidence}%</Chip>
                </Link>
              ))}
            </div>
          </Card>
        </div>
        <aside className="stack">
          <AiPanel title={aiInsights[0].title} action={<Button to="/coach" variant="ai" size="sm">Hỏi huấn luyện AI</Button>}>
            <p>{aiInsights[0].body}</p>
          </AiPanel>
          <Card>
            <div className="section-heading">
              <h2>Mức độ thành thạo theo chủ đề</h2>
              <p>Bản đồ học tập hiện tại dựa trên ghi chú và phản hồi quiz.</p>
            </div>
            <div className="topic-list">
              {topics.map((topic) => (
                <div className="topic-row" key={topic.id}>
                  <div>
                    <strong>{topic.name}</strong>
                    <ProgressBar value={topic.mastery} label={`Mức thành thạo ${topic.name}`} />
                  </div>
                  <span className="mono-label">{topic.mastery}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Mục tiêu tuần</h2>
              <p>Viết 10 nhật ký ngắn và trả lời 12 câu hỏi ôn tập.</p>
            </div>
            <ProgressBar value={72} />
          </Card>
        </aside>
      </div>
    </>
  );
}
