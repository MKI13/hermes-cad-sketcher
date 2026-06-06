import React from 'react';
import type { RenderSceneSnapshot } from '../core/rendering';

export type RenderWorkspacePanelProps = Readonly<{
  snapshot: RenderSceneSnapshot;
  bridgeStatus: 'internal-preview-only' | 'external-bridge-ready' | 'external-bridge-missing';
}>;

export function RenderWorkspacePanel({ snapshot, bridgeStatus }: RenderWorkspacePanelProps) {
  const previewPreset = snapshot.presets.find((preset) => preset.id === 'customer-interior-preview') ?? snapshot.presets[0];
  const externalReady = bridgeStatus === 'external-bridge-ready';
  return (
    <section className="render-workspace-panel" aria-label="Render-Workspace">
      <header>
        <strong>Render-Workspace</strong>
        <span>interne Vorschau · CAD-Kern bleibt Millimeter-Wahrheit</span>
      </header>
      <dl className="render-workspace-stats">
        <div><dt>Einheit</dt><dd>{snapshot.unit}</dd></div>
        <div><dt>Objekte</dt><dd>{snapshot.objects.length}</dd></div>
        <div><dt>PBR-Materialien</dt><dd>{snapshot.materials.length}</dd></div>
        <div><dt>Lichter</dt><dd>{snapshot.lights.length}</dd></div>
      </dl>
      <div className="render-workspace-card">
        <strong>Preset</strong>
        <p>{previewPreset.name} · {previewPreset.engine} · {previewPreset.width}×{previewPreset.height}</p>
      </div>
      <div className="render-workspace-card render-material-overview">
        <strong>Materialübersicht</strong>
        <ul aria-label="PBR-Materialübersicht">
          {snapshot.materials.map((material) => (
            <li key={material.id}>
              <span className="render-material-chip" style={{ backgroundColor: material.baseColor }} aria-hidden="true" />
              <span>{material.name}</span>
              <small>{material.category} · rough {material.roughness.toFixed(2)} · metal {material.metalness.toFixed(2)}</small>
            </li>
          ))}
        </ul>
      </div>
      <div className="render-workspace-card">
        <strong>Lokale Render-Bridge</strong>
        <p>{externalReady ? 'bereit für Blender/externes Rendering' : 'nicht aktiv; externe Jobs bleiben fail-closed'}</p>
      </div>
      <ul className="render-workspace-rules">
        <li>Materialien, Kamera, Licht und Umgebung laufen über RenderSceneSnapshot.</li>
        <li>Keine fremden Marken-Assets und keine freien Chat-Codebefehle.</li>
        <li>Blender/Cycles bleibt optional über lokale Bridge auf 127.0.0.1.</li>
      </ul>
    </section>
  );
}
