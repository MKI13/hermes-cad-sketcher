import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { exportProjectFile, importProjectFile, PROJECT_FILE_VERSION } from '../src/core/projectFile';

describe('Hermes CAD project files', () => {
  it('exports a versioned .hcad.json document with millimeter units', () => {
    const model = new SketchModel();
    model.createLine(vec(0, 0, 0), vec(1000, 0, 0));

    const json = exportProjectFile(model);
    const parsed = JSON.parse(json);

    expect(parsed).toMatchObject({
      format: 'hermes-cad-sketcher',
      version: PROJECT_FILE_VERSION,
      model: { unit: 'mm' }
    });
    expect(parsed.model.entities).toHaveLength(1);
  });

  it('imports a previously exported project without losing entities or components', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(10, 20, 0), 600, 700, 800);
    const line = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));
    model.createComponent('Test-Komponente', [box.id, line.id]);

    const roundTrip = importProjectFile(exportProjectFile(model));

    expect(roundTrip.snapshot()).toEqual(model.snapshot());
  });

  it('preserves STL reference mesh entities through project round trips', () => {
    const model = new SketchModel();
    model.addReferenceMesh('synthetic-reference.stl', [
      { vertices: [vec(0, 0, 0), vec(100, 0, 0), vec(0, 50, 0)] }
    ]);

    const roundTrip = importProjectFile(exportProjectFile(model));

    expect(roundTrip.snapshot()).toEqual(model.snapshot());
  });

  it('rejects invalid JSON and wrong project formats with clear errors', () => {
    expect(() => importProjectFile('not-json')).toThrow('Projektdatei ist kein gültiges JSON.');
    expect(() => importProjectFile(JSON.stringify({ format: 'other-cad', version: 1 }))).toThrow('Nicht unterstütztes Projektformat.');
  });

  it('rejects project files with unsupported versions or non-millimeter units', () => {
    const model = new SketchModel();
    const parsed = JSON.parse(exportProjectFile(model));

    expect(() => importProjectFile(JSON.stringify({ ...parsed, version: 999 }))).toThrow('Nicht unterstützte Projektdatei-Version.');
    expect(() => importProjectFile(JSON.stringify({ ...parsed, model: { ...parsed.model, unit: 'inch' } }))).toThrow('Nur Millimeter-Projekte werden unterstützt.');
  });

  it('rejects malformed entity payloads before restoring the model', () => {
    const model = new SketchModel();
    const parsed = JSON.parse(exportProjectFile(model));

    const malformedEdge = {
      id: 'edge_1',
      type: 'edge',
      start: vec(0, 0, 0),
      end: { x: 100, y: 0 }
    };

    expect(() => importProjectFile(JSON.stringify({
      ...parsed,
      model: { ...parsed.model, entities: [malformedEdge] }
    }))).toThrow('Projektdatei enthält ungültige Elemente.');
  });

  it('rejects components that reference missing entities', () => {
    const model = new SketchModel();
    const parsed = JSON.parse(exportProjectFile(model));

    expect(() => importProjectFile(JSON.stringify({
      ...parsed,
      model: {
        ...parsed.model,
        entities: [],
        components: [{ id: 'component_1', name: 'Leer', entityIds: ['edge_missing'] }]
      }
    }))).toThrow('Projektdatei enthält ungültige Komponenten.');
  });
});
