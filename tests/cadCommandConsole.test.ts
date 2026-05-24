import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { runAgentChatCommand, runCadConsoleCommand, runCadConsoleScript } from '../src/core/cadCommands';

describe('Ruby-like CAD command console', () => {
  it('creates 2D and 3D objects through function-named commands', () => {
    let result = runCadConsoleCommand(new SketchModel(), 'line(0, 0, 0, 1000, 0, 0)');
    expect(result.ok).toBe(true);
    expect(result.nextModel.allEntities()[0]).toMatchObject({ type: 'edge', start: vec(0, 0, 0), end: vec(1000, 0, 0) });

    result = runCadConsoleCommand(result.nextModel, 'rectangle(10, 20, 0, 1200, 600)', result.selectedId);
    expect(result.ok).toBe(true);
    expect(result.nextModel.allEntities()[1]).toMatchObject({ type: 'face' });

    result = runCadConsoleCommand(result.nextModel, 'box(0, 0, 0, 600, 400, 200)', result.selectedId);
    expect(result.ok).toBe(true);
    expect(result.nextModel.getEntity(result.selectedId!)).toMatchObject({ type: 'box', origin: vec(0, 0, 0), width: 600, depth: 400, height: 200 });
  });

  it('edits, moves, rotates, push-pulls and deletes the selected object with matching command names', () => {
    let result = runCadConsoleCommand(new SketchModel(), 'box(0, 0, 0, 600, 400, 200)');
    const boxId = result.selectedId!;

    result = runCadConsoleCommand(result.nextModel, 'move(selected, 100, 50, 25)', boxId);
    expect(result.nextModel.getEntity(boxId)).toMatchObject({ type: 'box', origin: vec(100, 50, 25) });

    result = runCadConsoleCommand(result.nextModel, 'resize(selected, width: 700, depth: 450, height: 250)', boxId);
    expect(result.nextModel.getEntity(boxId)).toMatchObject({ type: 'box', width: 700, depth: 450, height: 250 });

    result = runCadConsoleCommand(result.nextModel, 'rotate_z(selected, 90)', boxId);
    const rotated = result.nextModel.getEntity(boxId);
    expect(rotated).toMatchObject({ type: 'box' });
    if (rotated?.type === 'box') expect(rotated.rotationZ).toBeCloseTo(Math.PI / 2);

    result = runCadConsoleCommand(result.nextModel, 'push_pull(selected, 50)', boxId);
    expect(result.nextModel.getEntity(boxId)).toMatchObject({ type: 'box', height: 300 });

    result = runCadConsoleCommand(result.nextModel, 'delete(selected)', boxId);
    expect(result.ok).toBe(true);
    expect(result.nextModel.getEntity(boxId)).toBeUndefined();
  });

  it('runs multi-line scripts for agent-controlled CAD edits', () => {
    const result = runCadConsoleScript(new SketchModel(), `
      # Hermes CAD Ruby console script
      rectangle(0, 0, 0, 1000, 500)
      extrude(selected, 300)
      move(selected, 50, 0, 0)
    `);

    expect(result.ok).toBe(true);
    expect(result.nextModel.allEntities()).toHaveLength(1);
    expect(result.nextModel.getEntity(result.selectedId!)).toMatchObject({ type: 'box', origin: vec(50, 0, 0), width: 1000, depth: 500, height: 300 });
  });

  it('wraps agent-created box bodies in their own component without merging separate bodies', () => {
    const result = runCadConsoleScript(new SketchModel(), `
      box(0, 0, 0, 600, 400, 200)
      box(1000, 0, 0, 300, 200, 100)
    `);

    expect(result.ok).toBe(true);
    const boxes = result.nextModel.allEntities().filter((entity) => entity.type === 'box');
    const components = result.nextModel.allComponents();
    expect(boxes).toHaveLength(2);
    expect(components).toHaveLength(2);
    expect(components.map((component) => component.entityIds)).toEqual([[boxes[0].id], [boxes[1].id]]);
    expect(boxes.map((box) => box.componentId)).toEqual(components.map((component) => component.id));
  });

  it('wraps agent-extruded box bodies in their own component', () => {
    const result = runCadConsoleScript(new SketchModel(), `
      rectangle(0, 0, 0, 1000, 500)
      extrude(selected, 300)
    `);

    expect(result.ok).toBe(true);
    const box = result.nextModel.getEntity(result.selectedId!);
    const component = result.nextModel.allComponents()[0];
    expect(box).toMatchObject({ type: 'box', width: 1000, depth: 500, height: 300, componentId: component.id });
    expect(component.entityIds).toEqual([result.selectedId]);
  });

  it('moves an agent-extruded body out of a source face component into its own component', () => {
    const result = runCadConsoleScript(new SketchModel(), `
      rectangle(0, 0, 0, 1000, 500)
      component("Skizzenfläche", selected)
      extrude(selected, 300)
    `);

    expect(result.ok).toBe(true);
    const box = result.nextModel.getEntity(result.selectedId!);
    const components = result.nextModel.allComponents();
    const boxComponent = components.find((component) => component.entityIds.includes(result.selectedId!));
    expect(box).toMatchObject({ type: 'box', componentId: boxComponent?.id });
    expect(boxComponent?.name).toBe(`Körper ${result.selectedId}`);
    expect(components.filter((component) => component.entityIds.includes(result.selectedId!))).toHaveLength(1);
  });

  it('lets agent scripts delete the current selection without repeating the entity id', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 600, 400, 200);

    const result = runCadConsoleScript(model, `
      select(${box.id})
      delete
    `);

    expect(result.ok).toBe(true);
    expect(result.nextModel.getEntity(box.id)).toBeUndefined();
    expect(result.nextModel.allEntities()).toHaveLength(0);
  });

  it('rejects unknown command names without changing the model', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 100, 100);
    const result = runCadConsoleCommand(model, 'scale(selected, 2)', box.id);

    expect(result.ok).toBe(false);
    expect(result.nextModel.snapshot()).toEqual(model.snapshot());
    expect(result.message).toContain('Unbekannter CAD-Befehl');
  });
});

describe('Agent chat CAD command bridge', () => {
  it('lets an AI agent create and edit live model objects through chat text', () => {
    let result = runAgentChatCommand(new SketchModel(), 'Agent: erstelle box 0 0 0 600 400 200');
    const boxId = result.selectedId!;
    expect(result.ok).toBe(true);
    expect(result.nextModel.getEntity(boxId)).toMatchObject({ type: 'box' });

    result = runAgentChatCommand(result.nextModel, 'verschiebe auswahl 100 0 0', boxId);
    expect(result.nextModel.getEntity(boxId)).toMatchObject({ type: 'box', origin: vec(100, 0, 0) });
  });

  it('accepts explicit ruby console commands pasted by Hermes or another agent', () => {
    const result = runAgentChatCommand(new SketchModel(), 'ruby: line(0, 0, 0, 250, 0, 0)');

    expect(result.ok).toBe(true);
    expect(result.nextModel.allEntities()[0]).toMatchObject({ type: 'edge', start: vec(0, 0, 0), end: vec(250, 0, 0) });
  });

  it('explains that free Telegram-like chat needs the local Hermes bridge', () => {
    const result = runAgentChatCommand(new SketchModel(), 'Hallo Hermes bist du bereit eine Test zu machen?');

    expect(result.ok).toBe(false);
    expect(result.changed).toBe(false);
    expect(result.message).toContain('Freier Chat wie in Telegram');
    expect(result.message).toContain('lokalen Hermes Agent');
  });
});
