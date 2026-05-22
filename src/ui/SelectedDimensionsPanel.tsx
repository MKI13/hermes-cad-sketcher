import type { ChangeEvent } from 'react';
import type { BoxDimensions, Entity } from '../core/model';

export type DimensionInput = Record<keyof BoxDimensions, string>;
export type DimensionParseResult =
  | { ok: true; dimensions: BoxDimensions }
  | { ok: false; error: string };

type SelectedDimensionsPanelProps = {
  disabled: boolean;
  selectedType?: Entity['type'];
  dimensions: DimensionInput;
  onDimensionsChange: (dimensions: DimensionInput) => void;
  onApply: () => void;
};

export function boxDimensionsToInput(dimensions: BoxDimensions): DimensionInput {
  return {
    width: String(dimensions.width),
    depth: String(dimensions.depth),
    height: String(dimensions.height)
  };
}

export function parseSelectedBoxDimensions(dimensions: DimensionInput): DimensionParseResult {
  const width = Number(dimensions.width);
  const depth = Number(dimensions.depth);
  const height = Number(dimensions.height);
  const values = [width, depth, height];
  const hasEmpty = dimensions.width.trim() === '' || dimensions.depth.trim() === '' || dimensions.height.trim() === '';
  if (hasEmpty || values.some((value) => !Number.isFinite(value) || value <= 0)) {
    return { ok: false, error: 'Auswahlmaße müssen positive endliche Millimeterwerte sein.' };
  }
  return { ok: true, dimensions: { width, depth, height } };
}

export function SelectedDimensionsPanel({ disabled, selectedType, dimensions, onDimensionsChange, onApply }: SelectedDimensionsPanelProps) {
  const needsBox = selectedType !== 'box';
  const parsed = parseSelectedBoxDimensions(dimensions);
  const applyDisabled = disabled || needsBox || !parsed.ok;

  function updateDimension(key: keyof BoxDimensions, event: ChangeEvent<HTMLInputElement>) {
    onDimensionsChange({ ...dimensions, [key]: event.target.value });
  }

  return (
    <section className="selected-dimensions-panel" aria-label="Auswahlmaße bearbeiten">
      <strong>Auswahlmaße bearbeiten</strong>
      <p>{needsBox ? 'Körper auswählen, dann Breite, Tiefe und Höhe direkt bearbeiten.' : 'Absolute Maße der ausgewählten Box in Millimeter setzen.'}</p>
      <label>
        <span>Breite</span>
        <input aria-label="Breite der Auswahl in Millimeter" type="number" step="1" value={dimensions.width} onChange={(event) => updateDimension('width', event)} />
        <span>mm</span>
      </label>
      <label>
        <span>Tiefe</span>
        <input aria-label="Tiefe der Auswahl in Millimeter" type="number" step="1" value={dimensions.depth} onChange={(event) => updateDimension('depth', event)} />
        <span>mm</span>
      </label>
      <label>
        <span>Höhe</span>
        <input aria-label="Höhe der Auswahl in Millimeter" type="number" step="1" value={dimensions.height} onChange={(event) => updateDimension('height', event)} />
        <span>mm</span>
      </label>
      {!parsed.ok && !needsBox && <small>{parsed.error}</small>}
      <button type="button" disabled={applyDisabled} onClick={onApply}>Maße übernehmen</button>
    </section>
  );
}
