import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { beginPushPullDrag, finishPushPullDrag, pointForPushPullPointerDelta, pushPullDeltaFromDrag, updatePushPullDrag } from '../src/ui/pushPullInteraction';

const okPreview = { ok: true as const, entity: { id: 'box_1', type: 'box' as const, origin: vec(0, 0, 0), width: 1200, depth: 500, height: 300, rotationZ: 0 }, sourceEntityId: 'box_1', delta: 200 };

describe('Push/Pull viewport drag interaction', () => {
  it('starts only with a selected entity and preserves the selected box face', () => {
    expect(beginPushPullDrag(undefined, undefined, vec(0, 0, 0))).toBeUndefined();
    expect(beginPushPullDrag('box_1', { entityId: 'box_1', face: 'right' }, vec(0, 0, 0))).toEqual({
      mode: 'pushPullDragging',
      selection: { entityId: 'box_1', face: 'right' },
      startPoint: vec(0, 0, 0),
      axis: 'x',
      sign: 1,
      pixelsPerMillimeter: 2
    });
    expect(beginPushPullDrag('box_1', { entityId: 'other', face: 'front' }, vec(0, 0, 0))?.selection).toEqual({ entityId: 'box_1', face: undefined });
  });

  it('derives signed drag distances from the selected face normal', () => {
    const startPoint = vec(10, 20, 30);

    expect(pushPullDeltaFromDrag(beginPushPullDrag('box_1', { entityId: 'box_1', face: 'right' }, startPoint)!, vec(210, 20, 30))).toBe(200);
    expect(pushPullDeltaFromDrag(beginPushPullDrag('box_1', { entityId: 'box_1', face: 'left' }, startPoint)!, vec(-90, 20, 30))).toBe(100);
    expect(pushPullDeltaFromDrag(beginPushPullDrag('box_1', { entityId: 'box_1', face: 'front' }, startPoint)!, vec(10, 170, 30))).toBe(150);
    expect(pushPullDeltaFromDrag(beginPushPullDrag('box_1', { entityId: 'box_1', face: 'back' }, startPoint)!, vec(10, -80, 30))).toBe(100);
    expect(pushPullDeltaFromDrag(beginPushPullDrag('box_1', { entityId: 'box_1', face: 'top' }, startPoint)!, vec(10, 20, 330))).toBe(300);
    expect(pushPullDeltaFromDrag(beginPushPullDrag('box_1', { entityId: 'box_1', face: 'bottom' }, startPoint)!, vec(10, 20, -70))).toBe(100);
  });

  it('maps screen-pixel drags to model-space deltas without jumping to world-origin planes', () => {
    const startPoint = vec(1200, 800, 300);
    const right = beginPushPullDrag('box_1', { entityId: 'box_1', face: 'right' }, startPoint, { pixelsPerMillimeter: 2 })!;
    const top = beginPushPullDrag('box_1', { entityId: 'box_1', face: 'top' }, startPoint, { pixelsPerMillimeter: 2 })!;
    const bottom = beginPushPullDrag('box_1', { entityId: 'box_1', face: 'bottom' }, startPoint, { pixelsPerMillimeter: 2 })!;

    expect(pointForPushPullPointerDelta(right, { x: 200, y: 0 })).toEqual(vec(1300, 800, 300));
    expect(pushPullDeltaFromDrag(right, pointForPushPullPointerDelta(right, { x: 200, y: 0 }))).toBe(100);
    expect(pushPullDeltaFromDrag(top, pointForPushPullPointerDelta(top, { x: 0, y: -240 }))).toBe(120);
    expect(pushPullDeltaFromDrag(bottom, pointForPushPullPointerDelta(bottom, { x: 0, y: 240 }))).toBe(120);
  });

  it('updates a live preview without committing and returns exact Enter-style finish data', () => {
    const state = beginPushPullDrag('box_1', { entityId: 'box_1', face: 'right' }, vec(0, 0, 0));
    if (!state) throw new Error('expected drag state');
    const seen: Array<{ entityId: string; face?: string; delta: number }> = [];

    const step = updatePushPullDrag(state, vec(200, 0, 0), (selection, delta) => {
      seen.push({ ...selection, delta });
      return okPreview;
    });

    expect(step).toEqual({ mode: 'dragging', state, delta: 200, preview: okPreview });
    expect(seen).toEqual([{ entityId: 'box_1', face: 'right', delta: 200 }]);
    expect(finishPushPullDrag(state, vec(200, 0, 0))).toEqual({ selection: { entityId: 'box_1', face: 'right' }, delta: 200 });
    expect(finishPushPullDrag(state, vec(0, 0, 0))).toBeUndefined();
  });
});
