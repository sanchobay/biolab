import { ArrowRight, Bot, ChevronRight, Clapperboard, Clock3, Droplet, FlaskConical, Heart, Leaf, Bubbles, MessageCircleQuestion, Sun, Thermometer, Wind } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { formatLight, formatStartingPH, formatTemperature } from '../../presentation/format';
import { BASELINE_INPUT } from '../../simulation';
import { STAGES } from '../navigation';
import { Species } from '../Species';
import { KnowledgeCheck } from './KnowledgeCheck';
import { ResponseDiagrams } from './ResponseDiagrams';

interface LearnViewProps {
  onOpenExperiment: () => void;
  onJump: (target: string) => void;
}

const ICON = { 'aria-hidden': true, size: 16, strokeWidth: 2 } as const;

function Section({ id, title, tag, children }: { id: string; title: ReactNode; tag?: string; children: ReactNode }) {
  return (
    <section id={id} tabIndex={-1} aria-labelledby={`${id}-heading`} className="reading-section">
      <h3 id={`${id}-heading`}>
        {title}
        {tag && <span className="scope-tag">{tag}</span>}
      </h3>
      {children}
    </section>
  );
}

function OpenExperiment({ onClick }: { onClick: () => void }) {
  const { m } = useI18n();
  return (
    <button type="button" onClick={onClick} className="text-action">
      {m.common.openExperiment}
      <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
    </button>
  );
}

/** Tutor preview: example questions only. Activating one says plainly that tutoring is not available yet (PRD-0003 §8). */
function TutorPreview() {
  const { m } = useI18n();
  const l = m.learn;
  const [asked, setAsked] = useState(false);
  return (
    <>
      <p className="reading-lead">{l.tutorLead}</p>
      <ul className="tutor-examples">
        {l.tutorExamples.map((question) => (
          <li key={question}>
            <button type="button" onClick={() => setAsked(true)} className="tutor-example">
              <MessageCircleQuestion {...ICON} />
              {question}
            </button>
          </li>
        ))}
      </ul>
      <div role="status" className="preview-notice" data-visible={asked || undefined}>
        {asked && (
          <>
            <strong>
              <Bot {...ICON} />
              {l.tutorNoticeTitle}
            </strong>
            <span>{l.tutorNotice}</span>
          </>
        )}
      </div>
    </>
  );
}

/**
 * Learn: methodology, theory, protocol, knowledge check and the two roadmap previews, as one reading page with an
 * in-page contents list. It sits beside the workspace; the experiment keeps running while it is open.
 */
