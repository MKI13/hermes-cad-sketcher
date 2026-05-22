import type { ChangeEvent } from 'react';

export type RotateAngleParseResult =
  | { ok: true; radians: number }
  | { ok: false; error: string };

type RotatePanelProps = {
  disabled: boolean;
  angleDegrees: string;
  onAngleChange: (angleDegrees: string) => void;
  onApply: () => void;
};

export function parseRotateAngle(angleDegrees: string): RotateAngleParseResult {
  if (angleDegrees.trim() === '') return { ok: false, error: 'Drehung braucht einen gültigen Gradwert.' };
  const degrees = Number(angleDegrees);
  if (!Number.isFinite(degrees)) return { ok: false, error: 'Drehung braucht einen gültigen Gradwert.' };
  return { ok: true, radians: (degrees * Math.PI) / 180 };
}

export function RotatePanel({ disabled, angleDegrees, onAngleChange, onApply }: RotatePanelProps) {
  function updateAngle(event: ChangeEvent<HTMLInputElement>) {
    onAngleChange(event.target.value);
  }

  const parsed = parseRotateAngle(angleDegrees);
  const applyDisabled = disabled || !parsed.ok;

  return (
    <section className="rotate-panel" aria-label="Auswahl drehen">
      <strong>Auswahl drehen</strong>
      <p>{disabled ? 'Erst ein Element auswählen.' : 'Winkel in Grad eingeben; die Auswahl dreht um die eigene Z-Achse.'}</p>
      <label>
        <span>Winkel</span>
        <input
          aria-label="Drehwinkel in Grad"
          type="number"
          step="1"
          value={angleDegrees}
          onChange={updateAngle}
        />
        <span>Grad</span>
      </label>
      {!parsed.ok && <small>{parsed.error}</small>}
      <button type="button" disabled={applyDisabled} onClick={onApply}>Auswahl drehen</button>
    </section>
  );
}
