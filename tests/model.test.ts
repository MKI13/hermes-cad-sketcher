import { describe, expect, it } from 'vitest';
import { almostEqual, vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';

describe('SketchModel geometry tools', () => {
  it('creates lines and measures in millimeters', () => {
    const model = new SketchModel();
    const line = model.createLine(vec(0, 0, 0), vec(3000, 4000, 0));
    expect(line.type).toBe('edge');
    expect(model.measure(line.start, line.end)).toBe(5000);
  });

  it('creates rectangles on the ground plane with four vertices', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(10, 20, 0), 1000, 500);
    expect(face.vertices).toEqual([vec(10, 20, 0), vec(1010, 20, 0), vec(1010, 520, 0), vec(10, 520, 0)]);
  });

  it('creates boxes and push-pulls the height like a simple SketchUp body', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 600, 400, 200);
    const updated = model.pushPullBoxFace(box.id, 150);
    expect(updated.height).toBe(350);
  });

  it('moves selected entities by a delta vector', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 100, 100);
    const moved = model.moveEntity(box.id, vec(50, 25, 0));
    expect(moved.type).toBe('box');
    if (moved.type === 'box') expect(moved.origin).toEqual(vec(50, 25, 0));
  });

  it('rotates an edge around the Z axis', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(1, 0, 0), vec(2, 0, 0));
    const rotated = model.rotateEntityZ(edge.id, Math.PI / 2, vec(0, 0, 0));
    expect(rotated.type).toBe('edge');
    if (rotated.type === 'edge') {
      expect(almostEqual(rotated.start.x, 0)).toBe(true);
      expect(almostEqual(rotated.start.y, 1)).toBe(true);
      expect(almostEqual(rotated.end.x, 0)).toBe(true);
      expect(almostEqual(rotated.end.y, 2)).toBe(true);
    }
  });

  it('groups entities into named components', () => {
    const model = new SketchModel();
    const a = model.createBox(vec(0, 0, 0), 100, 100, 100);
    const b = model.createLine(vec(0, 0, 0), vec(100, 0, 0));
    const component = model.createComponent('Fensterrahmen', [a.id, b.id]);
    expect(component.entityIds).toEqual([a.id, b.id]);
    expect(model.getEntity(a.id)?.componentId).toBe(component.id);
  });

  it('duplicates a component with new entity ids and a stable millimeter offset', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);
    const edge = model.createLine(vec(0, 0, 0), vec(50, 0, 0));
    const original = model.createComponent('Schrankseite', [box.id, edge.id]);

    const duplicate = model.duplicateComponent(original.id, 'Schrankseite Kopie', vec(1000, -200, 0));

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.name).toBe('Schrankseite Kopie');
    expect(duplicate.entityIds).toHaveLength(2);
    expect(duplicate.entityIds).not.toContain(box.id);
    expect(duplicate.entityIds).not.toContain(edge.id);
    expect(model.getEntity(box.id)?.componentId).toBe(original.id);

    const copiedBox = model.getEntity(duplicate.entityIds[0]);
    const copiedEdge = model.getEntity(duplicate.entityIds[1]);
    expect(copiedBox?.componentId).toBe(duplicate.id);
    expect(copiedEdge?.componentId).toBe(duplicate.id);
    expect(copiedBox?.type).toBe('box');
    if (copiedBox?.type === 'box') expect(copiedBox.origin).toEqual(vec(1000, -200, 0));
    expect(copiedEdge?.type).toBe('edge');
    if (copiedEdge?.type === 'edge') {
      expect(copiedEdge.start).toEqual(vec(1000, -200, 0));
      expect(copiedEdge.end).toEqual(vec(1050, -200, 0));
    }
  });
});
