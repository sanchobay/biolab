// W18: onset-marker labels that would collide are placed on separate rows (ExecPlan 0004 F4).
import { describe, expect, it } from 'vitest';
import { layoutMarkerLabels } from '../../src/ui/data/chartOverlays';

describe('layoutMarkerLabels', () => {
  it('stacks labels that start at the same position', () => {
    expect(layoutMarkerLabels([{ x: 40, width: 70 }, { x: 40, width: 96 }])).toEqual([0, 1]);
  });

  it('keeps labels on the first row when they do not overlap', () => {
    expect(layoutMarkerLabels([{ x: 40, width: 70 }, { x: 200, width: 96 }])).toEqual([0, 0]);
  });

  it('reuses a freed row for a later label', () => {
    expect(layoutMarkerLabels([{ x: 0, width: 80 }, { x: 10, width: 80 }, { x: 120, width: 60 }])).toEqual([0, 1, 0]);
  });
});
