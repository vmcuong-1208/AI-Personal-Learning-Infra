import { describe, expect, it } from "vitest";
import { quizQuestions } from "../../src/data/mock/mockData";
import { calculateAccuracy, isCorrectAnswer, nextQuestionIndex } from "../../src/lib/quiz";

describe("quiz helpers", () => {
  it("checks correct answers", () => {
    const question = quizQuestions[0];

    expect(isCorrectAnswer(question, question.answerIndex)).toBe(true);
    expect(isCorrectAnswer(question, (question.answerIndex + 1) % question.options.length)).toBe(false);
  });

  it("wraps to the first question", () => {
    expect(nextQuestionIndex(quizQuestions.length - 1, quizQuestions.length)).toBe(0);
  });

  it("calculates rounded accuracy", () => {
    expect(calculateAccuracy(2, 3)).toBe(67);
    expect(calculateAccuracy(0, 0)).toBe(0);
  });
});
