import type { ChangeEvent } from 'react';
import type { BoxEntity, Entity } from '../core/model';

export type PushPullParseResult =
  | { ok: true; deltaHeight: number }
  | { ok: false; error: string };

type PushPullPanelProps = {
  disabled: boolean;
  selectedType?: Entity['type'];
  selectedBox?: Pick<BoxEntity, 'height'>;
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

export function validatePushPullHeight(selectedBox: Pick<BoxEntity, 'height'> | undefined, parsed: PushPullParseResult): PushPullParseResult {
  if (!parsed.ok) return parsed;
  if (!selectedBox) return { ok: false, error: 'Push/Pull braucht einen ausgewählten Körper.' };
  if (selectedBox.height + parsed.deltaHeight <= 0) {
    return { ok: false, error: 'Push/Pull darf die Höhe nicht auf null oder negativ setzen.' };
  }
  return parsed;
}

export function PushPullPanel({ disabled, selectedType, selectedBox, deltaHeight, onDeltaHeightChange, onApply }: PushPullPanelProps) {
  function updateDelta(event: ChangeEvent<HTMLInputElement>) {
    onDeltaHeightChange(event.target.value);
  }

  const parsed = parsePushPullDelta(deltaHeight);
  const needsBox = selectedType !== 'box';
  const heightValidation = needsBox ? parsed : validatePushPullHeight(selectedBox, parsed);
  const applyDisabled = disabled || needsBox || !heightValidation.ok;

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
      {!heightValidation.ok && <small>{heightValidation.error}</small>}
      <button type="button" disabled={applyDisabled} onClick={onApply}>Höhe ändern</button>
    </section>
  );
}
