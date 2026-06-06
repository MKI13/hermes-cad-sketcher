import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import {
  buildRenderJob,
  buildRenderSceneSnapshot,
  normalizeRenderMaterial,
  renderMaterialFromCadMaterial
} from '../src/core/rendering';

describe('rendering scene snapshots', () => {
  it('converts existing CAD materials into validated PBR render materials', () => {
    const material = renderMaterialFromCadMaterial({ id: 'oak-board', name: 'Eiche Platte', color: '#b45309' });

    expect(material).toMatchObject({
      id: 'oak-board',
      name: 'Eiche Platte',
      category: 'wood',
      baseColor: '#b45309',
      roughness: expect.any(Number),
      metalness: 0,
      source: { kind: 'builtin', license: 'Hermes CAD starter material' }
    });
    expect(material.roughness).toBeGreaterThanOrEqual(0);
    expect(material.roughness).toBeLessThanOrEqual(1);
  });

  it('rejects unsafe render material ids, colors, ranges, and texture scales', () => {
    expect(() => normalizeRenderMaterial({ id: 'bad id', name: 'Bad', category: 'generic', baseColor: '#ffffff', roughness: 0.5, metalness: 0 })).toThrow('Material-ID');
    expect(() => normalizeRenderMaterial({ id: 'bad-color', name: 'Bad', category: 'generic', baseColor: 'white', roughness: 0.5, metalness: 0 })).toThrow('Farbe');
    expect(() => normalizeRenderMaterial({ id: 'bad-roughness', name: 'Bad', category: 'generic', baseColor: '#ffffff', roughness: 2, metalness: 0 })).toThrow('Roughness');
    expect(() => normalizeRenderMaterial({ id: 'bad-scale', name: 'Bad', category: 'generic', baseColor: '#ffffff', roughness: 0.5, metalness: 0, textureScaleMm: { x: 0, y: 10 } })).toThrow('Texturmaßstab');
  });

  it('builds a millimeter render scene snapshot without mutating the CAD model', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(10, 20, 30), 600, 400, 200);
    model.applyMaterial(box.id, { materialId: 'wood-light' });
    const component = model.createComponent('Render-Korpus', [box.id]);
    const before = model.snapshot();

    const snapshot = buildRenderSceneSnapshot(model, { sourceProjectId: 'demo-project' });

    expect(snapshot).toMatchObject({ version: 1, unit: 'mm', sourceProjectId: 'demo-project' });
    expect(snapshot.objects).toHaveLength(1);
    expect(snapshot.objects[0]).toMatchObject({
      id: `render-${box.id}`,
      sourceEntityId: box.id,
      sourceComponentId: component.id,
      name: 'Render-Korpus / box',
      kind: 'box',
      transform: { position: [10, 20, 30], rotationEuler: [0, 0, 0], scale: [600, 400, 200] },
      materialId: 'wood-light',
      visible: true,
      selectable: true
    });
    expect(snapshot.materials.some((material) => material.id === 'wood-light')).toBe(true);
    expect(snapshot.cameras[0]).toMatchObject({ id: 'camera-main', type: 'perspective' });
    expect(snapshot.lights[0]).toMatchObject({ id: 'key-light', type: 'directional' });
    expect(model.snapshot()).toEqual(before);
  });

  it('creates a safe render job for the internal Three.js preview bridge contract', () => {
    const model = new SketchModel();
    model.createBox(vec(0, 0, 0), 100, 100, 100);
    const sceneSnapshot = buildRenderSceneSnapshot(model);

    const job = buildRenderJob({ engine: 'three-preview', quality: 'preview', width: 1280, height: 720, sceneSnapshot });

    expect(job).toMatchObject({ version: 1, engine: 'three-preview', quality: 'preview', width: 1280, height: 720, samples: 32 });
    expect(job.sceneSnapshot.objects).toHaveLength(1);
  });
});
