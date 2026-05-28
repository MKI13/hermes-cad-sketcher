import { type Vec3 } from '../core/geometry';
import type { BoxFaceName, EntityId } from '../core/model';
import type { FaceSelection, PushPullPreviewResult } from './viewportInteractionHelpers';

export type PushPullScreenDirection = Readonly<{ x: number; y: number }>;

export type PushPullDragState = Readonly<{
  mode: 'pushPullDragging';
  selection: { entityId: EntityId; face?: BoxFaceName };
  startPoint: Vec3;
  axis: 'x' | 'y' | 'z';
  sign: 1 | -1;
  pixelsPerMillimeter: number;
  screenDirection?: PushPullScreenDirection;
}>;

export type PushPullDragStep = Readonly<{ mode: 'dragging'; state: PushPullDragState; delta: number; preview: PushPullPreviewResult }>;

export function beginPushPullDrag(
  selectedId: EntityId | undefined,
  faceSelection: FaceSelection | undefined,
  startPoint: Vec3,
  options: { pixelsPerMillimeter?: number; screenDirection?: PushPullScreenDirection } = {}
): PushPullDragState | undefined {
  if (!selectedId) return undefined;
  const face = faceSelection?.entityId === selectedId ? faceSelection.face : undefined;
  const axis = axisForFace(face ?? 'top');
  const screenDirection = normalizeScreenDirection(options.screenDirection);
  return {
    mode: 'pushPullDragging',
    selection: { entityId: selectedId, face },
    startPoint,
    axis: axis.axis,
    sign: axis.sign,
    pixelsPerMillimeter: options.pixelsPerMillimeter ?? 2,
    ...(screenDirection ? { screenDirection } : {})
  };
}

export function pointForPushPullPointerDelta(state: PushPullDragState, pointerDelta: { x: number; y: number }): Vec3 {
  const pixelDelta = state.screenDirection
    ? pointerDelta.x * state.screenDirection.x + pointerDelta.y * state.screenDirection.y
    : dominantPointerDeltaForFace(state.selection.face ?? 'top', pointerDelta);
  const modelDelta = (pixelDelta / state.pixelsPerMillimeter) * state.sign;
  return {
    ...state.startPoint,
    [state.axis]: state.startPoint[state.axis] + modelDelta
  };
}

export function pushPullDeltaFromDrag(state: PushPullDragState, currentPoint: Vec3): number {
  return (currentPoint[state.axis] - state.startPoint[state.axis]) * state.sign;
}

function dominantPointerDeltaForFace(face: BoxFaceName, pointerDelta: { x: number; y: number }): number {
  if (face === 'right') return pointerDelta.x;
  if (face === 'left') return -pointerDelta.x;
  if (face === 'bottom' || face === 'back') return pointerDelta.y;
  return -pointerDelta.y;
}

function axisForFace(face: BoxFaceName): { axis: 'x' | 'y' | 'z'; sign: 1 | -1 } {
  if (face === 'left') return { axis: 'x', sign: -1 };
  if (face === 'right') return { axis: 'x', sign: 1 };
  if (face === 'front') return { axis: 'y', sign: 1 };
  if (face === 'back') return { axis: 'y', sign: -1 };
  if (face === 'bottom') return { axis: 'z', sign: -1 };
  return { axis: 'z', sign: 1 };
}

export function updatePushPullDrag(
  state: PushPullDragState,
  currentPoint: Vec3,
  createPreview: (selection: PushPullDragState['selection'], delta: number) => PushPullPreviewResult
): PushPullDragStep {
  const delta = pushPullDeltaFromDrag(state, currentPoint);
  return { mode: 'dragging', state, delta, preview: createPreview(state.selection, delta) };
}

export function finishPushPullDrag(state: PushPullDragState, currentPoint: Vec3): { selection: PushPullDragState['selection']; delta: number } | undefined {
  const delta = pushPullDeltaFromDrag(state, currentPoint);
  return delta === 0 ? undefined : { selection: state.selection, delta };
}


function normalizeScreenDirection(direction: PushPullScreenDirection | undefined): PushPullScreenDirection | undefined {
  if (!direction || !Number.isFinite(direction.x) || !Number.isFinite(direction.y)) return undefined;
  const length = Math.hypot(direction.x, direction.y);
  if (length < 1e-6) return undefined;
  return { x: direction.x / length, y: direction.y / length };
}

export function pushPullFaceNormal(face: BoxFaceName, rotationZ = 0): Vec3 {
  const base = face === 'left'
    ? { x: -1, y: 0, z: 0 }
    : face === 'right'
      ? { x: 1, y: 0, z: 0 }
      : face === 'front'
        ? { x: 0, y: 1, z: 0 }
        : face === 'back'
          ? { x: 0, y: -1, z: 0 }
          : face === 'bottom'
            ? { x: 0, y: 0, z: -1 }
            : { x: 0, y: 0, z: 1 };
  if (base.z !== 0) return base;
  const c = Math.cos(rotationZ);
  const s = Math.sin(rotationZ);
  return { x: base.x * c - base.y * s, y: base.x * s + base.y * c, z: 0 };
}
