import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import {
  createOrbitCameraState,
  orbitCameraDrag,
  cameraPositionFromOrbit,
  createModelGroup,
  disposeObjectTree,
  getEntityIdFromObject,
  isSelectedObject,
  snapToGrid,
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
    camera.position.set(0, 1000, 1000);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const groundPoint = screenPointToGround({ x: 500, y: 500, width: 1000, height: 1000 }, camera, 50);

    expect(groundPoint).toEqual(vec(0, 0, 0));
  });
});
