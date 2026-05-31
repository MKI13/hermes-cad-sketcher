import * as THREE from 'three';
import { add, scale, type Vec3 } from '../core/geometry';
import { type BoxFaceName, type DrawingPlane, type SketchModel } from '../core/model';
import type { MaterialDefinition } from '../core/materials';
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

export type ViewportAxisLock = 'x' | 'y' | 'z';

const MIN_POLAR = 0.1;
const MAX_POLAR = Math.PI - 0.1;
export const AXIS_GUIDE_PICK_THRESHOLD = 96;

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

export function panOrbitCameraDrag(state: OrbitCameraState, drag: OrbitDrag): OrbitCameraState {
  const width = Math.max(1, drag.viewportWidth);
  const height = Math.max(1, drag.viewportHeight);
  const position = cameraPositionFromOrbit(state);
  const target = new THREE.Vector3(state.target.x, state.target.z, state.target.y);
  const forward = target.clone().sub(position).normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const panScale = state.radius / Math.max(width, height);
  const cadRight = threeVectorToCadPoint(right);
  const cadUp = threeVectorToCadPoint(up);
  const delta = add(scale(cadRight, -drag.deltaX * panScale), scale(cadUp, drag.deltaY * panScale));
  return { ...state, target: add(state.target, delta) };
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

export function createModelGroup(model: Pick<SketchModel, 'allEntities'>, selectedId?: string, materials: readonly MaterialDefinition[] = 'allMaterials' in model && typeof model.allMaterials === 'function' ? model.allMaterials() : [], selectedFace?: { entityId: string; face: BoxFaceName }): THREE.Group {
  const group = new THREE.Group();
  group.name = 'sketch-model';
  for (const entity of model.allEntities()) {
    if (entity.hidden) continue;
    const object = entityToObject(entity, materials);
    object.userData.entityId = entity.id;
    object.userData.entityType = entity.type;
    object.userData.selected = entity.id === selectedId;
    if (object.userData.selected && selectedFace?.entityId === entity.id) applySelectedFaceHighlight(object, selectedFace.face);
    else if (object.userData.selected) applySelectedHighlight(object);
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
    if (child instanceof THREE.Mesh) applyMeshHighlight(child);
  });
}

function applySelectedFaceHighlight(object: THREE.Object3D, face: BoxFaceName): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.boxFace === face) applyMeshHighlight(child);
  });
}

function applyMeshHighlight(child: THREE.Mesh): void {
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
  return screenPointToAnchoredDrawingPlane(point, camera, plane, { x: 0, y: 0, z: 0 });
}

export function screenPointToAnchoredDrawingPlane(point: ScreenPoint, camera: THREE.PerspectiveCamera, plane: DrawingPlane, anchor: Vec3): Vec3 | undefined {
  const raycaster = raycasterForScreenPoint(point, camera);
  const drawingPlane = threePlaneForDrawingPlane(plane, anchor);
  const hit = new THREE.Vector3();
  const hasHit = raycaster.ray.intersectPlane(drawingPlane, hit);
  if (!hasHit) return undefined;
  return threePointToCadPoint(hit);
}

export function inferRectanglePlaneFromScreenDrag(input: {
  camera: THREE.PerspectiveCamera;
  anchor: Vec3;
  startScreen: ScreenPoint;
  currentScreen: ScreenPoint;
  fallback: DrawingPlane;
}): DrawingPlane {
  const dx = input.currentScreen.x - input.startScreen.x;
  const dy = input.currentScreen.y - input.startScreen.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 8) return input.fallback;
  const drag = { x: dx / length, y: dy / length };
  const directionForAxis = (axis: ViewportAxisLock) => screenDirectionForCadVector({
    camera: input.camera,
    origin: input.anchor,
    direction: axis === 'x' ? { x: 1000, y: 0, z: 0 } : axis === 'y' ? { x: 0, y: 1000, z: 0 } : { x: 0, y: 0, z: 1000 },
    width: input.currentScreen.width,
    height: input.currentScreen.height
  });
  const xDirection = directionForAxis('x');
  const yDirection = directionForAxis('y');
  const zDirection = directionForAxis('z');
  if (!xDirection || !yDirection || !zDirection) return input.fallback;
  const zScore = Math.abs(zDirection.x * drag.x + zDirection.y * drag.y);
  if (zScore < 0.35) return 'xy';
  const zProjection = zDirection.x * drag.x + zDirection.y * drag.y;
  const residual = { x: drag.x - zDirection.x * zProjection, y: drag.y - zDirection.y * zProjection };
  const residualLength = Math.hypot(residual.x, residual.y);
  const chooser = residualLength < 1e-6 ? drag : { x: residual.x / residualLength, y: residual.y / residualLength };
  const xScore = xDirection.x * chooser.x + xDirection.y * chooser.y;
  const yScore = yDirection.x * chooser.x + yDirection.y * chooser.y;
  return xScore >= yScore ? 'xz' : 'yz';
}

