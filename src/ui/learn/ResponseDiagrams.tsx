import { useI18n } from '../../i18n';
import { PARAMETERS } from '../../simulation';
import { lightFactor, pHFactor, temperatureFactor } from '../../simulation/model';

// Curves come from the model's own factor functions (ADR-0003 §6): each is 1.0 at full photosynthetic capacity.
// Boundary labels sit near the x-axis, where every curve is well above zero at its boundaries.
const W = 240;
const H = 132;
const PLOT = { left: 30, right: 232, top: 14, bottom: 112 };
const SAMPLES = 96;
const { zones, light } = PARAMETERS;

interface Band {
  from: number;
  to: number;
}

interface Mark {
  at: number;
  label: string;
}

interface DiagramProps {
  title: string;
  label: string;
  domain: [number, number];
  ticks: number[];
  tickFormat?: (value: number) => string;
  curve: (x: number) => number;
  accent: string;
  band?: Band & { label: string };
  marks: Mark[];
}

function Diagram({ title, label, domain, ticks, tickFormat = String, curve, accent, band, marks }: DiagramProps) {
  const [x0, x1] = domain;
  const sx = (x: number) => PLOT.left + ((x - x0) / (x1 - x0)) * (PLOT.right - PLOT.left);
  const sy = (y: number) => PLOT.bottom - y * (PLOT.bottom - PLOT.top);
  const path = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / SAMPLES;
    return `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)} ${sy(curve(x)).toFixed(1)}`;
  }).join(' ');

  return (
    <figure className="diagram">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {band && (
          <g>
            <rect x={sx(band.from)} y={PLOT.top} width={sx(band.to) - sx(band.from)} height={PLOT.bottom - PLOT.top} className="diagram-band" />
            <text x={(sx(band.from) + sx(band.to)) / 2} y={PLOT.top - 4} textAnchor="middle" className="diagram-band-label">
              {band.label}
            </text>
          </g>
        )}
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={PLOT.left} x2={PLOT.right} y1={sy(y)} y2={sy(y)} className="diagram-grid" />
            <text x={PLOT.left - 6} y={sy(y) + 3} textAnchor="end" className="diagram-tick">
              {y.toFixed(1)}
            </text>
          </g>
        ))}
        {marks.map((mark, index) => (
          <g key={mark.at}>
            <line x1={sx(mark.at)} x2={sx(mark.at)} y1={PLOT.top} y2={PLOT.bottom} className="diagram-mark" />
            <text
              x={sx(mark.at) + 3}
              y={PLOT.bottom - 6 - index * 12}
              textAnchor={sx(mark.at) > PLOT.right - 60 ? 'end' : 'start'}
              dx={sx(mark.at) > PLOT.right - 60 ? -6 : 0}
              className="diagram-mark-label"
            >
              {mark.label}
            </text>
          </g>
        ))}
        <path d={path} fill="none" style={{ stroke: accent }} strokeWidth={2} strokeLinejoin="round" />
        {ticks.map((tick) => (
          <text key={tick} x={sx(tick)} y={PLOT.bottom + 14} textAnchor="middle" className="diagram-tick">
            {tickFormat(tick)}
          </text>
        ))}
      </svg>
      <figcaption>{title}</figcaption>
    </figure>
  );
}

/** Temperature, light and pH responses of photosynthesis, drawn from the model with this model's boundaries marked. */
export function ResponseDiagrams() {
  const { m } = useI18n();
  const l = m.learn;
  const describe = (name: string) => `${l.diagramAxis}: ${name}`;
  return (
    <div className="diagrams">
      <Diagram
        title={l.diagramTemperature}
        label={describe(l.diagramTemperature)}
        domain={[15, 45]}
        ticks={[15, 25, 35, 45]}
        curve={temperatureFactor}
        accent="var(--bl-accent-temperature)"
        band={{ from: zones.temperature.favorableLow, to: zones.temperature.favorableHigh, label: l.markFavorable }}
        marks={[{ at: zones.temperature.heatStressAtOrAbove, label: l.markHeat }]}
      />
      <Diagram
        title={`${l.diagramLight} (µmol photons m⁻² s⁻¹)`}
        label={describe(l.diagramLight)}
        domain={[0, 2200]}
        ticks={[0, 800, 1500, 2200]}
        tickFormat={(value) => value.toLocaleString('en-US')}
        curve={(intensity) => lightFactor(32, intensity)}
        accent="var(--bl-accent-light)"
        marks={[
          { at: light.saturationOnset, label: l.markSaturation },
          { at: zones.light.photoinhibitionAtOrAbove, label: l.markPhotoinhibition },
        ]}
      />
      <Diagram
        title={l.diagramPH}
        label={describe(l.diagramPH)}
        domain={[6, 11]}
        ticks={[6, 7, 8, 9, 10, 11]}
        curve={pHFactor}
        accent="var(--bl-accent-ph)"
        band={{ from: zones.pH.favorableLow, to: zones.pH.favorableHigh, label: l.markFavorable }}
        marks={[
          { at: zones.pH.lowStressAtOrBelow, label: l.markStress },
          { at: zones.pH.highStressAtOrAbove, label: l.markStress },
        ]}
      />
    </div>
  );
}
