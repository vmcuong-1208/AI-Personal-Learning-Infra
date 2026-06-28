import { BarChart3, Brain, CheckCircle2, FileText, Flame, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, ChartCard, Chip, PageHeader } from "../../components/ui";
import { topics, weeklyActivity } from "../../data/mock/mockData";
import { getLearningLogs } from "../journal/journalData";

const moodLabels: Record<string, string> = {
  good: "Tốt",
  neutral: "Bình thường",
  tired: "Mệt"
};

const topicLabels: Record<string, string> = {
  networking: "Networking",
  security: "Security",
  monitoring: "Monitoring",
  devops: "DevOps",
  ai: "AI",
  programming: "Programming"
};

const moodTrend = [
  { day: "T2", difficulty: 2, mood: 4 },
  { day: "T3", difficulty: 3, mood: 3 },
  { day: "T4", difficulty: 2, mood: 4 },
  { day: "T5", difficulty: 4, mood: 2 },
  { day: "T6", difficulty: 3, mood: 3 },
  { day: "T7", difficulty: 2, mood: 4 },
  { day: "CN", difficulty: 3, mood: 3 }
];

const quizPerformance = [
  { topic: "Networking", score: 82 },
  { topic: "Security", score: 68 },
  { topic: "Monitoring", score: 74 },
  { topic: "DevOps", score: 79 },
  { topic: "AI", score: 71 }
];

const weeklyTracker = [
  { day: "Mon", date: "2026-06-22", active: true, logs: 2, quizzes: 1, entryId: "redis-streams" },
  { day: "Tue", date: "2026-06-23", active: true, logs: 1, quizzes: 0, entryId: "bullmq-retries" },
  { day: "Wed", date: "2026-06-24", active: true, logs: 1, quizzes: 1, entryId: "terraform-modules" },
  { day: "Thu", date: "2026-06-25", active: true, logs: 2, quizzes: 1, entryId: "kubernetes-probes" },
  { day: "Fri", date: "2026-06-26", active: true, logs: 1, quizzes: 0, entryId: "redis-streams" },
  { day: "Sat", date: "2026-06-27", active: false, logs: 0, quizzes: 0 },
  { day: "Sun", date: "2026-06-28", active: true, logs: 1, quizzes: 1, entryId: "bullmq-retries" }
];

