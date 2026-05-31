import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SketchModel } from '../src/core/model';
import { vec } from '../src/core/geometry';
import { createModelGroup, inferRectanglePlaneFromScreenDrag, screenDirectionForCadVector, screenPointToAnchoredDrawingPlane } from '../src/ui/viewportController';

describe('viewport controller push/pull selection helpers', () => {
  it('highlights only the selected body face when a box face is active', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 1000, 500, 300);

    const group = createModelGroup(model, box.id, [], { entityId: box.id, face: 'right' });
    const highlightedFaces: string[] = [];
    const unselectedFaceColors: number[] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.boxFace) {
        const color = (child.material as THREE.MeshStandardMaterial).color.getHex();
        if (color === 0x2563eb) highlightedFaces.push(child.userData.boxFace);
        else unselectedFaceColors.push(color);
      }
    });

    expect(highlightedFaces).toEqual(['right']);
    expect(unselectedFaceColors.length).toBe(5);
    expect(unselectedFaceColors).not.toContain(0x2563eb);
  });

  it('projects a CAD face normal into screen space for view-aware push/pull dragging', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    camera.position.set(1000, 1000, 1000);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const direction = screenDirectionForCadVector({ camera, origin: vec(0, 0, 0), direction: vec(100, 0, 0), width: 800, height: 600 });

    expect(direction).toBeDefined();
    expect(Math.hypot(direction!.x, direction!.y)).toBeCloseTo(1, 5);
  });

  it('projects free mouse points onto a drawing plane anchored at the first rectangle corner', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    camera.position.set(1200, 900, 900);
    camera.lookAt(new THREE.Vector3(100, 300, 200));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const anchor = vec(100, 200, 300);
    const target = new THREE.Vector3(500, 900, 200);
    const projected = target.clone().project(camera);

    const point = screenPointToAnchoredDrawingPlane({
      x: ((projected.x + 1) / 2) * 800,
      y: ((1 - projected.y) / 2) * 800,
      width: 800,
      height: 800
    }, camera, 'xz', anchor);

    expect(point).toBeDefined();
    expect(point!.y).toBeCloseTo(anchor.y, 5);
    expect(point!.x).toBeCloseTo(500, 1);
    expect(point!.z).toBeCloseTo(900, 1);
  });

  it('infers the live rectangle plane from the mouse drag direction instead of requiring bottom buttons', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
    camera.position.set(1600, 1300, 1200);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const startScreen = { x: 400, y: 320, width: 800, height: 640 };
    const anchor = vec(0, 0, 0);
    const red = screenDirectionForCadVector({ camera, origin: anchor, direction: vec(1000, 0, 0), width: 800, height: 640 })!;
    const blue = screenDirectionForCadVector({ camera, origin: anchor, direction: vec(0, 0, 1000), width: 800, height: 640 })!;

    const currentScreen = {
      ...startScreen,
      x: startScreen.x + red.x * 90 + blue.x * 140,
      y: startScreen.y + red.y * 90 + blue.y * 140
    };

    expect(inferRectanglePlaneFromScreenDrag({ camera, anchor, startScreen, currentScreen, fallback: 'xy' })).toBe('xz');
  });
});
