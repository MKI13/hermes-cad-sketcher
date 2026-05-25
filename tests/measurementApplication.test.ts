import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel, type SketchModelSnapshot } from '../src/core/model';
import { applyMeasurementBoxInputToModel, applyMeasurementInputTransaction } from '../src/core/measurementApplication';

describe('measurement application', () => {
  it('creates a rectangle immediately when rectangle dimensions are applied without a selection', () => {
    const model = new SketchModel();

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'rectangle',
      rawInput: '1200,600',
      defaultOrigin: vec(10, 20, 0)
    });

    expect(result).toMatchObject({ ok: true, action: 'created', entityType: 'face' });
    expect(model.allEntities()).toHaveLength(1);
    expect(model.allEntities()[0]).toMatchObject({ type: 'face' });
  });

  it('resizes the selected rectangle when rectangle dimensions are applied with a face selection', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(10, 20, 0), 400, 200);

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'rectangle',
      rawInput: '1200,600',
      selectedId: face.id,
      defaultOrigin: vec(0, 0, 0)
    });

    expect(result).toMatchObject({ ok: true, action: 'resized', entityId: face.id, entityType: 'face' });
    expect(model.getEntity(face.id)).toMatchObject({
      type: 'face',
      vertices: [vec(10, 20, 0), vec(1210, 20, 0), vec(1210, 620, 0), vec(10, 620, 0)]
    });
  });

  it('creates a body immediately when body dimensions are applied without a selection', () => {
    const model = new SketchModel();

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'box',
      rawInput: '600,400,720',
      defaultOrigin: vec(5, 6, 7)
    });

    expect(result).toMatchObject({ ok: true, action: 'created', entityType: 'box' });
    expect(model.allEntities()[0]).toMatchObject({ type: 'box', origin: vec(5, 6, 7), width: 600, depth: 400, height: 720 });
  });

  it('resizes the selected body when body dimensions are applied with a box selection', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 300, 200, 100);

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'box',
      rawInput: '600,400,720',
      selectedId: box.id,
      defaultOrigin: vec(10, 10, 0)
    });

    expect(result).toMatchObject({ ok: true, action: 'resized', entityId: box.id, entityType: 'box' });
    expect(model.getEntity(box.id)).toMatchObject({ type: 'box', origin: vec(0, 0, 0), width: 600, depth: 400, height: 720 });
  });

  it('fails closed for invalid measurements without changing the model', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 300, 200, 100);
    const before = model.snapshot();

    const result = applyMeasurementBoxInputToModel(model, {
      tool: 'box',
      rawInput: '600,,720',
      selectedId: box.id,
      defaultOrigin: vec(0, 0, 0)
    });

    expect(result).toMatchObject({ ok: false });
    expect(model.snapshot()).toEqual(before);
  });

  it('does not commit a model snapshot for invalid direct input', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 300, 200, 100);
    const commits: SketchModelSnapshot[] = [];

    const result = applyMeasurementInputTransaction(model, {
      tool: 'box',
      rawInput: '600,,720',
      selectedId: box.id,
      defaultOrigin: vec(0, 0, 0)
    }, (nextModel) => {
      commits.push(nextModel.snapshot());
    });

    expect(result).toMatchObject({ ok: false });
    expect(commits).toEqual([]);
  });

  it('returns a structured error for unsupported selected rectangle faces instead of throwing', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(0, 0, 0), 400, 200);
    model.rotateEntityZ(face.id, Math.PI / 4);
    const before = model.snapshot();

    const result = applyMeasurementInputTransaction(model, {
      tool: 'rectangle',
      rawInput: '1200,600',
      selectedId: face.id,
      defaultOrigin: vec(0, 0, 0)
    }, () => {
      throw new Error('invalid face must not be committed');
    });

    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? '' : result.error).toContain('axis-aligned');
    expect(model.snapshot()).toEqual(before);
  });
});
