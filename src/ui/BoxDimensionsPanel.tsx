import type { ChangeEvent } from 'react';
import type { BoxDimensions } from './drawingController';

type DimensionKey = keyof BoxDimensions;

export type BoxDimensionUpdate =
  | { ok: true; dimensions: BoxDimensions }
  | { ok: false; dimensions: BoxDimensions };

type BoxDimensionsPanelProps = {
  dimensions: BoxDimensions;
  onChange: (dimensions: BoxDimensions) => void;
};

const dimensionFields: Array<{ key: DimensionKey; label: string }> = [
  { key: 'width', label: 'Breite' },
  { key: 'depth', label: 'Tiefe' },
  { key: 'height', label: 'Höhe' }
];

export function updateBoxDimension(dimensions: BoxDimensions, key: DimensionKey, rawValue: string): BoxDimensionUpdate {
  const nextValue = Number(rawValue);
  if (!Number.isFinite(nextValue) || nextValue <= 0) return { ok: false, dimensions };
  return { ok: true, dimensions: { ...dimensions, [key]: nextValue } };
}

export function BoxDimensionsPanel({ dimensions, onChange }: BoxDimensionsPanelProps) {
  function updateDimension(key: DimensionKey, event: ChangeEvent<HTMLInputElement>) {
    const update = updateBoxDimension(dimensions, key, event.target.value);
    if (update.ok) onChange(update.dimensions);
  }

  return (
    <section className="box-dimensions" aria-label="Körpermaße in Millimeter">
      <strong>Körpermaße</strong>
      <p>Neue Körper werden mit diesen Maßen auf dem Raster platziert.</p>
      {dimensionFields.map((field) => (
        <label key={field.key}>
          <span>{field.label}</span>
          <input
            aria-label={`${field.label} in Millimeter`}
            type="number"
            min="1"
            step="1"
            value={dimensions[field.key]}
            onChange={(event) => updateDimension(field.key, event)}
          />
          <span>mm</span>
        </label>
      ))}
    </section>
  );
}
