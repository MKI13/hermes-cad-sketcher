import { SketchModel, type SketchModelSnapshot } from './model';

export const PROJECT_FILE_VERSION = 1;
export const PROJECT_FILE_FORMAT = 'hermes-cad-sketcher';

export type HermesCadProjectFile = Readonly<{
  format: typeof PROJECT_FILE_FORMAT;
  version: typeof PROJECT_FILE_VERSION;
  createdBy: 'Hermes CAD Sketcher';
  model: SketchModelSnapshot;
}>;

export function exportProjectFile(model: SketchModel): string {
  const document: HermesCadProjectFile = {
    format: PROJECT_FILE_FORMAT,
    version: PROJECT_FILE_VERSION,
    createdBy: 'Hermes CAD Sketcher',
    model: model.snapshot()
  };
  return JSON.stringify(document, null, 2) + '\n';
}

export function importProjectFile(text: string): SketchModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Projektdatei ist kein gültiges JSON.');
  }

  if (!isRecord(parsed) || parsed.format !== PROJECT_FILE_FORMAT) {
    throw new Error('Nicht unterstütztes Projektformat.');
  }

  if (parsed.version !== PROJECT_FILE_VERSION) {
    throw new Error('Nicht unterstützte Projektdatei-Version.');
  }

  if (!isRecord(parsed.model) || parsed.model.unit !== 'mm') {
    throw new Error('Nur Millimeter-Projekte werden unterstützt.');
  }

  const model = parsed.model as SketchModelSnapshot;
  if (!Array.isArray(model.entities) || !Array.isArray(model.components)) {
    throw new Error('Projektdatei enthält kein gültiges Modell.');
  }

  return SketchModel.fromSnapshot(model);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
