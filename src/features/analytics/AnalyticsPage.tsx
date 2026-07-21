import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button, Card, ChartCard, Chip, MetricCard, PageHeader, ProgressBar } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";
import { getAnalyticsSummary, type AnalyticsSummary, type AnalyticsTopic } from "./analyticsApi";

const COLORS = ["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#0ea5e9", "#ef4444"];

const emptySummary: AnalyticsSummary = {
  weeklyEntries: 0,
  totalMinutes: 0,
  streak: 0,
  accuracyPercentage: 0,
  topicDistribution: [],
  weakAreas: [],
  totalLogs: 0
};

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function getWeakAreaRows(summary: AnalyticsSummary) {
  if (summary.weakAreas.length === 0) return [];

  const byName = new Map(summary.topicDistribution.map((topic) => [topic.name.toLowerCase(), topic]));
  return summary.weakAreas.map((name) => {
    const matched = byName.get(name.toLowerCase());
    return {
      id: matched?.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      count: matched?.count ?? 0,
      share: matched?.share ?? 0
    };
  });
}

function TopicTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AnalyticsTopic }> }) {
  if (!active || !payload?.length) return null;
  const topic = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{topic.name}</strong>
      <p>{topic.count} nhật ký - {topic.share}%</p>
    </div>
  );
}

export function AnalyticsPage() {
  const { isAuthenticated, isLoading: isAuthLoading, refreshCurrentUser } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const currentUser = isAuthenticated ? true : await refreshCurrentUser();
      if (!currentUser) {
        setSummary(emptySummary);
        setLoadError("Bạn cần đăng nhập trước khi xem dữ liệu phân tích.");
        return;
      }

      setSummary(await getAnalyticsSummary());
    } catch (error) {
      setSummary(emptySummary);
      setLoadError(error instanceof Error ? error.message : "Chưa tải được dữ liệu phân tích.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshCurrentUser]);

  useEffect(() => {
    if (isAuthLoading) return;
    loadSummary();
  }, [isAuthLoading, loadSummary]);

  const weakAreaRows = useMemo(() => getWeakAreaRows(summary), [summary]);
  const hasTopics = summary.topicDistribution.length > 0;
  const isBusy = isAuthLoading || isLoading;

  return (
    <>
      <PageHeader
        eyebrow="Phân tích"
        title="Tiến độ học tập"
        description="Theo dõi thời gian học, thói quen ghi nhật ký, kết quả ôn tập và những chủ đề nên luyện thêm."
        action={<Button variant="ghost" icon={<RefreshCw size={17} />} onClick={loadSummary} disabled={isBusy}>{isBusy ? "Đang tải" : "Làm mới"}</Button>}
      />

      {loadError && <div className="settings-message settings-message-error" role="alert">{loadError}</div>}

      <section className="metric-row">
        <MetricCard label="Tổng phút" value={formatMinutes(summary.totalMinutes)} detail="Tổng thời gian học đã ghi nhận" />
        <MetricCard label="Độ chính xác" value={`${summary.accuracyPercentage}%`} detail="Từ các lượt làm quiz" tone="ai" />
        <MetricCard label="Chuỗi học" value={`${summary.streak}`} detail="Ngày ghi nhật ký liên tục" tone="success" />
        <MetricCard label="Nhật ký tuần" value={`${summary.weeklyEntries}`} detail={`${summary.totalLogs} nhật ký tổng cộng`} />
      </section>

      {isBusy ? (
        <Card className="journal-empty" style={{ marginTop: 16 }}>
          <h2>Đang tải dữ liệu phân tích...</h2>
          <p>LearnFlow đang kiểm tra phiên đăng nhập và lấy thống kê mới nhất từ backend AWS.</p>
        </Card>
      ) : (
        <div className="analytics-grid" style={{ marginTop: 16 }}>
          <div className="stack">
            <ChartCard title="Phân bổ chủ đề" detail="Số nhật ký theo từng chủ đề.">
              {hasTopics ? (
                <div className="mini-chart">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={summary.topicDistribution} dataKey="count" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                        {summary.topicDistribution.map((topic, index) => <Cell key={topic.id} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<TopicTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="search-empty">
                  <p>Chưa có topic nào trong dữ liệu nhật ký.</p>
                </div>
              )}
            </ChartCard>

            <Card>
              <div className="section-heading">
                <h2>Tóm tắt nguồn dữ liệu</h2>
                <p>Tổng quan nhanh về những gì bạn đã ghi lại và ôn tập.</p>
              </div>
              <div className="page-actions">
                <Chip tone="primary">{summary.totalLogs} logs</Chip>
                <Chip tone="success">{summary.weeklyEntries} tuần này</Chip>
                <Chip tone="ai">{summary.weakAreas.length} vùng yếu</Chip>
              </div>
            </Card>
          </div>

          <aside className="stack">
            <ChartCard title="Tỷ trọng theo chủ đề" detail="Topic càng dài nghĩa là xuất hiện nhiều hơn trong nhật ký.">
              {hasTopics ? (
                <div className="mini-chart">
                  <ResponsiveContainer>
                    <BarChart data={summary.topicDistribution} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip content={<TopicTooltip />} />
                      <Bar dataKey="share" fill="#10b981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="search-empty">
                  <p>Chưa đủ dữ liệu để vẽ biểu đồ.</p>
                </div>
              )}
            </ChartCard>

            <Card>
              <div className="section-heading">
                <h2>Vùng kiến thức yếu</h2>
                <p>Các chủ đề bạn nên ưu tiên xem lại trong lần học tiếp theo.</p>
              </div>
              {weakAreaRows.length > 0 ? (
                <div className="topic-list">
                  {weakAreaRows.map((topic) => (
                    <div className="topic-row" key={topic.id || topic.name}>
                      <div>
                        <strong>{topic.name}</strong>
                        <ProgressBar value={topic.share || 8} />
                      </div>
                      <span className="mono-label">{topic.count ? `${topic.count} logs` : "Có lỗi"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-empty">
                  <p>Chưa có vùng yếu nào. Khi nhật ký có trường errors, backend sẽ đưa topic vào đây.</p>
                </div>
              )}
            </Card>
          </aside>
        </div>
      )}
    </>
  );
}