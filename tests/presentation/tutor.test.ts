// T1–T8 (ExecPlan 0010, PRD-0006 as amended 2026-10-01): Lab Tutor questions and answers, built only from the run,
// PARAMETERS and the model-computed healthy baseline.
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../src/i18n';
import { tutorAnswer, tutorQuestions, type TutorQuestionId, type TutorRun } from '../../src/presentation/tutor';
import { BASELINE_INPUT, simulate, type SimulationInput, type SimulationResult } from '../../src/simulation';

const { en, ru, kk } = MESSAGES;

function simulateWith(patch: Partial<SimulationInput> = {}): SimulationResult {
  const outcome = simulate({ ...BASELINE_INPUT, ...patch });
  if (!outcome.ok) throw new Error('run failed');
  return outcome.result;
}

const completed = (result: SimulationResult): TutorRun => ({ result, step: result.samples.length - 1, completed: true });
const running = (result: SimulationResult, step: number): TutorRun => ({ result, step, completed: false });

const baseline = simulateWith();
const hot = simulateWith({ temperatureC: 45 });
const ids = (run: TutorRun | null, m = en) => tutorQuestions(run, m).map((q) => q.id);
const label = (run: TutorRun | null, id: TutorQuestionId, m = en) => tutorQuestions(run, m).find((q) => q.id === id)?.label;
const answer = (id: TutorQuestionId, run: TutorRun | null, m = en) => tutorAnswer(id, run, baseline, m);
const text = (id: TutorQuestionId, run: TutorRun | null, m = en) => answer(id, run, m).lines.join(' ');

describe('T1 chips', () => {
  it('shows only the four fixed questions before a run', () => {
    expect(tutorQuestions(null, en)).toEqual([
      { id: 'F1', label: 'Why did my biomass decrease?' },
      { id: 'F2', label: 'Why did pH increase?' },
      { id: 'F3', label: 'What parameter should I investigate next?' },
      { id: 'F4', label: 'Explain photoinhibition simply.' },
    ]);
  });

  it('adds failure, health and net O₂ questions that the run supports', () => {
    expect(ids(completed(hot))).toEqual(['F1', 'F2', 'F3', 'F4', 'C1', 'C2', 'C3L']);
    expect(label(completed(hot), 'C1')).toBe('Why did heat stress happen?');
    expect(label(completed(hot), 'C2')).toBe('Why is culture health stressed?');
    expect(label(completed(hot), 'C3L')).toBe('Why is net O₂ negative even in the light?');

    expect(ids(completed(baseline))).toEqual(['F1', 'F2', 'F3', 'F4', 'C3']);
    expect(label(completed(baseline), 'C3')).toBe('Why is net O₂ negative in the dark?');
  });

  it('asks "even in the light" only when light intensity is above zero', () => {
    const noLight = completed(simulateWith({ lightIntensity: 0 }));
    expect(ids(noLight)).toContain('C3');
    expect(ids(noLight)).not.toContain('C3L');
  });

  it('follows the run so far while it plays', () => {
    const early = running(hot, 30);
    expect(ids(early)).toContain('C1');
    expect(ids(early)).toContain('C3L');
    expect(ids(early)).not.toContain('C2');
  });

  it('words the contextual questions without case or gender agreement in Russian and Kazakh', () => {
    expect(label(completed(hot), 'C1', ru)).toBe('Тепловой стресс: почему это произошло?');
    expect(label(completed(hot), 'C1', kk)).toBe('Жылу күйзелісі: неліктен болды?');
    expect(label(completed(hot), 'C2', ru)).toBe('Почему состояние культуры — «Стресс»?');
  });
});

describe('T2 before a run', () => {
  it('asks for a run where the answer needs one, as a real answer', () => {
    for (const id of ['F1', 'F2', 'C1', 'C2', 'C3', 'C3L'] as const) {
      const a = answer(id, null);
      expect(a.lines).toEqual(['Run the experiment first — I answer from your run.']);
      expect(a.provenance).toBeNull();
    }
  });

  it('suggests the healthy baseline and explains photoinhibition with the model numbers', () => {
    const next = text('F3', null);
    expect(next).toContain('32.0 °C');
    expect(next).toContain('pH 9.0');
    expect(next).toContain('300 µmol photons m⁻² s⁻¹');
    const photo = text('F4', null);
    expect(photo).toContain('300');
    expect(photo).toContain('800');
    expect(photo).toMatch(/30 °C.*35 °C/);
  });
});

