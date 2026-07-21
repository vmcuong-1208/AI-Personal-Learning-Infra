import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, History, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Chip, Input, PageHeader, ProgressBar } from "../../components/ui";
import { ApiClientError } from "../../lib/apiClient";
import { createQuiz, getQuizById, submitQuizAttempt, type PracticeQuestion, type Quiz, type QuizDifficulty, type QuizSource, type QuizStatus } from "./quizApi";

type QuizHistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  source: string;
  difficulty: QuizDifficulty;
  score: string;
  status: "Completed" | "Failed" | "Pending";
};

const sourceLabels: Record<QuizSource, string> = {
  week: "Nhật ký tuần này",
  month: "Nhật ký tháng này",
  topic: "Chủ đề cụ thể"
};

const topicOptions = ["AWS", "VPC", "IAM", "CloudWatch", "Networking", "Security", "Monitoring", "DevOps", "AI", "Programming"];
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

const questionBank: PracticeQuestion[] = [
  {
    id: "nat-gateway-error",
    topic: "Networking",
    prompt: "Trong lab NAT Gateway, lỗi chính bạn gặp là gì?",
    options: [
      "Route table chưa trỏ subnet private qua NAT Gateway",
      "Security group mở quá nhiều port inbound",
      "IAM role thiếu quyền ghi CloudWatch Logs",
      "VPN tunnel bị lệch thuật toán mã hóa"
    ],
    answerIndex: 0,
    explanation: "Nhật ký tập trung vào việc kiểm tra route table và kết nối NAT Gateway cho subnet private."
  },
  {
    id: "cloudwatch-alarm",
    topic: "Monitoring",
    prompt: "Khi theo dõi CloudWatch Alarm, bước nào giúp xác nhận alarm đang đọc đúng metric?",
    options: [
      "Đổi tên alarm để dễ nhận diện",
      "Kiểm tra namespace, dimension và khoảng thời gian thống kê",
      "Tăng số instance để tạo thêm dữ liệu",
      "Xóa alarm rồi tạo lại bằng tên khác"
    ],
    answerIndex: 1,
    explanation: "Metric sai namespace hoặc dimension thường khiến alarm không phản ánh đúng trạng thái hệ thống."
  },
  {
    id: "iam-role-error",
    topic: "Security",
    prompt: "Với lỗi IAM role, tín hiệu nào nên kiểm tra trước?",
    options: [
      "Màu giao diện AWS Console",
      "Policy attached, trust relationship và resource ARN",
      "Tên VPC đang dùng trong cùng region",
      "Số lượng tag trên EC2 instance"
    ],
    answerIndex: 1,
    explanation: "IAM thường lỗi ở quyền được gắn, quan hệ tin cậy hoặc ARN tài nguyên không khớp."
  },
  {
    id: "redis-retry",
    topic: "DevOps",
    prompt: "Trong ghi chú retry queue, retry khác idempotency ở điểm nào?",
    options: [
      "Retry là thử lại tác vụ, idempotency là đảm bảo thử lại không gây side effect sai",
      "Retry chỉ dùng cho frontend, idempotency chỉ dùng cho database",
      "Retry luôn thay thế được dead-letter queue",
      "Idempotency là cách tăng tốc Redis Stream"
    ],
    answerIndex: 0,
    explanation: "Retry quyết định có thử lại hay không; idempotency bảo vệ tính an toàn khi thao tác chạy nhiều lần."
  },
  {
    id: "kubernetes-probe",
    topic: "Monitoring",
    prompt: "Probe nào ngăn traffic đi vào pod trước khi pod sẵn sàng?",
    options: ["Liveness probe", "Readiness probe", "Startup probe", "Node probe"],
    answerIndex: 1,
    explanation: "Readiness probe quyết định pod có được đưa vào service endpoints hay không."
  }
];

const initialHistoryItems: QuizHistoryItem[] = [
  {
    id: "quiz-demo-2026",
    title: "Quiz demo - Networking và Monitoring",
    createdAt: "2026-06-25T20:10:00.000Z",
    source: "Nhật ký tuần này",
    difficulty: "Medium",
    score: "4/5",
    status: "Completed"
  }
];

