import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, Chip, PageHeader, ProgressBar } from "../../components/ui";
import { quizQuestions } from "../../data/mock/mockData";
import { calculateAccuracy, isCorrectAnswer, nextQuestionIndex } from "../../lib/quiz";

export function QuizPage() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const question = quizQuestions[index];
  const accuracy = useMemo(() => calculateAccuracy(correct, answered), [correct, answered]);

  function choose(optionIndex: number) {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnswered((value) => value + 1);
    if (isCorrectAnswer(question, optionIndex)) setCorrect((value) => value + 1);
  }

  function next() {
    setIndex((value) => nextQuestionIndex(value, quizQuestions.length));
    setSelected(null);
  }

  return (
    <>
      <PageHeader eyebrow="Recall" title="Knowledge quiz" description="Practice the concepts most likely to decay without review." />
      <div className="quiz-grid">
        <Card>
          <div className="section-heading">
            <Chip tone="ai">{question.topic}</Chip>
            <h2>{question.prompt}</h2>
          </div>
          <div className="stack">
            {question.options.map((option, optionIndex) => {
              const chosen = selected === optionIndex;
              const correctOption = selected !== null && question.answerIndex === optionIndex;
              const wrongOption = chosen && !correctOption;
              return (
                <button
                  className={`answer-option${chosen ? " is-selected" : ""}${correctOption ? " is-correct" : ""}${wrongOption ? " is-wrong" : ""}`}
                  key={option}
                  onClick={() => choose(optionIndex)}
                >
                  <strong>{String.fromCharCode(65 + optionIndex)}.</strong>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <Card style={{ marginTop: 16 }}>
              <strong>{isCorrectAnswer(question, selected) ? "Correct" : "Review this"}</strong>
              <p>{question.explanation}</p>
              <Button onClick={next} icon={<ArrowRight size={17} />}>Next Question</Button>
            </Card>
          )}
        </Card>
        <aside className="stack">
          <Card>
            <div className="section-heading">
              <h2>Session</h2>
              <p>Progress through today's recall queue.</p>
            </div>
            <ProgressBar value={((index + 1) / quizQuestions.length) * 100} />
            <p><strong>{index + 1}</strong> of {quizQuestions.length} questions</p>
          </Card>
          <Card>
            <span className="mono-label">ACCURACY</span>
            <h2>{accuracy}%</h2>
            <p>{correct} correct from {answered} answered.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
