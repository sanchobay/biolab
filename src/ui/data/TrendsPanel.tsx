import { Table2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { buildSeries, darkBands, hourlyValues, onsetMarkers, pHWindow, revealSeries, type ChartMetric } from '../../presentation/chartData';
import { formatBiomass, formatNetO2, formatPH } from '../../presentation/format';
import { useI18n, type Messages } from '../../i18n';
import type { SimulationInput, SimulationResult } from '../../simulation';
import type { Theme } from '../theme';
import { FINAL_STEP, type Phase } from '../workspaceReducer';
import type { SeriesColor } from './chartOverlays';
import { MetricChart } from './MetricChart';

interface Trend {
  metric: ChartMetric;
  tab: string;
  title: string;
  unit: string;
  unitCaption?: string;
  color: SeriesColor;
  yStep: number;
  format: (value: number) => string;
}

// Fixed axes per metric (PRD-0002 D-11); the pH window is set per run from the starting pH. Labels come from the locale.
function trends(m: Messages): readonly Trend[] {
  const t = m.trends;
  return [
    { metric: 'biomass', tab: t.tabBiomass, title: t.biomassTitle, unit: t.biomassUnit, color: 'biomass', yStep: 0.2, format: formatBiomass },
    { metric: 'netO2Rate', tab: t.tabOxygen, title: t.o2Title, unit: t.o2Unit, unitCaption: t.o2Caption, color: 'oxygen', yStep: 0.5, format: formatNetO2 },
    { metric: 'pH', tab: t.tabPH, title: t.pHTitle, unit: t.pHUnit, color: 'pH', yStep: 0.2, format: formatPH },
  ];
}

interface TrendsPanelProps {
  phase: Phase;
  config: SimulationInput;
  result: SimulationResult | null;
  step: number;
  theme: Theme;
}

/** "Trends over time": one chart with Biomass / Oxygen / pH tabs, sampled from the precomputed result (PRD-0002 §6). */
export function TrendsPanel({ phase, config, result, step, theme }: TrendsPanelProps) {
  const { m } = useI18n();
  const TRENDS = trends(m);
  const [selected, setSelected] = useState(0);
  const [showValues, setShowValues] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const live = result !== null && phase !== 'ready' ? result : null;
  const completed = phase === 'completed';
  const trend = TRENDS[selected];

  const series = useMemo(
    () =>
      result
        ? { biomass: buildSeries(result.samples, 'biomass'), netO2Rate: buildSeries(result.samples, 'netO2Rate'), pH: buildSeries(result.samples, 'pH') }
        : null,
    [result],
  );

  const points = !live || !series ? [] : completed ? series[trend.metric] : revealSeries(series[trend.metric], live.samples, trend.metric, step);
  const axis = trend.metric === 'pH' ? pHWindow(live ? live.input.startingPH : config.startingPH) : trend.metric === 'biomass' ? { min: 0.8, max: 1.8 } : { min: -0.5, max: 1.5 };
  const oxygen = trend.metric === 'netO2Rate';
  const overlays = {
    bands: darkBands(live ? live.input.lightHours : config.lightHours),
    markers: live ? onsetMarkers(live.runRecord, completed ? FINAL_STEP : step, m) : [],
    cursorHours: phase === 'running' && live ? live.samples[step].tHours : null,
    zeroLine: oxygen,
    negativeCaption: oxygen ? m.trends.negativeCaption : null,
    darkLabel: m.trends.darkBand,
  };

  const select = (index: number) => {
    setSelected(index);
    tabs.current[index]?.focus();
  };

  // Shares the chart-title row (ExecPlan 0004); a flex row, so longer languages wrap instead of overlapping.
  const showValuesButton = (
    <button
      type="button"
      onClick={() => setShowValues((value) => !value)}
      disabled={!completed}
      aria-pressed={showValues && completed}
      aria-controls="trend-panel"
      title={completed ? undefined : m.trends.valuesUnavailable}
      className="values-toggle"
    >
      <Table2 aria-hidden="true" size={16} strokeWidth={2} />
      {m.trends.showValues}
    </button>
  );

  return (
    <section aria-labelledby="trends-title" className="panel trends-panel">
      <header className="trends-head">
        <h2 id="trends-title" className="panel-title">
          {m.trends.title}
        </h2>
        <div role="tablist" aria-label={m.trends.metricGroup} className="trend-tabs">
          {TRENDS.map((item, index) => (
            <button
              key={item.metric}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`trend-tab-${item.metric}`}
              aria-selected={index === selected}
              aria-controls="trend-panel"
              tabIndex={index === selected ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                const last = TRENDS.length - 1;
                const next =
                  event.key === 'ArrowRight' ? (index + 1) % TRENDS.length : event.key === 'ArrowLeft' ? (index + last) % TRENDS.length : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
                if (next !== null) {
                  event.preventDefault();
                  select(next);
                }
              }}
              className="trend-tab"
            >
              {item.tab}
            </button>
          ))}
        </div>
      </header>
      <div className="trend-body">
        <div role="tabpanel" id="trend-panel" aria-labelledby={`trend-tab-${trend.metric}`} tabIndex={0} className="trend-panel">
          <MetricChart
            title={trend.title}
            action={showValuesButton}
            unit={trend.unit}
            unitCaption={trend.unitCaption}
            points={points}
            yMin={axis.min}
            yMax={axis.max}
            yStep={trend.yStep}
            tickDecimals={1}
            format={trend.format}
            overlays={overlays}
            completed={completed}
            hourly={live && completed ? hourlyValues(live.samples, trend.metric) : null}
            showValues={showValues}
            color={trend.color}
            theme={theme}
          />
        </div>
      </div>
    </section>
  );
}
