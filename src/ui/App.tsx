import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { I18nProvider } from '../i18n/I18nProvider';
import {
  announcement,
  currentExplanation,
  errorExplanation,
  introExplanation,
  outcomeExplanation,
  runRecordView,
} from '../presentation/explanation';
import { BASELINE_INPUT, simulate, type SimulationInput, type SimulationResult } from '../simulation';
import { AboutView } from './about/AboutView';
import { Announcer } from './Announcer';
import { CultureChamber } from './chamber/CultureChamber';
import { ControlsPanel } from './controls/ControlsPanel';
import { LiveDataPanel } from './data/LiveDataPanel';
import { ExplanationPanel } from './explanation/ExplanationPanel';
import { RunRecord } from './explanation/RunRecord';
import { Header } from './Header';
import { LearnView } from './learn/LearnView';
import { MethodologyBar } from './MethodologyBar';
import { arriveAt, type Destination, type Stage, type View } from './navigation';
import { applyTheme, type Theme } from './theme';
import { usePlayback } from './usePlayback';
import { initialWorkspace, workspaceReducer } from './workspaceReducer';

/** The whole 24-hour result is computed before playback starts (ADR-0002 §9). Any failure becomes the error state. */
function runSimulation(input: SimulationInput): SimulationResult | null {
  try {
    const outcome = simulate(input);
    return outcome.ok ? outcome.result : null;
  } catch {
    return null;
  }
}

const LEARN_STAGE: Record<string, Stage> = { 'learn-theory': 'theory', 'learn-protocol': 'protocol' };

function Laboratory() {
  const { m } = useI18n();
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspace);
  // Healthy baseline for the Effect comparison, computed once by the model (PRD-0002 D-10).
  const [baseline] = useState(() => runSimulation(BASELINE_INPUT));
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  // Views are App state above the run state, so switching views never interrupts a run (ADR-0003 §5).
  const [view, setView] = useState<View>('experiment');
  const [learnStage, setLearnStage] = useState<Stage>('theory');
  const [arrival, setArrival] = useState(0);
  const pendingTarget = useRef<string | null>(null);
  usePlayback(state.phase === 'running', dispatch);

  const { config, phase, result, step, runError, resetNotice } = state;
  const live = result !== null && phase !== 'ready' ? result : null;

  const handleRun = useCallback(() => {
    const computed = runSimulation(config);
    dispatch(computed ? { type: 'runStarted', result: computed } : { type: 'runFailed' });
  }, [config]);
  const handleReset = useCallback(() => dispatch({ type: 'reset' }), []);
  const handleConfigure = useCallback((patch: Partial<SimulationInput>) => dispatch({ type: 'configure', patch }), []);
  // The attribute is set before the re-render, so charts read the new theme's colours in the same update.
  const handleTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setTheme(next);
  }, []);

  // Show the destination's view, then move focus there once it has rendered.
  const navigate = useCallback((destination: Destination) => {
    pendingTarget.current = destination.target;
    setView(destination.view);
    if (LEARN_STAGE[destination.target]) setLearnStage(LEARN_STAGE[destination.target]);
    setArrival((count) => count + 1);
  }, []);

  useEffect(() => {
    const target = pendingTarget.current;
    pendingTarget.current = null;
    if (target) arriveAt(target);
  }, [arrival]);

  const explanation = runError
    ? errorExplanation(m)
    : !live
      ? introExplanation(m)
      : phase === 'completed'
        ? outcomeExplanation(live, baseline, m)
        : currentExplanation(live, step, m);
  const record = runRecordView(live, phase === 'completed', step, m);
  const spoken = announcement(phase, runError, live, step, resetNotice, m);
  const stage: Stage | null = view === 'learn' ? learnStage : view === 'experiment' ? (phase === 'completed' ? 'results' : 'experiment') : null;
  const openExperiment = () => navigate({ view: 'experiment', target: 'experiment-controls' });

  return (
    <div className="app-shell">
      <a
        href="#experiment-controls"
        onClick={(event) => {
          event.preventDefault();
          openExperiment();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        {m.common.skipToControls}
      </a>
      <Header theme={theme} onThemeChange={handleTheme} view={view} onNavigate={navigate} />
      <MethodologyBar current={stage} onNavigate={navigate} />
      {!noticeDismissed && (
        <div className="narrow-notice lg:hidden">
          <span>{m.common.narrowNotice}</span>
          <button type="button" onClick={() => setNoticeDismissed(true)} className="rounded-control px-2 py-1 font-medium text-ink hover:bg-surface-3">
            {m.common.dismiss}
          </button>
        </div>
      )}
      {view === 'experiment' && (
        <main id="workspace" className="workspace">
          <ControlsPanel config={config} phase={phase} onChange={handleConfigure} onRun={handleRun} onReset={handleReset} />
          <CultureChamber phase={phase} runError={runError} config={config} sample={live ? live.samples[step] : null} />
          <LiveDataPanel phase={phase} config={config} result={result} step={step} theme={theme} />
          <ExplanationPanel view={explanation} />
          <RunRecord {...record} />
        </main>
      )}
      {view === 'learn' && <LearnView onOpenExperiment={openExperiment} onJump={(target) => navigate({ view: 'learn', target })} />}
      {view === 'about' && <AboutView onOpenExperiment={openExperiment} />}
      <Announcer polite={spoken.polite} assertive={spoken.assertive} />
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <Laboratory />
    </I18nProvider>
  );
}
