import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';

describe('SketchUp-like active edit context', () => {
  it('selects loose root geometry directly', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));

    expect(model.activeEditContext()).toEqual({ type: 'root' });
    expect(model.selectionTargetForEntity(edge.id)).toEqual({ type: 'entity', entityId: edge.id });
    expect(model.canEditEntity(edge.id)).toBe(true);
  });

  it('selects the outer component from root when hitting inner geometry', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));
    const component = model.createComponent('Rahmen', [edge.id]);

    expect(model.selectionTargetForEntity(edge.id)).toEqual({ type: 'component', componentId: component.id, hitEntityId: edge.id });
    expect(model.canEditEntity(edge.id)).toBe(false);
    expect(() => model.moveEntity(edge.id, vec(10, 0, 0))).toThrow('Erst Gruppe oder Komponente bearbeiten');
  });

  it('opens a component context before editing its inner entities', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));
    const component = model.createComponent('Rahmen', [edge.id]);

    model.openComponent(component.id);

    expect(model.activePath()).toEqual([component.id]);
    expect(model.selectionTargetForEntity(edge.id)).toEqual({ type: 'entity', entityId: edge.id });
    const moved = model.moveEntity(edge.id, vec(100, 0, 0));
    expect(moved.type).toBe('edge');
    if (moved.type === 'edge') expect(moved.start).toEqual(vec(100, 0, 0));

    model.closeActiveContext();
    expect(model.activeEditContext()).toEqual({ type: 'root' });
    expect(() => model.moveEntity(edge.id, vec(100, 0, 0))).toThrow('Erst Gruppe oder Komponente bearbeiten');
  });

  it('persists and restores an open edit path only when it still points at a component', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(0, 0, 0), 100, 100);
    const component = model.createComponent('Fuellung', [face.id]);
    model.openComponent(component.id);

    const restored = SketchModel.fromSnapshot(model.snapshot());

    expect(restored.activePath()).toEqual([component.id]);
    expect(restored.selectionTargetForEntity(face.id)).toEqual({ type: 'entity', entityId: face.id });
  });
});
