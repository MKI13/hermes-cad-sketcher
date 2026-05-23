import { type Vec3, distance, sub, vec } from './geometry';
import { SketchModel, type BoxEntity, type ReferenceMeshEntity } from './model';

export type StlTriangle = Readonly<{
  vertices: [Vec3, Vec3, Vec3];
}>;

export function importAsciiStl(text: string, name = 'reference.stl'): Omit<ReferenceMeshEntity, 'id'> {
  const lines = text.split(/\r?\n/);
  if (text.includes('\0') || !/^\s*solid\b/i.test(lines[0] ?? '')) {
    throw new Error('ASCII STL muss mit einem solid-Header beginnen.');
  }

  const triangles: StlTriangle[] = [];
  let index = 1;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (line === '') {
      index += 1;
      continue;
    }
    if (/^endsolid\b/i.test(line)) {
      index += 1;
      while (index < lines.length && lines[index].trim() === '') index += 1;
      if (index !== lines.length) throw new Error('ASCII STL enthält Daten nach endsolid.');
      if (triangles.length === 0) throw new Error('ASCII STL enthält keine vollständigen Dreiecke.');
      return { type: 'referenceMesh', name, triangles, triangleCount: triangles.length };
    }
    if (!isFacetNormalLine(line)) throw new Error('ASCII STL enthält unerwartete oder unvollständige Facettenstruktur.');
    const parsed = parseFacet(lines, index);
    if (triangleAreaMagnitude(parsed.triangle.vertices) <= 1e-9) {
      throw new Error('ASCII STL enthält degenerierte Dreiecke.');
    }
    triangles.push(parsed.triangle);
    index = parsed.nextIndex;
  }

  throw new Error('ASCII STL endet ohne endsolid.');
}

function isFacetNormalLine(line: string): boolean {
  const match = /^facet\s+normal\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s*$/i.exec(line);
  if (!match) return false;
  return [match[1], match[2], match[3]].every((value) => Number.isFinite(Number(value)));
}

function parseFacet(lines: string[], startIndex: number): { triangle: StlTriangle; nextIndex: number } {
  if (!/^\s*outer\s+loop\s*$/i.test(lines[startIndex + 1] ?? '')) {
    throw new Error('ASCII STL Facette enthält keinen outer loop.');
  }

  const vertices = [
    parseVertex(lines[startIndex + 2]),
    parseVertex(lines[startIndex + 3]),
    parseVertex(lines[startIndex + 4])
  ] as [Vec3, Vec3, Vec3];

  if (!/^\s*endloop\s*$/i.test(lines[startIndex + 5] ?? '')) {
    throw new Error('ASCII STL Facette enthält nicht exakt drei Vertices.');
  }
  if (!/^\s*endfacet\s*$/i.test(lines[startIndex + 6] ?? '')) {
    throw new Error('ASCII STL Facette endet nicht mit endfacet.');
  }

  return { triangle: { vertices }, nextIndex: startIndex + 7 };
}

function parseVertex(line: string | undefined): Vec3 {
  const match = /^\s*vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s*$/i.exec(line ?? '');
  if (!match) throw new Error('ASCII STL Facette enthält nicht exakt drei Vertices.');
  const vertex = vec(Number(match[1]), Number(match[2]), Number(match[3]));
  if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || !Number.isFinite(vertex.z)) {
    throw new Error('ASCII STL enthält ungültige Vertex-Koordinaten.');
  }
  return vertex;
}

function triangleAreaMagnitude(vertices: [Vec3, Vec3, Vec3]): number {
  return distance(vec(0, 0, 0), crossProduct(sub(vertices[1], vertices[0]), sub(vertices[2], vertices[0]))) / 2;
}

function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return vec(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

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
