import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { exportDxf, importDxf, supportedCadFormats } from '../src/core/dxf';
import { SketchModel } from '../src/core/model';
import { exportAsciiStl } from '../src/core/stl';

describe('CAD import/export foundation', () => {
  it('exports DXF with millimeter INSUNITS and line entities', () => {
    const model = new SketchModel();
    model.createLine(vec(0, 0, 0), vec(1000, 0, 0));
    const dxf = exportDxf(model);
    expect(dxf).toContain('$INSUNITS');
    expect(dxf).toContain('LINE');
    expect(dxf).toContain('1000');
  });

  it('imports simple DXF LINE entities into the model', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n';
    const model = importDxf(dxf);
    expect(model.allEntities()).toHaveLength(1);
    expect(model.measure(vec(0, 0, 0), vec(250, 0, 0))).toBe(250);
  });

  it('exports STL triangles for box bodies', () => {
    const model = new SketchModel();
    model.createBox(vec(0, 0, 0), 100, 100, 100);
    const stl = exportAsciiStl(model);
    expect(stl).toContain('solid hermes-cad-sketcher');
    expect(stl.match(/facet normal/g)?.length).toBe(12);
  });

  it('documents that DWG and SKP require external bridge layers, not fake support', () => {
    expect(supportedCadFormats().dxf).toBe('mvp');
    expect(supportedCadFormats().stl).toBe('mvp');
    expect(supportedCadFormats().dwg).toBe('external-bridge');
    expect(supportedCadFormats().skp).toBe('external-bridge');
  });
});
