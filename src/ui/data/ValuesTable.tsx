import { formatClock } from '../../presentation/format';

interface ValuesTableProps {
  caption: string;
  unit: string;
  rows: { hours: number; value: number }[];
  format: (value: number) => string;
  timeLabel: string;
}

/** Hourly values for a chart, shown after completion (PRD-0002 D-17). */
export function ValuesTable({ caption, unit, rows, format, timeLabel }: ValuesTableProps) {
  return (
    <div className="absolute inset-0 overflow-auto rounded-control border border-line">
      <table className="w-full text-left font-mono text-micro">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface-2 text-ink-2">
          <tr>
            <th scope="col" className="px-2 py-1 font-medium">
              {timeLabel}
            </th>
            <th scope="col" className="px-2 py-1 font-medium">
              {unit}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.hours} className="border-t border-line">
              <th scope="row" className="px-2 py-1 font-normal text-ink-2">
                {formatClock(row.hours)}
              </th>
              <td className="px-2 py-1 text-ink">{format(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
