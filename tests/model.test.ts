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

  it('extrudes an axis-aligned rectangle face into a box and removes the source face', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(10, 20, 0), 1000, 500);

    const box = model.extrudeFaceToBox(face.id, 300);

    expect(box).toMatchObject({ type: 'box', origin: vec(10, 20, 0), width: 1000, depth: 500, height: 300 });
    expect(model.getEntity(face.id)).toBeUndefined();
    expect(model.getEntity(box.id)).toEqual(box);
  });

  it('rejects rotated rectangle face extrusion instead of silently creating an axis-aligned bbox body', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(0, 0, 0), 1000, 500);
    model.rotateEntityZ(face.id, Math.PI / 4, model.entityCenter(face.id));

    expect(() => model.extrudeFaceToBox(face.id, 300)).toThrow('axis-aligned');
    expect(model.getEntity(face.id)?.type).toBe('face');
  });

  it('rejects skewed or non-rectangular face extrusion instead of mutating the model', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(10, 20, 0), 1000, 500);
    const snapshot = model.snapshot();
    const skewed = { ...face, vertices: [vec(10, 20, 0), vec(1010, 20, 0), vec(900, 520, 0), vec(10, 520, 0)] };
    const skewedModel = SketchModel.fromSnapshot({ ...snapshot, entities: [skewed] });

    expect(() => skewedModel.extrudeFaceToBox(face.id, 300)).toThrow('axis-aligned');
    expect(skewedModel.getEntity(face.id)).toEqual(skewed);
  });

  it('rejects degenerate rectangle faces before extrusion can replace the face', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(0, 0, 0), 1000, 500);
    const degenerate = { ...face, vertices: [vec(0, 0, 0), vec(0, 500, 0), vec(0, 500, 0), vec(0, 0, 0)] };
    const degenerateModel = SketchModel.fromSnapshot({ ...model.snapshot(), entities: [degenerate] });

    expect(() => degenerateModel.extrudeFaceToBox(face.id, 300)).toThrow('axis-aligned');
    expect(degenerateModel.getEntity(face.id)).toEqual(degenerate);
  });

  it('rejects self-intersecting rectangle-corner face order before extrusion can replace the face', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(0, 0, 0), 1000, 500);
    const bowTie = { ...face, vertices: [vec(0, 0, 0), vec(1000, 500, 0), vec(1000, 0, 0), vec(0, 500, 0)] };
    const tinyBowTie = { ...face, vertices: [vec(0, 0, 0), vec(0.001, 0.001, 0), vec(0.001, 0, 0), vec(0, 0.001, 0)] };
    const bowTieModel = SketchModel.fromSnapshot({ ...model.snapshot(), entities: [bowTie] });
    const tinyBowTieModel = SketchModel.fromSnapshot({ ...model.snapshot(), entities: [tinyBowTie] });

    expect(() => bowTieModel.extrudeFaceToBox(face.id, 300)).toThrow('axis-aligned');
    expect(bowTieModel.getEntity(face.id)).toEqual(bowTie);
    expect(() => tinyBowTieModel.extrudeFaceToBox(face.id, 300)).toThrow('axis-aligned');
    expect(tinyBowTieModel.getEntity(face.id)).toEqual(tinyBowTie);
  });

  it('rejects face extrusion heights that are zero or negative', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(10, 20, 0), 1000, 500);

    expect(() => model.extrudeFaceToBox(face.id, 0)).toThrow('positive Höhe');
    expect(() => model.extrudeFaceToBox(face.id, -1)).toThrow('positive Höhe');
  });

  it('creates boxes and push-pulls the height like a simple SketchUp body', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 600, 400, 200);
    const updated = model.pushPullBoxFace(box.id, 150);
    expect(updated.height).toBe(350);
  });

  it('edits selected box dimensions while keeping positive millimeter values', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 600, 400, 200);

    const updated = model.resizeBox(box.id, { width: 800, depth: 450, height: 250 });

    expect(updated).toMatchObject({ id: box.id, width: 800, depth: 450, height: 250 });
  });

  it('rejects box dimension edits that would make any size zero or negative', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 600, 400, 200);

    expect(() => model.resizeBox(box.id, { width: 0 })).toThrow('positive Breite, Tiefe und Höhe');
    expect(() => model.resizeBox(box.id, { depth: -1 })).toThrow('positive Breite, Tiefe und Höhe');
    expect(() => model.resizeBox(box.id, { height: 0 })).toThrow('positive Breite, Tiefe und Höhe');
  });

  it('rejects non-finite box dimensions in both create and resize paths', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 600, 400, 200);

    expect(() => model.createBox(vec(0, 0, 0), Number.POSITIVE_INFINITY, 400, 200)).toThrow('positive Breite, Tiefe und Höhe');
    expect(() => model.createBox(vec(0, 0, 0), 600, Number.NaN, 200)).toThrow('positive Breite, Tiefe und Höhe');
    expect(() => model.resizeBox(box.id, { width: Number.POSITIVE_INFINITY })).toThrow('positive Breite, Tiefe und Höhe');
    expect(() => model.resizeBox(box.id, { depth: Number.NaN })).toThrow('positive Breite, Tiefe und Höhe');
    expect(() => model.pushPullBoxFace(box.id, Number.POSITIVE_INFINITY)).toThrow('positive Höhe');
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

  it('rejects invalid reference mesh triangles before storing them in the model', () => {
    const model = new SketchModel();

    expect(() => model.addReferenceMesh('non-finite.stl', [
      { vertices: [vec(0, 0, 0), vec(Number.NaN, 0, 0), vec(0, 50, 0)] }
    ])).toThrow('finiten Koordinaten');
    expect(model.allEntities()).toEqual([]);
  });

  it('rejects sparse reference mesh triangle arrays before storing them in the model', () => {
    const model = new SketchModel();
    const sparseTriangles = new Array(1) as Parameters<typeof model.addReferenceMesh>[1];

    expect(() => model.addReferenceMesh('sparse-triangles.stl', sparseTriangles)).toThrow('finiten Koordinaten');
    expect(model.allEntities()).toEqual([]);
  });

  it('rejects sparse reference mesh vertex arrays before storing them in the model', () => {
    const model = new SketchModel();
    const sparseVertices = [vec(0, 0, 0), , vec(0, 50, 0)] as unknown as [ReturnType<typeof vec>, ReturnType<typeof vec>, ReturnType<typeof vec>];

    expect(() => model.addReferenceMesh('sparse-vertices.stl', [
      { vertices: sparseVertices }
    ])).toThrow('finiten Koordinaten');
    expect(model.allEntities()).toEqual([]);
  });

  it('validates the exact cloned reference mesh triangles that it stores', () => {
    const model = new SketchModel();
    let xReads = 0;
    const vertexWithChangingGetter = {
      get x() {
        xReads += 1;
        return xReads === 1 ? 100 : Number.NaN;
      },
      y: 0,
      z: 0
    } as ReturnType<typeof vec>;

    const entity = model.addReferenceMesh('accessor-backed.stl', [
      { vertices: [vec(0, 0, 0), vertexWithChangingGetter, vec(0, 50, 0)] }
    ]);

    expect(Number.isFinite(entity.triangles[0].vertices[1].x)).toBe(true);
    expect(model.allEntities()).toEqual([entity]);
  });

  it('duplicates reference mesh components with the same stable millimeter offset', () => {
    const model = new SketchModel();
    const mesh = model.addReferenceMesh('synthetic-reference.stl', [
      { vertices: [vec(0, 0, 0), vec(100, 0, 0), vec(0, 50, 0)] }
    ]);
    const original = model.createComponent('Referenzteil', [mesh.id]);

    const duplicate = model.duplicateComponent(original.id, 'Referenzteil Kopie', vec(1000, -200, 25));
    const copiedMesh = model.getEntity(duplicate.entityIds[0]);

    expect(copiedMesh?.type).toBe('referenceMesh');
    if (copiedMesh?.type === 'referenceMesh') {
      expect(copiedMesh.triangles[0].vertices).toEqual([
        vec(1000, -200, 25),
        vec(1100, -200, 25),
        vec(1000, -150, 25)
      ]);
      expect(copiedMesh.componentId).toBe(duplicate.id);
    }
  });

  it('deletes a selected entity from the model', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 100, 100);

    expect(model.deleteEntity(box.id)).toBe(true);

    expect(model.getEntity(box.id)).toBeUndefined();
    expect(model.allEntities()).toEqual([]);
  });

  it('updates component membership and removes empty components when deleting members', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 100, 100);
    const line = model.createLine(vec(0, 0, 0), vec(100, 0, 0));
    const component = model.createComponent('Rahmen', [box.id, line.id]);

    model.deleteEntity(box.id);

    expect(model.allComponents()).toEqual([{ ...component, entityIds: [line.id] }]);
    expect(model.getEntity(line.id)?.componentId).toBe(component.id);

    model.deleteEntity(line.id);

    expect(model.allComponents()).toEqual([]);
  });
});
