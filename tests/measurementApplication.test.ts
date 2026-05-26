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

  it('applies Push/Pull measurement distance to selected rectangle faces and boxes', () => {
    const faceModel = new SketchModel();
    const face = faceModel.createRectangle(vec(10, 20, 0), 1200, 600, {}, 'xy');

    const faceResult = applyMeasurementBoxInputToModel(faceModel, {
      tool: 'pushPull',
      rawInput: '720',
      drawingPlane: 'xy',
      selectedId: face.id
    });

    expect(faceResult).toMatchObject({ ok: true, action: 'extruded', entityType: 'box' });
    if (!faceResult.ok) throw new Error('Expected selected face to extrude from Push/Pull measurement');
    expect(faceModel.getEntity(face.id)).toBeUndefined();
    expect(faceModel.getEntity(faceResult.entityId)).toMatchObject({ type: 'box', origin: vec(10, 20, 0), width: 1200, depth: 600, height: 720 });

    const boxModel = new SketchModel();
    const box = boxModel.createBox(vec(0, 0, 0), 600, 400, 200);

    const boxResult = applyMeasurementBoxInputToModel(boxModel, {
      tool: 'pushPull',
      rawInput: '100',
      drawingPlane: 'xy',
      selectedId: box.id,
      selectedBoxFace: 'right'
    });

    expect(boxResult).toMatchObject({ ok: true, action: 'resized', entityId: box.id, entityType: 'box' });
    expect(boxModel.getEntity(box.id)).toMatchObject({ type: 'box', width: 700, height: 200 });
  });

  it('rejects Push/Pull measurement when no rectangle face or body is selected', () => {
    const model = new SketchModel();

    expect(applyMeasurementBoxInputToModel(model, {
      tool: 'pushPull',
      rawInput: '720',
      drawingPlane: 'xy'
    })).toEqual({ ok: false, error: 'Push/Pull braucht eine ausgewählte Fläche oder einen Körper.' });
  });
});
