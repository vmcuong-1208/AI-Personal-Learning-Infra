import { CalendarDays, FileText, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";
import { ApiClientError } from "../../lib/apiClient";
import { createAiReport, getAiReportById, getAiReports, type AiReport, type AiReportStatus, type AiReportType } from "./aiCoachApi";

type ReportPeriod = AiReportType;
type JobStatus = "idle" | AiReportStatus;

const fallbackReports: AiReport[] = [
  {
    id: "week-demo-2026",
    title: "Weekly AI Report - Demo",
    type: "weekly",
    range: "17/06/2026 -> 23/06/2026",
    startDate: "2026-06-17",
    endDate: "2026-06-23",
    createdAt: "2026-06-24T09:15:00.000Z",
    status: "completed",
    summary: "Tuần này bạn học đều hơn, ghi chú có nhiều ví dụ thực tế về queue, Redis và triển khai hệ thống. Các phần tốt nhất là khả năng liên hệ lỗi vận hành với cách thiết kế retry an toàn.",
    strengths: ["Ghi lại bối cảnh lỗi rõ ràng", "Biết so sánh nhiều phương án triển khai", "Có thói quen tóm tắt sau mỗi lab"],
    weaknesses: ["Một số ghi chú command còn thiếu kết quả đầu ra", "Chưa phân biệt thật chắc readiness và liveness probe"],
    recommendations: ["Thêm phần kết quả mong đợi cho từng command", "Ôn lại Kubernetes probes bằng 5 tình huống lỗi", "Tạo quiz ngắn ngay sau mỗi nhật ký quan trọng"]
  }
];

const statusLabels: Record<JobStatus, string> = {
  idle: "Chưa tạo yêu cầu",
  pending: "Đang chờ",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  failed: "Thất bại"
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function parseWeekInput(value: string) {
  const match = value.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstMonday = addDays(firstThursday, -(firstThursday.getUTCDay() || 7) + 1);
  return addDays(firstMonday, (week - 1) * 7);
}

function resolveReportRange(period: ReportPeriod, quickRange: string, customDate: string) {
  const now = new Date();

  if (period === "weekly") {
    const customStart = customDate ? parseWeekInput(customDate) : null;
    const start = customStart ?? addDays(startOfWeek(now), quickRange === "last-week" ? -7 : 0);
    return {
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(addDays(start, 6))
    };
  }

  const customMonth = customDate ? new Date(`${customDate}-01T00:00:00`) : null;
  const baseMonth = customMonth && !Number.isNaN(customMonth.getTime())
    ? customMonth
    : new Date(now.getFullYear(), now.getMonth() + (quickRange === "last-month" ? -1 : 0), 1);

  return {
    startDate: toDateInputValue(baseMonth),
    endDate: toDateInputValue(endOfMonth(baseMonth))
  };
}

function formatDateTime(value: string) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function isFallbackAllowed(error: unknown) {
  return error instanceof ApiClientError && (error.code === "CONFIG_ERROR" || error.code === "AUTH_REQUIRED" || error.code === "UNAUTHORIZED");
}

export function AiCoachPage() {
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [quickRange, setQuickRange] = useState("this-week");
  const [customDate, setCustomDate] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [reports, setReports] = useState<AiReport[]>(fallbackReports);
  const [selectedReportId, setSelectedReportId] = useState(fallbackReports[0].id);
  const pollTimerRef = useRef<number | null>(null);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0],
    [reports, selectedReportId]
  );

  const rangeOptions = period === "weekly"
    ? [
      { value: "this-week", label: "Tuần này" },
      { value: "last-week", label: "Tuần trước" }
    ]
    : [
      { value: "this-month", label: "Tháng này" },
      { value: "last-month", label: "Tháng trước" }
    ];

  const refreshReports = useCallback(async () => {
    setIsLoadingReports(true);
    setError("");
    try {
      const nextReports = await getAiReports();
      if (nextReports.length > 0) {
        setReports(nextReports);
        setSelectedReportId((current) => nextReports.some((report) => report.id === current) ? current : nextReports[0].id);
      }
    } catch (nextError) {
      if (!isFallbackAllowed(nextError)) {
        setError(nextError instanceof Error ? nextError.message : "Không tải được danh sách báo cáo AI.");
      }
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollReport = useCallback((reportId: string, attempt = 1) => {
    stopPolling();
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const nextReport = await getAiReportById(reportId);
        setReports((current) => [nextReport, ...current.filter((report) => report.id !== nextReport.id)]);
        setSelectedReportId(nextReport.id);
        setJobStatus(nextReport.status);

        if (nextReport.status === "completed" || nextReport.status === "failed" || attempt >= MAX_POLL_ATTEMPTS) {
          setIsGenerating(false);
          setBanner(nextReport.status === "completed" ? "Báo cáo AI đã hoàn thành." : "Báo cáo AI chưa hoàn tất. Hãy kiểm tra lại worker hoặc DLQ nếu trạng thái không đổi.");
          return;
        }

        pollReport(reportId, attempt + 1);
      } catch (nextError) {
        setIsGenerating(false);
        setJobStatus("failed");
        setError(nextError instanceof Error ? nextError.message : "Không kiểm tra được trạng thái báo cáo.");
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  useEffect(() => {
    refreshReports();
    return stopPolling;
  }, [refreshReports, stopPolling]);

  async function generateReport() {
    const range = resolveReportRange(period, quickRange, customDate);
    setIsGenerating(true);
    setJobStatus("pending");
    setBanner("Đã gửi yêu cầu tạo báo cáo AI. Worker đang xử lý qua SQS.");
    setError("");

    try {
      const createdReport = await createAiReport({ type: period, ...range });
      setReports((current) => [createdReport, ...current.filter((report) => report.id !== createdReport.id)]);
      setSelectedReportId(createdReport.id);
      pollReport(createdReport.id);
    } catch (nextError) {
      if (isFallbackAllowed(nextError)) {
        setIsGenerating(false);
        setJobStatus("completed");
        setBanner("Đang chạy dữ liệu demo vì frontend chưa có phiên đăng nhập/backend để gọi API thật.");
        return;
      }
      setIsGenerating(false);
      setJobStatus("failed");
      setError(nextError instanceof Error ? nextError.message : "Không tạo được yêu cầu báo cáo AI.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Huấn luyện AI"
        title="AI Learning Coach"
        description="Tóm tắt và đề xuất do AI tạo ra dựa trên nhật ký học tập của bạn."
        action={<Button variant="ghost" onClick={refreshReports} icon={<RefreshCw size={17} />} disabled={isLoadingReports}>Làm mới</Button>}
      />

      {banner && <div className="coach-banner" role="status">{banner}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="coach-report-layout">
        <div className="coach-main-stack">
          <Card className="coach-generate-card">
            <div className="section-heading">
              <span className="mono-label">Báo cáo</span>
              <h2>Generate AI Report</h2>
              <p>Chọn chu kỳ và khoảng thời gian cần phân tích. Frontend sẽ tạo job, nhận trạng thái pending và tự hỏi lại backend đến khi worker hoàn tất.</p>
            </div>

            <div className="report-controls">
              <fieldset className="segmented-field">
                <legend>Chu kỳ báo cáo</legend>
                <label>
                  <input checked={period === "weekly"} name="period" type="radio" onChange={() => { setPeriod("weekly"); setQuickRange("this-week"); setCustomDate(""); }} />
                  <span>Weekly</span>
                </label>
                <label>
                  <input checked={period === "monthly"} name="period" type="radio" onChange={() => { setPeriod("monthly"); setQuickRange("this-month"); setCustomDate(""); }} />
                  <span>Monthly</span>
                </label>
              </fieldset>

              <div className="form-field">
                <label htmlFor="coach-range">Khoảng thời gian</label>
                <select id="coach-range" className="input" value={quickRange} onChange={(event) => setQuickRange(event.target.value)}>
                  {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="coach-custom-date">Tùy chỉnh</label>
                <Input id="coach-custom-date" type={period === "weekly" ? "week" : "month"} value={customDate} onChange={(event) => setCustomDate(event.target.value)} />
              </div>
            </div>

            <div className="generate-actions">
              <Button className="generate-button" onClick={generateReport} icon={<Sparkles size={18} />} disabled={isGenerating}>
                {isGenerating ? "Sending request..." : "Generate AI Report"}
              </Button>
              {isGenerating && <p>Your report is being generated in the background. You can continue using the app.</p>}
            </div>

            <div className={`job-status job-${jobStatus}`}>
              <span>Trạng thái job</span>
              <strong>{statusLabels[jobStatus]}</strong>
            </div>
          </Card>

          <Card>
            <div className="section-heading report-list-heading">
              <div>
                <span className="mono-label">Lịch sử</span>
                <h2>Danh sách báo cáo</h2>
              </div>
              <Chip tone="primary">{reports.length} báo cáo</Chip>
            </div>

            <div className="report-list">
              {isLoadingReports && <p>Đang tải danh sách báo cáo...</p>}
              {!isLoadingReports && reports.map((report) => (
                <article className={`report-item ${selectedReportId === report.id ? "is-selected" : ""}`} key={report.id}>
                  <div className="report-item-icon"><FileText size={18} /></div>
                  <div>
                    <h3>{report.title}</h3>
                    <p><CalendarDays size={14} /> {report.range}</p>
                    <p>Tạo lúc: {formatDateTime(report.createdAt)}</p>
                  </div>
                  <Chip tone={report.status === "completed" ? "success" : "neutral"}>{statusLabels[report.status]}</Chip>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReportId(report.id)}>Xem chi tiết</Button>
                </article>
              ))}
            </div>
          </Card>
        </div>

        <aside className="report-detail-panel">
          <Card>
            {selectedReport ? (
              <>
                <div className="section-heading">
                  <span className="mono-label">Chi tiết</span>
                  <h2>{selectedReport.title}</h2>
                  <p>{selectedReport.range}</p>
                </div>

                <div className="report-detail-stack">
                  <section>
                    <h3>Tóm tắt</h3>
                    <p>{selectedReport.summary}</p>
                  </section>
                  <section>
                    <h3>Điểm mạnh</h3>
                    <ul>{(selectedReport.strengths.length ? selectedReport.strengths : ["Đang chờ AI Worker cập nhật kết quả."]).map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <h3>Điểm yếu</h3>
                    <ul>{(selectedReport.weaknesses.length ? selectedReport.weaknesses : ["Chưa có dữ liệu."]).map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <h3>Đề xuất</h3>
                    <ul>{(selectedReport.recommendations.length ? selectedReport.recommendations : ["Chưa có đề xuất."]).map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                </div>
              </>
            ) : (
              <p>Chưa có báo cáo nào.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}