describe('T3 why did my biomass decrease', () => {
  it('states the change, the healthy baseline and the main cause in the model', () => {
    const a = answer('F1', completed(hot));
    expect(a.question).toBe('Why did my biomass decrease?');
    expect(a.lines[0]).toBe('Relative biomass went from 1.00 to 0.94 × initial by 24:00, so it decreased.');
    const all = a.lines.join(' ');
    expect(all).toContain('The healthy baseline reached 1.31 × initial.');
    expect(all).toContain('Heat stress');
    expect(all).toContain('occurred during this run — first at 00:00');
    expect(all).toContain("at or above this model's heat-stress boundary of 40 °C");
  });

  it('starts by saying so when biomass did not decrease', () => {
    const a = answer('F1', completed(baseline));
    expect(a.lines[0]).toBe('Biomass did not decrease: it went from 1.00 to 1.31 × initial by 24:00.');
    expect(a.lines.join(' ')).not.toContain('healthy baseline reached');
  });

  it('uses the agreed Russian and Kazakh wording', () => {
    const russian = text('F1', completed(hot), ru);
    expect(russian).toContain('с 1.00 до 0.94 от исходной');
    expect(russian).not.toContain('0.94 ×');
    expect(russian).toContain('не ниже границы теплового стресса этой модели (40 °C)');
    expect(text('F1', completed(hot), kk)).toContain('Салыстырмалы биомасса: 1.00 → 0.94');
  });

  it('describes the run so far while it plays', () => {
    expect(answer('F1', running(hot, 30)).lines[0]).toContain('by 00:30');
  });
});

describe('T4 why did pH increase', () => {
  it('starts by saying so when pH did not increase, then gives the mechanism', () => {
    const a = answer('F2', completed(hot));
    expect(a.lines[0]).toBe('pH did not increase: it went from 9.0 to 8.95 by 24:00.');
    expect(a.lines.length).toBeGreaterThanOrEqual(2);
  });

  it('confirms an increase in the healthy baseline', () => {
    expect(answer('F2', completed(baseline)).lines[0]).toBe('Simulated pH went from 9.0 to 9.24 by 24:00, so it increased.');
  });

  it('adds the model pH boundaries when a pH stress or suboptimal pH occurred', () => {
    const lowPH = text('F2', completed(simulateWith({ startingPH: 7 })));
    expect(lowPH).toContain('8.5');
    expect(lowPH).toContain('9.5');
    expect(lowPH).toContain('7.0');
    expect(lowPH).toContain('10.5');
  });
});

describe('T5 what to investigate next', () => {
  it('uses the primary failure "Try next" text', () => {
    expect(text('F3', completed(hot))).toContain(en.explanation.tryNext.thermal(30, 35));
  });

  it('suggests one change at a time for a healthy run, with values from the control ranges', () => {
    const next = text('F3', completed(baseline));
    expect(next).toContain('one condition at a time');
    expect(next).toContain('2,200');
    expect(next).toContain('45.0 °C');
  });
});

describe('T6 photoinhibition', () => {
  it('places the run light setting relative to the zone', () => {
    expect(text('F4', completed(hot))).toContain("300 µmol photons m⁻² s⁻¹ is below this model's photoinhibition zone (800).");
    expect(text('F4', completed(simulateWith({ lightIntensity: 2200 })))).toContain("well above this model's photoinhibition boundary of 800");
  });
});

describe('T7 contextual answers', () => {
  it('C1 names the failure, its onset and what to try next', () => {
    const c1 = text('C1', completed(hot));
    expect(c1).toContain('Heat stress');
    expect(c1).toContain('00:00');
    expect(c1).toContain(en.explanation.tryNext.thermal(30, 35));
  });

  it('C2 explains the delayed indicator with the model lags', () => {
    const c2 = text('C2', completed(hot));
    expect(c2).toContain('Stressed');
    expect(c2).toContain('steady');
    expect(c2).toContain('2 h');
    expect(c2).toContain('6 h');
    expect(c2).toContain('delayed');
  });

  it('C3′ gives the lowest value and when net O₂ first went negative in the light', () => {
    const c3 = text('C3L', completed(hot));
    expect(c3).toContain('−0.14');
    expect(c3).toContain('14:00');
    expect(c3).toContain('00:00');
  });

  it('C3 says darkness is normal', () => {
    expect(text('C3', completed(baseline))).toMatch(/normal/);
  });
});

describe('T8 every answer with a run', () => {
  it('restates the question, keeps 2–5 lines, cites the run and never claims damage or AI', () => {
    for (const m of [en, ru, kk]) {
      for (const run of [completed(hot), completed(baseline)]) {
        for (const question of tutorQuestions(run, m)) {
          const a = tutorAnswer(question.id, run, baseline, m);
          expect(a.question).toBe(question.label);
          expect(a.lines.length).toBeGreaterThanOrEqual(2);
          expect(a.lines.length).toBeLessThanOrEqual(5);
          expect(a.provenance).not.toBeNull();
          if (m === en) expect([...a.lines, a.provenance].join(' ')).not.toMatch(/damaged|\bAI\b/i);
        }
      }
    }
    expect(answer('F1', completed(hot)).provenance).toBe(
      'Based on your run at 24:00: 45.0 °C, pH 9.0, 300 µmol photons m⁻² s⁻¹, 14 h light : 10 h dark, Adequate.',
    );
  });
});
