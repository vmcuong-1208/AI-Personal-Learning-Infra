import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();

vi.mock("../../src/lib/apiClient", () => ({
  apiRequest: apiRequestMock
}));

describe("quiz API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates a quiz job with the backend contract", async () => {
    apiRequestMock.mockResolvedValue({ quiz_id: "quiz-1", status: "pending" });
    const { createQuiz } = await import("../../src/features/quiz/quizApi");

    await createQuiz({
      sourceType: "topic",
      topic: "Security",
      questionCount: 5,
      difficulty: "Hard"
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/quiz", {
      method: "POST",
      body: JSON.stringify({
        source_type: "topic",
        sourceType: "topic",
        topic: "Security",
        question_count: 5,
        questionCount: 5,
        difficulty: "hard"
      })
    });
  });

  it("normalizes generated quiz questions", async () => {
    apiRequestMock.mockResolvedValue({
      quizId: "quiz-2",
      sourceType: "week",
      topic: "AWS",
      questionCount: 1,
      difficulty: "medium",
      status: "completed",
      questions: [
        {
          topic: "AWS",
          prompt: "What should be checked first?",
          options: ["IAM policy", "Theme color"],
          answer_index: 0,
          explanation: "Permissions decide access."
        }
      ]
    });
    const { getQuizById } = await import("../../src/features/quiz/quizApi");

    await expect(getQuizById("quiz-2")).resolves.toEqual(expect.objectContaining({
      id: "quiz-2",
      status: "completed",
      difficulty: "Medium",
      questions: [
        expect.objectContaining({
          answerIndex: 0,
          options: ["IAM policy", "Theme color"]
        })
      ]
    }));
  });

  it("submits quiz attempts as ordered answer indexes", async () => {
    apiRequestMock.mockResolvedValue({ attemptId: "att-1", quizId: "quiz-2", score: 1, totalQuestions: 1 });
    const { submitQuizAttempt } = await import("../../src/features/quiz/quizApi");

    await expect(submitQuizAttempt("quiz-2", [0])).resolves.toEqual(expect.objectContaining({
      id: "att-1",
      score: 1,
      totalQuestions: 1
    }));
    expect(apiRequestMock).toHaveBeenCalledWith("/quiz/quiz-2/attempts", {
      method: "POST",
      body: JSON.stringify({ answers: [0] })
    });
  });
});
