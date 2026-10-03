import { Info } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../i18n';
import { asSentence, spokenText } from '../../presentation/speech';
import { tutorAnswer, tutorQuestions, type TutorQuestionId, type TutorRun } from '../../presentation/tutor';
import type { SimulationResult } from '../../simulation';
import { ReadAloud } from '../speech/ReadAloud';

interface LabTutorProps {
  /** The run so far, shared with the workspace; null before a run and after Reset. */
  run: TutorRun | null;
  /** The model-computed healthy baseline (PRD-0002 D-10). */
  baseline: SimulationResult | null;
}

/**
 * Lab Tutor (PRD-0006, DESIGN_SYSTEM §31): question chips and one answer at a time, built from the run and the model.
 * No free text, no chat bubbles and no claim beyond the listed questions; the honesty line says how answers are made.
 */
export function LabTutor({ run, baseline }: LabTutorProps) {
  const { m } = useI18n();
  const questions = tutorQuestions(run, m);
  const [selected, setSelected] = useState<TutorQuestionId | null>(null);
  // A contextual answer disappears with its chip, e.g. after Reset; a fixed one re-renders from the current run.
  const active = selected && questions.some((question) => question.id === selected) ? selected : null;
  const answer = active ? tutorAnswer(active, run, baseline, m) : null;

  return (
    <>
      <p className="tutor-honesty">
        <Info aria-hidden="true" size={16} strokeWidth={2} />
        <span>{m.tutor.honesty}</span>
      </p>
      <div role="group" aria-label={m.tutor.questionsLabel} className="tutor-chips">
        {questions.map((question) => (
          <button
            key={question.id}
            type="button"
            aria-pressed={active === question.id}
            onClick={() => setSelected(question.id)}
            className="tutor-chip"
          >
            {question.label}
          </button>
        ))}
      </div>
      <div className="tutor-answer" data-empty={answer ? undefined : true}>
        <div aria-live="polite">
          {answer && (
            <>
              <h4 className="tutor-answer-title">{answer.question}</h4>
              <ul className="tutor-answer-lines">
                {answer.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {answer.provenance && <p className="tutor-provenance">{answer.provenance}</p>}
            </>
          )}
        </div>
        {answer && (
          <ReadAloud
            id="tutor-answer"
            getText={() => spokenText([answer.question, ...answer.lines, answer.provenance ?? ''].filter(Boolean).map(asSentence).join(' '), m)}
          />
        )}
      </div>
    </>
  );
}
