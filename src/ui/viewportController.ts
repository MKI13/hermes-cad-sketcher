import * as THREE from 'three';
import { type Vec3 } from '../core/geometry';
import { type SketchModel } from '../core/model';
import { entityToObject } from './sceneAdapter';

export type OrbitCameraState = Readonly<{
  target: Vec3;
  radius: number;
  azimuth: number;
  polar: number;
}>;

export type OrbitDrag = Readonly<{
  deltaX: number;
  deltaY: number;
  viewportWidth: number;
  viewportHeight: number;
}>;

const MIN_POLAR = 0.1;
const MAX_POLAR = Math.PI - 0.1;

export function createOrbitCameraState(input?: Partial<OrbitCameraState>): OrbitCameraState {
  return {
    target: input?.target ?? { x: 0, y: 0, z: 0 },
    radius: input?.radius ?? 5000,
    azimuth: input?.azimuth ?? Math.PI / 4,
    polar: clamp(input?.polar ?? Math.PI / 3, MIN_POLAR, MAX_POLAR)
  };
}

export function orbitCameraDrag(state: OrbitCameraState, drag: OrbitDrag): OrbitCameraState {
  const width = Math.max(1, drag.viewportWidth);
  const height = Math.max(1, drag.viewportHeight);
  const azimuthDelta = (drag.deltaX / width) * Math.PI * 2;
  const polarDelta = (drag.deltaY / height) * Math.PI;
  return {
    ...state,
    azimuth: state.azimuth + azimuthDelta,
    polar: clamp(state.polar + polarDelta, MIN_POLAR, MAX_POLAR)
  };
}

export function cameraPositionFromOrbit(state: OrbitCameraState): THREE.Vector3 {
  const sinPolar = Math.sin(state.polar);
  const x = state.target.x + state.radius * sinPolar * Math.sin(state.azimuth);
  const y = state.target.z + state.radius * Math.cos(state.polar);
  const z = state.target.y + state.radius * sinPolar * Math.cos(state.azimuth);
  return new THREE.Vector3(x, y, z);
}

export function applyOrbitToCamera(camera: THREE.PerspectiveCamera, state: OrbitCameraState): void {
  const position = cameraPositionFromOrbit(state);
  camera.position.copy(position);
  camera.lookAt(new THREE.Vector3(state.target.x, state.target.z, state.target.y));
}

export function createModelGroup(model: SketchModel): THREE.Group {
  const group = new THREE.Group();
  group.name = 'sketch-model';
  for (const entity of model.allEntities()) {
    const object = entityToObject(entity);
    object.userData.entityId = entity.id;
    object.userData.entityType = entity.type;
    group.add(object);
  }
  return group;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
