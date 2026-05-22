import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { exportDxf, importDxf, importDxfWithReport, supportedCadFormats } from '../src/core/dxf';
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

  it('imports DXF geometry when HEADER declares millimeters with INSUNITS 4', () => {
    const dxf = '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n';

    const report = importDxfWithReport(dxf);

    expect(report.model.allEntities()).toHaveLength(1);
    expect(report.unitStatus).toEqual({ kind: 'millimeters', insunits: 4, message: 'DXF units: millimeters ($INSUNITS=4).' });
  });

  it('imports DXF geometry with missing INSUNITS only with an explicit millimeter assumption warning', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n';

    const report = importDxfWithReport(dxf);

    expect(report.model.allEntities()).toHaveLength(1);
    expect(report.unitStatus).toEqual({ kind: 'missing', message: 'DXF has no $INSUNITS header; assuming millimeters.' });
  });

  it('rejects non-millimeter DXF documents before importing geometry', () => {
    const dxf = '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n1\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n';

    const report = importDxfWithReport(dxf);

    expect(report.importedEntities).toBe(0);
    expect(report.model.allEntities()).toEqual([]);
    expect(report.unitStatus).toEqual({ kind: 'unsupported', insunits: 1, message: 'Unsupported DXF units: $INSUNITS=1. Only millimeters ($INSUNITS=4) are imported.' });
    expect(report.skippedEntities).toEqual([
      { entityType: 'DXF', reason: 'Unsupported DXF units: $INSUNITS=1. Only millimeters ($INSUNITS=4) are imported.' }
    ]);
  });

  it('reads INSUNITS only from the DXF HEADER section', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nTEXT\n9\n$INSUNITS\n70\n1\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n';

    const report = importDxfWithReport(dxf);

    expect(report.importedEntities).toBe(1);
    expect(report.model.allEntities()).toHaveLength(1);
    expect(report.skippedEntities).toEqual([
      { entityType: 'TEXT', reason: 'DXF entity type is not supported by the current MVP importer.' }
    ]);
    expect(report.unitStatus).toEqual({ kind: 'missing', message: 'DXF has no $INSUNITS header; assuming millimeters.' });
  });

  it('imports a closed DXF LWPOLYLINE rectangle fixture as a millimeter face', async () => {
    const dxf = await readFile('tests/fixtures/simple-rectangle-lwpolyline.dxf', 'utf8');

    const model = importDxf(dxf);
    const [face] = model.allEntities();

    expect(model.allEntities()).toHaveLength(1);
    expect(face).toMatchObject({ type: 'face' });
    expect(face?.type === 'face' ? face.vertices : []).toEqual([
      vec(10, 20, 0),
      vec(1010, 20, 0),
      vec(1010, 520, 0),
      vec(10, 520, 0)
    ]);
  });

  it('imports closed DXF LWPOLYLINE rectangles independent of clockwise order and start corner', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n1010\n20\n520\n10\n1010\n20\n20\n10\n10\n20\n20\n10\n10\n20\n520\n0\nENDSEC\n0\nEOF\n';

    const model = importDxf(dxf);
    const [face] = model.allEntities();

    expect(model.allEntities()).toHaveLength(1);
    expect(face?.type === 'face' ? face.vertices : []).toEqual([
      vec(10, 20, 0),
      vec(1010, 20, 0),
      vec(1010, 520, 0),
      vec(10, 520, 0)
    ]);
  });

  it('imports only closed 4-point DXF LWPOLYLINE rectangles and ignores open polylines', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n0\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n50\n10\n0\n20\n50\n0\nENDSEC\n0\nEOF\n';

    const model = importDxf(dxf);

    expect(model.allEntities()).toEqual([]);
  });

  it('ignores non-rectangular closed DXF LWPOLYLINE shapes rather than inventing geometry', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n0\n20\n0\n10\n100\n20\n0\n10\n80\n20\n50\n10\n0\n20\n50\n0\nENDSEC\n0\nEOF\n';

    const model = importDxf(dxf);

    expect(model.allEntities()).toEqual([]);
  });

  it('ignores bulged DXF LWPOLYLINE rectangles because arc segments are unsupported', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n0\n20\n0\n42\n0.25\n10\n100\n20\n0\n10\n100\n20\n50\n10\n0\n20\n50\n0\nENDSEC\n0\nEOF\n';

    const model = importDxf(dxf);

    expect(model.allEntities()).toEqual([]);
  });

  it('ignores DXF LWPOLYLINE rectangles with non-default extrusion vectors', () => {
    const dxf = '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n210\n0\n220\n1\n230\n0\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n50\n10\n0\n20\n50\n0\nENDSEC\n0\nEOF\n';

    const model = importDxf(dxf);

    expect(model.allEntities()).toEqual([]);
  });

  it('ignores DXF LWPOLYLINE rectangles with nonzero thickness or width fields', () => {
    const unsupportedGroups = ['39', '43', '40', '41'];
    for (const group of unsupportedGroups) {
      const dxf = `0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n${group}\n5\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n50\n10\n0\n20\n50\n0\nENDSEC\n0\nEOF\n`;

      const model = importDxf(dxf);

      expect(model.allEntities(), `group ${group}`).toEqual([]);
    }
  });

  it('does not import malformed DXF LINE entities with non-finite or missing required coordinates', () => {
    const malformedLines = [
      '0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\nNaN\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n',
      '0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n31\n0\n0\nENDSEC\n0\nEOF\n',
      '0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n0\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n'
    ];

    for (const dxf of malformedLines) {
      const report = importDxfWithReport(dxf);

      expect(report.model.allEntities()).toEqual([]);
      expect(report.importedEntities).toBe(0);
      expect(report.skippedEntities).toEqual([
        { entityType: 'LINE', reason: 'DXF LINE has missing, non-finite, or zero-length coordinates.' }
      ]);
    }
  });

  it('does not repair malformed DXF LWPOLYLINE rectangles into geometry', () => {
    const malformedPolylines = [
      '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n50\n10\n0\n0\nENDSEC\n0\nEOF\n',
      '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n5\n70\n1\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n50\n10\n0\n20\n50\n0\nENDSEC\n0\nEOF\n',
      '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n0\n20\n0\n10\nNaN\n20\n0\n10\n100\n20\n50\n10\n0\n20\n50\n0\nENDSEC\n0\nEOF\n'
    ];

    for (const dxf of malformedPolylines) {
      const report = importDxfWithReport(dxf);

      expect(report.model.allEntities()).toEqual([]);
      expect(report.importedEntities).toBe(0);
      expect(report.skippedEntities).toEqual([
        { entityType: 'LWPOLYLINE', reason: 'Only closed, four-point, axis-aligned LWPOLYLINE rectangles without malformed coordinates, bulge, width, thickness, or non-default extrusion are supported.' }
      ]);
    }
  });

  it('imports only entities from the DXF ENTITIES section and ignores block definitions', () => {
    const dxf = '0\nSECTION\n2\nBLOCKS\n0\nBLOCK\n2\nCHAIR\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n100\n21\n0\n31\n0\n0\nENDBLK\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nINSERT\n2\nCHAIR\n10\n500\n20\n0\n30\n0\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n';

    const report = importDxfWithReport(dxf);

    expect(report.model.allEntities()).toHaveLength(1);
    expect(report.importedEntities).toBe(1);
    expect(report.skippedEntities).toEqual([
      { entityType: 'INSERT', reason: 'DXF entity type is not supported by the current MVP importer.' }
    ]);
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
