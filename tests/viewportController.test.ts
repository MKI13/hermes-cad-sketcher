import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SketchModel } from '../src/core/model';
import { vec } from '../src/core/geometry';
import { createModelGroup, screenDirectionForCadVector } from '../src/ui/viewportController';

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
});
