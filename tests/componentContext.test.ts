import { describe, expect, it } from 'vitest';
import { componentContextLabel, componentEditBlockMessage, isEntityEditableInContext, sketchUpClickDepthHint } from '../src/core/componentContext';
import { SketchModel } from '../src/core/model';
import { vec } from '../src/core/geometry';

describe('SketchUp-like component edit context', () => {
  it('blocks inner geometry edits until the component is opened', () => {
    const model = new SketchModel();
    const panel = model.createBox(vec(0, 0, 0), 1000, 500, 19);
    const component = model.createComponent('Platte', [panel.id], { kind: 'component' });
    const componentPanel = model.getEntity(panel.id)!;

    expect(isEntityEditableInContext(componentPanel, undefined)).toBe(false);
    expect(componentEditBlockMessage(componentPanel, undefined)).toContain('Doppelklick auf die Komponente');
    expect(isEntityEditableInContext(componentPanel, component.id)).toBe(true);
    expect(componentEditBlockMessage(componentPanel, component.id)).toBeUndefined();
  });

  it('keeps loose root geometry directly editable', () => {
    const model = new SketchModel();
    const line = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));

    expect(isEntityEditableInContext(line, undefined)).toBe(true);
    expect(componentContextLabel({})).toBe('Außerhalb einer Komponente');
    expect(componentContextLabel({ activeComponentId: 'component_1', activeComponentName: 'Platte' })).toBe('In Komponente: Platte');
  });

  it('documents the video-derived click-depth selection hints', () => {
    expect(sketchUpClickDepthHint(1)).toContain('einzelne Fläche');
    expect(sketchUpClickDepthHint(2)).toContain('Komponentenkontext öffnen');
    expect(sketchUpClickDepthHint(3)).toContain('zusammenhängende Geometrie');
  });
});
