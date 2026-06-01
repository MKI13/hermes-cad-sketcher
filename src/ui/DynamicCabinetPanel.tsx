import React from 'react';
import type { DynamicCabinetTemplateId, DynamicCabinetTemplateSummary, DynamicComponent, KitchenBaseCabinetParameters } from '../core/dynamicComponents';

export type DynamicCabinetPanelProps = {
  cabinet: DynamicComponent;
  templates: DynamicCabinetTemplateSummary[];
  activeTemplateId: DynamicCabinetTemplateId;
  onTemplateChange: (templateId: DynamicCabinetTemplateId) => void;
  onParameterChange: <K extends keyof KitchenBaseCabinetParameters>(key: K, value: KitchenBaseCabinetParameters[K]) => void;
  onCreateModel: () => void;
  onDownloadTemplate: () => void;
  onDownloadManufacturingDxf: () => void;
  onDownloadCncCsv: () => void;
  onOpenTemplate: (file: File) => void;
  layout?: 'tray' | 'window';
  onOpenWindow?: () => void;
};

export function DynamicCabinetPanel({ cabinet, templates, activeTemplateId, onTemplateChange, onParameterChange, onCreateModel, onDownloadTemplate, onDownloadManufacturingDxf, onDownloadCncCsv, onOpenTemplate, layout = 'window', onOpenWindow }: DynamicCabinetPanelProps) {
  const params = cabinet.parameters;
  const errorCount = cabinet.validation.filter((issue) => issue.severity === 'error').length;
  const warningCount = cabinet.validation.filter((issue) => issue.severity === 'warning').length;
  const hintCount = cabinet.validation.filter((issue) => issue.severity === 'info').length;
  const visiblePartCount = cabinet.parts.filter((part) => part.visible).length;

  if (layout === 'tray') {
    return (
      <section className="dynamic-component-tray-launcher" aria-label="Dynamische Komponenten Kurzansicht" data-dynamic-tray-mode="compact">
        <strong>Dynamische Komponenten</strong>
        <p>{cabinet.name} · {visiblePartCount} Bauteile · {cabinet.cutlist.length} Zuschnitte · {cabinet.holeList.length} Bohrungen.</p>
        <button type="button" className="primary" onClick={onOpenWindow}>Dynamische Komponenten als Fenster öffnen</button>
        <button type="button" onClick={onCreateModel}>{cabinet.name} erzeugen</button>
        <div className="dynamic-summary compact" aria-label="Dynamische Komponente Kurzauswertung">
          <span>Bauteile: {visiblePartCount}</span>
          <span>Stückliste: {cabinet.cutlist.length}</span>
          <span>Bohrliste: {cabinet.holeList.length}</span>
        </div>
        <small>Maße, Listen und Exporte öffnen im eigenen verschiebbaren Fenster, damit rechts keine Leiste über der anderen liegt.</small>
      </section>
    );
  }

  return (
    <section className="dynamic-component-panel windowed" aria-label="Dynamic Component Options">
      <strong>Dynamische Komponenten</strong>
      <p>Schreiner-MVP: echte Bauteile statt optischer Skalierung. Vorlage: {cabinet.name}</p>
      <label>
        <span>Schranktyp-Bibliothek</span>
        <select value={activeTemplateId} onChange={(event) => onTemplateChange(event.currentTarget.value as DynamicCabinetTemplateId)}>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
      </label>
      <div className="dynamic-component-actions">
        <button type="button" onClick={onCreateModel}>{cabinet.name} erzeugen</button>
        <button type="button" onClick={onDownloadTemplate}>JSON-Vorlage speichern</button>
        <label className="file-button">
          JSON-Vorlage laden
          <input
            type="file"
            accept=".json,.hcad.json,application/json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onOpenTemplate(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <button type="button" onClick={onDownloadManufacturingDxf}>Fertigungs-DXF</button>
        <button type="button" onClick={onDownloadCncCsv}>CNC-Bohrliste CSV</button>
      </div>
      <fieldset>
        <legend>Allgemein</legend>
        <NumberField label="Breite" value={params.W} onChange={(value) => onParameterChange('W', value)} />
        <NumberField label="Höhe" value={params.H} onChange={(value) => onParameterChange('H', value)} />
        <NumberField label="Tiefe" value={params.D} onChange={(value) => onParameterChange('D', value)} />
        <NumberField label="Materialstärke" value={params.T} onChange={(value) => onParameterChange('T', value)} />
        <NumberField label="Rückwandstärke" value={params.BACK_T} onChange={(value) => onParameterChange('BACK_T', value)} />
      </fieldset>
      <fieldset>
        <legend>Konstruktion</legend>
        <label>
          <span>Fronttyp</span>
          <select value={params.DOOR_TYPE} onChange={(event) => onParameterChange('DOOR_TYPE', event.currentTarget.value as KitchenBaseCabinetParameters['DOOR_TYPE'])}>
            <option value="none">keine</option>
            <option value="left_door">Tür links</option>
            <option value="right_door">Tür rechts</option>
            <option value="double_door">Doppeltür</option>
            <option value="drawers">Schubladen</option>
          </select>
        </label>
        <NumberField label="Fachbodenanzahl" value={params.SHELF_COUNT} onChange={(value) => onParameterChange('SHELF_COUNT', Math.floor(value))} />
        <label>
          <span>Fachbodenart</span>
          <select value={params.SHELF_TYPE} onChange={(event) => onParameterChange('SHELF_TYPE', event.currentTarget.value as KitchenBaseCabinetParameters['SHELF_TYPE'])}>
            <option value="adjustable">verstellbar mit Lochreihe</option>
            <option value="fixed">fest</option>
          </select>
        </label>
        <label>
          <span>Rückwand</span>
          <select value={params.BACK_TYPE} onChange={(event) => onParameterChange('BACK_TYPE', event.currentTarget.value as KitchenBaseCabinetParameters['BACK_TYPE'])}>
            <option value="applied">aufgesetzt</option>
            <option value="grooved">eingenutet</option>
            <option value="none">keine</option>
          </select>
        </label>
        <NumberField label="Schubladenanzahl" value={params.DRAWER_COUNT} onChange={(value) => onParameterChange('DRAWER_COUNT', Math.max(1, Math.floor(value)))} />
        <NumberField label="Auszugslänge" value={params.DRAWER_RUNNER_LENGTH} onChange={(value) => onParameterChange('DRAWER_RUNNER_LENGTH', value)} />
        <label>
          <span>Sockel</span>
          <input type="checkbox" checked={params.PLINTH} onChange={(event) => onParameterChange('PLINTH', event.currentTarget.checked)} />
        </label>
      </fieldset>
      <div className="dynamic-summary" aria-label="Dynamische Komponente Auswertung">
        <span>Bauteile: {visiblePartCount}</span>
        <span>Stückliste: {cabinet.cutlist.length}</span>
        <span>Zuschnittliste: {cabinet.cutlist.length}</span>
        <span>Kantenliste: {cabinet.edgeList.length}</span>
        <span>Bohrliste: {cabinet.holeList.length}</span>
        <span>Beschlagsliste: {cabinet.hardwareList.length}</span>
      </div>
      <div className="dynamic-validation" aria-label="Dynamische Komponente Validierung">
        <strong>Validierung</strong>
        <span>{errorCount} Fehler · {warningCount} Warnungen · {hintCount} Hinweise</span>
        {cabinet.validation.length > 0 ? (
          <ul>{cabinet.validation.slice(0, 4).map((issue, index) => <li key={`${issue.severity}-${index}`}>{issue.severity.toUpperCase()}: {issue.message}</li>)}</ul>
        ) : <p>Keine Fehler oder Warnungen.</p>}
      </div>
      <details>
        <summary>Stückliste / Zuschnittliste</summary>
        <ol>
          {cabinet.cutlist.slice(0, 10).map((row) => (
            <li key={row.partId}>{row.name}: {row.quantity} × {row.length} × {row.width} × {row.thickness} mm · {row.material}</li>
          ))}
        </ol>
      </details>
      <details>
        <summary>Kantenliste</summary>
        <ol>
          {cabinet.edgeList.slice(0, 10).map((row) => (
            <li key={`${row.partId}-${row.edge}`}>{row.partName} {row.edge}: {row.banding} · {row.length} mm</li>
          ))}
        </ol>
      </details>
      <details>
        <summary>Bohrliste</summary>
        <ol>
          {cabinet.holeList.slice(0, 10).map((hole) => (
            <li key={hole.id}>{hole.partName}: Ø{hole.diameter} × {hole.depth} mm · {hole.purpose}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step="1"
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <small>mm</small>
    </label>
  );
}