export function LearnView({ onOpenExperiment, onJump }: LearnViewProps) {
  const { m } = useI18n();
  const l = m.learn;
  const c = m.controls;
  const r = m.results;

  const contents = [
    { id: 'learn-methodology', label: l.methodologyTitle },
    { id: 'learn-theory', label: l.theoryTitle },
    { id: 'learn-protocol', label: l.protocolTitle },
    { id: 'learn-knowledge', label: l.knowledgeTitle },
    { id: 'learn-videos', label: l.videosTitle },
    { id: 'learn-tutor', label: l.tutorTitle },
  ];

  const independent = [
    { icon: <Thermometer {...ICON} />, accent: 'var(--bl-accent-temperature)', name: c.temperature },
    { icon: <Droplet {...ICON} />, accent: 'var(--bl-accent-ph)', name: c.startingPH },
    { icon: <Sun {...ICON} />, accent: 'var(--bl-accent-light)', name: c.lightIntensity },
    { icon: <Clock3 {...ICON} />, accent: 'var(--bl-accent-light)', name: c.cycle },
    { icon: <Wind {...ICON} />, accent: 'var(--bl-accent-aeration)', name: c.aeration },
  ];
  const outcomes = [
    { icon: <Leaf {...ICON} />, accent: 'var(--bl-accent-biomass)', name: r.biomass },
    { icon: <Bubbles {...ICON} />, accent: 'var(--bl-accent-oxygen)', name: r.netO2 },
    { icon: <Droplet {...ICON} />, accent: 'var(--bl-accent-ph)', name: r.pH },
    { icon: <Heart {...ICON} />, accent: 'var(--bl-ink-2)', name: r.health },
  ];
  // The approved baseline, read from the parameter source (PRD-0001 §12.9).
  const baseline = [
    { name: c.temperature, value: formatTemperature(BASELINE_INPUT.temperatureC) },
    { name: c.startingPH, value: formatStartingPH(BASELINE_INPUT.startingPH) },
    { name: c.lightIntensity, value: `${formatLight(BASELINE_INPUT.lightIntensity)} µmol photons m⁻² s⁻¹` },
    { name: c.cycle, value: c.cycleValue(BASELINE_INPUT.lightHours) },
    { name: c.aeration, value: m.aeration[BASELINE_INPUT.aeration] },
  ];

  return (
    <main id="learn-view" className="reading-view">
      <div className="reading-layout">
        <nav aria-label={l.contents} className="reading-toc">
          <p>{l.contents}</p>
          <ul>
            {contents.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onJump(id);
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="reading-content">
          <header className="reading-header">
            <h2 id="learn-title" tabIndex={-1}>
              {l.title}
            </h2>
            <p className="reading-lead">{l.lead}</p>
          </header>

          <Section id="learn-methodology" title={l.methodologyTitle}>
            <p className="reading-lead">{l.methodologyLead}</p>
            <ol className="method-steps">
              {STAGES.map(({ stage }, index) => (
                <li key={stage}>
                  <span aria-hidden="true" className="methodology-index">
                    {index + 1}
                  </span>
                  <div>
                    <strong>{m.methodology[stage]}</strong>
                    <p>{l.steps[index].text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <h4>{l.resultsTitle}</h4>
            <p className="reading-note">{l.resultsLead}</p>
            <ol className="results-flow">
              {l.resultsSteps.map((step, index) => (
                <li key={step.name}>
                  {index > 0 && <ChevronRight aria-hidden="true" size={16} strokeWidth={2} className="results-flow-arrow" />}
                  <div>
                    <strong>{step.name}</strong>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="learn-theory" title={l.theoryTitle}>
            <p className="reading-lead">{l.theoryLead}</p>
            <div className="theory-list">
              {l.theory.map((topic) => (
                <article key={topic.title} className="theory-topic">
                  <h4>
                    <Species text={topic.title} />
                  </h4>
                  {topic.body.map((paragraph) => (
                    <p key={paragraph}>
                      <Species text={paragraph} />
                    </p>
                  ))}
                  <p className="theory-link">
                    <FlaskConical aria-hidden="true" size={14} strokeWidth={2} />
                    <span>
                      <strong>{l.inExperiment}: </strong>
                      <Species text={topic.experiment} />
                    </span>
                  </p>
                </article>
              ))}
            </div>
            <h4>{l.diagramsTitle}</h4>
            <ResponseDiagrams />
            <p className="reading-note">{l.diagramsCaption}</p>
          </Section>

          <Section id="learn-protocol" title={l.protocolTitle}>
            <dl className="protocol-facts">
              <div>
                <dt>{l.objectiveTitle}</dt>
                <dd>
                  <Species text={l.objective} />
                </dd>
              </div>
              <div>
                <dt>{l.hypothesisTitle}</dt>
                <dd>{l.hypothesis}</dd>
              </div>
            </dl>
            <h4>{l.variablesTitle}</h4>
            <div className="protocol-variables">
              <div>
                <p className="reading-note">{l.independentTitle}</p>
                <ul className="variable-list">
                  {independent.map(({ icon, accent, name }) => (
                    <li key={name} style={{ '--accent': accent } as CSSProperties}>
                      {icon}
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="reading-note">{l.outcomesTitle}</p>
                <ul className="variable-list">
                  {outcomes.map(({ icon, accent, name }) => (
                    <li key={name} style={{ '--accent': accent } as CSSProperties}>
                      {icon}
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <h4>{l.baselineTitle}</h4>
            <p className="reading-note">{l.baselineNote}</p>
            <dl className="baseline-table">
              {baseline.map(({ name, value }) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <h4>{l.procedureTitle}</h4>
            <ol className="procedure">
              {l.procedure.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <OpenExperiment onClick={onOpenExperiment} />
          </Section>

          <Section id="learn-knowledge" title={l.knowledgeTitle}>
            <p className="reading-lead">{l.knowledgeLead}</p>
            <KnowledgeCheck />
          </Section>

          <Section id="learn-videos" title={l.videosTitle} tag={m.common.comingSoon}>
            <p className="reading-lead">{l.videosLead}</p>
            <ul className="video-list">
              {l.videos.map((video) => (
                <li key={video.title}>
                  <Clapperboard aria-hidden="true" size={18} strokeWidth={2} />
                  <span className="video-title">
                    <Species text={video.title} />
                  </span>
                  <span className="video-duration">{video.duration}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="learn-tutor" title={l.tutorTitle} tag={m.common.preview}>
            <TutorPreview />
          </Section>
        </div>
      </div>
    </main>
  );
}
