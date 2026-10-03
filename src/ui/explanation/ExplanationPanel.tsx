import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import type { ExplanationSection, ExplanationView } from '../../presentation/explanation';
import { TONE_TEXT } from '../../presentation/labels';
import { explanationSpeech } from '../../presentation/speech';
import { ModelAssumptions } from '../chamber/ModelAssumptions';
import { prefersReducedMotion } from '../preferences';
import { ReadAloud } from '../speech/ReadAloud';
import { StateIcon } from '../StateIcon';
import { OrganismCard } from './OrganismCard';

function SectionBody({ lines }: { lines: string[] }) {
  if (lines.length === 1) return <p>{lines[0]}</p>;
  return (
    <ul>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function Section({ section }: { section: ExplanationSection }) {
  return (
    <div className="guide-section">
      <h4>{section.label}</h4>
      <SectionBody lines={section.lines} />
    </div>
  );
}

interface ScrollState {
  overflowing: boolean;
  atEnd: boolean;
}

/** Tracks whether the explanation region hides content, so it can offer a cue and join the tab order only then (ExecPlan 0004 F3, F5). */
function useScrollState() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollState>({ overflowing: false, atEnd: true });

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const overflowing = element.scrollHeight > element.clientHeight + 1;
    const atEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 4;
    setState((previous) => (previous.overflowing === overflowing && previous.atEnd === atEnd ? previous : { overflowing, atEnd }));
  }, []);

  // A ResizeObserver reports once when observation starts, then on every size change of the region or its content.
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  return { ref, state, measure };
}

/**
 * "What's happening in the culture?": what happened, why, effect on the model and parameter to reconsider (PRD-0002 §7),
 * flowing in balanced columns beside the organism note.
 */
export function ExplanationPanel({ view, onAskTutor }: { view: ExplanationView; onAskTutor?: () => void }) {
  const { m } = useI18n();
  const { ref, state, measure } = useScrollState();
  const titleColor = view.tone === 'neutral' ? 'text-ink' : TONE_TEXT[view.tone];
  const iconColor = view.tone === 'neutral' ? 'text-primary-ink' : TONE_TEXT[view.tone];
  const hiddenBelow = state.overflowing && !state.atEnd;

  const scrollOn = () => {
    const element = ref.current;
    if (!element) return;
    const reduced = prefersReducedMotion();
    element.scrollBy({ top: element.clientHeight * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section id="culture-guide" tabIndex={-1} aria-labelledby="guide-title" className="panel area-explanation">
      <header className="guide-head">
        <h2 id="guide-title" className="panel-title">
          {m.explanation.panelTitle}
        </h2>
        <div className="head-actions">
          <ReadAloud id="explanation" getText={() => explanationSpeech(view, m)} />
          {onAskTutor && (
            <button type="button" onClick={onAskTutor} className="ghost-button">
              <MessageCircleQuestion aria-hidden="true" size={16} strokeWidth={2} />
              {m.tutor.ask}
            </button>
          )}
          <ModelAssumptions />
        </div>
      </header>
      <div className="guide-frame" data-more={hiddenBelow || undefined}>
        <div
          ref={ref}
          role="group"
          aria-labelledby="guide-title"
          tabIndex={state.overflowing ? 0 : undefined}
          onScroll={measure}
          className="guide-body"
        >
          <div className="guide-grid">
            <div className="guide-main">
              <div data-testid="explanation" className="guide-explanation">
                <div className="guide-title-row">
                  <StateIcon name={view.icon} size={20} className={`shrink-0 ${iconColor}`} />
                  <h3 id="explanation-title" className={`guide-view-title ${titleColor}`}>
                    {view.title}
                  </h3>
                  {view.scope && <span className="scope-tag">{view.scope}</span>}
                </div>
                <div className="guide-sections">
                  {view.sections.map((section) => (
                    <Section key={section.label} section={section} />
                  ))}
                  {view.blocks.map((block) => (
                    <Section key={block.label} section={block} />
                  ))}
                </div>
              </div>
              {/* Sticky at the bottom of the visible region, inside the explanation column only. */}
              {hiddenBelow && (
                <button type="button" onClick={scrollOn} className="more-below">
                  {m.explanation.moreBelow}
                  <ChevronDown aria-hidden="true" size={14} strokeWidth={2.25} />
                </button>
              )}
            </div>
            <OrganismCard />
          </div>
        </div>
      </div>
    </section>
  );
}