export function DashboardPage() {
  const logs = useMemo(() => getLearningLogs(), []);
  const weeklyLogs = logs.filter((log) => log.date >= "2026-06-19");
  const activeDays = weeklyTracker.filter((day) => day.active).length;
  const currentStreak = 12;
  const topicChart = useMemo(() => {
    const counts = weeklyLogs.reduce<Record<string, number>>((acc, log) => {
      const label = topicLabels[log.category] ?? log.category;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([topic, entries]) => ({ topic, entries }));
  }, [weeklyLogs]);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Bảng điều khiển học tập"
        description="Theo dõi nhanh nhật ký, báo cáo AI, quiz và xu hướng học tập trong tuần."
      />

      <section className="dashboard-section">
        <div className="section-heading dashboard-section-heading">
          <div>
            <span className="mono-label">Khối A</span>
            <h2>Tổng quan tuần này</h2>
          </div>
        </div>
        <div className="weekly-overview-grid">
          <Card className="overview-card">
            <div className="overview-icon"><FileText size={19} /></div>
            <span className="mono-label">Nhật ký tuần này</span>
            <strong>{weeklyLogs.length}</strong>
            <p>{weeklyLogs.length > 0 ? "Entry đã ghi trong tuần, sắp xếp mới nhất trước." : "Chưa có nhật ký trong tuần này."}</p>
            <Link to="/journal">Xem tất cả</Link>
          </Card>

          <Card className="overview-card">
            <div className="overview-icon ai"><Sparkles size={19} /></div>
            <span className="mono-label">Báo cáo AI tuần này</span>
            <strong>2</strong>
            <p>Một báo cáo đã hoàn tất, một báo cáo đang chờ tạo mới.</p>
            <Link to="/coach">Tạo báo cáo mới</Link>
          </Card>

          <Card className="overview-card">
            <div className="overview-icon success"><BarChart3 size={19} /></div>
            <span className="mono-label">Quiz đã làm</span>
            <strong>5</strong>
            <p>Điểm trung bình 78%, tốt nhất ở Networking.</p>
            <Link to="/quiz">Làm quiz mới</Link>
          </Card>

          <Card className="overview-card coach-highlight">
            <div className="overview-icon ai"><Brain size={19} /></div>
            <span className="mono-label">Coach highlight</span>
            <p>AI nhận thấy bạn học đều hơn ở nhóm AWS/Monitoring. Tuần tới nên ôn lại IAM và probe timing để giảm lỗi lặp.</p>
            <Link to="/coach">Mở AI Coach</Link>
          </Card>
        </div>
      </section>

      <section className="dashboard-section weekly-tracker-section">
        <Card className="weekly-tracker-card">
          <div className="weekly-tracker-header">
            <div>
              <span className="mono-label">Điểm danh học tập</span>
              <h2>Hoạt động học tập hàng tuần</h2>
              <p>Theo dõi chuỗi học tập và điểm danh mỗi ngày.</p>
            </div>
            <div className="streak-counter">
              <Flame size={22} />
              <div>
                <strong>{currentStreak} ngày</strong>
                <span>Chuỗi học liên tiếp</span>
              </div>
              <Chip tone="success">Milestone 7 ngày</Chip>
            </div>
          </div>

          <div className="weekly-tracker-grid" aria-label="Theo dõi hoạt động học tập hàng tuần">
            {weeklyTracker.map((day) => {
              const content = (
                <>
                  <span>{day.day}</span>
                  <strong>{day.date.slice(8)}</strong>
                  <small>{day.active ? `${day.logs} log · ${day.quizzes} quiz` : "Chưa có hoạt động"}</small>
                  {day.active && <CheckCircle2 size={17} />}
                </>
              );
              const title = `${day.date}: ${day.logs} log, ${day.quizzes} quiz`;

              return day.entryId ? (
                <Link className={`tracker-day${day.active ? " is-active" : ""}`} key={day.day} title={title} to={`/journal/${day.entryId}`}>
                  {content}
                </Link>
              ) : (
                <span className="tracker-day" key={day.day} title={title}>{content}</span>
              );
            })}
          </div>

          <p className="tracker-note">{activeDays}/7 ngày có hoạt động. Khi bạn tạo log hoặc làm quiz, ngày tương ứng sẽ được điểm danh tự động.</p>
        </Card>
      </section>

      <section className="dashboard-section detail-analysis-section">
        <div className="section-heading dashboard-section-heading">
          <div>
            <span className="mono-label">Khối B</span>
            <h2>Phân tích chi tiết</h2>
          </div>
        </div>

        <Card className="dashboard-filter-bar">
          <div className="form-field">
            <label htmlFor="dashboard-range">Khoảng thời gian</label>
            <select id="dashboard-range" className="input" defaultValue="7">
              <option value="7">7 ngày gần đây</option>
              <option value="30">30 ngày gần đây</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dashboard-topic">Topic / tag</label>
            <select id="dashboard-topic" className="input" defaultValue="all">
              <option value="all">Tất cả topic</option>
              <option value="aws">AWS</option>
              <option value="monitoring">Monitoring</option>
              <option value="security">Security</option>
              <option value="devops">DevOps</option>
            </select>
          </div>
        </Card>

        <div className="dashboard-chart-grid">
          <ChartCard title="Số nhật ký theo thời gian" detail="Số entry theo từng ngày trong tuần.">
            <div className="mini-chart">
              <ResponsiveContainer>
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis width={28} />
                  <Tooltip />
                  <Line type="monotone" dataKey="entries" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Chủ đề học" detail="Số nhật ký theo topic chính.">
            <div className="mini-chart">
              <ResponsiveContainer>
                <BarChart data={topicChart.length > 0 ? topicChart : topics.slice(0, 4).map((topic) => ({ topic: topic.name, entries: Math.round(topic.mastery / 20) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="topic" />
                  <YAxis width={28} />
                  <Tooltip />
                  <Bar dataKey="entries" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Mood / difficulty theo thời gian" detail="Mood cao hơn nghĩa là buổi học dễ chịu hơn.">
            <div className="mini-chart">
              <ResponsiveContainer>
                <LineChart data={moodTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis width={28} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="difficulty" stroke="#f59e0b" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Quiz performance theo topic" detail="Điểm trung bình sau các phiên quiz.">
            <div className="mini-chart">
              <ResponsiveContainer>
                <BarChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="topic" />
                  <YAxis width={28} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <Card className="dashboard-table-card">
          <div className="section-heading">
            <h2>Bảng chi tiết nhật ký</h2>
            <p>Danh sách learning logs dùng làm nguồn cho AI Coach, Search, Quiz và Analytics.</p>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-log-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Subject</th>
                  <th>Topic</th>
                  <th>Tags</th>
                  <th>Mood</th>
                  <th>Difficulty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {weeklyLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.title}</td>
                    <td>{topicLabels[log.category] ?? log.category}</td>
                    <td>
                      <div className="table-chip-row">{log.tags.slice(0, 3).map((tag) => <Chip key={tag}>{tag}</Chip>)}</div>
                    </td>
                    <td>{moodLabels[log.mood]}</td>
                    <td>{log.difficulty}/5</td>
                    <td><Link to={`/journal/${log.id}`}>Xem</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </>
  );
}
