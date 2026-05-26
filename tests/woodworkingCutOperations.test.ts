import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel, boardEntitiesForCutList, cutOperationReadinessForEntity, type CutOperation } from '../src/core/model';
import { exportProjectFile, importProjectFile } from '../src/core/projectFile';

describe('woodworking cut operations metadata', () => {
  it('keeps a side panel as one PLT board while storing an explicit shelf-pin drill row', () => {
    const model = new SketchModel();
    const side = model.createBox(vec(0, 0, 0), 720, 560, 19);
    model.assignWoodworkingClassification(side.id, 'panel', 'Seitenwand links');

    const row: CutOperation = {
      id: 'shelf-pin-row-left',
      type: 'drillRow',
      face: 'front',
      start: { x: 37, y: 64 },
      spacingMm: 32,
      count: 12,
      diameterMm: 5,
      depthMm: 12
    };
    const updated = model.assignCutOperation(side.id, row);

    expect(updated.cutOperations).toEqual([row]);
    expect(boardEntitiesForCutList(model.allEntities()).map((entity) => entity.id)).toEqual([side.id]);
    expect(cutOperationReadinessForEntity(updated)).toEqual({ ready: true, messages: [] });
  });

  it('excludes explicit cutout marker entities from board quantity rows', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 900, 600, 19);
    const marker = model.createRectangle(vec(100, 100, 0), 300, 200);
    model.assignWoodworkingClassification(board.id, 'panel', 'Arbeitsplatte');
    model.assignWoodworkingClassification(marker.id, 'cut', 'Spülenausschnitt Marker');

    expect(boardEntitiesForCutList(model.allEntities()).map((entity) => entity.id)).toEqual([board.id]);
  });

  it('stores rectangular cutouts through project-file round trips', () => {
    const model = new SketchModel();
    const top = model.createBox(vec(0, 0, 0), 1200, 650, 38);
    model.assignWoodworkingClassification(top.id, 'panel', 'Arbeitsplatte');
    model.assignCutOperation(top.id, {
      id: 'sink-cutout',
      type: 'rectangularCutout',
      face: 'top',
      origin: { x: 280, y: 180 },
      widthMm: 500,
      heightMm: 400
    });

    const roundTrip = importProjectFile(exportProjectFile(model));

    expect(roundTrip.getEntity(top.id)?.cutOperations).toEqual(model.getEntity(top.id)?.cutOperations);
  });

  it('flags unsupported cutouts as not ready for future nesting instead of silently accepting them', () => {
    const model = new SketchModel();
    const top = model.createBox(vec(0, 0, 0), 1200, 650, 38);
    model.assignWoodworkingClassification(top.id, 'panel', 'Arbeitsplatte');
    const updated = model.assignCutOperation(top.id, {
      id: 'dynamic-sink-cutout',
      type: 'unsupportedCutout',
      reason: 'verschachtelter dynamischer Ausschnitt ohne stabile Maße'
    });

    expect(cutOperationReadinessForEntity(updated)).toEqual({
      ready: false,
      messages: ['Nicht unterstützter Ausschnitt dynamic-sink-cutout: verschachtelter dynamischer Ausschnitt ohne stabile Maße']
    });
  });

  it('rejects zero or negative cut operation dimensions before storing or importing them', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 720, 560, 19);

    expect(() => model.assignCutOperation(board.id, {
      id: 'bad-row',
      type: 'drillRow',
      face: 'front',
      start: { x: 0, y: 0 },
      spacingMm: 0,
      count: 5,
      diameterMm: 5
    })).toThrow('Zuschnitt-Operation');

    const parsed = JSON.parse(exportProjectFile(model));
    parsed.model.entities[0].cutOperations = [{ id: 'bad-cutout', type: 'rectangularCutout', face: 'top', origin: { x: 0, y: 0 }, widthMm: -1, heightMm: 50 }];

    expect(() => importProjectFile(JSON.stringify(parsed))).toThrow('Projektdatei enthält ungültige Elemente.');
  });
});
