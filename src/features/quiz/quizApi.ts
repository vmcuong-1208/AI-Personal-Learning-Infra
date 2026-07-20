import { apiRequest } from "../../lib/apiClient";

export type QuizSource = "week" | "month" | "topic";
export type QuizDifficulty = "Easy" | "Medium" | "Hard";
export type QuizStatus = "pending" | "processing" | "completed" | "failed";

export type PracticeQuestion = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type Quiz = {
  id: string;
  title: string;
  sourceType: QuizSource;
  topic: string;
  questionCount: number;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  createdAt: string;
  updatedAt?: string;
  questions: PracticeQuestion[];
};

export type CreateQuizPayload = {
  sourceType: QuizSource;
  topic: string;
  questionCount: number;
  difficulty: QuizDifficulty;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
};

type BackendQuestion = {
  id?: string;
  questionId?: string;
  question_id?: string;
  topic?: string;
  prompt?: string;
  question?: string;
  options?: unknown;
  answerIndex?: number;
  answer_index?: number;
  correctAnswer?: number;
  correct_answer?: number;
  explanation?: string;
};

type BackendQuiz = {
  id?: string;
  quizId?: string;
  quiz_id?: string;
  title?: string;
  sourceType?: string;
  source_type?: string;
  topic?: string;
  questionCount?: number;
  question_count?: number;
  difficulty?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  questions?: BackendQuestion[];
};

type BackendAttempt = {
  id?: string;
  attemptId?: string;
  attempt_id?: string;
  quizId?: string;
  quiz_id?: string;
  score?: number;
  totalQuestions?: number;
  total_questions?: number;
  submittedAt?: string;
  submitted_at?: string;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function readOptions(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readStatus(value: unknown): QuizStatus {
  if (value === "pending" || value === "processing" || value === "completed" || value === "failed") return value;
  return "pending";
}

function readSource(value: unknown): QuizSource {
  if (value === "week" || value === "month" || value === "topic") return value;
  if (value === "weekly") return "week";
  if (value === "monthly") return "month";
  return "topic";
}

function readDifficulty(value: unknown): QuizDifficulty {
  const text = readString(value, "Medium").toLowerCase();
  if (text === "easy") return "Easy";
  if (text === "hard") return "Hard";
  return "Medium";
}

function normalizeQuestion(question: BackendQuestion, index: number): PracticeQuestion {
  return {
    id: readString(question.id ?? question.questionId ?? question.question_id, `question-${index + 1}`),
    topic: readString(question.topic, "General"),
    prompt: readString(question.prompt ?? question.question, "Câu hỏi chưa có nội dung."),
    options: readOptions(question.options),
    answerIndex: readNumber(question.answerIndex ?? question.answer_index ?? question.correctAnswer ?? question.correct_answer),
    explanation: readString(question.explanation, "Chưa có giải thích cho câu hỏi này.")
  };
}

function normalizeQuiz(quiz: BackendQuiz): Quiz {
  const id = readString(quiz.id ?? quiz.quizId ?? quiz.quiz_id);
  const sourceType = readSource(quiz.sourceType ?? quiz.source_type);
  const difficulty = readDifficulty(quiz.difficulty);
  const topic = readString(quiz.topic, "General");
  const questions = Array.isArray(quiz.questions)
    ? quiz.questions.map(normalizeQuestion).filter((question) => question.options.length > 0)
    : [];

  return {
    id,
    title: readString(quiz.title, `Quiz ${topic}`),
    sourceType,
    topic,
    questionCount: readNumber(quiz.questionCount ?? quiz.question_count, questions.length || 5),
    difficulty,
    status: readStatus(quiz.status),
    createdAt: readString(quiz.createdAt ?? quiz.created_at),
    updatedAt: readString(quiz.updatedAt ?? quiz.updated_at) || undefined,
    questions
  };
}

function normalizeAttempt(attempt: BackendAttempt): QuizAttempt {
  return {
    id: readString(attempt.id ?? attempt.attemptId ?? attempt.attempt_id),
    quizId: readString(attempt.quizId ?? attempt.quiz_id),
    score: readNumber(attempt.score),
    totalQuestions: readNumber(attempt.totalQuestions ?? attempt.total_questions),
    submittedAt: readString(attempt.submittedAt ?? attempt.submitted_at)
  };
}

export function createQuiz(payload: CreateQuizPayload) {
  return apiRequest<BackendQuiz>("/quiz", {
    method: "POST",
    body: JSON.stringify({
      source_type: payload.sourceType,
      sourceType: payload.sourceType,
      topic: payload.topic,
      question_count: payload.questionCount,
      questionCount: payload.questionCount,
      difficulty: payload.difficulty.toLowerCase()
    })
  }).then(normalizeQuiz);
}

export function getQuizById(id: string) {
  return apiRequest<BackendQuiz>(`/quiz/${encodeURIComponent(id)}`).then(normalizeQuiz);
}

export function submitQuizAttempt(quizId: string, answers: number[]) {
  return apiRequest<BackendAttempt>(`/quiz/${encodeURIComponent(quizId)}/attempts`, {
    method: "POST",
    body: JSON.stringify({ answers })
  }).then(normalizeAttempt);
}
