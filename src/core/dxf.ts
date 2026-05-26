import { SketchModel, type Entity } from './model';
import { almostEqual, vec, type Vec3 } from './geometry';

function pair(code: string | number, value: string | number): string {
  return `${code}\n${value}`;
}

export function exportDxf(model: SketchModel): string {
  const out: string[] = [pair(0, 'SECTION'), pair(2, 'HEADER'), pair(9, '$INSUNITS'), pair(70, 4), pair(0, 'ENDSEC'), pair(0, 'SECTION'), pair(2, 'ENTITIES')];
  for (const entity of model.allEntities()) {
    if (entity.type === 'edge') line(out, entity.start, entity.end, entity.layer);
    if (entity.type === 'face') polyline(out, entity.vertices, entity.layer);
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

export type DxfSkippedEntity = { entityType: string; reason: string };
export type DxfUnitStatus =
  | { kind: 'millimeters'; insunits: 4; message: string }
  | { kind: 'missing'; message: string }
  | { kind: 'unsupported'; insunits: number; message: string }
  | { kind: 'malformed'; message: string };
export type DxfImportReport = { model: SketchModel; importedEntities: number; skippedEntities: DxfSkippedEntity[]; unitStatus: DxfUnitStatus };

const unsupportedDxfEntityReason = 'DXF entity type is not supported by the current MVP importer.';
const unsupportedLwPolylineReason = 'Only closed, four-point, axis-aligned LWPOLYLINE rectangles without malformed coordinates, bulge, width, thickness, or non-default extrusion are supported.';
const unsupportedLineReason = 'DXF LINE has missing, non-finite, or zero-length coordinates.';

export function importDxf(text: string): SketchModel {
  return importDxfWithReport(text).model;
}

export function importDxfWithReport(text: string): DxfImportReport {
  const model = new SketchModel();
  let importedEntities = 0;
  const skippedEntities: DxfSkippedEntity[] = [];
  const tokens = text.split(/\r?\n/).map((s) => s.trim());
  const unitStatus = readDxfUnitStatus(tokens);
  if (unitStatus.kind === 'unsupported' || unitStatus.kind === 'malformed') {
    return { model, importedEntities, skippedEntities: [{ entityType: 'DXF', reason: unitStatus.message }], unitStatus };
  }
  let inEntitiesSection = false;
  for (let i = 0; i < tokens.length - 1; i += 2) {
    const code = tokens[i];
    const value = tokens[i + 1];
    const nextCode = tokens[i + 2];
    const nextValue = tokens[i + 3];
    if (code === '0' && value === 'SECTION') {
      inEntitiesSection = nextCode === '2' && nextValue === 'ENTITIES';
      continue;
    }
    if (code === '0' && value === 'ENDSEC') {
      inEntitiesSection = false;
      continue;
    }
    if (!inEntitiesSection) continue;
    if (code === '0' && value === 'LINE') {
      const fields = readEntityFields(tokens, i + 2);
      const start = linePoint(fields, '10', '20', '30');
      const end = linePoint(fields, '11', '21', '31');
      if (start && end && isFiniteLine(start, end)) {
        model.createLine(start, end, entityMetadata(fields));
        importedEntities += 1;
      } else {
        skippedEntities.push({ entityType: 'LINE', reason: unsupportedLineReason });
      }
    }
    if (code === '0' && value === 'LWPOLYLINE') {
      const polyline = readLwPolyline(tokens, i + 2);
      if (polyline.closed && !polyline.hasMalformedCoordinates && !polyline.hasBulge && !polyline.hasUnsupportedExtrusion && !polyline.hasUnsupportedWidthOrThickness && polyline.points.length === 4 && isAxisAlignedRectangle(polyline.points)) {
        const bounds = rectangleBounds(polyline.points);
        model.createRectangle(bounds.origin, bounds.width, bounds.depth, polyline.metadata);
        importedEntities += 1;
      } else {
        skippedEntities.push({ entityType: 'LWPOLYLINE', reason: unsupportedLwPolylineReason });
      }
    }
    if (code === '0' && isUnsupportedEntityToken(value)) {
      skippedEntities.push({ entityType: value, reason: unsupportedDxfEntityReason });
    }
  }
  return { model, importedEntities, skippedEntities, unitStatus };
}

const supportedOrStructuralDxfTokens = new Set(['SECTION', 'ENDSEC', 'EOF', 'HEADER', 'ENTITIES', 'LINE', 'LWPOLYLINE']);

function isUnsupportedEntityToken(value: string): boolean {
  return value.length > 0 && !supportedOrStructuralDxfTokens.has(value);
}

function readDxfUnitStatus(tokens: string[]): DxfUnitStatus {
  let inHeaderSection = false;
  for (let i = 0; i < tokens.length - 1; i += 2) {
    const code = tokens[i];
    const value = tokens[i + 1];
    const nextCode = tokens[i + 2];
    const nextValue = tokens[i + 3];
    if (code === '0' && value === 'SECTION') {
      inHeaderSection = nextCode === '2' && nextValue === 'HEADER';
      continue;
    }
    if (code === '0' && value === 'ENDSEC') {
      inHeaderSection = false;
      continue;
    }
    if (inHeaderSection && code === '9' && value === '$INSUNITS') {
      const valueCode = tokens[i + 2];
      const rawInsunits = tokens[i + 3];
      if (valueCode !== '70' || rawInsunits === undefined || !/^\d+$/.test(rawInsunits)) {
        return { kind: 'malformed', message: 'Malformed DXF units: $INSUNITS must use group code 70 with integer value 4 for millimeters.' };
      }
      const insunits = Number(rawInsunits);
      if (insunits === 4) return { kind: 'millimeters', insunits: 4, message: 'DXF units: millimeters ($INSUNITS=4).' };
      return { kind: 'unsupported', insunits, message: `Unsupported DXF units: $INSUNITS=${rawInsunits}. Only millimeters ($INSUNITS=4) are imported.` };
    }
  }
  return { kind: 'missing', message: 'DXF has no $INSUNITS header; assuming millimeters.' };
}

function isFiniteLine(start: Vec3, end: Vec3): boolean {
  return [start.x, start.y, start.z, end.x, end.y, end.z].every(Number.isFinite) &&
    (Math.abs(start.x - end.x) > 1e-9 || Math.abs(start.y - end.y) > 1e-9 || Math.abs(start.z - end.z) > 1e-9);
}

type DxfEntityMetadata = { layer?: string };

function readEntityFields(tokens: string[], start: number): Map<string, string> {
  const fields = new Map<string, string>();
  for (let i = start; i < tokens.length - 1; i += 2) {
    if (tokens[i] === '0') break;
    fields.set(tokens[i], tokens[i + 1]);
  }
  return fields;
}

function entityMetadata(fields: Map<string, string>): DxfEntityMetadata {
  const layer = safeLayerName(fields.get('8'));
  return layer ? { layer } : {};
}

function safeLayerName(layer: string | undefined): string | undefined {
  const trimmed = layer?.trim();
  return trimmed && /^[A-Za-z0-9_. -]+$/.test(trimmed) ? trimmed : undefined;
}

type LwPolyline = { closed: boolean; points: Vec3[]; metadata: DxfEntityMetadata; hasMalformedCoordinates: boolean; hasBulge: boolean; hasUnsupportedExtrusion: boolean; hasUnsupportedWidthOrThickness: boolean };

function readLwPolyline(tokens: string[], start: number): LwPolyline {
  let closed = false;
  let hasBulge = false;
  let hasUnsupportedWidthOrThickness = false;
  let declaredVertexCount: number | undefined;
  let extrusion = vec(0, 0, 1);
  const fields = new Map<string, string>();
  const xs: number[] = [];
  const ys: number[] = [];
  const elevations: number[] = [];
  for (let i = start; i < tokens.length - 1; i += 2) {
    const code = tokens[i];
    const value = tokens[i + 1];
    if (code === '0') break;
    fields.set(code, value);
    if (code === '70') closed = (Number(value) & 1) === 1;
    if (code === '90') declaredVertexCount = Number(value);
    if (code === '10') xs.push(Number(value));
    if (code === '20') ys.push(Number(value));
    if (code === '38') elevations.push(Number(value));
    if (code === '42' && Math.abs(Number(value)) > 1e-9) hasBulge = true;
    if (['39', '40', '41', '43'].includes(code) && Math.abs(Number(value)) > 1e-9) hasUnsupportedWidthOrThickness = true;
    if (code === '210') extrusion = { ...extrusion, x: Number(value) };
    if (code === '220') extrusion = { ...extrusion, y: Number(value) };
    if (code === '230') extrusion = { ...extrusion, z: Number(value) };
  }
  const z = elevations.length === 0 ? 0 : elevations[0];
  const hasMalformedCoordinates = declaredVertexCount !== 4 || xs.length !== 4 || ys.length !== 4 || !Number.isFinite(z) ||
    xs.some((x) => !Number.isFinite(x)) || ys.some((y) => !Number.isFinite(y));
  const points = hasMalformedCoordinates ? [] : xs.map((x, index) => vec(x, ys[index], z));
  const hasUnsupportedExtrusion = !almostEqual(extrusion.x, 0) || !almostEqual(extrusion.y, 0) || !almostEqual(extrusion.z, 1);
  return { closed, points, metadata: entityMetadata(fields), hasMalformedCoordinates, hasBulge, hasUnsupportedExtrusion, hasUnsupportedWidthOrThickness };
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

function linePoint(fields: Map<string, string>, xCode: string, yCode: string, zCode: string): Vec3 | undefined {
  if (!fields.has(xCode) || !fields.has(yCode)) return undefined;
  const point = vec(Number(fields.get(xCode)), Number(fields.get(yCode)), Number(fields.get(zCode) ?? 0));
  return [point.x, point.y, point.z].every(Number.isFinite) ? point : undefined;
}

function line(out: string[], start: Vec3, end: Vec3, layer = '0'): void {
  out.push(pair(0, 'LINE'), pair(8, safeLayerName(layer) ?? '0'), pair(10, start.x), pair(20, start.y), pair(30, start.z), pair(11, end.x), pair(21, end.y), pair(31, end.z));
}

function polyline(out: string[], vertices: Vec3[], layer = '0'): void {
  for (let i = 0; i < vertices.length; i++) {
    line(out, vertices[i], vertices[(i + 1) % vertices.length], layer);
  }
}

export type CadFormatSupportStatus = 'canonical' | 'mvp' | 'planned' | 'external-bridge' | 'unsupported';

export function supportedCadFormats(): Record<string, CadFormatSupportStatus> {
  return {
    hcadJson: 'canonical',
    dxf: 'mvp',
    stl: 'mvp',
    skp: 'external-bridge',
    dwg: 'external-bridge',
    rb: 'unsupported',
    rbz: 'unsupported',
    step: 'unsupported',
    ifc: 'unsupported',
    obj: 'unsupported',
    glb: 'unsupported'
  };
}
