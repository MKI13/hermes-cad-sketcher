import { describe, expect, it } from 'vitest';
import { importDxfWithReport } from '../src/core/dxf';
import { shouldApplyDxfImportReport, statusFromDxfImportReport } from '../src/ui/dxfImportPolicy';

describe('DXF UI import policy', () => {
  it('does not replace the current model when DXF units are explicitly unsupported', () => {
    const report = importDxfWithReport('0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n1\n0\nENDSEC\n0\nEOF\n');

    expect(report.unitStatus.kind).toBe('unsupported');
    expect(shouldApplyDxfImportReport(report)).toBe(false);
    expect(statusFromDxfImportReport(report, 'inch.dxf')).toContain('DXF abgelehnt');
    expect(statusFromDxfImportReport(report, 'inch.dxf')).toContain('$INSUNITS=1');
  });

  it('allows millimeter and missing-unit DXF reports to be applied with visible status text', () => {
    const report = importDxfWithReport('0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n250\n21\n0\n31\n0\n0\nENDSEC\n0\nEOF\n');

    expect(report.unitStatus.kind).toBe('missing');
    expect(shouldApplyDxfImportReport(report)).toBe(true);
    expect(statusFromDxfImportReport(report, 'no-units.dxf')).toContain('DXF geladen');
    expect(statusFromDxfImportReport(report, 'no-units.dxf')).toContain('assuming millimeters');
  });
});