function buildQuizQuestions(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const base = questionBank[index % questionBank.length];
    return {
      ...base,
      id: `${base.id}-${index + 1}`,
      prompt: index < questionBank.length ? base.prompt : `${base.prompt} (biến thể ${Math.floor(index / questionBank.length) + 1})`
    };
  });
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
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

function buildFallbackQuiz(sourceType: QuizSource, topic: string, questionCount: number, difficulty: QuizDifficulty): Quiz {
  const now = new Date().toISOString();
  return {
    id: `quiz-demo-${Date.now()}`,
    title: `Quiz ${sourceType === "topic" ? topic : sourceLabels[sourceType]}`,
    sourceType,
    topic,
    questionCount,
    difficulty,
    status: "completed",
    createdAt: now,
    questions: buildQuizQuestions(questionCount)
  };
}

function getStatusLabel(status: QuizStatus) {
  if (status === "completed") return "Hoàn thành";
  if (status === "failed") return "Thất bại";
  if (status === "processing") return "Đang xử lý";
  return "Đang chờ";
}

export function QuizPage() {
  const [sourceMode, setSourceMode] = useState<"time" | "topic">("time");
  const [cycle, setCycle] = useState<"day" | "week" | "month">("week");
  const [sourceDate, setSourceDate] = useState("");
  const [topicFrom, setTopicFrom] = useState("");
  const [topicTo, setTopicTo] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("Medium");
  const [topic, setTopic] = useState("AWS");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionCount * 60);
  const [selectedHistoryId, setSelectedHistoryId] = useState(initialHistoryItems[0].id);
  const [historyItems, setHistoryItems] = useState<QuizHistoryItem[]>(initialHistoryItems);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>("pending");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptScore, setAttemptScore] = useState<number | null>(null);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const pollTimerRef = useRef<number | null>(null);

  const source: QuizSource = sourceMode === "topic" ? "topic" : cycle === "month" ? "month" : "week";
  const selectedHistory = historyItems.find((item) => item.id === selectedHistoryId) ?? historyItems[0];
  const questions = activeQuiz?.questions ?? buildQuizQuestions(questionCount);
  const currentQuestion = questions[currentIndex] ?? questions[0];
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const localCorrectCount = questions.filter((question) => answers[question.id] === question.answerIndex).length;
  const correctCount = attemptScore ?? localCorrectCount;
  const wrongCount = submitted ? questions.length - correctCount : 0;
  const completion = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);

  const startQuiz = useCallback((quiz: Quiz) => {
    const nextQuestions = quiz.questions.length ? quiz.questions : buildQuizQuestions(quiz.questionCount);
    setActiveQuiz({ ...quiz, questions: nextQuestions });
    setAnswers({});
    setSubmitted(false);
    setAttemptScore(null);
    setStarted(true);
    setCurrentIndex(0);
    setTimeLeft(Math.max(nextQuestions.length, 1) * 60);
    setQuizStatus(quiz.status);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const upsertHistory = useCallback((quiz: Quiz, statusLabel?: QuizHistoryItem["status"], score = "--") => {
    const item: QuizHistoryItem = {
      id: quiz.id,
      title: quiz.title,
      createdAt: quiz.createdAt,
      source: sourceLabels[quiz.sourceType] ?? quiz.topic,
      difficulty: quiz.difficulty,
      score,
      status: statusLabel ?? (quiz.status === "completed" ? "Completed" : quiz.status === "failed" ? "Failed" : "Pending")
    };
    setHistoryItems((current) => [item, ...current.filter((history) => history.id !== quiz.id)]);
    setSelectedHistoryId(quiz.id);
  }, []);

  const pollQuiz = useCallback((quizId: string, attempt = 1) => {
    stopPolling();
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const nextQuiz = await getQuizById(quizId);
        setQuizStatus(nextQuiz.status);
        upsertHistory(nextQuiz);

        if (nextQuiz.status === "completed" && nextQuiz.questions.length > 0) {
          setIsGenerating(false);
          setBanner("Quiz AI đã sẵn sàng. Bạn có thể bắt đầu làm bài.");
          startQuiz(nextQuiz);
          return;
        }

        if (nextQuiz.status === "failed" || attempt >= MAX_POLL_ATTEMPTS) {
          setIsGenerating(false);
          setError("Quiz chưa sẵn sàng. Vui lòng thử lại sau ít phút.");
          return;
        }

        pollQuiz(quizId, attempt + 1);
      } catch (nextError) {
        setIsGenerating(false);
        setError(nextError instanceof Error ? nextError.message : "Không kiểm tra được trạng thái quiz.");
      }
    }, POLL_INTERVAL_MS);
  }, [startQuiz, stopPolling, upsertHistory]);

  useEffect(() => stopPolling, [stopPolling]);

  useEffect(() => {
    if (!started || submitted) return;
    if (timeLeft <= 0) {
      void submitAnswers();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, submitted, timeLeft]);

  async function generateQuiz() {
    setIsGenerating(true);
    setQuizStatus("pending");
    setBanner("Đang tạo bài ôn tập từ nhật ký của bạn.");
    setError("");

    try {
      const createdQuiz = await createQuiz({
        sourceType: source,
        topic: source === "topic" ? topic : sourceLabels[source],
        questionCount,
        difficulty
      });
      upsertHistory(createdQuiz);
      if (createdQuiz.status === "completed" && createdQuiz.questions.length > 0) {
        setIsGenerating(false);
        startQuiz(createdQuiz);
        return;
      }
      pollQuiz(createdQuiz.id);
    } catch (nextError) {
      if (isFallbackAllowed(nextError)) {
        const demoQuiz = buildFallbackQuiz(source, topic, questionCount, difficulty);
        setIsGenerating(false);
        setBanner("Đang mở quiz mẫu vì chưa có đủ dữ liệu cá nhân để tạo quiz mới.");
        upsertHistory(demoQuiz, "Completed");
        startQuiz(demoQuiz);
        return;
      }
      setIsGenerating(false);
      setError(nextError instanceof Error ? nextError.message : "Không tạo được quiz AI.");
    }
  }

  function resetToSetup() {
    stopPolling();
    setStarted(false);
    setSubmitted(false);
    setAnswers({});
    setActiveQuiz(null);
    setAttemptScore(null);
    setCurrentIndex(0);
    setTimeLeft(questionCount * 60);
    setBanner("");
    setError("");
  }

  function selectAnswer(optionIndex: number) {
    if (submitted || !currentQuestion) return;
    setAnswers((current) => ({ ...current, [currentQuestion.id]: optionIndex }));
  }

  function goToQuestion(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)));
  }

  async function submitAnswers() {
    if (submitted || !activeQuiz) {
      setSubmitted(true);
      return;
    }

    setSubmitted(true);
    setIsSubmitting(true);
    setError("");

    try {
      if (!activeQuiz.id.startsWith("quiz-demo-")) {
        const orderedAnswers = activeQuiz.questions.map((question) => answers[question.id] ?? -1);
        const attempt = await submitQuizAttempt(activeQuiz.id, orderedAnswers);
        setAttemptScore(attempt.score);
        upsertHistory(activeQuiz, "Completed", `${attempt.score}/${attempt.totalQuestions || activeQuiz.questions.length}`);
      } else {
        upsertHistory(activeQuiz, "Completed", `${localCorrectCount}/${questions.length}`);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không nộp được bài quiz lên backend. Kết quả tạm tính vẫn hiển thị ở frontend.");
      upsertHistory(activeQuiz, "Completed", `${localCorrectCount}/${questions.length}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!started) {
    return (
      <>
        <PageHeader
          eyebrow="AI practice room"
          title="Ôn tập / Quiz AI"
          description="Tạo câu hỏi ôn tập từ nhật ký theo khoảng thời gian hoặc theo chủ đề bạn muốn luyện lại."
        />

        {banner && <div className="coach-banner" role="status">{banner}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="quiz-setup-layout">
          <Card className="quiz-generator-card">
            <div className="section-heading">
              
              <h2>Tạo quiz ôn tập</h2>
              <p>Chọn nguồn ghi chú, số câu và độ khó để bắt đầu.</p>
            </div>

            <div className="quiz-generator-stack">
              <fieldset className="segmented-field quiz-source-row">
                <legend>Nguồn dữ liệu</legend>
                <label>
                  <input checked={sourceMode === "time"} name="quiz-source-mode" type="radio" onChange={() => setSourceMode("time")} />
                  <span>Theo khoảng thời gian</span>
                </label>
                <label>
                  <input checked={sourceMode === "topic"} name="quiz-source-mode" type="radio" onChange={() => setSourceMode("topic")} />
                  <span>Theo chủ đề</span>
                </label>
              </fieldset>

              {sourceMode === "time" ? (
                <div className="quiz-source-grid">
                  <div className="form-field">
                    <label htmlFor="quiz-cycle">Kiểu chu kỳ</label>
                    <select id="quiz-cycle" className="input" value={cycle} onChange={(event) => setCycle(event.target.value as typeof cycle)}>
                      <option value="day">Ngày</option>
                      <option value="week">Tuần</option>
                      <option value="month">Tháng</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="quiz-source-date">Chọn mốc thời gian</label>
                    <Input id="quiz-source-date" type={cycle === "month" ? "month" : cycle === "week" ? "week" : "date"} value={sourceDate} onChange={(event) => setSourceDate(event.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="quiz-source-grid">
                  <div className="form-field">
                    <label htmlFor="quiz-topic">Chủ đề / thẻ</label>
                    <select id="quiz-topic" className="input" value={topic} onChange={(event) => setTopic(event.target.value)}>
                      {topicOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="quiz-topic-from">Từ ngày</label>
                    <Input id="quiz-topic-from" type="date" value={topicFrom} onChange={(event) => setTopicFrom(event.target.value)} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="quiz-topic-to">Đến ngày</label>
                    <Input id="quiz-topic-to" type="date" value={topicTo} onChange={(event) => setTopicTo(event.target.value)} />
                  </div>
                </div>
              )}

              <div className="form-field">
                <label htmlFor="quiz-count">Bạn muốn thử sức với bao nhiêu câu?</label>
                <select id="quiz-count" className="input" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
                  {Array.from({ length: 20 }, (_, index) => (index + 1) * 5).map((count) => <option key={count} value={count}>{count} câu</option>)}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="quiz-difficulty">Độ khó</label>
                <select id="quiz-difficulty" className="input" value={difficulty} onChange={(event) => setDifficulty(event.target.value as QuizDifficulty)}>
                  {["Easy", "Medium", "Hard"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className="generate-actions">
              <Button onClick={generateQuiz} icon={<Sparkles size={17} />} disabled={isGenerating}>{isGenerating ? "Đang tạo Quiz..." : "Tạo Quiz"}</Button>
              {isGenerating && <p>Quiz đang được chuẩn bị. Bạn có thể chờ trong giây lát.</p>}
            </div>
          </Card>

          <Card>
            <div className="section-heading">
              <History size={18} />
              <h2>Lịch sử quiz</h2>
            </div>
            <div className="quiz-history-list">
              {historyItems.map((item) => (
                <button className={`quiz-history-item${selectedHistoryId === item.id ? " is-selected" : ""}`} key={item.id} type="button" onClick={() => setSelectedHistoryId(item.id)}>
                  <span>{item.title}</span>
                  <small>{formatDateTime(item.createdAt)} · {item.source}</small>
                  <div className="journal-card-actions">
                    <Chip tone={item.status === "Completed" ? "success" : "neutral"}>{item.status}</Chip>
                    <strong>{item.score}</strong>
                  </div>
                </button>
              ))}
            </div>
            <div className="quiz-history-detail">
              
              <h3>{selectedHistory.title}</h3>
              <p>Độ khó: {selectedHistory.difficulty}. Trạng thái: {selectedHistory.status}.</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw size={15} />} onClick={() => activeQuiz && pollQuiz(activeQuiz.id)} disabled={!activeQuiz || isGenerating}>Kiểm tra lại</Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="AI practice room"
        title={submitted ? "Kết quả Quiz AI" : "Bài làm Quiz AI"}
        description={submitted ? "Xem tổng kết đúng/sai và giải thích cho từng câu hỏi." : "Trả lời từng câu, quay lại câu trước hoặc nhảy đến câu bất kỳ bằng bảng điều hướng."}
        action={<Button variant="ghost" onClick={resetToSetup}>Tạo quiz khác</Button>}
      />

      {banner && <div className="coach-banner" role="status">{banner}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="quiz-taking-layout">
        <Card className="quiz-question-panel">
          <div className="quiz-question-nav">
            <Button variant="ghost" onClick={() => goToQuestion(currentIndex - 1)} disabled={currentIndex === 0} icon={<ArrowLeft size={17} />}>Quay lại</Button>
            <strong>Câu {currentIndex + 1}/{questions.length}</strong>
            <Button variant="ghost" onClick={() => goToQuestion(currentIndex + 1)} disabled={currentIndex === questions.length - 1}>Tiếp theo <ArrowRight size={17} /></Button>
          </div>

          <div className="quiz-current-question">
            <Chip tone="primary">{currentQuestion.topic}</Chip>
            <h2>{currentQuestion.prompt}</h2>
            <div className="stack" role="radiogroup" aria-label={`Câu hỏi ${currentIndex + 1}`}>
              {currentQuestion.options.map((option, optionIndex) => {
                const selected = answers[currentQuestion.id] === optionIndex;
                const correctOption = submitted && currentQuestion.answerIndex === optionIndex;
                const wrongOption = submitted && selected && currentQuestion.answerIndex !== optionIndex;
                return (
                  <label className={`answer-option${selected ? " is-selected" : ""}${correctOption ? " is-correct" : ""}${wrongOption ? " is-wrong" : ""}`} key={`${currentQuestion.id}-${optionIndex}`}>
                    <input
                      checked={selected}
                      disabled={submitted}
                      name={currentQuestion.id}
                      type="radio"
                      onChange={() => selectAnswer(optionIndex)}
                    />
                    <strong>{String.fromCharCode(65 + optionIndex)}.</strong>
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {submitted && (
            <div className="quiz-result-panel">
              <div className="section-heading">
                <span className="mono-label">Tổng hợp</span>
                <h2>{correctCount} đúng, {wrongCount} sai</h2>
                <p>{answers[currentQuestion.id] === currentQuestion.answerIndex ? "Bạn đã chọn đúng câu này." : "Câu này cần ôn lại."}</p>
              </div>
              <div className="quiz-explanation">
                {answers[currentQuestion.id] === currentQuestion.answerIndex ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <p>{currentQuestion.explanation}</p>
              </div>
            </div>
          )}
        </Card>

        <aside className="quiz-navigation-panel">
          <Card>
            <div className="section-heading">
              <span className="mono-label">Điều hướng</span>
              <h2>Danh sách câu hỏi</h2>
            </div>
            <div className="quiz-number-grid">
              {questions.map((question, index) => {
                const answered = answers[question.id] !== undefined;
                return (
                  <button
                    className={`quiz-number-button${currentIndex === index ? " is-current" : ""}${answered ? " is-answered" : ""}`}
                    key={question.id}
                    type="button"
                    onClick={() => goToQuestion(index)}
                    aria-label={`Đi tới câu ${index + 1}${answered ? ", đã trả lời" : ", chưa trả lời"}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="quiz-timer-panel">
              <div>
                <Clock3 size={18} />
                <span>Thời gian còn lại</span>
              </div>
              <strong>{formatTime(timeLeft)}</strong>
              <ProgressBar value={(timeLeft / Math.max(questions.length * 60, 1)) * 100} label="Thời gian làm quiz còn lại" />
              <p>{answeredCount}/{questions.length} câu đã trả lời</p>
              <ProgressBar value={completion} label="Tỷ lệ câu đã trả lời" />
            </div>

            <div className="quiz-submit-row">
              <Button onClick={submitAnswers} disabled={submitted || isSubmitting}>{answeredCount === questions.length ? "Nộp bài" : "Nộp bài ngay"}</Button>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}