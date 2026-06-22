import type { QuizQuestion } from "../data/mock/types";

export function isCorrectAnswer(question: QuizQuestion, selectedIndex: number) {
  return question.answerIndex === selectedIndex;
}

export function nextQuestionIndex(currentIndex: number, total: number) {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}

export function calculateAccuracy(correct: number, answered: number) {
  if (answered <= 0) return 0;
  return Math.round((correct / answered) * 100);
}
