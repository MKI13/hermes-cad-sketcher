import { describe, expect, it } from 'vitest';
import { parseMeasurementBoxInput } from '../src/core/measurementInput';

describe('measurement box input', () => {
  it('parses a single millimeter distance for line and push-pull tools', () => {
    expect(parseMeasurementBoxInput('line', '1200')).toEqual({ ok: true, kind: 'distance', value: 1200 });
    expect(parseMeasurementBoxInput('line', '1200mm')).toEqual({ ok: true, kind: 'distance', value: 1200 });
    expect(parseMeasurementBoxInput('pushPull', '300mm')).toEqual({ ok: true, kind: 'distance', value: 300 });
    expect(parseMeasurementBoxInput('pushPull', '-75')).toEqual({ ok: true, kind: 'distance', value: -75 });
  });

  it('parses rectangle dimensions written like SketchUp measurements', () => {
    expect(parseMeasurementBoxInput('rectangle', '1200,600')).toEqual({ ok: true, kind: 'rectangle', width: 1200, depth: 600 });
    expect(parseMeasurementBoxInput('rectangle', '1200; 600 mm')).toEqual({ ok: true, kind: 'rectangle', width: 1200, depth: 600 });
  });

  it('parses move vectors and fills missing y and z with zero', () => {
    expect(parseMeasurementBoxInput('move', '100')).toEqual({ ok: true, kind: 'vector', x: 100, y: 0, z: 0 });
    expect(parseMeasurementBoxInput('move', '<100,0,25>')).toEqual({ ok: true, kind: 'vector', x: 100, y: 0, z: 25 });
    expect(parseMeasurementBoxInput('move', '[1000,500,0]')).toEqual({ ok: true, kind: 'vector', x: 1000, y: 500, z: 0 });
    expect(parseMeasurementBoxInput('move', '100,50')).toEqual({ ok: true, kind: 'vector', x: 100, y: 50, z: 0 });
  });

  it('parses rotate angles as degrees', () => {
    expect(parseMeasurementBoxInput('rotate', '45')).toEqual({ ok: true, kind: 'angle', degrees: 45 });
    expect(parseMeasurementBoxInput('rotate', '-90°')).toEqual({ ok: true, kind: 'angle', degrees: -90 });
  });

  it('reports clear errors for impossible measurements', () => {
    expect(parseMeasurementBoxInput('rectangle', '1200')).toEqual({ ok: false, error: 'Rechteck braucht Breite und Tiefe, z. B. 1200,600.' });
    expect(parseMeasurementBoxInput('pushPull', '0')).toEqual({ ok: false, error: 'Maß muss ungleich 0 sein.' });
    expect(parseMeasurementBoxInput('move', 'a,b,c')).toEqual({ ok: false, error: 'Maß enthält keine gültigen Zahlen.' });
  });
});
