import type { ToolName } from './model';

export type MeasurementBoxParseResult =
  | { ok: true; kind: 'distance'; value: number }
  | { ok: true; kind: 'rectangle'; width: number; depth: number }
  | { ok: true; kind: 'box'; width: number; depth: number; height: number }
  | { ok: true; kind: 'vector'; x: number; y: number; z: number }
  | { ok: false; error: string };

function parseNumbers(raw: string): number[] | undefined {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/mm\b/g, '')
    .replace(/×/g, ',')
    .replace(/x/g, ',')
    .replace(/;/g, ',')
    .replace(/\s+/g, '');
  if (!cleaned) return undefined;
  const values = cleaned.split(',').filter(Boolean).map(Number);
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) return undefined;
  return values;
}

function requirePositive(value: number): MeasurementBoxParseResult | undefined {
  return value > 0 ? undefined : { ok: false, error: 'Maß muss positiv sein.' };
}

export function parseMeasurementBoxInput(tool: ToolName, raw: string): MeasurementBoxParseResult {
  const values = parseNumbers(raw);
  if (!values) return { ok: false, error: 'Maß enthält keine gültigen Zahlen.' };

  if (tool === 'rectangle') {
    if (values.length < 2) return { ok: false, error: 'Rechteck braucht Breite und Tiefe, z. B. 1200,600.' };
    const [width, depth] = values;
    return requirePositive(width) ?? requirePositive(depth) ?? { ok: true, kind: 'rectangle', width, depth };
  }

  if (tool === 'box') {
    if (values.length < 3) return { ok: false, error: 'Körper braucht Breite, Tiefe und Höhe, z. B. 600,400,720.' };
    const [width, depth, height] = values;
    return requirePositive(width) ?? requirePositive(depth) ?? requirePositive(height) ?? { ok: true, kind: 'box', width, depth, height };
  }

  if (tool === 'move') {
    if (values.length > 3) return { ok: false, error: 'Verschieben braucht maximal X,Y,Z, z. B. 100,0,0.' };
    const [x = 0, y = 0, z = 0] = values;
    return { ok: true, kind: 'vector', x, y, z };
  }

  if (tool === 'line' || tool === 'pushPull' || tool === 'tape') {
    if (values.length !== 1) return { ok: false, error: 'Dieses Werkzeug braucht genau ein Maß in Millimeter.' };
    const [value] = values;
    return requirePositive(value) ?? { ok: true, kind: 'distance', value };
  }

  return { ok: false, error: 'Für dieses Werkzeug gibt es noch keine aktive Maßeingabe.' };
}
