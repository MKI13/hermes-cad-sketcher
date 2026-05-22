import { SketchModel, type Entity } from './model';
import { almostEqual, vec, type Vec3 } from './geometry';

function pair(code: string | number, value: string | number): string {
  return `${code}\n${value}`;
}

export function exportDxf(model: SketchModel): string {
  const out: string[] = [pair(0, 'SECTION'), pair(2, 'HEADER'), pair(9, '$INSUNITS'), pair(70, 4), pair(0, 'ENDSEC'), pair(0, 'SECTION'), pair(2, 'ENTITIES')];
  for (const entity of model.allEntities()) {
    if (entity.type === 'edge') line(out, entity.start, entity.end);
    if (entity.type === 'face') polyline(out, entity.vertices);
    if (entity.type === 'box') {
      const o = entity.origin;
      const pts = [o, vec(o.x + entity.width, o.y, o.z), vec(o.x + entity.width, o.y + entity.depth, o.z), vec(o.x, o.y + entity.depth, o.z)];
      polyline(out, pts);
      for (const p of pts) line(out, p, vec(p.x, p.y, p.z + entity.height));
      polyline(out, pts.map((p) => vec(p.x, p.y, p.z + entity.height)));
    }
  }
  out.push(pair(0, 'ENDSEC'), pair(0, 'EOF'));
  return out.join('\n') + '\n';
}

export function importDxf(text: string): SketchModel {
  const model = new SketchModel();
  const tokens = text.split(/\r?\n/).map((s) => s.trim());
  for (let i = 0; i < tokens.length - 1; i += 2) {
    const code = tokens[i];
    const value = tokens[i + 1];
    if (code === '0' && value === 'LINE') {
      const fields = readEntityFields(tokens, i + 2);
      model.createLine(vec(num(fields, '10'), num(fields, '20'), num(fields, '30')), vec(num(fields, '11'), num(fields, '21'), num(fields, '31')));
    }
    if (code === '0' && value === 'LWPOLYLINE') {
      const polyline = readLwPolyline(tokens, i + 2);
      if (polyline.closed && !polyline.hasBulge && !polyline.hasUnsupportedExtrusion && !polyline.hasUnsupportedWidthOrThickness && polyline.points.length === 4 && isAxisAlignedRectangle(polyline.points)) {
        const bounds = rectangleBounds(polyline.points);
        model.createRectangle(bounds.origin, bounds.width, bounds.depth);
      }
    }
  }
  return model;
}

function readEntityFields(tokens: string[], start: number): Map<string, string> {
  const fields = new Map<string, string>();
  for (let i = start; i < tokens.length - 1; i += 2) {
    if (tokens[i] === '0') break;
    fields.set(tokens[i], tokens[i + 1]);
  }
  return fields;
}

type LwPolyline = { closed: boolean; points: Vec3[]; hasBulge: boolean; hasUnsupportedExtrusion: boolean; hasUnsupportedWidthOrThickness: boolean };

function readLwPolyline(tokens: string[], start: number): LwPolyline {
  let closed = false;
  let hasBulge = false;
  let hasUnsupportedWidthOrThickness = false;
  let extrusion = vec(0, 0, 1);
  const xs: number[] = [];
  const ys: number[] = [];
  const elevations: number[] = [];
  for (let i = start; i < tokens.length - 1; i += 2) {
    const code = tokens[i];
    const value = tokens[i + 1];
    if (code === '0') break;
    if (code === '70') closed = (Number(value) & 1) === 1;
    if (code === '10') xs.push(Number(value));
    if (code === '20') ys.push(Number(value));
    if (code === '38') elevations.push(Number(value));
    if (code === '42' && Math.abs(Number(value)) > 1e-9) hasBulge = true;
    if (['39', '40', '41', '43'].includes(code) && Math.abs(Number(value)) > 1e-9) hasUnsupportedWidthOrThickness = true;
    if (code === '210') extrusion = { ...extrusion, x: Number(value) };
    if (code === '220') extrusion = { ...extrusion, y: Number(value) };
    if (code === '230') extrusion = { ...extrusion, z: Number(value) };
  }
  const z = elevations.find(Number.isFinite) ?? 0;
  const points = xs.map((x, index) => vec(x, ys[index] ?? 0, z)).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
  const hasUnsupportedExtrusion = !almostEqual(extrusion.x, 0) || !almostEqual(extrusion.y, 0) || !almostEqual(extrusion.z, 1);
  return { closed, points, hasBulge, hasUnsupportedExtrusion, hasUnsupportedWidthOrThickness };
}

function isAxisAlignedRectangle(points: Vec3[]): boolean {
  if (points.length !== 4) return false;
  const uniqueCorners = new Set(points.map((point) => `${point.x.toFixed(6)},${point.y.toFixed(6)},${point.z.toFixed(6)}`));
  if (uniqueCorners.size !== 4) return false;
  const bounds = rectangleBounds(points);
  if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.depth) || bounds.width <= 0 || bounds.depth <= 0) return false;
  const expectedCorners = new Set([
    `${bounds.origin.x.toFixed(6)},${bounds.origin.y.toFixed(6)},${bounds.origin.z.toFixed(6)}`,
    `${(bounds.origin.x + bounds.width).toFixed(6)},${bounds.origin.y.toFixed(6)},${bounds.origin.z.toFixed(6)}`,
    `${(bounds.origin.x + bounds.width).toFixed(6)},${(bounds.origin.y + bounds.depth).toFixed(6)},${bounds.origin.z.toFixed(6)}`,
    `${bounds.origin.x.toFixed(6)},${(bounds.origin.y + bounds.depth).toFixed(6)},${bounds.origin.z.toFixed(6)}`
  ]);
  if (![...uniqueCorners].every((corner) => expectedCorners.has(corner))) return false;
  return points.every((point, index) => {
    const next = points[(index + 1) % points.length];
    return (Math.abs(point.x - next.x) <= 1e-6 && Math.abs(point.y - next.y) > 1e-6) || (Math.abs(point.y - next.y) <= 1e-6 && Math.abs(point.x - next.x) > 1e-6);
  });
}

function rectangleBounds(points: Vec3[]): { origin: Vec3; width: number; depth: number } {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const z = points[0]?.z ?? 0;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { origin: vec(minX, minY, z), width: maxX - minX, depth: maxY - minY };
}

function num(fields: Map<string, string>, code: string): number {
  return Number(fields.get(code) ?? 0);
}

function line(out: string[], start: Vec3, end: Vec3): void {
  out.push(pair(0, 'LINE'), pair(8, '0'), pair(10, start.x), pair(20, start.y), pair(30, start.z), pair(11, end.x), pair(21, end.y), pair(31, end.z));
}

function polyline(out: string[], vertices: Vec3[]): void {
  for (let i = 0; i < vertices.length; i++) {
    line(out, vertices[i], vertices[(i + 1) % vertices.length]);
  }
}

export function supportedCadFormats(): Record<string, 'mvp' | 'planned' | 'external-bridge'> {
  return {
    dxf: 'mvp',
    stl: 'mvp',
    skp: 'external-bridge',
    dwg: 'external-bridge',
    rb: 'planned',
    rbz: 'planned'
  };
}
