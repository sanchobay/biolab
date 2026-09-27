import { useI18n } from '../../i18n';

// Cells along one helical trichome, split into the far and near turns for simple depth.
const CELLS = Array.from({ length: 17 }, (_, i) => {
  const turn = i * 0.62;
  return { x: 12 + i * 6.6, y: 60 - i * 1.5 + Math.sin(turn) * 17, near: Math.cos(turn) >= 0, r: 5 + Math.cos(turn) * 1.1 };
});

/** Organism note beside the explanation (ExecPlan 0003; a column, not a card, since ExecPlan 0004). Straight strains exist, so the text says "often helical" (PRD-0001 §1). */
export function OrganismCard() {
  const { m } = useI18n();
  return (
    <aside id="about-arthrospira" tabIndex={-1} aria-labelledby="organism-title" className="organism-note">
      <svg viewBox="0 0 128 104" aria-hidden="true" className="organism-art">
        {[false, true].map((near) =>
          CELLS.filter((cell) => cell.near === near).map((cell) => (
            <circle
              key={`${near ? 'n' : 'f'}${cell.x}`}
              cx={cell.x}
              cy={cell.y}
              r={cell.r}
              style={{ fill: near ? 'var(--bl-culture)' : 'color-mix(in srgb, var(--bl-culture) 55%, var(--bl-surface))', stroke: 'var(--bl-filament)' }}
              strokeOpacity={near ? 0.55 : 0.25}
              strokeWidth={1}
            />
          )),
        )}
      </svg>
      <div className="organism-text">
        <h3 id="organism-title">
          <i>Arthrospira platensis</i>
        </h3>
        <p>{m.organism.text}</p>
      </div>
    </aside>
  );
}
