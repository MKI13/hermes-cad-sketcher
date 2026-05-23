import { describe, expect, it } from 'vitest';
import { entityBoundingBox, SketchModel } from '../src/core/model';
import { vec } from '../src/core/geometry';

function centerOfBox(entity: Parameters<typeof entityBoundingBox>[0]) {
  const box = entityBoundingBox(entity);
  return vec(box.min.x + box.size.x / 2, box.min.y + box.size.y / 2, box.min.z + box.size.z / 2);
}

describe('box rotation around own axis', () => {
  it('keeps a box center stable when rotating around its own Z axis', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 100, 100);
    const before = centerOfBox(box);

    const rotated = model.rotateEntityZ(box.id, Math.PI / 2);

    expect(rotated.type).toBe('box');
    if (rotated.type === 'box') {
      expect(centerOfBox(rotated)).toEqual(before);
      expect(rotated.rotationZ).toBe(Math.PI / 2);
    }
  });
});
