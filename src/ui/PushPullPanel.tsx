import type { ChangeEvent } from 'react';
import type { Entity } from '../core/model';

export type PushPullParseResult =
  | { ok: true; deltaHeight: number }
  | { ok: false; error: string };

type PushPullPanelProps = {
  disabled: boolean;
  selectedType?: Entity['type'];
  deltaHeight: string;
  onDeltaHeightChange: (deltaHeight: string) => void;
  onApply: () => void;
};

export function parsePushPullDelta(deltaHeight: string): PushPullParseResult {
  if (deltaHeight.trim() === '') return { ok: false, error: 'Push/Pull braucht eine gültige Höhenänderung.' };
  const value = Number(deltaHeight);
  if (!Number.isFinite(value) || value === 0) return { ok: false, error: 'Push/Pull braucht eine Höhenänderung ungleich 0 mm.' };
  return { ok: true, deltaHeight: value };
}

export function PushPullPanel({ disabled, selectedType, deltaHeight, onDeltaHeightChange, onApply }: PushPullPanelProps) {
  function updateDelta(event: ChangeEvent<HTMLInputElement>) {
    onDeltaHeightChange(event.target.value);
  }

  const parsed = parsePushPullDelta(deltaHeight);
  const needsBox = selectedType !== 'box';
  const applyDisabled = disabled || needsBox || !parsed.ok;

  return (
    <section className="push-pull-panel" aria-label="Höhe ändern">
      <strong>Höhe ändern</strong>
      <p>{needsBox ? 'Körper auswählen, dann Höhe in Millimeter ändern.' : 'Positive Werte erhöhen, negative Werte verringern die Körperhöhe.'}</p>
      <label>
        <span>ΔH</span>
        <input
          aria-label="Höhenänderung in Millimeter"
          type="number"
          step="1"
          value={deltaHeight}
          onChange={updateDelta}
        />
        <span>mm</span>
      </label>
      {!parsed.ok && <small>{parsed.error}</small>}
      <button type="button" disabled={applyDisabled} onClick={onApply}>Höhe ändern</button>
    </section>
  );
}
