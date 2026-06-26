import type { AiInsight, AnalyticsSummary, JournalEntry, LearningTopic, QuizQuestion } from "./types";

export const topics: LearningTopic[] = [
  { id: "redis", name: "Redis", mastery: 78, color: "#4f46e5" },
  { id: "bullmq", name: "BullMQ", mastery: 64, color: "#8b5cf6" },
  { id: "terraform", name: "Terraform", mastery: 58, color: "#10b981" },
  { id: "system-design", name: "Thiết kế hệ thống", mastery: 71, color: "#f59e0b" },
  { id: "kubernetes", name: "Kubernetes", mastery: 49, color: "#0ea5e9" }
];

export const journalEntries: JournalEntry[] = [
  {
    id: "redis-streams",
    title: "Redis Streams cho hàng đợi học tập bền vững",
    date: "2026-06-22",
    summary: "So sánh streams, consumer groups và lists để thiết kế pipeline học tập ổn định.",
    content: "Redis Streams phù hợp khi workflow học tập cần lịch sử sự kiện dạng append-only và khả năng phát lại. Consumer groups giúp tách các worker như ghi nhận, tóm tắt và tạo quiz mà không làm mất trạng thái.",
    topics: ["Redis", "Thiết kế hệ thống"],
    confidence: 82,
    minutes: 45,
    mood: "focused"
  },
  {
    id: "bullmq-retries",
    title: "Ghi chú chiến lược retry trong BullMQ",
    date: "2026-06-21",
    summary: "Ghi lại retry, backoff và dead-letter cho các job làm giàu dữ liệu bằng AI.",
    content: "BullMQ giúp kiểm soát retry rõ ràng cho các tác vụ AI chạy nền. Exponential backoff phù hợp với lỗi tạm thời từ provider, còn lỗi validation nên được đưa thẳng vào hàng chờ kiểm tra.",
    topics: ["BullMQ", "Redis"],
    confidence: 68,
    minutes: 32,
    mood: "curious"
  },
  {
    id: "terraform-modules",
    title: "Ranh giới module Terraform",
    date: "2026-06-20",
    summary: "Phác thảo nguyên tắc giữ module nhỏ, tái sử dụng được và dễ đọc.",
    content: "Một module Terraform tốt nên sở hữu một khái niệm hạ tầng mạch lạc. Input cần rõ ràng, output nên hỗ trợ composition và drift giữa các môi trường phải dễ thấy khi review.",
    topics: ["Terraform"],
    confidence: 61,
    minutes: 38,
    mood: "confident"
  },
  {
    id: "kubernetes-probes",
    title: "Kubernetes probes và độ tin cậy khi rollout",
    date: "2026-06-19",
    summary: "Làm rõ readiness, liveness và khi nào startup probe giúp giảm restart nhiễu.",
    content: "Readiness probe bảo vệ traffic, liveness probe phục hồi process bị kẹt, còn startup probe cho service khởi động chậm thêm thời gian. Điểm chính là khớp timing của probe với hành vi thật của ứng dụng.",
    topics: ["Kubernetes", "Thiết kế hệ thống"],
    confidence: 54,
    minutes: 29,
    mood: "stuck"
  }
];

export const aiInsights: AiInsight[] = [
  {
    id: "connect-queues",
    title: "Liên kết hàng đợi với luyện nhớ",
    body: "Ghi chú Redis và BullMQ của bạn cùng hướng tới một mô hình: trạng thái công việc bền vững. Hãy biến chủ đề đó thành hai câu hỏi ôn tập hôm nay.",
    relatedEntryId: "bullmq-retries"
  },
  {
    id: "probe-gap",
    title: "Probe timing đang là điểm yếu",
    body: "Mức tự tin với Kubernetes thấp hơn trung bình. Nên ôn lại các failure mode trước khi thêm chủ đề deployment mới.",
    relatedEntryId: "kubernetes-probes"
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    topic: "Redis",
    prompt: "Tính năng nào của Redis Streams giúp nhiều worker phối hợp tiến độ độc lập?",
    options: ["Sorted sets", "Consumer groups", "Pub/sub channels", "Key expiration"],
    answerIndex: 1,
    explanation: "Consumer groups theo dõi việc giao message và xác nhận xử lý cho nhiều consumer phối hợp."
  },
  {
    id: "q2",
    topic: "Kubernetes",
    prompt: "Probe nào ngăn traffic đi vào pod trước khi pod sẵn sàng?",
    options: ["Readiness probe", "Liveness probe", "Startup probe", "Node probe"],
    answerIndex: 0,
    explanation: "Readiness probe quyết định pod có được đưa vào service endpoints hay không."
  },
  {
    id: "q3",
    topic: "Terraform",
    prompt: "Dấu hiệu tốt nhất cho thấy ranh giới module Terraform đang hợp lý là gì?",
    options: ["Module không có biến", "Module sở hữu một khái niệm hạ tầng mạch lạc", "Module giấu mọi output", "Module thay đổi mọi môi trường cùng lúc"],
    answerIndex: 1,
    explanation: "Module nhỏ và mạch lạc dễ tái sử dụng, dễ review và dễ kết hợp với module khác."
  }
];

export const analyticsSummary: AnalyticsSummary = {
  streak: 12,
  weeklyMinutes: 214,
  recallAccuracy: 76,
  entriesThisWeek: 8
};

export const weeklyActivity = [
  { day: "T2", minutes: 24, entries: 1 },
  { day: "T3", minutes: 38, entries: 2 },
  { day: "T4", minutes: 28, entries: 1 },
  { day: "T5", minutes: 52, entries: 2 },
  { day: "T6", minutes: 31, entries: 1 },
  { day: "T7", minutes: 18, entries: 1 },
  { day: "CN", minutes: 23, entries: 0 }
];
