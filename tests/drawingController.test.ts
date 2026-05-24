import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import {
  createBoxDraft,
  createLineDraft,
  createRectangleDraft,
  parseRectangleDimensionMask,
  secondPointForRectangleDimensions
} from '../src/ui/drawingController';

describe('drawing controller geometry helpers', () => {
  it('creates a line draft from two distinct millimeter grid points', () => {
    const result = createLineDraft(vec(0, 0, 0), vec(1000, 250, 0));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.start).toEqual(vec(0, 0, 0));
      expect(result.end).toEqual(vec(1000, 250, 0));
    }
  });

  it('rejects zero-length line drafts with a clear validation error', () => {
    const result = createLineDraft(vec(100, 100, 0), vec(100, 100, 0));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('zwei verschiedene Punkte');
  });

  it('keeps the first rectangle point as the exact anchor even when drawing toward negative axes', () => {
    const result = createRectangleDraft(vec(500, 700, 0), vec(100, 200, 0));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.origin).toEqual(vec(500, 700, 0));
      expect(result.width).toBe(-400);
      expect(result.depth).toBe(-500);
      expect(result.plane).toBe('xy');
    }
  });

  it('creates rectangle drafts on red-blue and green-blue vertical planes', () => {
    const redBlue = createRectangleDraft(vec(10, 20, 30), vec(510, 20, 230), 'xz');
    const greenBlue = createRectangleDraft(vec(10, 20, 30), vec(10, -180, 330), 'yz');

    expect(redBlue).toMatchObject({ ok: true, origin: vec(10, 20, 30), width: 500, depth: 200, plane: 'xz' });
    expect(greenBlue).toMatchObject({ ok: true, origin: vec(10, 20, 30), width: -200, depth: 300, plane: 'yz' });
  });

  it('uses exact dimension mask values while preserving mouse direction', () => {
    const parsed = parseRectangleDimensionMask({ width: '1200', depth: '600' });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(secondPointForRectangleDimensions(vec(500, 700, 0), vec(100, 1200, 0), parsed, 'xy')).toEqual(vec(-700, 1300, 0));
      expect(secondPointForRectangleDimensions(vec(0, 0, 100), vec(50, 0, -20), parsed, 'xz')).toEqual(vec(1200, 0, -500));
    }
  });

  it('rejects rectangle drafts without area', () => {
    const result = createRectangleDraft(vec(100, 200, 0), vec(100, 600, 0));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Breite und Tiefe');
  });

  it('creates a default box draft at a clicked origin', () => {
    const result = createBoxDraft(vec(50, 100, 0));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.origin).toEqual(vec(50, 100, 0));
      expect(result.width).toBe(600);
      expect(result.depth).toBe(600);
      expect(result.height).toBe(600);
    }
  });

  it('rejects non-positive box dimensions', () => {
    const result = createBoxDraft(vec(0, 0, 0), { width: 0, depth: 600, height: 600 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('positive Maße');
  });
});
