import { ArrowRight, LogIn, PenLine, Sparkles, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
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
        eyebrow="Today"
        title="Learning dashboard"
        description="A focused control room for capture, recall, coaching, and momentum."
        action={
          <div className="dashboard-auth-actions">
            {auth.isAuthenticated && auth.user ? (
              <div className="account-pill" aria-label={`Signed in as ${auth.user.name}`}>
                <span className="brand-mark small"><Sparkles size={16} /></span>
                <span>
                  <strong>{auth.user.name}</strong>
                  <small>{auth.user.provider === "google" ? "Google account" : auth.user.email}</small>
                </span>
                <Button variant="ghost" size="sm" onClick={auth.logout}>Logout</Button>
              </div>
            ) : (
              <>
                <Button to="/auth/register" variant="secondary" icon={<UserPlus size={17} />}>Đăng ký</Button>
                <Button to="/auth/login" icon={<LogIn size={17} />}>Đăng nhập</Button>
              </>
            )}
            <Button to="/journal/new" icon={<PenLine size={17} />}>New Entry</Button>
          </div>
        }
      />
      {auth.isAuthenticated && auth.user && (
        <div className="login-success" role="status">
          <Sparkles size={17} />
          <span>{authMessage ?? `Đăng nhập thành công: ${auth.user.name}`}</span>
        </div>
      )}
      <section className="metric-row">
        <MetricCard label="Streak" value={`${analyticsSummary.streak}d`} detail="Consistent capture" tone="success" />
        <MetricCard label="This Week" value={`${analyticsSummary.weeklyMinutes}m`} detail="Deep learning time" />
        <MetricCard label="Recall" value={`${analyticsSummary.recallAccuracy}%`} detail="Quiz accuracy" tone="ai" />
        <MetricCard label="Entries" value={`${analyticsSummary.entriesThisWeek}`} detail="Notes captured" />
      </section>
      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="stack">
          <Card className="hero-card">
            <span className="mono-label">NEXT BEST ACTION</span>
            <h2>Review queues, then turn one weak spot into a quiz.</h2>
            <p>System design is moving well. Kubernetes still needs a tighter feedback loop before you add new concepts.</p>
            <Button to="/quiz" variant="success" icon={<ArrowRight size={17} />}>Start Practice</Button>
          </Card>
          <ChartCard title="Weekly activity" detail="Minutes and entry rhythm across the current week.">
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
              <h2>Recent entries</h2>
              <p>Open a note to inspect its summary, concepts, and follow-up actions.</p>
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
          <AiPanel title={aiInsights[0].title} action={<Button to="/coach" variant="ai" size="sm">Ask Coach</Button>}>
            <p>{aiInsights[0].body}</p>
          </AiPanel>
          <Card>
            <div className="section-heading">
              <h2>Topic mastery</h2>
              <p>Current learning map based on notes and quiz feedback.</p>
            </div>
            <div className="topic-list">
              {topics.map((topic) => (
                <div className="topic-row" key={topic.id}>
                  <div>
                    <strong>{topic.name}</strong>
                    <ProgressBar value={topic.mastery} label={`${topic.name} mastery`} />
                  </div>
                  <span className="mono-label">{topic.mastery}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Weekly goal</h2>
              <p>Write 10 concise entries and answer 12 recall prompts.</p>
            </div>
            <ProgressBar value={72} />
          </Card>
        </aside>
      </div>
    </>
  );
}
