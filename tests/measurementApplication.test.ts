import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { applyMeasurementBoxInputToModel } from '../src/core/measurementApplication';

describe('measurement input model application', () => {
  it('creates a rectangle immediately when rectangle dimensions are applied without a selection', () => {
    const model = new SketchModel();

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'rectangle',
      rawInput: '1200,600',
      drawingPlane: 'xy',
      defaultOrigin: vec(0, 0, 0)
    });

    expect(result).toMatchObject({ ok: true, action: 'created', entityType: 'face' });
    const face = model.allEntities()[0];
    expect(face).toMatchObject({ type: 'face' });
    if (face?.type !== 'face') throw new Error('Expected a created rectangle face');
    expect(face.vertices).toEqual([
      vec(0, 0, 0),
      vec(1200, 0, 0),
      vec(1200, 600, 0),
      vec(0, 600, 0)
    ]);
  });

  it('creates a body immediately when body dimensions are applied without a selection', () => {
    const model = new SketchModel();

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'box',
      rawInput: '600,400,720',
      drawingPlane: 'xy',
      defaultOrigin: vec(0, 0, 0)
    });

    expect(result).toMatchObject({ ok: true, action: 'created', entityType: 'box' });
    expect(model.allEntities()).toEqual([
      expect.objectContaining({ type: 'box', origin: vec(0, 0, 0), width: 600, depth: 400, height: 720 })
    ]);
  });
});
