import { type Vec3, vec } from './geometry';
import { SketchModel, type BoxEntity } from './model';

export function exportAsciiStl(model: SketchModel, name = 'hermes-cad-sketcher'): string {
  const lines = [`solid ${sanitize(name)}`];
  for (const entity of model.allEntities()) {
    if (entity.type === 'box') appendBox(lines, entity);
  }
  lines.push(`endsolid ${sanitize(name)}`);
  return lines.join('\n') + '\n';
}

function appendBox(out: string[], box: BoxEntity): void {
  const o = box.origin;
  const p = [
    o,
    vec(o.x + box.width, o.y, o.z),
    vec(o.x + box.width, o.y + box.depth, o.z),
    vec(o.x, o.y + box.depth, o.z),
    vec(o.x, o.y, o.z + box.height),
    vec(o.x + box.width, o.y, o.z + box.height),
    vec(o.x + box.width, o.y + box.depth, o.z + box.height),
    vec(o.x, o.y + box.depth, o.z + box.height)
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3],
    [3, 7, 4], [3, 4, 0]
  ];
  for (const [a, b, c] of faces) triangle(out, p[a], p[b], p[c]);
}

function triangle(out: string[], a: Vec3, b: Vec3, c: Vec3): void {
  out.push('  facet normal 0 0 0', '    outer loop', vertex(a), vertex(b), vertex(c), '    endloop', '  endfacet');
}

function vertex(p: Vec3): string {
  return `      vertex ${p.x} ${p.y} ${p.z}`;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
