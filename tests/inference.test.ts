import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import {
  applyAxisLock,
  axisLockFromArrowKey,
  collectInferenceCandidates,
  createInference,
  describeInference,
  freezeInference,
  inferenceLabel,
  resolveInference,
  type InferenceCandidate
} from '../src/core/inference';

describe('snap and axis inference', () => {
  it('collects endpoint, midpoint, center, edge and face snap candidates from supported entities', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));
    const face = model.createRectangle(vec(0, 0, 0), 1000, 500);
    const box = model.createBox(vec(0, 0, 0), 1000, 500, 300);

    const candidates = collectInferenceCandidates(model);

    expect(candidates).toEqual(expect.arrayContaining([
      { entityId: edge.id, kind: 'endpoint', point: vec(0, 0, 0) },
      { entityId: edge.id, kind: 'midpoint', point: vec(500, 0, 0) },
      { entityId: face.id, kind: 'center', point: vec(500, 250, 0) },
      { entityId: box.id, kind: 'center', point: vec(500, 250, 150) }
    ]));
  });

  it('resolves the highest priority candidate within tolerance before lower priority candidates', () => {
    const candidates: InferenceCandidate[] = [
      { kind: 'onEdge', point: vec(100, 0, 0), entityId: 'edge_1' },
      { kind: 'endpoint', point: vec(106, 0, 0), entityId: 'edge_2' }
    ];

    expect(resolveInference(vec(105, 0, 0), candidates, { tolerance: 12 })).toMatchObject({
      kind: 'endpoint',
      point: vec(106, 0, 0),
      entityId: 'edge_2'
    });
    expect(resolveInference(vec(130, 0, 0), candidates, { tolerance: 12 })).toEqual({ kind: 'free', point: vec(130, 0, 0) });
  });

  it('projects arbitrary points onto non-midpoint edges within tolerance', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));

    const inference = createInference(vec(735, 18, 0), collectInferenceCandidates(model), { tolerance: 35 });

    expect(inference).toEqual({ kind: 'onEdge', point: vec(735, 0, 0), entityId: edge.id });
  });

  it('projects arbitrary points inside a face instead of snapping only to the face center', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(0, 0, 0), 1000, 500);

    const inference = createInference(vec(725, 320, 0), collectInferenceCandidates(model), { tolerance: 35 });

    expect(inference).toEqual({ kind: 'onFace', point: vec(725, 320, 0), entityId: face.id });
  });

  it('projects near-face points to the nearest face point within tolerance', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(0, 0, 0), 1000, 500);

    const inference = createInference(vec(725, 320, 20), collectInferenceCandidates(model), { tolerance: 35 });

    expect(inference).toEqual({ kind: 'onFace', point: vec(725, 320, 0), entityId: face.id });
  });

  it('projects arbitrary points onto tilted planar faces within tolerance', () => {
    const face = {
      id: 'tilted_face',
      type: 'face' as const,
      vertices: [vec(0, 0, 0), vec(1000, 0, 0), vec(1000, 500, 500), vec(0, 500, 500)]
    };
    const model = { allEntities: () => [face] };

    const inference = createInference(vec(725, 320, 340), collectInferenceCandidates(model), { tolerance: 35 });

    expect(inference).toEqual({ kind: 'onFace', point: vec(725, 330, 330), entityId: face.id });
  });

  it('adds axis inference from an anchor point and supports explicit arrow-key axis locks', () => {
    expect(axisLockFromArrowKey('ArrowRight')).toBe('x');
    expect(axisLockFromArrowKey('ArrowLeft')).toBe('y');
    expect(axisLockFromArrowKey('ArrowUp')).toBe('z');
    expect(axisLockFromArrowKey('ArrowDown')).toBeUndefined();
    expect(axisLockFromArrowKey('ArrowRight', { targetTagName: 'INPUT' })).toBeUndefined();
    expect(axisLockFromArrowKey('ArrowLeft', { targetTagName: 'TEXTAREA' })).toBeUndefined();
    expect(axisLockFromArrowKey('ArrowUp', { targetIsContentEditable: true })).toBeUndefined();
    expect(axisLockFromArrowKey('ArrowRight', { ctrlKey: true })).toBeUndefined();

    const anchor = vec(10, 20, 30);
    const freePoint = vec(95, 87, 71);

    expect(applyAxisLock(freePoint, anchor, 'x')).toEqual(vec(95, 20, 30));
    expect(applyAxisLock(freePoint, anchor, 'y')).toEqual(vec(10, 87, 30));
    expect(applyAxisLock(freePoint, anchor, 'z')).toEqual(vec(10, 20, 71));

    expect(createInference(freePoint, [], { anchor, axisLock: 'y' })).toMatchObject({
      kind: 'axisY',
      point: vec(10, 87, 30),
      axis: 'y',
      axisLine: { start: anchor, end: vec(10, 87, 30), color: '#16a34a' }
    });
  });

  it('keeps default XY-plane Z lock meaningful by projecting pointer distance into height when point.z equals anchor.z', () => {
    const anchor = vec(100, 200, 50);
    const defaultXyPointerPoint = vec(100, 650, 50);

    expect(createInference(defaultXyPointerPoint, [], { anchor, axisLock: 'z' })).toMatchObject({
      kind: 'axisZ',
      point: vec(100, 200, 500),
      axisLine: { start: anchor, end: vec(100, 200, 500), color: '#2563eb' }
    });
  });

  it('freezes the current inference while Shift is held', () => {
    const held = { kind: 'midpoint' as const, point: vec(500, 0, 0), entityId: 'edge_1' };
    const next = { kind: 'endpoint' as const, point: vec(0, 0, 0), entityId: 'edge_1' };

    expect(freezeInference(next, held, true)).toBe(held);
    expect(freezeInference(next, held, false)).toBe(next);
  });

  it('uses German marker labels and measurement descriptions for snap and axis states', () => {
    expect(inferenceLabel('endpoint')).toBe('Endpunkt');
    expect(inferenceLabel('midpoint')).toBe('Mitte');
    expect(inferenceLabel('center')).toBe('Zentrum');
    expect(inferenceLabel('onEdge')).toBe('auf Kante');
    expect(inferenceLabel('onFace')).toBe('auf Fläche');
    expect(inferenceLabel('axisX')).toBe('Achse X');
    expect(inferenceLabel('axisY')).toBe('Achse Y');
    expect(inferenceLabel('axisZ')).toBe('Achse Z');

    expect(describeInference({ kind: 'axisX', point: vec(300, 0, 0), axis: 'x', axisLine: { start: vec(0, 0, 0), end: vec(300, 0, 0), color: '#dc2626' } })).toBe('Achse X · Δ 300 mm / 0 mm / 0 mm');
    expect(describeInference({ kind: 'onEdge', point: vec(0, 0, 0), entityId: 'edge_1' })).toBe('auf Kante');
  });
});
