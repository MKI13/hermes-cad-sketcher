import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { cancelToolState, createInitialToolState, formatTapeMeasurement, getDrawingPreview, handleGroundClick } from '../src/core/toolState';

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

  it('previews a pending line while hovering over the second point', () => {
    const first = handleGroundClick(createInitialToolState(), 'line', vec(0, 0, 0));

    expect(getDrawingPreview(first.state, 'line', vec(1000, 500, 0))).toEqual({
      type: 'linePreview',
      start: vec(0, 0, 0),
      end: vec(1000, 500, 0)
    });
  });

  it('previews a pending rectangle while hovering over the opposite corner', () => {
    const first = handleGroundClick(createInitialToolState(), 'rectangle', vec(500, 700, 0));

    expect(getDrawingPreview(first.state, 'rectangle', vec(100, 200, 0))).toEqual({
      type: 'rectanglePreview',
      first: vec(500, 700, 0),
      second: vec(100, 200, 0)
    });
  });

  it('does not preview when idle, cancelled or another tool is active', () => {
    const first = handleGroundClick(createInitialToolState(), 'line', vec(0, 0, 0));

    expect(getDrawingPreview(createInitialToolState(), 'line', vec(100, 0, 0))).toBeUndefined();
    expect(getDrawingPreview(cancelToolState(first.state), 'line', vec(100, 0, 0))).toBeUndefined();
    expect(getDrawingPreview(first.state, 'rectangle', vec(100, 0, 0))).toBeUndefined();
  });

  it('stores first tape point then commits a distance measurement command on second point', () => {
    const first = handleGroundClick(createInitialToolState(), 'tape', vec(0, 0, 0));
    expect(first.state).toEqual({ mode: 'drawing', pendingPoint: vec(0, 0, 0), tool: 'tape' });
    expect(first.command).toBeUndefined();

    const second = handleGroundClick(first.state, 'tape', vec(300, 400, 0));
    expect(second.state).toEqual({ mode: 'idle', pendingPoint: undefined });
    expect(second.command).toEqual({ type: 'measureDistance', start: vec(0, 0, 0), end: vec(300, 400, 0) });
  });

  it('formats tape measurement through SketchModel.measure in millimeters', () => {
    const model = new SketchModel();

    expect(formatTapeMeasurement(model, vec(0, 0, 0), vec(300, 400, 0))).toBe('500 mm');
  });
});
