import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, ChartCard, MetricCard, PageHeader, ProgressBar } from "../../components/ui";
import { analyticsSummary, topics, weeklyActivity } from "../../data/mock/mockData";

const COLORS = ["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#0ea5e9"];

export function AnalyticsPage() {
  return (
    <>
      <PageHeader eyebrow="Phân tích" title="Tiến độ học tập" description="Góc nhìn nhanh về độ đều đặn, mức thành thạo và các vùng còn yếu." />
      <section className="metric-row">
        <MetricCard label="Số phút" value={`${analyticsSummary.weeklyMinutes}`} detail="Trong tuần này" />
        <MetricCard label="Độ chính xác" value={`${analyticsSummary.recallAccuracy}%`} detail="Chất lượng ôn tập" tone="ai" />
        <MetricCard label="Chuỗi học" value={`${analyticsSummary.streak}`} detail="Ngày ghi chép liên tục" tone="success" />
        <MetricCard label="Nhật ký" value={`${analyticsSummary.entriesThisWeek}`} detail="Trong tuần này" />
      </section>
      <div className="analytics-grid" style={{ marginTop: 16 }}>
        <div className="stack">
          <ChartCard title="Hoạt động học tập" detail="Số phút học theo từng ngày.">
            <div className="mini-chart">
              <ResponsiveContainer>
                <AreaChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis width={28} />
                  <Tooltip />
                  <Area dataKey="minutes" stroke="#4f46e5" fill="#ddd6fe" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Phân bổ chủ đề" detail="Thời gian học đang tập trung vào đâu.">
            <div className="mini-chart">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={topics} dataKey="mastery" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {topics.map((topic, index) => <Cell key={topic.id} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        <aside className="stack">
          <ChartCard title="Mức thành thạo theo chủ đề">
            <div className="mini-chart">
              <ResponsiveContainer>
                <BarChart data={topics} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={92} />
                  <Tooltip />
                  <Bar dataKey="mastery" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <Card>
            <div className="section-heading">
              <h2>Vùng kiến thức yếu</h2>
              <p>Ưu tiên các chủ đề này trong phiên ôn tập tiếp theo.</p>
            </div>
            <div className="topic-list">
              {topics.filter((topic) => topic.mastery < 65).map((topic) => (
                <div className="topic-row" key={topic.id}>
                  <div>
                    <strong>{topic.name}</strong>
                    <ProgressBar value={topic.mastery} />
                  </div>
                  <span className="mono-label">{topic.mastery}%</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
