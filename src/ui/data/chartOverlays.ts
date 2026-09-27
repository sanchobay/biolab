// Local Chart.js overlay plugin (ADR-0001 §3): dark-period bands, onset markers, playback cursor, zero line.
import type { Chart, ChartType, Plugin } from 'chart.js';
import type { Theme } from '../theme';

/** Parameter identity colours for the trend lines (DESIGN_SYSTEM §28). */
export type SeriesColor = 'biomass' | 'oxygen' | 'pH';

export interface ChartColors {
  /** The theme these values were read for; charts re-read them when it changes. */
  theme: Theme;
  series: Record<SeriesColor, string>;
  primaryHover: string;
  ink2: string;
  line: string;
  lineStrong: string;
  critical: string;
  surface: string;
  nightBand: string;
  sans: string;
  mono: string;
}

export interface OverlayOptions {
  bands: { from: number; to: number }[];
  markers: { hours: number; label: string }[];
  cursorHours: number | null;
  zeroLine: boolean;
  negativeCaption: string | null;
  /** Localized label of the shaded dark-period band. */
  darkLabel: string;
  colors: ChartColors;
}

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    biolabOverlays?: Partial<OverlayOptions>;
  }
}

/** Reads the DESIGN_SYSTEM token variables for the active theme; the values are never duplicated in code. */
export function readChartColors(theme: Theme): ChartColors {
  const style = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
  const read = (name: string) => style?.getPropertyValue(`--bl-${name}`).trim() ?? '';
  return {
    theme,
    series: { biomass: read('accent-biomass'), oxygen: read('accent-oxygen'), pH: read('accent-ph') },
    primaryHover: read('primary-hover'),
    ink2: read('ink-2'),
    line: read('line'),
    lineStrong: read('line-strong'),
    critical: read('critical'),
    surface: read('surface'),
    nightBand: read('night-band'),
    sans: read('font-sans'),
    mono: read('font-mono'),
  };
}

const LABEL_GAP = 8;
const LABEL_ROW_HEIGHT = 14;

/**
 * Row index for each marker label (in drawing order), so labels whose horizontal extents overlap never print on top of
 * each other, for example two stresses that both begin at 00:00. A label takes the first row whose last label has ended.
 */
export function layoutMarkerLabels(labels: { x: number; width: number }[]): number[] {
  const rowEnds: number[] = [];
  return labels.map(({ x, width }) => {
    let row = rowEnds.findIndex((end) => x >= end + LABEL_GAP);
    if (row === -1) row = rowEnds.length;
    rowEnds[row] = x + width;
    return row;
  });
}

function area(chart: Chart) {
  const { chartArea, scales } = chart;
  return chartArea && scales.x && scales.y ? { chartArea, x: scales.x, y: scales.y } : null;
}

export const overlayPlugin: Plugin<'line', Partial<OverlayOptions>> = {
  id: 'biolabOverlays',
  beforeDatasetsDraw(chart, _args, options) {
    const geometry = area(chart);
    const colors = options.colors;
    if (!geometry || !colors) return;
    const { chartArea, x, y } = geometry;
    const { ctx } = chart;
    ctx.save();
    ctx.font = `11px ${colors.sans}`;
    for (const band of options.bands ?? []) {
      const left = x.getPixelForValue(band.from);
      const right = x.getPixelForValue(band.to);
      ctx.fillStyle = colors.nightBand;
      ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);
      ctx.fillStyle = colors.ink2;
      ctx.textBaseline = 'top';
      ctx.fillText(options.darkLabel ?? '', left + 6, chartArea.top + 4);
    }
    if (options.zeroLine) {
      const zero = y.getPixelForValue(0);
      ctx.strokeStyle = colors.lineStrong;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, zero);
      ctx.lineTo(chartArea.right, zero);
      ctx.stroke();
      if (options.negativeCaption) {
        ctx.fillStyle = colors.ink2;
        ctx.textBaseline = 'bottom';
        ctx.fillText(options.negativeCaption, chartArea.left + 4, chartArea.bottom - 2);
      }
    }
    ctx.restore();
  },
  afterDatasetsDraw(chart, _args, options) {
    const geometry = area(chart);
    const colors = options.colors;
    if (!geometry || !colors) return;
    const { chartArea, x } = geometry;
    const { ctx } = chart;
    ctx.save();
    ctx.font = `11px ${colors.sans}`;
    ctx.textBaseline = 'top';
    const markers = (options.markers ?? []).map((marker) => {
      const at = x.getPixelForValue(marker.hours);
      const width = ctx.measureText(marker.label).width;
      return { at, label: marker.label, x: Math.min(at + 4, chartArea.right - width - 2), width };
    });
    const rows = layoutMarkerLabels(markers);
    markers.forEach((marker, index) => {
      ctx.strokeStyle = colors.critical;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(marker.at, chartArea.top);
      ctx.lineTo(marker.at, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      // Labels sit below the "Dark period" band label, one row per collision.
      ctx.fillStyle = colors.critical;
      ctx.fillText(marker.label, marker.x, chartArea.top + 18 + rows[index] * LABEL_ROW_HEIGHT);
    });
    if (options.cursorHours !== null && options.cursorHours !== undefined) {
      const at = x.getPixelForValue(options.cursorHours);
      ctx.strokeStyle = colors.primaryHover;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(at, chartArea.top);
      ctx.lineTo(at, chartArea.bottom);
      ctx.stroke();
    }
    ctx.restore();
  },
};
