import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { applyMeasurementBoxInputToModel } from '../src/core/measurementApplication';

describe('measurement input model application', () => {
  it('creates an exact line from a pending start point and mouse direction', () => {
    const model = new SketchModel();

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'line',
      rawInput: '1200mm',
      drawingPlane: 'xy',
      pendingStartPoint: vec(10, 20, 0),
      directionPoint: vec(20, 20, 0)
    });

    expect(result).toMatchObject({ ok: true, action: 'created', entityType: 'edge' });
    const line = model.allEntities()[0];
    expect(line).toMatchObject({ type: 'edge', start: vec(10, 20, 0), end: vec(1210, 20, 0) });
  });

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

  it('moves the selected entity from scalar and bracketed vector measurements', () => {
    const scalarModel = new SketchModel();
    const scalarBox = scalarModel.createBox(vec(10, 20, 0), 600, 400, 200);

    const scalarResult = applyMeasurementBoxInputToModel(scalarModel, {
      tool: 'move',
      rawInput: '100',
      drawingPlane: 'xy',
      selectedId: scalarBox.id
    });

    expect(scalarResult).toMatchObject({ ok: true, action: 'moved', entityId: scalarBox.id, entityType: 'box' });
    expect(scalarModel.getEntity(scalarBox.id)).toMatchObject({ type: 'box', origin: vec(110, 20, 0) });

    const vectorResult = applyMeasurementBoxInputToModel(scalarModel, {
      tool: 'move',
      rawInput: '[1000,500,0]',
      drawingPlane: 'xy',
      selectedId: scalarBox.id
    });

    expect(vectorResult).toMatchObject({ ok: true, action: 'moved', entityId: scalarBox.id, entityType: 'box' });
    expect(scalarModel.getEntity(scalarBox.id)).toMatchObject({ type: 'box', origin: vec(1110, 520, 0) });
  });

  it('rotates the selected entity from degree measurements', () => {
    const model = new SketchModel();
    const line = model.createLine(vec(0, 0, 0), vec(100, 0, 0));

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'rotate',
      rawInput: '90',
      drawingPlane: 'xy',
      selectedId: line.id
    });

    expect(result).toMatchObject({ ok: true, action: 'rotated', entityId: line.id, entityType: 'edge' });
    const rotated = model.getEntity(line.id);
    expect(rotated).toMatchObject({ type: 'edge' });
    if (rotated?.type !== 'edge') throw new Error('Expected rotated line');
    expect(rotated.start.x).toBeCloseTo(50);
    expect(rotated.start.y).toBeCloseTo(-50);
    expect(rotated.end.x).toBeCloseTo(50);
    expect(rotated.end.y).toBeCloseTo(50);
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
