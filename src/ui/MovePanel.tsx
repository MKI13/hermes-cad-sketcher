import type { ChangeEvent } from 'react';
import { vec, type Vec3 } from '../core/geometry';

export type MoveDeltaInput = {
  x: string;
  y: string;
  z: string;
};

export type MoveDeltaParseResult =
  | { ok: true; delta: Vec3 }
  | { ok: false; error: string };

type MovePanelProps = {
  disabled: boolean;
  delta: MoveDeltaInput;
  onDeltaChange: (delta: MoveDeltaInput) => void;
  onApply: () => void;
};

const fields: Array<{ key: keyof MoveDeltaInput; label: string; aria: string }> = [
  { key: 'x', label: 'ΔX', aria: 'Delta X in Millimeter' },
  { key: 'y', label: 'ΔY', aria: 'Delta Y in Millimeter' },
  { key: 'z', label: 'ΔZ', aria: 'Delta Z in Millimeter' }
];

export function parseMoveDelta(input: MoveDeltaInput): MoveDeltaParseResult {
  const rawValues = [input.x, input.y, input.z];
  if (rawValues.some((value) => value.trim() === '')) {
    return { ok: false, error: 'Verschiebung braucht gültige Millimeterwerte.' };
  }
  const parsed = rawValues.map((value) => Number(value));
  if (parsed.some((value) => !Number.isFinite(value))) {
    return { ok: false, error: 'Verschiebung braucht gültige Millimeterwerte.' };
  }
  return { ok: true, delta: vec(parsed[0], parsed[1], parsed[2]) };
}

export function MovePanel({ disabled, delta, onDeltaChange, onApply }: MovePanelProps) {
  function updateField(key: keyof MoveDeltaInput, event: ChangeEvent<HTMLInputElement>) {
    onDeltaChange({ ...delta, [key]: event.target.value });
  }

  const parsed = parseMoveDelta(delta);
  const applyDisabled = disabled || !parsed.ok;

  return (
    <section className="move-panel" aria-label="Auswahl verschieben">
      <strong>Auswahl verschieben</strong>
      <p>{disabled ? 'Erst ein Element auswählen.' : 'Delta in Millimeter eingeben und auf die Auswahl anwenden.'}</p>
      {fields.map((field) => (
        <label key={field.key}>
          <span>{field.label}</span>
          <input
            aria-label={field.aria}
            type="number"
            step="1"
            value={delta[field.key]}
            onChange={(event) => updateField(field.key, event)}
          />
          <span>mm</span>
        </label>
      ))}
      {!parsed.ok && <small>{parsed.error}</small>}
      <button type="button" disabled={applyDisabled} onClick={onApply}>Auswahl verschieben</button>
    </section>
  );
}
