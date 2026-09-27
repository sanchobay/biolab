import { CircleCheck, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../i18n';

/** Index of the correct option for each question; the option order is the same in every language. */
const ANSWERS = [1, 1, 0] as const;

/**
 * Three single-answer questions with immediate feedback (PRD-0003 §7). Native radio inputs give keyboard and
 * screen-reader support; each question's feedback is a polite live region. Nothing is scored or stored.
 */
export function KnowledgeCheck() {
  const { m } = useI18n();
  const l = m.learn;
  const [chosen, setChosen] = useState<(number | null)[]>(() => ANSWERS.map(() => null));

  return (
    <ol className="quiz">
      {l.questions.map((question, q) => {
        const answer = chosen[q];
        const correct = answer === ANSWERS[q];
        return (
          <li key={q}>
            <fieldset className="quiz-question">
              <legend>
                <span aria-hidden="true" className="quiz-number">
                  {q + 1}
                </span>
                {question.prompt}
              </legend>
              <div className="quiz-options">
                {question.options.map((option, o) => (
                  <label key={o} className="quiz-option" data-state={answer === o ? (correct ? 'correct' : 'wrong') : undefined}>
                    <input
                      type="radio"
                      name={`quiz-${q}`}
                      checked={answer === o}
                      onChange={() => setChosen((previous) => previous.map((value, index) => (index === q ? o : value)))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <div role="status" className="quiz-feedback" data-state={answer === null ? undefined : correct ? 'correct' : 'wrong'}>
                {answer !== null && (
                  <>
                    <strong>
                      {correct ? <CircleCheck aria-hidden="true" size={16} strokeWidth={2} /> : <RotateCcw aria-hidden="true" size={16} strokeWidth={2} />}
                      {correct ? l.correct : l.tryAgain}
                    </strong>
                    <span>{question.explanation}</span>
                  </>
                )}
              </div>
            </fieldset>
          </li>
        );
      })}
    </ol>
  );
}
