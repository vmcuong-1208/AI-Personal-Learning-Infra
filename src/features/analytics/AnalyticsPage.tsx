import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, ChartCard, MetricCard, PageHeader, ProgressBar } from "../../components/ui";
import { analyticsSummary, topics, weeklyActivity } from "../../data/mock/mockData";

const COLORS = ["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#0ea5e9"];

export function AnalyticsPage() {
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Learning progress" description="A scan-friendly view of consistency, mastery, and weak areas." />
      <section className="metric-row">
        <MetricCard label="Minutes" value={`${analyticsSummary.weeklyMinutes}`} detail="This week" />
        <MetricCard label="Accuracy" value={`${analyticsSummary.recallAccuracy}%`} detail="Recall quality" tone="ai" />
        <MetricCard label="Streak" value={`${analyticsSummary.streak}`} detail="Daily capture" tone="success" />
        <MetricCard label="Entries" value={`${analyticsSummary.entriesThisWeek}`} detail="This week" />
      </section>
      <div className="analytics-grid" style={{ marginTop: 16 }}>
        <div className="stack">
          <ChartCard title="Learning activity" detail="Minutes captured by day.">
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
          <ChartCard title="Topic distribution" detail="Where your learning time is concentrated.">
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
          <ChartCard title="Mastery by topic">
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
              <h2>Weak areas</h2>
              <p>Prioritize these in the next recall session.</p>
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
