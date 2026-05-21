import { type Vec3 } from './geometry';
import { type ToolName } from './model';

export type DrawableTool = Extract<ToolName, 'line' | 'rectangle' | 'box'>;

export type ToolState =
  | { mode: 'idle'; pendingPoint?: undefined }
  | { mode: 'drawing'; tool: Extract<DrawableTool, 'line' | 'rectangle'>; pendingPoint: Vec3 };

export type ToolCommand =
  | { type: 'createLine'; start: Vec3; end: Vec3 }
  | { type: 'createRectangle'; first: Vec3; second: Vec3 }
  | { type: 'createBox'; origin: Vec3 };

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

export function handleGroundClick(state: ToolState, tool: ToolName, point: Vec3): ToolStep {
  if (tool === 'box') {
    return { state: createInitialToolState(), command: { type: 'createBox', origin: point } };
  }

  if (tool !== 'line' && tool !== 'rectangle') {
    return { state: createInitialToolState() };
  }

  if (state.mode !== 'drawing' || state.tool !== tool) {
    return { state: { mode: 'drawing', tool, pendingPoint: point } };
  }

  const command: ToolCommand =
    tool === 'line'
      ? { type: 'createLine', start: state.pendingPoint, end: point }
      : { type: 'createRectangle', first: state.pendingPoint, second: point };

  return { state: createInitialToolState(), command };
}
