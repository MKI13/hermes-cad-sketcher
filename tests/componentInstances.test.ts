import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { exportDxf } from '../src/core/dxf';
import { entityBoundingBox, SketchModel, worldEntitiesForModel } from '../src/core/model';
import { exportProjectFile, importProjectFile } from '../src/core/projectFile';

function expectDxfLine(dxf: string, start: { x: number; y: number; z?: number }, end: { x: number; y: number; z?: number }) {
  const line = [
    '0', 'LINE',
    '8', '0',
    '10', String(start.x),
    '20', String(start.y),
    '30', String(start.z ?? 0),
    '11', String(end.x),
    '21', String(end.y),
    '31', String(end.z ?? 0)
  ].join('\n');
  expect(dxf).toContain(line);
}

function boxById(model: SketchModel, id: string) {
  const entity = model.getEntity(id);
  expect(entity?.type).toBe('box');
  if (entity?.type !== 'box') throw new Error('expected box');
  return entity;
}

describe('component definitions and instances', () => {

  it('selects viewport-expanded instance geometry as a component instance instead of editable source entity', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const { definition, firstInstance } = model.createComponentDefinitionFromEntities('Seitenwand', [board.id]);
    expect(definition.entityIds).toEqual([board.id]);

    const worldId = `${firstInstance.id}:${board.id}`;
    expect(model.selectionTargetForEntity(worldId)).toEqual({
      type: 'componentInstance',
      componentInstanceId: firstInstance.id,
      sourceEntityId: board.id
    });
    expect(model.canEditEntity(worldId)).toBe(false);
    expect(() => model.moveEntity(worldId, vec(10, 0, 0))).toThrow('Instanz-Geometrie ist nur eine Weltansicht');
    expect(() => model.deleteEntity(worldId)).toThrow('Instanz-Geometrie ist nur eine Weltansicht');
  });

  it('creating a component definition from selected geometry creates a visible first instance', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);

    const { definition, firstInstance } = model.createComponentDefinitionFromEntities('Seitenwand', [board.id]);
    const worldEntities = worldEntitiesForModel(model);

    expect(definition.entityIds).toEqual([board.id]);
    expect(definition.componentId).toMatch(/^component_/);
    expect(model.getEntity(board.id)?.componentId).toBe(definition.componentId);
    expect(model.selectionTargetForEntity(board.id)).toEqual({ type: 'component', componentId: definition.componentId, hitEntityId: board.id });
    model.openComponent(definition.componentId!);
    expect(model.activePath()).toEqual([definition.componentId]);
    expect(model.canEditEntity(board.id)).toBe(true);
    expect(firstInstance.definitionId).toBe(definition.id);
    expect(model.allComponentInstances()).toHaveLength(1);
    expect(worldEntities).toHaveLength(1);
    expect(worldEntities[0]).toMatchObject({
      id: `${firstInstance.id}:${board.id}`,
      componentInstanceId: firstInstance.id,
      sourceEntityId: board.id
    });
  });

  it('round-trips active context together with component definitions and instances', () => {
    const model = new SketchModel();
    const legacyBox = model.createBox(vec(10, 20, 0), 100, 100, 100);
    const legacyComponent = model.createComponent('Bearbeitete Gruppe', [legacyBox.id]);
    model.openComponent(legacyComponent.id);
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const { definition, firstInstance } = model.createComponentDefinitionFromEntities('Seitenwand', [board.id]);

    const roundTrip = importProjectFile(exportProjectFile(model));

    expect(roundTrip.activePath()).toEqual([legacyComponent.id]);
    expect(roundTrip.allComponentDefinitions()).toEqual([definition]);
    expect(roundTrip.allComponentInstances()).toEqual([firstInstance]);
    expect(roundTrip.allComponents().some((component) => component.id === definition.componentId)).toBe(true);
    expect(roundTrip.snapshot()).toMatchObject({
      activePath: [legacyComponent.id],
      componentDefinitions: [definition],
      componentInstances: [firstInstance]
    });
  });
  it('does not confuse real imported entity ids that contain the world-id separator with synthetic instance hits', () => {
    const model = SketchModel.fromSnapshot({
      unit: 'mm',
      entities: [{ id: 'instance_1:custom-real-entity', type: 'box', origin: vec(0, 0, 0), width: 100, depth: 100, height: 18, rotationZ: 0 }],
      components: []
    });

    expect(model.selectionTargetForEntity('instance_1:custom-real-entity')).toEqual({ type: 'entity', entityId: 'instance_1:custom-real-entity' });
    expect(model.canEditEntity('instance_1:custom-real-entity')).toBe(true);
    expect(model.moveEntity('instance_1:custom-real-entity', vec(10, 0, 0))).toMatchObject({ type: 'box', origin: vec(10, 0, 0) });
  });

  it('rejects material and hide operations on selected component instances with an explicit protected-instance error', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const { firstInstance } = model.createComponentDefinitionFromEntities('Seitenwand', [board.id]);

    expect(() => model.applyMaterial(firstInstance.id, { materialId: 'wood-light' })).toThrow('Komponenten-Instanz');
    expect(() => model.hideEntity(firstInstance.id)).toThrow('Komponenten-Instanz');
  });

  it('creates a component definition and placed instance without duplicating definition geometry', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);

    const definition = model.createComponentDefinition('Seitenwand', [board.id], {
      localAxes: {
        length: 'x',
        width: 'y',
        thickness: 'z'
      }
    });
    const firstInstance = model.createComponentInstance(definition.id, 'links', { translation: vec(1000, 0, 0), rotationZ: Math.PI / 2 });
    const secondInstance = model.createComponentInstance(definition.id, 'rechts', { translation: vec(2000, 0, 0) });

    expect(definition.entityIds).toEqual([board.id]);
    expect(model.getEntity(board.id)?.componentId).toBeUndefined();
    expect(model.allEntities()).toHaveLength(1);
    expect(model.allComponentDefinitions()).toEqual([definition]);
    expect(model.allComponentInstances()).toEqual([firstInstance, secondInstance]);
    expect(firstInstance.definitionId).toBe(definition.id);
    expect(firstInstance.transform).toEqual({ translation: vec(1000, 0, 0), rotationZ: Math.PI / 2, scale: vec(1, 1, 1) });
  });

  it('moves and rotates component instances by changing only instance transforms', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Fachboden', [board.id]);
    const instance = model.createComponentInstance(definition.id, 'Fachboden A', { translation: vec(100, 0, 0) });

    const moved = model.moveComponentInstance(instance.id, vec(0, 250, 10));
    const rotated = model.rotateComponentInstanceZ(instance.id, Math.PI / 2);

    expect(moved.transform.translation).toEqual(vec(100, 250, 10));
    expect(rotated.transform.translation).toEqual(vec(100, 250, 10));
    expect(rotated.transform.rotationZ).toBe(Math.PI / 2);
    expect(model.getEntity(board.id)).toMatchObject({ type: 'box', origin: vec(0, 0, 0), width: 600, depth: 300, height: 18 });
  });

  it('duplicates a component instance as another placement of the same definition for repeated part semantics', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Türfront', [board.id]);
    const original = model.createComponentInstance(definition.id, 'Türfront links', { translation: vec(0, 0, 0) });

    const duplicate = model.duplicateComponentInstance(original.id, 'Türfront rechts', { translation: vec(700, 0, 0) });

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.definitionId).toBe(definition.id);
    expect(model.allEntities()).toHaveLength(1);
    expect(model.allComponentDefinitions()).toHaveLength(1);
    expect(model.allComponentInstances().map((instance) => instance.definitionId)).toEqual([definition.id, definition.id]);
  });

  it('makes a unique component definition for one changed instance while leaving sibling instances shared', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Seitenwand', [board.id]);
    const left = model.createComponentInstance(definition.id, 'links');
    const right = model.duplicateComponentInstance(left.id, 'rechts', { translation: vec(700, 0, 0) });

    const unique = model.makeComponentInstanceUnique(right.id, 'Seitenwand rechts angepasst');

    expect(unique.id).not.toBe(definition.id);
    expect(model.allComponentDefinitions()).toHaveLength(2);
    expect(model.allEntities()).toHaveLength(2);
    expect(model.allComponentInstances().find((instance) => instance.id === left.id)?.definitionId).toBe(definition.id);
    expect(model.allComponentInstances().find((instance) => instance.id === right.id)?.definitionId).toBe(unique.id);
    expect(unique.entityIds).not.toContain(board.id);
    const uniqueBoard = model.getEntity(unique.entityIds[0]);
    expect(uniqueBoard).toMatchObject({ type: 'box', origin: vec(0, 0, 0), width: 600, depth: 300, height: 18 });
  });

  it('expands component instances into transformed world geometry for viewport/export adapters', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Seitenwand', [board.id]);
    const left = model.createComponentInstance(definition.id, 'links', { translation: vec(1000, 0, 0) });
    const right = model.createComponentInstance(definition.id, 'rechts', { translation: vec(2000, 0, 0), rotationZ: Math.PI / 2 });

    const worldEntities = worldEntitiesForModel(model);

    expect(worldEntities).toHaveLength(2);
    expect(worldEntities).not.toContainEqual(board);
    const leftBox = worldEntities.find((entity) => entity.id === `${left.id}:${board.id}`);
    const rightBox = worldEntities.find((entity) => entity.id === `${right.id}:${board.id}`);
    expect(leftBox).toMatchObject({ type: 'box', origin: vec(1000, 0, 0), width: 600, depth: 300, height: 18, rotationZ: 0 });
    expect(rightBox).toMatchObject({ type: 'box', width: 600, depth: 300, height: 18, rotationZ: Math.PI / 2 });
    const rightBounds = rightBox ? entityBoundingBox(rightBox) : undefined;
    expect(rightBounds?.min.x).toBeCloseTo(1700, 6);
    expect(rightBounds?.max.x).toBeCloseTo(2000, 6);
    expect(rightBounds?.min.y).toBeCloseTo(0, 6);
    expect(rightBounds?.max.y).toBeCloseTo(600, 6);
    expect(rightBounds?.size).toMatchObject({ x: 300, y: 600, z: 18 });
  });


  it('reflects source definition edits in every component instance world placement', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Regalboden', [board.id]);
    model.createComponentInstance(definition.id, 'unten', { translation: vec(0, 0, 0) });
    model.createComponentInstance(definition.id, 'oben', { translation: vec(0, 500, 0) });

    model.resizeBox(board.id, { width: 800 });

    const instanceBoxes = worldEntitiesForModel(model);
    expect(instanceBoxes).toHaveLength(2);
    expect(instanceBoxes.every((entity) => entity.type === 'box' && entity.width === 800)).toBe(true);
  });

  it('round-trips component definitions and instances while old components still load', () => {
    const legacyModel = new SketchModel();
    const legacyBox = legacyModel.createBox(vec(0, 0, 0), 100, 200, 300);
    const legacyComponent = legacyModel.createComponent('Legacy-Gruppe', [legacyBox.id]);

    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Seitenwand', [board.id]);
    model.createComponentInstance(definition.id, 'links', { translation: vec(1000, 0, 0), rotationZ: Math.PI / 2 });

    const roundTrip = importProjectFile(exportProjectFile(model));
    const legacyRoundTrip = importProjectFile(exportProjectFile(legacyModel));

    expect(roundTrip.snapshot()).toEqual(model.snapshot());
    expect(legacyRoundTrip.allComponents()).toEqual([legacyComponent]);
    expect(boxById(legacyRoundTrip, legacyBox.id)).toMatchObject({ componentId: legacyComponent.id });
  });

  it('exports instance world geometry without changing the shared source definition', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Fachboden', [board.id]);
    model.createComponentInstance(definition.id, 'Fachboden oben', { translation: vec(0, 800, 0) });

    const dxf = exportDxf(model);

    expect(model.allEntities()).toHaveLength(1);
    expect(dxf).toContain('800');
    expect((dxf.match(/LINE/g) ?? []).length).toBe(12);
  });

  it('exports rotated component-instance boxes at their transformed world coordinates', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Seitenwand', [board.id]);
    model.createComponentInstance(definition.id, 'rechts', { translation: vec(2000, 0, 0), rotationZ: Math.PI / 2 });

    const dxf = exportDxf(model);

    expectDxfLine(dxf, { x: 2000, y: 0 }, { x: 2000, y: 600 });
    expectDxfLine(dxf, { x: 2000, y: 600 }, { x: 1700, y: 600 });
    expectDxfLine(dxf, { x: 1700, y: 600 }, { x: 1700, y: 0 });
    expectDxfLine(dxf, { x: 1700, y: 0 }, { x: 2000, y: 0 });
  });

  it('rejects scaled component instances for woodworking-safe repeated part defaults', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 600, 300, 18);
    const definition = model.createComponentDefinition('Leiste', [board.id]);

    expect(() => model.createComponentInstance(definition.id, 'skaliert', { scale: vec(2, 1, 1) })).toThrow('Instanz-Skalierung ist für zuschnittsfähige Komponenten nicht erlaubt.');
  });
});
