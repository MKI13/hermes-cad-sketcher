import { describe, expect, it } from 'vitest';
import { SketchModel } from '../src/core/model';
import { inspectEntity } from '../src/core/inspection';
import { importAsciiStl } from '../src/core/stl';
import { vec } from '../src/core/geometry';

describe('entity inspection', () => {
  it('reports line length and endpoints in millimeters', () => {
    const model = new SketchModel();
    const line = model.createLine(vec(0, 0, 0), vec(300, 400, 0));

    const inspection = inspectEntity(line);

    expect(inspection).toMatchObject({
      id: line.id,
      type: 'edge',
      title: 'Linie'
    });
    expect(inspection.metrics).toContainEqual({ label: 'Länge', value: '500 mm' });
    expect(inspection.metrics).toContainEqual({ label: 'Start', value: '0 / 0 / 0 mm' });
    expect(inspection.metrics).toContainEqual({ label: 'Ende', value: '300 / 400 / 0 mm' });
    expect(inspection.boundingBox.size).toEqual(vec(300, 400, 0));
  });

  it('reports imported CAD layer metadata when available', () => {
    const model = new SketchModel();
    const line = model.createLine(vec(0, 0, 0), vec(300, 400, 0), { layer: 'walls' });

    const inspection = inspectEntity(line);

    expect(inspection.metrics).toContainEqual({ label: 'Layer', value: 'walls' });
  });

  it('reports rectangle dimensions and bounding box in millimeters', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(100, 200, 0), 1200, 800);

    const inspection = inspectEntity(face);

    expect(inspection.type).toBe('face');
    expect(inspection.title).toBe('Rechteck/Fläche');
    expect(inspection.metrics).toContainEqual({ label: 'Breite', value: '1200 mm' });
    expect(inspection.metrics).toContainEqual({ label: 'Tiefe', value: '800 mm' });
    expect(inspection.boundingBox.min).toEqual(vec(100, 200, 0));
    expect(inspection.boundingBox.size).toEqual(vec(1200, 800, 0));
  });

  it('reports box dimensions, rotation and bounding box in millimeters', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 2400, 900, 720);
    const rotated = model.rotateEntityZ(box.id, Math.PI / 2);

    const inspection = inspectEntity(rotated);

    expect(inspection.type).toBe('box');
    expect(inspection.title).toBe('Körper');
    expect(inspection.metrics).toContainEqual({ label: 'Breite', value: '2400 mm' });
    expect(inspection.metrics).toContainEqual({ label: 'Tiefe', value: '900 mm' });
    expect(inspection.metrics).toContainEqual({ label: 'Höhe', value: '720 mm' });
    expect(inspection.metrics).toContainEqual({ label: 'Rotation Z', value: '90°' });
    expect(inspection.boundingBox.size.x).toBeCloseTo(900, 6);
    expect(inspection.boundingBox.size.y).toBeCloseTo(2400, 6);
    expect(inspection.boundingBox.size.z).toBe(720);
    expect(inspection.metrics).toContainEqual({ label: 'Bounding Box Größe', value: '900 / 2400 / 720 mm' });
  });

  it('reports STL reference meshes as non-editable reference geometry', () => {
    const model = new SketchModel();
    const mesh = importAsciiStl(`solid ref
facet normal 0 0 1
outer loop
vertex 0 0 0
vertex 100 0 0
vertex 0 50 0
endloop
endfacet
endsolid ref
`, 'synthetic-reference.stl');
    const entity = model.addReferenceMesh(mesh.name, mesh.triangles);

    const inspection = inspectEntity(entity);

    expect(inspection.type).toBe('referenceMesh');
    expect(inspection.title).toBe('STL-Referenzmesh');
    expect(inspection.metrics).toContainEqual({ label: 'Name', value: 'synthetic-reference.stl' });
    expect(inspection.metrics).toContainEqual({ label: 'Dreiecke', value: '1' });
    expect(inspection.metrics).toContainEqual({ label: 'Bearbeitung', value: 'Referenz, kein editierbarer Körper' });
    expect(inspection.boundingBox.size).toEqual(vec(100, 50, 0));
  });
});
