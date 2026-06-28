import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, History, Sparkles, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader, ProgressBar } from "../../components/ui";

type QuizSource = "week" | "month" | "topic";
type QuizDifficulty = "Easy" | "Medium" | "Hard";
type QuizStatus = "Completed" | "Failed";

type PracticeQuestion = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type QuizHistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  source: string;
  difficulty: QuizDifficulty;
  score: string;
  status: QuizStatus;
};

const sourceLabels: Record<QuizSource, string> = {
  week: "Nhật ký tuần này",
  month: "Nhật ký tháng này",
  topic: "Chủ đề cụ thể"
};

const topicOptions = ["Networking", "Security", "Monitoring", "DevOps", "AI", "Programming"];

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

const historyItems: QuizHistoryItem[] = [
  {
    id: "quiz-2026-06-25",
    title: "Quiz tuần 25 - Networking và Monitoring",
    createdAt: "2026-06-25 20:10",
    source: "Nhật ký tuần này",
    difficulty: "Medium",
    score: "4/5",
    status: "Completed"
  },
  {
    id: "quiz-2026-06-22",
    title: "Quiz IAM role error",
    createdAt: "2026-06-22 08:45",
    source: "Chủ đề Security",
    difficulty: "Hard",
    score: "2/5",
    status: "Completed"
  },
  {
    id: "quiz-2026-06-18",
    title: "Quiz tháng 06 - AWS labs",
    createdAt: "2026-06-18 18:30",
    source: "Nhật ký tháng này",
    difficulty: "Easy",
    score: "--",
    status: "Failed"
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

export function QuizPage() {
  const [source, setSource] = useState<QuizSource>("week");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("Medium");
  const [topic, setTopic] = useState("Networking");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionCount * 60);
  const [selectedHistoryId, setSelectedHistoryId] = useState(historyItems[0].id);

  const selectedHistory = historyItems.find((item) => item.id === selectedHistoryId) ?? historyItems[0];
  const questions = useMemo(() => buildQuizQuestions(questionCount), [questionCount]);
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const correctCount = questions.filter((question) => answers[question.id] === question.answerIndex).length;
  const wrongCount = submitted ? questions.length - correctCount : 0;
  const completion = Math.round((answeredCount / questions.length) * 100);

  useEffect(() => {
    if (!started || submitted) return;
    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, submitted, timeLeft]);

  function generateQuiz() {
    setAnswers({});
    setSubmitted(false);
    setStarted(true);
    setCurrentIndex(0);
    setTimeLeft(questionCount * 60);
  }

  function resetToSetup() {
    setStarted(false);
    setSubmitted(false);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(questionCount * 60);
  }

  function selectAnswer(optionIndex: number) {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [currentQuestion.id]: optionIndex }));
  }

  function goToQuestion(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)));
  }

  if (!started) {
    return (
      <>
        <PageHeader
          eyebrow="AI practice room"
          title="Ôn tập / Quiz AI"
          description="AI sẽ tạo câu hỏi ôn tập dựa trên nhật ký học của bạn. Chọn phạm vi và chủ đề để bắt đầu."
        />

        <div className="quiz-setup-layout">
          <Card className="quiz-generator-card">
            <div className="section-heading">
              <span className="mono-label">Tạo bài ôn tập</span>
              <h2>Generate Quiz</h2>
              <p>Chọn nguồn dữ liệu, số lượng câu hỏi và độ khó. Sau khi tạo, bạn sẽ chuyển sang màn hình làm bài riêng.</p>
            </div>

            <div className="quiz-generator-stack">
              <fieldset className="segmented-field quiz-source-row">
                <legend>Nguồn dữ liệu</legend>
                {(Object.keys(sourceLabels) as QuizSource[]).map((item) => (
                  <label key={item}>
                    <input checked={source === item} name="quiz-source" type="radio" onChange={() => setSource(item)} />
                    <span>{sourceLabels[item]}</span>
                  </label>
                ))}
              </fieldset>

              {source === "topic" && (
                <div className="form-field">
                  <label htmlFor="quiz-topic">Chủ đề</label>
                  <select id="quiz-topic" className="input" value={topic} onChange={(event) => setTopic(event.target.value)}>
                    {topicOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
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

            <Button onClick={generateQuiz} icon={<Sparkles size={17} />}>Tạo Quiz</Button>
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
                  <small>{item.createdAt} · {item.source}</small>
                  <div className="journal-card-actions">
                    <Chip tone={item.status === "Completed" ? "success" : "neutral"}>{item.status}</Chip>
                    <strong>{item.score}</strong>
                  </div>
                </button>
              ))}
            </div>
            <div className="quiz-history-detail">
              <span className="mono-label">Chi tiết</span>
              <h3>{selectedHistory.title}</h3>
              <p>Độ khó: {selectedHistory.difficulty}. Trạng thái: {selectedHistory.status}.</p>
              <Button variant="ghost" size="sm">Xem chi tiết</Button>
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
                  <label className={`answer-option${selected ? " is-selected" : ""}${correctOption ? " is-correct" : ""}${wrongOption ? " is-wrong" : ""}`} key={option}>
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
              <ProgressBar value={(timeLeft / (questionCount * 60)) * 100} label="Thời gian làm quiz còn lại" />
              <p>{answeredCount}/{questions.length} câu đã trả lời</p>
            </div>

            <div className="quiz-submit-row">
              <Button onClick={() => setSubmitted(true)} disabled={submitted}>{answeredCount === questions.length ? "Nộp bài" : "Nộp bài ngay"}</Button>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
