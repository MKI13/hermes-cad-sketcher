import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { entityToObject } from '../src/ui/sceneAdapter';
import { collectSnapPoints, createPushPullPreview, faceSelectionLabel, getFaceSelectionFromObject, isSameFaceSelection, pushPullPreviewMeasurement, snapPointToModel } from '../src/ui/viewportInteractionHelpers';

describe('SketchUp-like snapping and box face interaction', () => {
  it('collects endpoints and midpoints from lines and body line skeletons', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));
    const box = model.createBox(vec(0, 0, 0), 1000, 500, 300);

    const snapPoints = collectSnapPoints(model);

    expect(snapPoints).toEqual(expect.arrayContaining([
      { entityId: edge.id, kind: 'endpoint', point: vec(0, 0, 0) },
      { entityId: edge.id, kind: 'endpoint', point: vec(1000, 0, 0) },
      { entityId: edge.id, kind: 'midpoint', point: vec(500, 0, 0) },
      { entityId: box.id, kind: 'endpoint', point: vec(0, 0, 0) },
      { entityId: box.id, kind: 'endpoint', point: vec(1000, 500, 300) },
      { entityId: box.id, kind: 'midpoint', point: vec(500, 0, 0) }
    ]));
  });

  it('snaps a ground point to the nearest endpoint or midpoint when it is inside tolerance', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(1000, 0, 0));

    const snapped = snapPointToModel(vec(512, 18, 0), model, 35);

    expect(snapped).toEqual({ point: vec(500, 0, 0), kind: 'midpoint', entityId: edge.id, snapped: true });
    expect(snapPointToModel(vec(512, 80, 0), model, 35)).toEqual({ point: vec(512, 80, 0), snapped: false });
  });

  it('renders boxes as selectable faces plus visible edge lines instead of one opaque block only', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 1000, 500, 300);

    const object = entityToObject(box);

    expect(object).toBeInstanceOf(THREE.Group);
    expect(object.userData.solidFutureReady).toBe(true);
    const faceMeshes = object.children.filter((child): child is THREE.Mesh => child instanceof THREE.Mesh && Boolean(child.userData.boxFace));
    expect(faceMeshes.map((child) => child.userData.boxFace).sort()).toEqual(['back', 'bottom', 'front', 'left', 'right', 'top']);
    expect(faceMeshes.every((child) => child.userData.entityId === box.id)).toBe(true);
    expect(faceMeshes.every((child) => child.userData.entityType === 'box')).toBe(true);
    expect(object.children.some((child) => child.userData.edgeSkeleton === true)).toBe(true);
  });

  it('finds the selected body face from a clicked child object for later move or pull operations', () => {
    const root = new THREE.Group();
    root.userData.entityId = 'box_1';
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
    face.userData.boxFace = 'front';
    root.add(face);

    expect(getFaceSelectionFromObject(face)).toEqual({ entityId: 'box_1', face: 'front' });
    expect(faceSelectionLabel({ entityId: 'box_1', face: 'front' })).toBe('Fläche ausgewählt: vorne');
  });

  it('compares face selections by entity id and face so unchanged hovers can skip rebuilds', () => {
    expect(isSameFaceSelection(undefined, undefined)).toBe(true);
    expect(isSameFaceSelection({ entityId: 'box_1', face: 'front' }, { entityId: 'box_1', face: 'front' })).toBe(true);
    expect(isSameFaceSelection({ entityId: 'box_1', face: 'front' }, { entityId: 'box_1', face: 'right' })).toBe(false);
    expect(isSameFaceSelection(undefined, { entityId: 'box_1', face: 'front' })).toBe(false);
  });

  it('pushes and pulls a selected box face by changing the matching body dimension', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 1000, 500, 300);

    const pulledRight = model.pushPullBoxFace(box.id, 'right', 200);
    expect(pulledRight.width).toBe(1200);
    expect(pulledRight.origin).toEqual(vec(0, 0, 0));

    const pulledLeft = model.pushPullBoxFace(box.id, 'left', 100);
    expect(pulledLeft.width).toBe(1300);
    expect(pulledLeft.origin).toEqual(vec(-100, 0, 0));

    const pushedFront = model.pushPullBoxFace(box.id, 'front', -100);
    expect(pushedFront.depth).toBe(400);
  });


  it('builds a non-mutating live preview for selected box face Push/Pull drags', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 1000, 500, 300);

    const preview = createPushPullPreview(model, { entityId: box.id, face: 'right' }, 200);

    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error('Expected a valid Push/Pull preview');
    expect(preview.entity).toMatchObject({ id: box.id, type: 'box', width: 1200, depth: 500, height: 300 });
    expect(model.getEntity(box.id)).toMatchObject({ type: 'box', width: 1000, depth: 500, height: 300 });
    expect(pushPullPreviewMeasurement(preview.entity, 200)).toBe('Push/Pull-Vorschau: 200 mm · Körper: 1200 mm × 500 mm × 300 mm');
  });

  it('builds a non-mutating live preview for axis-aligned face extrusion drags', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(10, 20, 0), 1200, 600, {}, 'xy');

    const preview = createPushPullPreview(model, { entityId: face.id }, 720);

    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error('Expected a valid face extrusion preview');
    expect(preview.entity).toMatchObject({ type: 'box', origin: vec(10, 20, 0), width: 1200, depth: 600, height: 720 });
    expect(model.getEntity(face.id)).toEqual(face);
  });

  it('rejects live Push/Pull previews that would create invalid final dimensions', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 1000, 500, 300);

    expect(createPushPullPreview(model, { entityId: box.id, face: 'front' }, -500)).toEqual({
      ok: false,
      error: 'Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.'
    });
    expect(model.getEntity(box.id)).toEqual(box);
  });
});
