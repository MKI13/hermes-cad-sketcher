import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { createOrbitCameraState, orbitCameraDrag, cameraPositionFromOrbit, createModelGroup } from '../src/ui/viewportController';

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
});
