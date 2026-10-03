import { Chart as ChartJS, LinearScale, LineController, LineElement, PointElement, Tooltip, type ChartData, type ChartOptions } from 'chart.js';
import { Component, useMemo, type ReactNode } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartPoint } from '../../presentation/chartData';
import { useI18n } from '../../i18n';
import { formatClock } from '../../presentation/format';
import { scaledFontSize, usePreferences } from '../preferences';
import type { Theme } from '../theme';
import { overlayPlugin, readChartColors, type OverlayOptions, type SeriesColor } from './chartOverlays';
import { ValuesTable } from './ValuesTable';

// Only the Chart.js parts BioLab needs (ADR-0001 §1).
ChartJS.register(LineController, LineElement, PointElement, LinearScale, Tooltip, overlayPlugin);

class ChartBoundary extends Component<{ children: ReactNode; message: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <p className="p-2 text-meta text-ink-2">{this.props.message}</p>
    ) : (
      this.props.children
    );
  }
}

/** Point markers every 4 simulated hours, on the model's own samples (no smoothing or added values). */
const onFourHourMark = (hours: number) => Math.abs(hours / 4 - Math.round(hours / 4)) < 1e-9;

interface MetricChartProps {
  title: string;
  /** A control that shares the title row, e.g. Show values; the row wraps instead of overlapping (ExecPlan 0005). */
  action?: ReactNode;
  unit: string;
  /** Shown after the title when the unit is not already part of it. */
  unitCaption?: string;
  points: ChartPoint[];
  yMin: number;
  yMax: number;
  yStep: number;
  tickDecimals: number;
  format: (value: number) => string;
  overlays: Omit<OverlayOptions, 'colors'>;
  completed: boolean;
  hourly: { hours: number; value: number }[] | null;
  showValues: boolean;
  color: SeriesColor;
  theme: Theme;
}

/** One trend chart with fixed axes (PRD-0002 §6, D-11) and an hourly values table (D-17). */
export function MetricChart({ title, action, unit, unitCaption, points, yMin, yMax, yStep, tickDecimals, format, overlays, completed, hourly, showValues, color, theme }: MetricChartProps) {
  const { m } = useI18n();
  const { textSize } = usePreferences().preferences;
  const colors = useMemo(() => readChartColors(theme), [theme]);
  const valuesVisible = showValues && completed && hourly !== null;
  const lineColor = colors.series[color];

  const data: ChartData<'line'> = {
    datasets: [
      {
        data: points,
        borderColor: lineColor,
        borderWidth: 2,
        pointRadius: (context) => {
          const raw = context.raw as ChartPoint | undefined;
          return raw && onFourHourMark(raw.x) ? 3 : 0;
        },
        pointBackgroundColor: lineColor,
        pointBorderColor: colors.surface,
        pointBorderWidth: 1.5,
        pointHoverRadius: completed ? 4 : 0,
        pointHitRadius: 6,
        tension: 0,
      },
    ],
  };

  // Canvas text does not follow the root font size; tick labels and the axis title scale with Text size (PRD-0005 §2).
  const tickFont = { family: colors.mono, size: scaledFontSize(11, textSize) };
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    normalized: true,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    layout: { padding: { top: 4, right: 8 } },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 24,
        ticks: { stepSize: 4, color: colors.ink2, font: tickFont },
        grid: { color: colors.line },
        border: { color: colors.lineStrong },
        title: { display: true, text: m.trends.timeAxis, color: colors.ink2, font: { family: colors.sans, size: scaledFontSize(12, textSize) } },
      },
      y: {
        min: yMin,
        max: yMax,
        ticks: { stepSize: yStep, color: colors.ink2, font: tickFont, callback: (value) => Number(value).toFixed(tickDecimals) },
        grid: { color: colors.line },
        border: { color: colors.lineStrong },
      },
    },
    plugins: {
      tooltip: {
        enabled: completed,
        callbacks: {
          title: (items) => formatClock(items[0]?.parsed.x ?? 0),
          label: (item) => `${format(item.parsed.y ?? 0)} ${unit}`,
        },
      },
      biolabOverlays: { ...overlays, colors },
    },
  };

  const values = points.map((point) => point.y);
  const summary =
    completed && values.length > 0
      ? m.trends.summary(title, format(values[values.length - 1]), format(Math.min(...values)), format(Math.max(...values)), unit)
      : m.trends.updating(title);

  return (
    <div role="group" aria-labelledby="metric-chart-title" className="metric-chart">
      <div className="chart-head">
        <p id="metric-chart-title" className="chart-title">
        {title}
          {unitCaption && <span className="font-normal text-ink-2"> ({unitCaption})</span>}
        </p>
        {action}
      </div>
      <div className="chart-canvas">
        {valuesVisible && hourly ? (
          <ValuesTable caption={m.trends.tableCaption(title)} unit={unit} rows={hourly} format={format} timeLabel={m.trends.time} />
        ) : (
          <ChartBoundary message={m.trends.chartUnavailable}>
            <Line data={data} options={options} updateMode="none" role="img" aria-label={summary} />
          </ChartBoundary>
        )}
      </div>
    </div>
  );
}
