import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, History, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Chip, Input, PageHeader, ProgressBar } from "../../components/ui";
import { createQuiz, getQuizAttempts, getQuizById, getQuizzes, submitQuizAttempt, type PracticeQuestion, type Quiz, type QuizAttempt, type QuizDifficulty, type QuizSource, type QuizStatus } from "./quizApi";

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
  day: "Nhật ký ngày đã chọn",
  week: "Nhật ký tuần này",
  month: "Nhật ký tháng này",
  topic: "Chủ đề cụ thể"
};

const topicOptions = ["AWS", "VPC", "IAM", "CloudWatch", "NAT Gateway", "VPN", "Networking", "Security", "Monitoring", "DevOps", "AI", "Programming", "custom"];
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;


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

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

function resolveQuizRange(source: QuizSource, sourceDate: string, topicFrom: string, topicTo: string) {
  if (source === "topic") return { startDate: topicFrom || undefined, endDate: topicTo || undefined };
  if (!sourceDate) return {};
  if (source === "day") return { startDate: sourceDate, endDate: sourceDate };
  if (source === "week") {
    const start = parseWeekInput(sourceDate);
    return start ? { startDate: toDateInputValue(start), endDate: toDateInputValue(addDays(start, 6)) } : {};
  }
  const start = new Date(`${sourceDate}-01T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
}





function getStatusLabel(status: QuizStatus) {
  if (status === "completed") return "Hoàn thành";
  if (status === "failed") return "Thất bại";
  if (status === "processing") return "Đang xử lý";
  return "Đang chờ";
}

function getHistoryStatus(quiz: Quiz, attempt?: QuizAttempt): QuizHistoryItem["status"] {
  if (attempt) return "Completed";
  if (quiz.status === "failed") return "Failed";
  return "Pending";
}

function buildHistoryItem(quiz: Quiz, attempt?: QuizAttempt): QuizHistoryItem {
  return {
    id: quiz.id,
    title: quiz.title,
    createdAt: quiz.createdAt,
    source: sourceLabels[quiz.sourceType] ?? quiz.topic,
    difficulty: quiz.difficulty,
    score: attempt ? `${attempt.score}/${attempt.totalQuestions || quiz.questions.length || quiz.questionCount}` : "--",
    status: getHistoryStatus(quiz, attempt)
  };
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
  const [customTopic, setCustomTopic] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionCount * 60);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [historyItems, setHistoryItems] = useState<QuizHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>("pending");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptScore, setAttemptScore] = useState<number | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<Record<string, QuizAttempt>>({});
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const pollTimerRef = useRef<number | null>(null);

  const source: QuizSource = sourceMode === "topic" ? "topic" : cycle;
  const selectedTopic = topic === "custom" ? customTopic.trim() : topic;
  const selectedHistory = historyItems.find((item) => item.id === selectedHistoryId) ?? historyItems[0];
  const selectedAttempt = selectedHistoryId ? attemptDetails[selectedHistoryId] : undefined;
  const questions = activeQuiz?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? questions[0];
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const localCorrectCount = questions.filter((question) => answers[question.id] === question.answerIndex).length;
  const correctCount = attemptScore ?? localCorrectCount;
  const wrongCount = submitted ? questions.length - correctCount : 0;
  const completion = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);

  const startQuiz = useCallback((quiz: Quiz) => {
    if (quiz.questions.length === 0) {
      setError("Khong co cau hoi nao trong quiz nay.");
      return;
    }
    setActiveQuiz(quiz);
    setAnswers({});
    setSubmitted(false);
    setAttemptScore(null);
    setStarted(true);
    setCurrentIndex(0);
    setTimeLeft(Math.max(quiz.questions.length, 1) * 60);
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
      ...buildHistoryItem(quiz),
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

        if (nextQuiz.status === "completed" && nextQuiz.questions.length === 0) {
          setIsGenerating(false);
          setError("Không tìm thấy nhật ký phù hợp để tạo quiz. Hãy đổi khoảng thời gian, chủ đề hoặc thẻ rồi thử lại.");
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

  const loadQuizHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError("");
    try {
      const quizzes = await getQuizzes();
      const attemptsByQuiz: Record<string, QuizAttempt> = {};
      const items = await Promise.all(quizzes.map(async (quiz) => {
        try {
          const attempts = await getQuizAttempts(quiz.id);
          const latestAttempt = attempts[0];
          if (latestAttempt) attemptsByQuiz[quiz.id] = latestAttempt;
          return buildHistoryItem(quiz, latestAttempt);
        } catch {
          return buildHistoryItem(quiz);
        }
      }));

      setAttemptDetails((current) => ({ ...current, ...attemptsByQuiz }));
      setHistoryItems(items);
      setSelectedHistoryId((current) => items.some((item) => item.id === current) ? current : items[0]?.id ?? "");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không tải được lịch sử quiz từ backend.");
      setHistoryItems([]);
      setSelectedHistoryId("");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadQuizHistory();
  }, [loadQuizHistory]);

  useEffect(() => {
    if (!banner || isGenerating) return;
    const timeout = window.setTimeout(() => setBanner(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [banner, isGenerating]);

  useEffect(() => {
    if (!selectedHistoryId || attemptDetails[selectedHistoryId]) return;
    let ignore = false;
    getQuizAttempts(selectedHistoryId)
      .then((attempts) => {
        const latestAttempt = attempts[0];
        if (!ignore && latestAttempt) setAttemptDetails((current) => ({ ...current, [selectedHistoryId]: latestAttempt }));
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [attemptDetails, selectedHistoryId]);

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
      const quizRange = resolveQuizRange(source, sourceDate, topicFrom, topicTo);
      const createdQuiz = await createQuiz({
        sourceType: source,
        topic: source === "topic" ? selectedTopic || "General" : sourceLabels[source],
        questionCount,
        difficulty,
        ...quizRange
      });
      upsertHistory(createdQuiz);
      if (createdQuiz.status === "completed" && createdQuiz.questions.length > 0) {
        setIsGenerating(false);
        setBanner("Quiz AI đã sẵn sàng. Bạn có thể bắt đầu làm bài.");
        startQuiz(createdQuiz);
        return;
      }
      if (createdQuiz.status === "completed" && createdQuiz.questions.length === 0) {
        setIsGenerating(false);
        setError("Không tìm thấy nhật ký phù hợp để tạo quiz. Hãy đổi khoảng thời gian, chủ đề hoặc thẻ rồi thử lại.");
        return;
      }
      pollQuiz(createdQuiz.id);
    } catch (nextError) {
      setIsGenerating(false);
      setError(nextError instanceof Error ? nextError.message : "Khong tao duoc quiz AI.");
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
      const orderedAnswers = activeQuiz.questions.map((question) => answers[question.id] ?? -1);
      const attempt = await submitQuizAttempt(activeQuiz.id, orderedAnswers);
      setAttemptScore(attempt.score);
      setAttemptDetails((current) => ({ ...current, [activeQuiz.id]: attempt }));
      upsertHistory(activeQuiz, "Completed", `${attempt.score}/${attempt.totalQuestions || activeQuiz.questions.length}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Khong nop duoc bai quiz len backend.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openHistoryReview() {
    if (!selectedHistory || !selectedAttempt || selectedAttempt.answers.length === 0) return;
    const reviewQuestions = selectedAttempt.answers.map(({ userAnswer, isCorrect, ...question }) => question);
    setActiveQuiz({
      id: selectedHistory.id,
      title: selectedHistory.title,
      sourceType: "topic",
      topic: selectedHistory.source,
      questionCount: reviewQuestions.length,
      difficulty: selectedHistory.difficulty,
      status: "completed",
      createdAt: selectedHistory.createdAt,
      questions: reviewQuestions
    });
    setAnswers(Object.fromEntries(selectedAttempt.answers.map((question) => [question.id, question.userAnswer])));
    setAttemptScore(selectedAttempt.score);
    setSubmitted(true);
    setStarted(true);
    setCurrentIndex(0);
    setTimeLeft(0);
    setBanner("");
    setError("");
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
                      {topicOptions.map((item) => <option key={item} value={item}>{item === "custom" ? "Nhập chủ đề / thẻ khác" : item}</option>)}
                    </select>
                  </div>
                  {topic === "custom" && (
                    <div className="form-field">
                      <label htmlFor="quiz-custom-topic">Chủ đề / thẻ tự nhập</label>
                      <Input id="quiz-custom-topic" value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} placeholder="Ví dụ: serverless" />
                    </div>
                  )}
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
              {isLoadingHistory && (
                <div className="search-empty">
                  <History size={30} />
                  <p>Đang tải lịch sử quiz...</p>
                </div>
              )}
              {!isLoadingHistory && historyError && (
                <div className="settings-message settings-message-error" role="alert">{historyError}</div>
              )}
              {!isLoadingHistory && !historyError && historyItems.length === 0 && (
                <div className="search-empty">
                  <History size={30} />
                  <p>Chưa có lịch sử quiz. Tạo quiz mới để xem lại kết quả ở đây.</p>
                </div>
              )}
              {historyItems.map((item) => (
                <button className={`quiz-history-item${selectedHistoryId === item.id ? " is-selected" : ""}`} key={item.id} type="button" onClick={() => setSelectedHistoryId(item.id)}>
                  <span>{item.title}</span>
                  <small>{formatDateTime(item.createdAt)} - {item.source}</small>
                  <div className="journal-card-actions">
                    <Chip tone={item.status === "Completed" ? "success" : "neutral"}>{item.status}</Chip>
                    <strong>{item.score}</strong>
                  </div>
                </button>
              ))}
            </div>
            <div className="quiz-history-detail">
              {selectedHistory ? (
                <>
                  <h3>{selectedHistory.title}</h3>
                  <p>Độ khó: {selectedHistory.difficulty}. Trạng thái: {selectedHistory.status}.</p>
                  <div className="page-actions">
                    <Button variant="ghost" size="sm" icon={<RefreshCw size={15} />} onClick={() => activeQuiz && pollQuiz(activeQuiz.id)} disabled={!activeQuiz || isGenerating}>Kiểm tra lại</Button>
                    <Button variant="secondary" size="sm" onClick={openHistoryReview} disabled={!selectedAttempt || selectedAttempt.answers.length === 0}>Xem lại chi tiết</Button>
                  </div>
                  {selectedAttempt && selectedAttempt.answers.length > 0 && (
                    <div className="quiz-history-review">
                      {selectedAttempt.answers.slice(0, 3).map((question, index) => (
                        <p key={question.id}><strong>Câu {index + 1}:</strong> {question.isCorrect ? "Đúng" : "Sai"} - {question.prompt}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p>Chọn một quiz trong lịch sử để xem lại chi tiết.</p>
              )}
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
              <div className={`quiz-explanation${answers[currentQuestion.id] === currentQuestion.answerIndex ? " is-correct" : " is-wrong"}`}>
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
                    className={`quiz-number-button${currentIndex === index ? " is-current" : ""}${answered ? " is-answered" : ""}${submitted && answered && answers[question.id] === question.answerIndex ? " is-correct" : ""}${submitted && answered && answers[question.id] !== question.answerIndex ? " is-wrong" : ""}`}
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