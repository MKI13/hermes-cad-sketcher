import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import {
  createBoxDraft,
  createLineDraft,
  createRectangleDraft
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
