import { SketchModel, type Entity } from './model';
import { vec, type Vec3 } from './geometry';

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
