import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { cancelToolState, createInitialToolState, handleGroundClick } from '../src/core/toolState';

describe('pure CAD tool state', () => {
  it('starts in idle state without a pending point', () => {
    expect(createInitialToolState()).toEqual({ mode: 'idle', pendingPoint: undefined });
  });

  it('stores first line point then commits a line command on second point', () => {
    const first = handleGroundClick(createInitialToolState(), 'line', vec(0, 0, 0));
    expect(first.state).toEqual({ mode: 'drawing', pendingPoint: vec(0, 0, 0), tool: 'line' });
    expect(first.command).toBeUndefined();

    const second = handleGroundClick(first.state, 'line', vec(1000, 0, 0));
    expect(second.state).toEqual({ mode: 'idle', pendingPoint: undefined });
    expect(second.command).toEqual({ type: 'createLine', start: vec(0, 0, 0), end: vec(1000, 0, 0) });
  });

  it('stores first rectangle point then commits normalized rectangle corners', () => {
    const first = handleGroundClick(createInitialToolState(), 'rectangle', vec(500, 700, 0));
    const second = handleGroundClick(first.state, 'rectangle', vec(100, 200, 0));

    expect(second.command).toEqual({ type: 'createRectangle', first: vec(500, 700, 0), second: vec(100, 200, 0) });
    expect(second.state.mode).toBe('idle');
  });

  it('commits a starter box immediately on box tool click', () => {
    const result = handleGroundClick(createInitialToolState(), 'box', vec(250, 300, 0));

    expect(result.command).toEqual({ type: 'createBox', origin: vec(250, 300, 0) });
    expect(result.state.mode).toBe('idle');
  });

  it('cancels pending drawing state with Escape semantics', () => {
    const first = handleGroundClick(createInitialToolState(), 'line', vec(0, 0, 0));

    expect(cancelToolState(first.state)).toEqual({ mode: 'idle', pendingPoint: undefined });
  });

  it('resets pending state when switching tools before clicking again', () => {
    const first = handleGroundClick(createInitialToolState(), 'line', vec(0, 0, 0));
    const switched = handleGroundClick(first.state, 'rectangle', vec(100, 100, 0));

    expect(switched.state).toEqual({ mode: 'drawing', pendingPoint: vec(100, 100, 0), tool: 'rectangle' });
    expect(switched.command).toBeUndefined();
  });
});
