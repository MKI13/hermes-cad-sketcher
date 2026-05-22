import type { ChangeEvent } from 'react';
import type { Entity } from '../core/model';
import { isAxisAlignedRectangleFace } from '../core/model';

export type ExtrudeHeightParseResult =
  | { ok: true; height: number }
  | { ok: false; error: string };

type FaceExtrudePanelProps = {
  disabled: boolean;
  selectedType?: Entity['type'];
  selectedFace?: Extract<Entity, { type: 'face' }>;
  height: string;
  onHeightChange: (height: string) => void;
  onApply: () => void;
};

export function parseExtrudeHeight(height: string): ExtrudeHeightParseResult {
  if (height.trim() === '') return { ok: false, error: 'Extrusion braucht eine positive endliche Höhe in Millimeter.' };
  const value = Number(height);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: 'Extrusion braucht eine positive endliche Höhe in Millimeter.' };
  return { ok: true, height: value };
}

export function validateExtrudableFace(selectedFace: Extract<Entity, { type: 'face' }> | undefined, parsed: ExtrudeHeightParseResult): ExtrudeHeightParseResult {
  if (!parsed.ok) return parsed;
  if (!selectedFace) return { ok: false, error: 'Extrusion braucht eine ausgewählte Rechteckfläche.' };
  if (!isAxisAlignedRectangleFace(selectedFace.vertices)) {
    return { ok: false, error: 'Extrusion unterstützt im MVP nur axis-aligned Rechteckflächen.' };
  }
  return parsed;
}

export function FaceExtrudePanel({ disabled, selectedType, selectedFace, height, onHeightChange, onApply }: FaceExtrudePanelProps) {
  const needsFace = selectedType !== 'face';
  const parsed = parseExtrudeHeight(height);
  const validation = needsFace ? parsed : validateExtrudableFace(selectedFace, parsed);
  const applyDisabled = disabled || needsFace || !validation.ok;

  function updateHeight(event: ChangeEvent<HTMLInputElement>) {
    onHeightChange(event.target.value);
  }

  return (
    <section className="face-extrude-panel" aria-label="Fläche extrudieren">
      <strong>Fläche extrudieren</strong>
      <p>{needsFace ? 'Rechteck/Fläche auswählen, dann eine positive Höhe in Millimeter setzen.' : 'Ausgewählte Rechteckfläche zu einem Boxkörper extrudieren.'}</p>
      <label>
        <span>Höhe</span>
        <input aria-label="Extrusionshöhe in Millimeter" type="number" step="1" value={height} onChange={updateHeight} />
        <span>mm</span>
      </label>
      {!validation.ok && !needsFace && <small>{validation.error}</small>}
      <button type="button" disabled={applyDisabled} onClick={onApply}>Fläche extrudieren</button>
    </section>
  );
}
