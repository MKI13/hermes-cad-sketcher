import type { ChangeEvent } from 'react';
import type { BoxEntity, BoxFaceName, Entity } from '../core/model';
import { isAxisAlignedRectangleFace } from '../core/model';

export type PushPullParseResult =
  | { ok: true; deltaHeight: number }
  | { ok: false; error: string };

type PushPullPanelProps = {
  disabled: boolean;
  selectedType?: Entity['type'];
  selectedBox?: Pick<BoxEntity, 'width' | 'depth' | 'height'>;
  selectedBoxFace?: BoxFaceName;
  selectedFace?: Extract<Entity, { type: 'face' }>;
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

export function validatePushPullHeight(
  selected: { selectedBox?: Pick<BoxEntity, 'width' | 'depth' | 'height'>; selectedBoxFace?: BoxFaceName; selectedFace?: Extract<Entity, { type: 'face' }> },
  parsed: PushPullParseResult
): PushPullParseResult {
  if (!parsed.ok) return parsed;
  if (selected.selectedFace) {
    if (parsed.deltaHeight <= 0) return { ok: false, error: 'Push/Pull-Flächenextrusion braucht eine positive Distanz.' };
    if (!isAxisAlignedRectangleFace(selected.selectedFace.vertices)) return { ok: false, error: 'Push/Pull unterstützt im MVP nur axis-aligned Rechteckflächen oder Körperseiten.' };
    return parsed;
  }
  if (!selected.selectedBox) return { ok: false, error: 'Push/Pull braucht eine ausgewählte Fläche oder einen Körper.' };
  const affectedDimension = dimensionForBoxFace(selected.selectedBox, selected.selectedBoxFace ?? 'top');
  if (affectedDimension + parsed.deltaHeight <= 0) {
    return { ok: false, error: 'Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.' };
  }
  return parsed;
}

function dimensionForBoxFace(box: Pick<BoxEntity, 'width' | 'depth' | 'height'>, face: BoxFaceName): number {
  if (face === 'left' || face === 'right') return box.width;
  if (face === 'front' || face === 'back') return box.depth;
  return box.height;
}

export function PushPullPanel({ disabled, selectedType, selectedBox, selectedBoxFace, selectedFace, deltaHeight, onDeltaHeightChange, onApply }: PushPullPanelProps) {
  function updateDelta(event: ChangeEvent<HTMLInputElement>) {
    onDeltaHeightChange(event.target.value);
  }

  const parsed = parsePushPullDelta(deltaHeight);
  const needsSelection = selectedType !== 'box' && selectedType !== 'face';
  const heightValidation = needsSelection ? parsed : validatePushPullHeight({ selectedBox, selectedBoxFace, selectedFace }, parsed);
  const applyDisabled = disabled || needsSelection || !heightValidation.ok;
  const selectedFaceMode = selectedType === 'face';

  return (
    <section className="push-pull-panel" aria-label="Push/Pull Fläche oder Körper">
      <strong>Push/Pull</strong>
      <p>{needsSelection
        ? 'Körper oder Rechteckfläche auswählen, dann in Millimeter ziehen.'
        : selectedFaceMode
          ? 'Ausgewählte Rechteckfläche mit positiver Distanz zu einem Körper extrudieren.'
          : 'Positive Werte ziehen die Körperseite heraus, negative Werte drücken sie hinein.'}</p>
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
