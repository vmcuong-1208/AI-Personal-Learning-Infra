import { apiRequest } from "../../lib/apiClient";

export type AiReportStatus = "pending" | "processing" | "completed" | "failed";
export type AiReportType = "weekly" | "monthly";

export type AiReport = {
  id: string;
  title: string;
  type: AiReportType;
  range: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
  status: AiReportStatus;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

export type CreateAiReportPayload = {
  type: AiReportType;
  startDate: string;
  endDate: string;
};

type BackendAiReport = {
  id?: string;
  reportId?: string;
  report_id?: string;
  title?: string;
  type?: string;
  range?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  status?: string;
  summary?: string;
  strengths?: unknown;
  weaknesses?: unknown;
  recommendations?: unknown;
};

type BackendAiReportList = BackendAiReport[] | {
  items?: BackendAiReport[];
  reports?: BackendAiReport[];
  data?: BackendAiReport[];
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readReportStatus(value: unknown): AiReportStatus {
  if (value === "pending" || value === "processing" || value === "completed" || value === "failed") return value;
  return "pending";
}

function readReportType(value: unknown): AiReportType {
  return value === "monthly" ? "monthly" : "weekly";
}

function formatDateLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function buildReportTitle(report: BackendAiReport, type: AiReportType) {
  const explicitTitle = readString(report.title);
  if (explicitTitle) return explicitTitle;
  return type === "monthly" ? "Monthly AI Report" : "Weekly AI Report";
}

function normalizeAiReport(report: BackendAiReport): AiReport {
  const id = readString(report.id ?? report.reportId ?? report.report_id);
  const type = readReportType(report.type);
  const startDate = readString(report.startDate ?? report.start_date);
  const endDate = readString(report.endDate ?? report.end_date);
  const range = readString(report.range, startDate || endDate ? `${formatDateLabel(startDate)} -> ${formatDateLabel(endDate)}` : "Chưa có khoảng thời gian");

  return {
    id,
    title: buildReportTitle(report, type),
    type,
    range,
    startDate,
    endDate,
    createdAt: readString(report.createdAt ?? report.created_at),
    updatedAt: readString(report.updatedAt ?? report.updated_at) || undefined,
    status: readReportStatus(report.status),
    summary: readString(report.summary, "Báo cáo đang được xử lý. Vui lòng chờ kết quả từ AI Worker."),
    strengths: readStringArray(report.strengths),
    weaknesses: readStringArray(report.weaknesses),
    recommendations: readStringArray(report.recommendations)
  };
}

function readReportList(response: BackendAiReportList) {
  if (Array.isArray(response)) return response;
  return response.items ?? response.reports ?? response.data ?? [];
}

export function getAiReports() {
  return apiRequest<BackendAiReportList>("/ai/reports")
    .then((response) => readReportList(response).map(normalizeAiReport).filter((report) => report.id))
    .then((reports) => reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function getAiReportById(id: string) {
  return apiRequest<BackendAiReport>(`/ai/reports/${encodeURIComponent(id)}`).then(normalizeAiReport);
}

export function createAiReport(payload: CreateAiReportPayload) {
  return apiRequest<BackendAiReport>("/ai/reports", {
    method: "POST",
    body: JSON.stringify({
      type: payload.type,
      start_date: payload.startDate,
      startDate: payload.startDate,
      end_date: payload.endDate,
      endDate: payload.endDate
    })
  }).then(normalizeAiReport);
}
