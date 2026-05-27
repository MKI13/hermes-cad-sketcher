import { describe, expect, it } from 'vitest';
import { shouldMeasurementBoxHandleKey } from '../src/ui/MeasurementBox';

describe('MeasurementBox keyboard handling', () => {
  it('confirms exact measurements with Enter and cancels them with Escape', () => {
    expect(shouldMeasurementBoxHandleKey({ key: 'Enter' })).toEqual({ type: 'apply' });
    expect(shouldMeasurementBoxHandleKey({ key: 'Escape' })).toEqual({ type: 'cancel' });
  });

  it('keeps tool shortcuts as text while typing in the measurement box', () => {
    expect(shouldMeasurementBoxHandleKey({ key: 'l' })).toEqual({ type: 'text' });
    expect(shouldMeasurementBoxHandleKey({ key: 'R' })).toEqual({ type: 'text' });
    expect(shouldMeasurementBoxHandleKey({ key: 'p' })).toEqual({ type: 'text' });
  });
});
