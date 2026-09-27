// Playback of the precomputed result (PRD-0002 §9, ADR-0002 §9).
// The simulation never runs on this clock: it only chooses which precomputed sample is shown.
import { useEffect, type Dispatch } from 'react';
import { PARAMETERS } from '../simulation';
import type { WorkspaceAction } from './workspaceReducer';

/** 24 simulated hours play back over about 30 real seconds. */
export const PLAYBACK_MS = 30_000;
const RUN_HOURS = PARAMETERS.time.runHours;
const STEPS_PER_HOUR = PARAMETERS.time.stepsPerHour;

export function usePlayback(running: boolean, dispatch: Dispatch<WorkspaceAction>): void {
  useEffect(() => {
    if (!running) return undefined;
    let frame = 0;
    let last: number | null = null;
    let elapsed = 0;
    let hidden = document.visibilityState === 'hidden';

    // Hidden time is never counted: playback pauses while the tab is hidden (PRD-0002 D-12).
    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden';
      last = null;
    };

    const tick = (timestamp: number) => {
      const now = Number.isFinite(timestamp) ? timestamp : performance.now();
      if (last !== null && !hidden) elapsed += now - last;
      last = now;
      const hours = Math.min(RUN_HOURS, (RUN_HOURS * elapsed) / PLAYBACK_MS);
      if (hours >= RUN_HOURS) {
        dispatch({ type: 'completed' });
        return;
      }
      dispatch({ type: 'tick', step: Math.floor(STEPS_PER_HOUR * hours) });
      frame = requestAnimationFrame(tick);
    };

    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [running, dispatch]);
}
