import { describe, expect, it } from 'vitest';
import { SketchModel } from '../src/core/model';
import { distance, vec } from '../src/core/geometry';

describe('line length editing', () => {
  it('resizes a selected line from its start point while preserving direction', () => {
    const model = new SketchModel();
    const line = model.createLine(vec(10, 0, 0), vec(110, 0, 0));

    const updated = model.resizeLineLength(line.id, 250);

    expect(updated.id).toBe(line.id);
    expect(updated.start).toEqual(vec(10, 0, 0));
    expect(updated.end).toEqual(vec(260, 0, 0));
    expect(distance(updated.start, updated.end)).toBe(250);
  });
});
