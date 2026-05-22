import type { SketchModelSnapshot } from './model';

export type ModelHistory = {
  current: SketchModelSnapshot;
  past: SketchModelSnapshot[];
  future: SketchModelSnapshot[];
  canUndo: boolean;
  canRedo: boolean;
};

function cloneSnapshot(snapshot: SketchModelSnapshot): SketchModelSnapshot {
  return structuredClone(snapshot);
}

function buildHistory(current: SketchModelSnapshot, past: SketchModelSnapshot[], future: SketchModelSnapshot[]): ModelHistory {
  return {
    current: cloneSnapshot(current),
    past: past.map(cloneSnapshot),
    future: future.map(cloneSnapshot),
    canUndo: past.length > 0,
    canRedo: future.length > 0
  };
}

export function createHistory(initial: SketchModelSnapshot): ModelHistory {
  return buildHistory(initial, [], []);
}

export function pushHistory(history: ModelHistory, next: SketchModelSnapshot): ModelHistory {
  return buildHistory(next, [...history.past, history.current], []);
}

export function undoHistory(history: ModelHistory): { history: ModelHistory; snapshot: SketchModelSnapshot } {
  if (history.past.length === 0) return { history, snapshot: cloneSnapshot(history.current) };
  const snapshot = history.past[history.past.length - 1];
  const past = history.past.slice(0, -1);
  const nextHistory = buildHistory(snapshot, past, [history.current, ...history.future]);
  return { history: nextHistory, snapshot: cloneSnapshot(snapshot) };
}

export function redoHistory(history: ModelHistory): { history: ModelHistory; snapshot: SketchModelSnapshot } {
  if (history.future.length === 0) return { history, snapshot: cloneSnapshot(history.current) };
  const snapshot = history.future[0];
  const future = history.future.slice(1);
  const nextHistory = buildHistory(snapshot, [...history.past, history.current], future);
  return { history: nextHistory, snapshot: cloneSnapshot(snapshot) };
}
