import * as THREE from 'three';
import { type Vec3 } from '../core/geometry';
import { type DrawingPlane, type SketchModel } from '../core/model';
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

export type ScreenPoint = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
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

export function createModelGroup(model: SketchModel, selectedId?: string): THREE.Group {
  const group = new THREE.Group();
  group.name = 'sketch-model';
  for (const entity of model.allEntities()) {
    const object = entityToObject(entity);
    object.userData.entityId = entity.id;
    object.userData.entityType = entity.type;
    object.userData.selected = entity.id === selectedId;
    if (object.userData.selected) applySelectedHighlight(object);
    group.add(object);
  }
  return group;
}

export function isSelectedObject(object: THREE.Object3D | undefined): boolean {
  return object?.userData.selected === true;
}

export function getEntityIdFromObject(object: THREE.Object3D | undefined): string | undefined {
  let current: THREE.Object3D | null | undefined = object;
  while (current) {
    if (typeof current.userData.entityId === 'string') return current.userData.entityId;
    current = current.parent;
  }
  return undefined;
}

export function disposeObjectTree(object: THREE.Object3D): void {
  object.traverse((child) => {
    const maybeGeometry = (child as THREE.Mesh | THREE.Line).geometry;
    if (maybeGeometry && typeof maybeGeometry.dispose === 'function') maybeGeometry.dispose();

    const maybeMaterial = (child as THREE.Mesh | THREE.Line).material;
    if (Array.isArray(maybeMaterial)) {
      for (const material of maybeMaterial) material.dispose();
    } else if (maybeMaterial && typeof maybeMaterial.dispose === 'function') {
      maybeMaterial.dispose();
    }
  });
}

function applySelectedHighlight(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Line) {
      child.material = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
    }
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      const selectedMaterial = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.18,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.82
      });
      if (Array.isArray(material)) child.material = material.map(() => selectedMaterial.clone());
      else child.material = selectedMaterial;
    }
  });
}

export function snapToGrid(point: Vec3, gridSize = 50): Vec3 {
  const safeGrid = Math.max(1, gridSize);
  return {
    x: Math.round(point.x / safeGrid) * safeGrid,
    y: Math.round(point.y / safeGrid) * safeGrid,
    z: Math.round(point.z / safeGrid) * safeGrid
  };
}

export function screenPointToGround(point: ScreenPoint, camera: THREE.PerspectiveCamera, _gridSize = 50): Vec3 | undefined {
  return screenPointToDrawingPlane(point, camera, 'xy');
}

export function screenPointToDrawingPlane(point: ScreenPoint, camera: THREE.PerspectiveCamera, plane: DrawingPlane): Vec3 | undefined {
  const width = Math.max(1, point.width);
  const height = Math.max(1, point.height);
  const pointer = new THREE.Vector2((point.x / width) * 2 - 1, -(point.y / height) * 2 + 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const groundPlane = threePlaneForDrawingPlane(plane);
  const hit = new THREE.Vector3();
  const hasHit = raycaster.ray.intersectPlane(groundPlane, hit);
  if (!hasHit) return undefined;
  return threePointToCadPoint(hit);
}

function threePlaneForDrawingPlane(plane: DrawingPlane): THREE.Plane {
  if (plane === 'xz') return new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  if (plane === 'yz') return new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
}

function threePointToCadPoint(point: THREE.Vector3): Vec3 {
  return { x: point.x, y: point.z, z: point.y };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
