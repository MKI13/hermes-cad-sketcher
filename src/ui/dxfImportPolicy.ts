import type { DxfImportReport } from '../core/dxf';

export function shouldApplyDxfImportReport(report: DxfImportReport): boolean {
  return report.unitStatus.kind !== 'unsupported' && report.unitStatus.kind !== 'malformed';
}

export function statusFromDxfImportReport(report: DxfImportReport, fileName: string): string {
  const skipped = report.skippedEntities.length;
  if (!shouldApplyDxfImportReport(report)) {
    return `DXF abgelehnt: ${report.unitStatus.message} (${fileName})`;
  }
  return `DXF geladen: ${report.importedEntities} importiert, ${skipped} übersprungen; ${report.unitStatus.message} (${fileName})`;
}
