import type { Announcement } from '../presentation/explanation';

/** Visually hidden live regions (PRD-0002 §11). */
export function Announcer({ polite, assertive }: Announcement) {
  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertive}
      </div>
    </>
  );
}
