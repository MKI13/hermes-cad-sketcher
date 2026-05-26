import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel, partMaterialReadinessForEntity, type PartMaterialMetadata } from '../src/core/model';

describe('woodworking part material metadata', () => {
  it('stores material identity, grain direction, board thickness and edge banding on a real part', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 720, 560, 19);
    const metadata: PartMaterialMetadata = {
      materialId: 'spanplatte-weiss-19',
      materialName: 'Spanplatte weiß 19 mm',
      boardType: 'beschichtete Spanplatte',
      thicknessMm: 19,
      grainDirection: 'length',
      edging: {
        front: { materialName: 'ABS weiß', thicknessMm: 2 },
        back: { materialName: 'ABS weiß', thicknessMm: 1 },
        left: { materialName: 'ABS weiß', thicknessMm: 1 },
        right: { materialName: 'ABS weiß', thicknessMm: 1 }
      }
    };

    const updated = model.assignPartMaterial(box.id, metadata);

    expect(updated.partMaterial).toEqual(metadata);
    expect(partMaterialReadinessForEntity(updated)).toEqual({ ready: true, messages: [] });
  });

  it('reports missing grain and material data before a part is cut-list ready', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 720, 560, 19);

    expect(partMaterialReadinessForEntity(model.getEntity(box.id))).toEqual({
      ready: false,
      messages: ['Materialdaten fehlen', 'Faserrichtung fehlt']
    });
  });

  it('keeps part material metadata when component parts are duplicated', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 720, 560, 19);
    model.assignPartMaterial(box.id, {
      materialId: 'birke-multiplex-18',
      materialName: 'Birke Multiplex 18 mm',
      thicknessMm: 18,
      grainDirection: 'width'
    });
    const original = model.createComponent('Fachboden', [box.id]);

    const duplicate = model.duplicateComponent(original.id, 'Fachboden Kopie', vec(0, 600, 0));
    const copied = model.getEntity(duplicate.entityIds[0]);

    expect(copied?.partMaterial).toMatchObject({ materialName: 'Birke Multiplex 18 mm', grainDirection: 'width' });
  });
});