export function screenPointToObjectPoint(point: ScreenPoint, camera: THREE.PerspectiveCamera, objects: readonly THREE.Object3D[], lineThreshold = 12): { point: Vec3; object: THREE.Object3D } | undefined {
  const raycaster = raycasterForScreenPoint(point, camera);
  raycaster.params.Line.threshold = lineThreshold;
  const hit = raycaster.intersectObjects([...objects], true)[0];
  return hit ? { point: threePointToCadPoint(hit.point), object: hit.object } : undefined;
}


export function screenDirectionForCadVector(input: { camera: THREE.PerspectiveCamera; origin: Vec3; direction: Vec3; width: number; height: number }): { x: number; y: number } | undefined {
  const start = cadPointToThreeVector(input.origin).project(input.camera);
  const end = cadPointToThreeVector(add(input.origin, input.direction)).project(input.camera);
  const dx = ((end.x - start.x) * Math.max(1, input.width)) / 2;
  const dy = (-(end.y - start.y) * Math.max(1, input.height)) / 2;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1e-6) return undefined;
  return { x: dx / length, y: dy / length };
}

export function screenPointToAxisLockedPoint(point: ScreenPoint, camera: THREE.PerspectiveCamera, startPoint: Vec3, axis: ViewportAxisLock): Vec3 | undefined {
  const raycaster = raycasterForScreenPoint(point, camera);
  const rayOrigin = raycaster.ray.origin;
  const rayDirection = raycaster.ray.direction.clone().normalize();
  const axisOrigin = cadPointToThreeVector(startPoint);
  const axisDirection = threeAxisDirection(axis);
  const axisPoint = closestPointOnAxisToRay(rayOrigin, rayDirection, axisOrigin, axisDirection);
  return axisPoint ? threePointToCadPoint(axisPoint) : undefined;
}

function raycasterForScreenPoint(point: ScreenPoint, camera: THREE.PerspectiveCamera): THREE.Raycaster {
  const width = Math.max(1, point.width);
  const height = Math.max(1, point.height);
  const pointer = new THREE.Vector2((point.x / width) * 2 - 1, -(point.y / height) * 2 + 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  return raycaster;
}

function threePlaneForDrawingPlane(plane: DrawingPlane, anchor: Vec3 = { x: 0, y: 0, z: 0 }): THREE.Plane {
  const anchorPoint = cadPointToThreeVector(anchor);
  const normal = plane === 'xz'
    ? new THREE.Vector3(0, 0, 1)
    : plane === 'yz'
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, anchorPoint);
}

export function threePointToCadPoint(point: THREE.Vector3): Vec3 {
  return { x: point.x, y: point.z, z: point.y };
}

function cadPointToThreeVector(point: Vec3): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.z, point.y);
}

function threeAxisDirection(axis: ViewportAxisLock): THREE.Vector3 {
  if (axis === 'x') return new THREE.Vector3(1, 0, 0);
  if (axis === 'y') return new THREE.Vector3(0, 0, 1);
  return new THREE.Vector3(0, 1, 0);
}

function closestPointOnAxisToRay(rayOrigin: THREE.Vector3, rayDirection: THREE.Vector3, axisOrigin: THREE.Vector3, axisDirection: THREE.Vector3): THREE.Vector3 | undefined {
  const diff = rayOrigin.clone().sub(axisOrigin);
  const b = rayDirection.dot(axisDirection);
  const d = rayDirection.dot(diff);
  const e = axisDirection.dot(diff);
  const denominator = 1 - b * b;
  if (Math.abs(denominator) < 1e-9) return axisOrigin.clone().add(axisDirection.clone().multiplyScalar(e));
  const axisScalar = (e - b * d) / denominator;
  return axisOrigin.clone().add(axisDirection.clone().multiplyScalar(axisScalar));
}

function threeVectorToCadPoint(vector: THREE.Vector3): Vec3 {
  return { x: vector.x, y: vector.z, z: vector.y };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
