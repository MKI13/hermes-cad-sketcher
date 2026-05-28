import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { defaultMaterials } from '../src/core/materials';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { importAsciiStl } from '../src/core/stl';
import {
  createOrbitCameraState,
  orbitCameraDrag,
  cameraPositionFromOrbit,
  createModelGroup,
  disposeObjectTree,
  getEntityIdFromObject,
  isSelectedObject,
  snapToGrid,
  screenPointToDrawingPlane,
  screenPointToGround
} from '../src/ui/viewportController';

describe('interactive Three.js viewport foundation', () => {
  it('orbits camera when the right mouse button drag delta is applied', () => {
    const initial = createOrbitCameraState({ target: vec(0, 0, 0), radius: 1000, azimuth: 0, polar: Math.PI / 3 });
    const next = orbitCameraDrag(initial, { deltaX: 120, deltaY: -60, viewportWidth: 1200, viewportHeight: 800 });

    expect(next.azimuth).toBeGreaterThan(initial.azimuth);
    expect(next.polar).toBeLessThan(initial.polar);
    expect(next.radius).toBe(1000);
  });

  it('clamps polar angle so the camera cannot flip upside down', () => {
    const initial = createOrbitCameraState({ target: vec(0, 0, 0), radius: 1000, azimuth: 0, polar: 0.05 });
    const next = orbitCameraDrag(initial, { deltaX: 0, deltaY: -10000, viewportWidth: 1000, viewportHeight: 1000 });

    expect(next.polar).toBeGreaterThanOrEqual(0.1);
  });

  it('converts orbit state to a Three.js camera position using x/z ground axes and y height', () => {
    const state = createOrbitCameraState({ target: vec(0, 0, 0), radius: 1000, azimuth: 0, polar: Math.PI / 2 });
    const position = cameraPositionFromOrbit(state);

    expect(Math.round(position.x)).toBe(0);
    expect(Math.round(position.y)).toBe(0);
    expect(Math.round(position.z)).toBe(1000);
  });

  it('creates a Three.js group with one child per model entity and stable entity userData', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);
    const line = model.createLine(vec(0, 0, 0), vec(100, 0, 0));

    const group = createModelGroup(model);

    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.children).toHaveLength(2);
    expect(group.children.map((child) => child.userData.entityId)).toEqual([box.id, line.id]);
  });

  it('skips hidden entities and renders applied material colors like the Materials tray', () => {
    const model = new SketchModel();
    const painted = model.createRectangle(vec(0, 0, 0), 1000, 500);
    const hidden = model.createLine(vec(0, 0, 0), vec(100, 0, 0));
    model.applyMaterial(painted.id, { name: 'Holz', color: '#b45309' });
    model.hideEntity(hidden.id);

    const group = createModelGroup(model);

    expect(group.children.map((child) => child.userData.entityId)).toEqual([painted.id]);
    const mesh = group.children[0] as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('b45309');
  });

  it('uses stable materialId catalog colors when no legacy material color is stored on the entity', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 50, 25);
    model.applyMaterial(box.id, { materialId: 'wood-light' });

    const group = createModelGroup(model, undefined, defaultMaterials());

    const boxObject = group.children[0] as THREE.Group;
    const mesh = boxObject.children[0] as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('d97706');
  });

  it('renders push/pull preview entities without requiring a full SketchModel instance', () => {
    const model = { allEntities: () => [{ id: 'box_1', type: 'box' as const, origin: vec(0, 0, 0), width: 100, depth: 50, height: 25, rotationZ: 0, materialId: 'wood-light' }] };

    const group = createModelGroup(model, undefined, defaultMaterials());

    expect(group.children).toHaveLength(1);
    const boxObject = group.children[0] as THREE.Group;
    const mesh = boxObject.children[0] as THREE.Mesh;
    expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('d97706');
  });

  it('passes the live material catalog into ThreeViewport push/pull preview rendering', async () => {
    const source = await readFile('src/ui/ThreeViewport.tsx', 'utf8');

    expect(source).not.toContain('createModelGroup({ allEntities: () => [preview.entity] } as SketchModel, undefined)');
    expect(source).toContain('createModelGroup({ allEntities: () => [preview.entity] }');
    expect(source).toContain('model.allMaterials()');
  });

  it('renders STL reference meshes as transparent wireframe mesh geometry', () => {
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

    const group = createModelGroup(model);
    const object = group.children[0];

    expect(object.userData.entityId).toBe(entity.id);
    expect(object.userData.entityType).toBe('referenceMesh');
    expect(object).toBeInstanceOf(THREE.Mesh);
    expect((object as THREE.Mesh).geometry.getAttribute('position').count).toBe(3);
    const material = (object as THREE.Mesh).material;
    expect(Array.isArray(material)).toBe(false);
    if (!Array.isArray(material)) {
      expect(material.transparent).toBe(true);
      expect((material as THREE.MeshStandardMaterial).wireframe).toBe(true);
    }
  });

  it('marks only the selected entity object for viewport highlighting', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);
    const line = model.createLine(vec(0, 0, 0), vec(100, 0, 0));

    const group = createModelGroup(model, line.id);

    const byEntityId = new Map(group.children.map((child) => [child.userData.entityId, child]));
    const unselectedBox = byEntityId.get(box.id);
    const selectedLine = byEntityId.get(line.id);
    expect(isSelectedObject(unselectedBox)).toBe(false);
    expect(isSelectedObject(selectedLine)).toBe(true);
    expect(selectedLine).toBeInstanceOf(THREE.Line);
    if (selectedLine instanceof THREE.Line && !Array.isArray(selectedLine.material)) {
      expect(selectedLine.material.color.getHex()).toBe(0x2563eb);
    }
  });

  it('marks only selected component instance world geometry for viewport highlighting', () => {
    const model = new SketchModel();
    const board = model.createBox(vec(0, 0, 0), 100, 200, 18);
    const definition = model.createComponentDefinition('Board', [board.id]);
    const first = model.createComponentInstance(definition.id, 'first');
    const second = model.createComponentInstance(definition.id, 'second', { translation: vec(300, 0, 0) });

    const group = createModelGroup(model, second.id);
    const byEntityId = new Map(group.children.map((child) => [child.userData.entityId, child]));

    expect(isSelectedObject(byEntityId.get(`${first.id}:${board.id}`))).toBe(false);
    expect(isSelectedObject(byEntityId.get(`${second.id}:${board.id}`))).toBe(true);
    expect(byEntityId.get(`${second.id}:${board.id}`)?.userData.componentInstanceId).toBe(second.id);
    expect(byEntityId.get(`${second.id}:${board.id}`)?.userData.sourceEntityId).toBe(board.id);
  });

  it('finds entity ids on hit ancestors for robust picking', () => {
    const root = new THREE.Group();
    const child = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    root.userData.entityId = 'box_1';
    root.add(child);

    expect(getEntityIdFromObject(child)).toBe('box_1');
  });

  it('disposes geometries and materials in viewport object trees', () => {
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial();
    let geometryDisposed = false;
    let materialDisposed = false;
    geometry.addEventListener('dispose', () => { geometryDisposed = true; });
    material.addEventListener('dispose', () => { materialDisposed = true; });
    group.add(new THREE.Mesh(geometry, material));

    disposeObjectTree(group);

    expect(geometryDisposed).toBe(true);
    expect(materialDisposed).toBe(true);
  });

  it('snaps ground points to the configured millimeter grid', () => {
    expect(snapToGrid(vec(124, 276, 0), 50)).toEqual(vec(100, 300, 0));
    expect(snapToGrid(vec(-124, -276, 0), 100)).toEqual(vec(-100, -300, 0));
  });

  it('projects the center of the screen onto the millimeter ground plane', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100000);
    camera.position.set(123.4, 1000, 1456.7);
    camera.lookAt(new THREE.Vector3(123.4, 0, 456.7));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const groundPoint = screenPointToGround({ x: 500, y: 500, width: 1000, height: 1000 }, camera, 50);

    expect(groundPoint?.x).toBeCloseTo(123.4, 6);
    expect(groundPoint?.y).toBeCloseTo(456.7, 6);
    expect(groundPoint?.z).toBeCloseTo(0, 6);
  });

  it('projects screen points onto vertical red-blue and green-blue drawing planes', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100000);
    camera.position.set(800, 1000, 1200);
    camera.lookAt(new THREE.Vector3(100, 250, 0));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const redBluePoint = screenPointToDrawingPlane({ x: 500, y: 500, width: 1000, height: 1000 }, camera, 'xz');
    expect(redBluePoint?.x).toBeCloseTo(100, 6);
    expect(redBluePoint?.y).toBeCloseTo(0, 6);
    expect(redBluePoint?.z).toBeCloseTo(250, 6);

    camera.lookAt(new THREE.Vector3(0, 250, 100));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const greenBluePoint = screenPointToDrawingPlane({ x: 500, y: 500, width: 1000, height: 1000 }, camera, 'yz');
    expect(greenBluePoint?.x).toBeCloseTo(0, 6);
    expect(greenBluePoint?.y).toBeCloseTo(100, 6);
    expect(greenBluePoint?.z).toBeCloseTo(250, 6);
  });
});
