import { sub, type Vec3 } from './geometry';
import { formatMillimeters, type EntityId, type SketchModel, type ToolName } from './model';

export type DrawableTool = Extract<ToolName, 'line' | 'rectangle' | 'box'>;
export type TwoPointTool = Extract<ToolName, 'line' | 'rectangle' | 'tape'>;

export type ToolState =
  | { mode: 'idle'; pendingPoint?: undefined }
  | { mode: 'drawing'; tool: TwoPointTool; pendingPoint: Vec3 }
  | { mode: 'moving'; tool: 'move'; selectedId: EntityId; pendingPoint: Vec3 };

export type ToolCommand =
  | { type: 'createLine'; start: Vec3; end: Vec3 }
  | { type: 'createRectangle'; first: Vec3; second: Vec3 }
  | { type: 'createBox'; origin: Vec3 }
  | { type: 'measureDistance'; start: Vec3; end: Vec3 }
  | { type: 'moveEntity'; entityId: EntityId; delta: Vec3 };

export type ToolPreview =
  | { type: 'linePreview'; start: Vec3; end: Vec3 }
  | { type: 'rectanglePreview'; first: Vec3; second: Vec3 };

export type ToolStep = Readonly<{
  state: ToolState;
  command?: ToolCommand;
}>;

export function createInitialToolState(): ToolState {
  return { mode: 'idle', pendingPoint: undefined };
}

export function cancelToolState(_state: ToolState): ToolState {
  return createInitialToolState();
}

export function getDrawingPreview(state: ToolState, tool: ToolName, point: Vec3): ToolPreview | undefined {
  if (state.mode !== 'drawing' || state.tool !== tool) return undefined;
  if (tool === 'line') return { type: 'linePreview', start: state.pendingPoint, end: point };
  if (tool === 'rectangle') return { type: 'rectanglePreview', first: state.pendingPoint, second: point };
  return undefined;
}

export function formatTapeMeasurement(model: Pick<SketchModel, 'measure'>, start: Vec3, end: Vec3): string {
  return formatMillimeters(model.measure(start, end));
}

export function handleGroundClick(state: ToolState, tool: ToolName, point: Vec3, selectedId?: EntityId): ToolStep {
  if (tool === 'box') {
    return { state: createInitialToolState(), command: { type: 'createBox', origin: point } };
  }

  if (tool === 'move') {
    if (!selectedId) return { state: createInitialToolState() };

    if (state.mode !== 'moving' || state.selectedId !== selectedId) {
      return { state: { mode: 'moving', tool: 'move', selectedId, pendingPoint: point } };
    }

    return { state: createInitialToolState(), command: { type: 'moveEntity', entityId: selectedId, delta: sub(point, state.pendingPoint) } };
  }

  if (tool !== 'line' && tool !== 'rectangle' && tool !== 'tape') {
    return { state: createInitialToolState() };
  }

  if (state.mode !== 'drawing' || state.tool !== tool) {
    return { state: { mode: 'drawing', tool, pendingPoint: point } };
  }

  const command: ToolCommand =
    tool === 'line'
      ? { type: 'createLine', start: state.pendingPoint, end: point }
      : tool === 'rectangle'
        ? { type: 'createRectangle', first: state.pendingPoint, second: point }
        : { type: 'measureDistance', start: state.pendingPoint, end: point };

  return { state: createInitialToolState(), command };
}
