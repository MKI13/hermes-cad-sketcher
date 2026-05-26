import { type Vec3 } from '../core/geometry';
import type { BoxFaceName, EntityId } from '../core/model';
import type { FaceSelection, PushPullPreviewResult } from './viewportInteractionHelpers';

export type PushPullDragState = Readonly<{
  mode: 'pushPullDragging';
  selection: { entityId: EntityId; face?: BoxFaceName };
  startPoint: Vec3;
  axis: 'x' | 'y' | 'z';
  sign: 1 | -1;
  pixelsPerMillimeter: number;
}>;

export type PushPullDragStep = Readonly<{ mode: 'dragging'; state: PushPullDragState; delta: number; preview: PushPullPreviewResult }>;

export function beginPushPullDrag(
  selectedId: EntityId | undefined,
  faceSelection: FaceSelection | undefined,
  startPoint: Vec3,
  options: { pixelsPerMillimeter?: number } = {}
): PushPullDragState | undefined {
  if (!selectedId) return undefined;
  const face = faceSelection?.entityId === selectedId ? faceSelection.face : undefined;
  const axis = axisForFace(face ?? 'top');
  return {
    mode: 'pushPullDragging',
    selection: { entityId: selectedId, face },
    startPoint,
    axis: axis.axis,
    sign: axis.sign,
    pixelsPerMillimeter: options.pixelsPerMillimeter ?? 2
  };
}

export function pointForPushPullPointerDelta(state: PushPullDragState, pointerDelta: { x: number; y: number }): Vec3 {
  const pixelDelta = dominantPointerDeltaForFace(state.selection.face ?? 'top', pointerDelta);
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
