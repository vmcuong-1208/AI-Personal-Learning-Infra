import { CalendarDays, FileText, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, Chip, Input, PageHeader } from "../../components/ui";

type ReportPeriod = "weekly" | "monthly";
type JobStatus = "idle" | "pending" | "processing" | "completed" | "failed";
type ReportStatus = "completed" | "failed";

type AiReport = {
  id: string;
  title: string;
  range: string;
  createdAt: string;
  status: ReportStatus;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

const reports: AiReport[] = [
  {
    id: "week-25-2026",
    title: "Weekly AI Report - Week 25, 2026",
    range: "2026-06-17 -> 2026-06-23",
    createdAt: "2026-06-24 09:15",
    status: "completed",
    summary: "Tuần này bạn học đều hơn, ghi chú có nhiều ví dụ thực tế về queue, Redis và triển khai hệ thống. Các phần tốt nhất là khả năng liên hệ lỗi vận hành với cách thiết kế retry an toàn.",
    strengths: ["Ghi lại bối cảnh lỗi rõ ràng", "Biết so sánh nhiều phương án triển khai", "Có thói quen tóm tắt sau mỗi lab"],
    weaknesses: ["Một số ghi chú command còn thiếu kết quả đầu ra", "Chưa phân biệt thật chắc readiness và liveness probe", "Ít câu hỏi tự kiểm tra sau buổi học"],
    recommendations: ["Thêm phần kết quả mong đợi cho từng command", "Ôn lại Kubernetes probes bằng 5 tình huống lỗi", "Tạo quiz ngắn ngay sau mỗi nhật ký quan trọng"]
  },
  {
    id: "week-24-2026",
    title: "Weekly AI Report - Week 24, 2026",
    range: "2026-06-10 -> 2026-06-16",
    createdAt: "2026-06-17 08:40",
    status: "completed",
    summary: "Bạn tập trung tốt vào nền tảng hạ tầng và bắt đầu gom các ghi chú rời rạc thành chủ đề lớn. Cần duy trì nhịp học đều và chuẩn hóa tag để tìm lại nhanh hơn.",
    strengths: ["Chủ đề DevOps được ghi lại liên tục", "Có nhiều ví dụ lệnh thực hành", "Biết ghi lại nguyên nhân gốc của lỗi"],
    weaknesses: ["Tag chưa nhất quán giữa các buổi học", "Một số mục chỉ có lệnh mà thiếu giải thích", "Chưa có mốc ưu tiên cho tuần sau"],
    recommendations: ["Dùng bộ tag cố định cho AWS, Redis, Kubernetes", "Viết 2-3 dòng giải thích sau mỗi command", "Chọn một chủ đề khó nhất để coach phân tích sâu"]
  },
  {
    id: "month-06-2026",
    title: "Monthly AI Report - June 2026",
    range: "2026-06-01 -> 2026-06-30",
    createdAt: "2026-06-25 18:05",
    status: "failed",
    summary: "Yêu cầu báo cáo tháng chưa hoàn tất do dữ liệu đầu vào thiếu một số mốc thời gian. Bạn có thể tạo lại sau khi bổ sung nhật ký học.",
    strengths: ["Có nhiều phiên học thực hành", "Các lỗi quan trọng đã được đánh dấu"],
    weaknesses: ["Thiếu thời gian bắt đầu và kết thúc ở một số log", "Một vài entry chưa có danh mục"],
    recommendations: ["Bổ sung metadata cho các entry còn thiếu", "Tạo lại báo cáo tháng sau khi cập nhật dữ liệu"]
  }
];

const statusLabels: Record<JobStatus | ReportStatus, string> = {
  idle: "Chưa tạo yêu cầu",
  pending: "Đang chờ",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  failed: "Thất bại"
};

export function AiCoachPage() {
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [quickRange, setQuickRange] = useState("this-week");
  const [customDate, setCustomDate] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [banner, setBanner] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0],
    [selectedReportId]
  );

  const rangeOptions = period === "weekly"
    ? [
      { value: "this-week", label: "Tuần này" },
      { value: "last-week", label: "Tuần trước" },
      { value: "week-24-2026", label: "Tuần 24/2026" }
    ]
    : [
      { value: "this-month", label: "Tháng này" },
      { value: "last-month", label: "Tháng trước" },
      { value: "month-05-2026", label: "Tháng 05/2026" }
    ];

  function generateReport() {
    setIsGenerating(true);
    setJobStatus("pending");
    setBanner("");

    window.setTimeout(() => {
      setJobStatus("processing");
      setBanner("Yêu cầu báo cáo đã được tạo cho 2026-06-20 -> 2026-06-26. Quá trình này có thể mất vài giây.");
    }, 650);

    window.setTimeout(() => {
      setJobStatus("completed");
      setIsGenerating(false);
    }, 1400);
  }

  return (
    <>
      <PageHeader
        eyebrow="Huấn luyện AI"
        title="AI Learning Coach"
        description="Tóm tắt và đề xuất do AI tạo ra dựa trên nhật ký học tập của bạn."
      />

      {banner && <div className="coach-banner" role="status">{banner}</div>}

      <div className="coach-report-layout">
        <div className="coach-main-stack">
          <Card className="coach-generate-card">
            <div className="section-heading">
              <span className="mono-label">Báo cáo</span>
              <h2>Generate AI Report</h2>
              <p>Chọn chu kỳ và khoảng thời gian cần phân tích. Hệ thống sẽ tạo yêu cầu chạy nền và cập nhật trạng thái rõ ràng.</p>
            </div>

            <div className="report-controls">
              <fieldset className="segmented-field">
                <legend>Chu kỳ báo cáo</legend>
                <label>
                  <input checked={period === "weekly"} name="period" type="radio" onChange={() => { setPeriod("weekly"); setQuickRange("this-week"); }} />
                  <span>Weekly</span>
                </label>
                <label>
                  <input checked={period === "monthly"} name="period" type="radio" onChange={() => { setPeriod("monthly"); setQuickRange("this-month"); }} />
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
              {reports.map((report) => (
                <article className={`report-item ${selectedReportId === report.id ? "is-selected" : ""}`} key={report.id}>
                  <div className="report-item-icon"><FileText size={18} /></div>
                  <div>
                    <h3>{report.title}</h3>
                    <p><CalendarDays size={14} /> {report.range}</p>
                    <p>Tạo lúc: {report.createdAt}</p>
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
                <ul>{selectedReport.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section>
                <h3>Điểm yếu</h3>
                <ul>{selectedReport.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section>
                <h3>Đề xuất</h3>
                <ul>{selectedReport.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
