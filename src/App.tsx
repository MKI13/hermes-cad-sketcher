import React, { useEffect, useState } from 'react';
import { Box, Component, Copy, Download, FolderOpen, Move3D, Redo2, Ruler, RotateCw, Save, Square, Slash, Trash2, Undo2, Upload } from 'lucide-react';
import { SketchModel, type ToolName } from './core/model';
import { vec, type Vec3 } from './core/geometry';
import { formatTapeMeasurement } from './core/toolState';
import { exportProjectFile, importProjectFile } from './core/projectFile';
import { exportDxf, importDxfWithReport } from './core/dxf';
import { exportAsciiStl } from './core/stl';
import { createHistory, pushHistory, redoHistory, undoHistory, type ModelHistory } from './core/history';
import { BoxDimensionsPanel } from './ui/BoxDimensionsPanel';
import { inspectEntity } from './core/inspection';
import { InspectorPanel } from './ui/InspectorPanel';
import { createBoxDraft, createLineDraft, createRectangleDraft, DEFAULT_BOX_DIMENSIONS } from './ui/drawingController';
import { SelectedDimensionsPanel, boxDimensionsToInput, parseSelectedBoxDimensions, type DimensionInput } from './ui/SelectedDimensionsPanel';
import { FaceExtrudePanel, parseExtrudeHeight, validateExtrudableFace } from './ui/FaceExtrudePanel';
import { MovePanel, parseMoveDelta, type MoveDeltaInput } from './ui/MovePanel';
import { RotatePanel, parseRotateAngle } from './ui/RotatePanel';
import { PushPullPanel, parsePushPullDelta } from './ui/PushPullPanel';
import { getPrimaryActionLabel, getToolInstructions } from './ui/toolInstructions';
import { shouldDeleteSelectionFromKey } from './ui/selectionControls';
import { ThreeViewport } from './ui/ThreeViewport';
import './styles.css';

const tools: Array<{ id: ToolName; label: string; icon: React.ReactNode }> = [
  { id: 'select', label: 'Auswahl', icon: <Component size={18} /> },
  { id: 'line', label: 'Linie', icon: <Slash size={18} /> },
  { id: 'rectangle', label: 'Quadrat/Rechteck', icon: <Square size={18} /> },
  { id: 'box', label: 'Körper', icon: <Box size={18} /> },
  { id: 'move', label: 'Verschieben', icon: <Move3D size={18} /> },
  { id: 'pushPull', label: 'Seite ziehen', icon: <Upload size={18} /> },
  { id: 'rotate', label: 'Drehen', icon: <RotateCw size={18} /> },
  { id: 'tape', label: 'Maßband', icon: <Ruler size={18} /> }
];

export default function App() {
  const [initialModel] = useState(() => {
    const m = new SketchModel();
    const box = m.createBox(vec(0, 0, 0), 2400, 900, 720);
    const line = m.createLine(vec(0, -300, 0), vec(2400, -300, 0));
    m.createComponent('Beispiel-Komponente Tischkörper', [box.id, line.id]);
    return m;
  });
  const [model, setModel] = useState(initialModel);
  const [history, setHistory] = useState<ModelHistory>(() => createHistory(initialModel.snapshot()));
  const [tool, setTool] = useState<ToolName>('select');
  const [selectedId, setSelectedId] = useState<string | undefined>(model.allEntities()[0]?.id);
  const [lastMeasurement, setLastMeasurement] = useState('noch keine Messung');
  const [projectStatus, setProjectStatus] = useState('Projekt nicht gespeichert');
  const [boxDimensions, setBoxDimensions] = useState(DEFAULT_BOX_DIMENSIONS);
  const [selectedDimensions, setSelectedDimensions] = useState<DimensionInput>(() => {
    const first = initialModel.allEntities()[0];
    return first?.type === 'box' ? boxDimensionsToInput(first) : boxDimensionsToInput(DEFAULT_BOX_DIMENSIONS);
  });
  const [moveDelta, setMoveDelta] = useState<MoveDeltaInput>({ x: '100', y: '0', z: '0' });
  const [rotateAngleDegrees, setRotateAngleDegrees] = useState('90');
  const [pushPullDeltaHeight, setPushPullDeltaHeight] = useState('100');
  const [extrudeHeight, setExtrudeHeight] = useState('720');
  const [faceExtrusionStatus, setFaceExtrusionStatus] = useState('');

  const selected = selectedId ? model.getEntity(selectedId) : undefined;
  const selectedInspection = selected ? inspectEntity(selected) : undefined;

  useEffect(() => {
    if (selected?.type === 'box') setSelectedDimensions(boxDimensionsToInput(selected));
  }, [selected?.id, selected?.type, selected?.type === 'box' ? selected.width : undefined, selected?.type === 'box' ? selected.depth : undefined, selected?.type === 'box' ? selected.height : undefined]);

  function mutate(action: (m: SketchModel) => void) {
    const next = SketchModel.fromSnapshot(model.snapshot());
    action(next);
    setModel(next);
    setHistory((current) => pushHistory(current, next.snapshot()));
  }

  function restoreSnapshot(nextHistory: ModelHistory, fallbackSelectedId?: string) {
    const nextModel = SketchModel.fromSnapshot(nextHistory.current);
    setModel(nextModel);
    setHistory(nextHistory);
    setSelectedId((current) => {
      if (current && nextModel.getEntity(current)) return current;
      if (fallbackSelectedId && nextModel.getEntity(fallbackSelectedId)) return fallbackSelectedId;
      return nextModel.allEntities()[0]?.id;
    });
  }

  function undoModelChange() {
    const result = undoHistory(history);
    restoreSnapshot(result.history, selectedId);
  }

  function redoModelChange() {
    const result = redoHistory(history);
    restoreSnapshot(result.history, selectedId);
  }

  function loadExampleModel() {
    const m = new SketchModel();
    const box = m.createBox(vec(0, 0, 0), 2400, 900, 720);
    const line = m.createLine(vec(0, -300, 0), vec(2400, -300, 0));
    m.createComponent('Beispiel-Komponente Tischkörper', [box.id, line.id]);
    setModel(m);
    setHistory(createHistory(m.snapshot()));
    setSelectedId(box.id);
    setLastMeasurement('noch keine Messung');
    setProjectStatus('Beispiel geladen');
  }

  function createLineFromViewport(start: Vec3, end: Vec3) {
    const draft = createLineDraft(start, end);
    if (!draft.ok) return;
    mutate((m) => setSelectedId(m.createLine(draft.start, draft.end).id));
  }

  function createRectangleFromViewport(first: Vec3, second: Vec3) {
    const draft = createRectangleDraft(first, second);
    if (!draft.ok) return;
    mutate((m) => setSelectedId(m.createRectangle(draft.origin, draft.width, draft.depth).id));
  }

  function createBoxFromViewport(origin: Vec3) {
    const draft = createBoxDraft(origin, boxDimensions);
    if (!draft.ok) return;
    mutate((m) => setSelectedId(m.createBox(draft.origin, draft.width, draft.depth, draft.height).id));
  }

  function measureFromViewport(start: Vec3, end: Vec3) {
    setLastMeasurement(formatTapeMeasurement(model, start, end));
  }

  function moveFromViewport(entityId: string, delta: Vec3) {
    mutate((m) => {
      m.moveEntity(entityId, delta);
      setSelectedId(entityId);
    });
  }

  function applyMoveDelta() {
    if (!selectedId) return;
    const parsed = parseMoveDelta(moveDelta);
    if (!parsed.ok) return;
    moveFromViewport(selectedId, parsed.delta);
  }

  function applyRotateAngle() {
    if (!selectedId) return;
    const parsed = parseRotateAngle(rotateAngleDegrees);
    if (!parsed.ok) return;
    mutate((m) => {
      m.rotateEntityZ(selectedId, parsed.radians);
      setSelectedId(selectedId);
    });
  }

  function applyPushPullDelta() {
    if (!selectedId || selected?.type !== 'box') return;
    const parsed = parsePushPullDelta(pushPullDeltaHeight);
    if (!parsed.ok) return;
    mutate((m) => {
      const updated = m.pushPullBoxFace(selectedId, parsed.deltaHeight);
      setSelectedId(selectedId);
      setSelectedDimensions(boxDimensionsToInput(updated));
    });
  }

  function applySelectedDimensions() {
    if (!selectedId || selected?.type !== 'box') return;
    const parsed = parseSelectedBoxDimensions(selectedDimensions);
    if (!parsed.ok) return;
    mutate((m) => {
      const updated = m.resizeBox(selectedId, parsed.dimensions);
      setSelectedId(selectedId);
      setSelectedDimensions(boxDimensionsToInput(updated));
    });
  }

  function applyFaceExtrusion() {
    if (!selectedId || selected?.type !== 'face') return;
    const validation = validateExtrudableFace(selected, parseExtrudeHeight(extrudeHeight));
    if (!validation.ok) {
      setFaceExtrusionStatus(validation.error);
      setProjectStatus(validation.error);
      return;
    }
    try {
      let extruded = false;
      mutate((m) => {
        const box = m.extrudeFaceToBox(selectedId, validation.height);
        setSelectedId(box.id);
        setSelectedDimensions(boxDimensionsToInput(box));
        extruded = true;
      });
      if (extruded) {
        setFaceExtrusionStatus('Fläche zu Körper extrudiert');
        setProjectStatus('Fläche zu Körper extrudiert');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fläche konnte nicht extrudiert werden.';
      setFaceExtrusionStatus(message);
      setProjectStatus(message);
    }
  }

  function duplicateSelectedComponent() {
    if (!selected?.componentId) return;
    mutate((m) => {
      const duplicate = m.duplicateComponent(selected.componentId!, 'Kopie der Komponente', vec(800, 0, 0));
      setSelectedId(duplicate.entityIds[0]);
    });
  }

  function deleteSelectedEntity() {
    if (!selectedId) return;
    mutate((m) => {
      m.deleteEntity(selectedId);
      setSelectedId(undefined);
    });
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedId || !shouldDeleteSelectionFromKey(event)) return;
      event.preventDefault();
      deleteSelectedEntity();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [model, selectedId]);

  function download(filename: string, content: string, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveProjectFile() {
    download('hermes-cad-sketcher.hcad.json', exportProjectFile(model), 'application/json');
    setProjectStatus('Projekt als .hcad.json exportiert');
  }

  async function openProjectFile(file: File) {
    try {
      const text = await file.text();
      const next = importProjectFile(text);
      setModel(next);
      setHistory(createHistory(next.snapshot()));
      setSelectedId(next.allEntities()[0]?.id);
      setProjectStatus(`Projekt geladen: ${file.name}`);
    } catch (error) {
      setProjectStatus(error instanceof Error ? error.message : 'Projekt konnte nicht geladen werden.');
    }
  }

  async function openDxfFile(file: File) {
    try {
      const text = await file.text();
      const report = importDxfWithReport(text);
      setModel(report.model);
      setHistory(createHistory(report.model.snapshot()));
      setSelectedId(report.model.allEntities()[0]?.id);
      const skipped = report.skippedEntities.length;
      setProjectStatus(`DXF geladen: ${report.importedEntities} importiert, ${skipped} übersprungen (${file.name})`);
    } catch (error) {
      setProjectStatus(error instanceof Error ? error.message : 'DXF konnte nicht geladen werden.');
    }
  }

  return (
    <main className="app-shell">
      <aside className="toolbar">
        <h1>Hermes CAD Sketcher</h1>
        <p className="subtitle">SketchUp-ähnlicher Linux-CAD-Prototyp in Millimeter.</p>
        {tools.map((item) => (
          <button key={item.id} className={tool === item.id ? 'active' : ''} onClick={() => setTool(item.id)}>
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
        <button className="primary" onClick={loadExampleModel}>{getPrimaryActionLabel()}</button>
        <div className="history-controls" aria-label="Verlauf">
          <button title="Letzte Modelländerung rückgängig machen" onClick={undoModelChange} disabled={!history.canUndo}>
            <Undo2 size={18}/> Rückgängig
          </button>
          <button title="Rückgängig gemachte Modelländerung wiederholen" onClick={redoModelChange} disabled={!history.canRedo}>
            <Redo2 size={18}/> Wiederholen
          </button>
        </div>
        <p className="tool-instruction">{getToolInstructions(tool)}</p>
        <button onClick={duplicateSelectedComponent} disabled={!selected?.componentId}><Copy size={18}/> Komponente duplizieren</button>
        <button title="Ausgewähltes Element löschen" disabled={!selectedId} onClick={deleteSelectedEntity}>
          <Trash2 size={18}/> Auswahl löschen
        </button>
        <MovePanel disabled={!selectedId} delta={moveDelta} onDeltaChange={setMoveDelta} onApply={applyMoveDelta} />
        <RotatePanel disabled={!selectedId} angleDegrees={rotateAngleDegrees} onAngleChange={setRotateAngleDegrees} onApply={applyRotateAngle} />
        <PushPullPanel
          disabled={!selectedId || selected?.type !== 'box'}
          selectedType={selected?.type}
          selectedBox={selected?.type === 'box' ? selected : undefined}
          deltaHeight={pushPullDeltaHeight}
          onDeltaHeightChange={setPushPullDeltaHeight}
          onApply={applyPushPullDelta}
        />
        <SelectedDimensionsPanel
          disabled={!selectedId || selected?.type !== 'box'}
          selectedType={selected?.type}
          dimensions={selectedDimensions}
          onDimensionsChange={setSelectedDimensions}
          onApply={applySelectedDimensions}
        />
        <FaceExtrudePanel
          disabled={!selectedId || selected?.type !== 'face'}
          selectedType={selected?.type}
          selectedFace={selected?.type === 'face' ? selected : undefined}
          height={extrudeHeight}
          onHeightChange={(height) => {
            setExtrudeHeight(height);
            setFaceExtrusionStatus('');
          }}
          onApply={applyFaceExtrusion}
          statusMessage={faceExtrusionStatus}
        />
        <InspectorPanel inspection={selectedInspection} />
        {tool === 'box' && <BoxDimensionsPanel dimensions={boxDimensions} onChange={setBoxDimensions} />}
        <button onClick={saveProjectFile}><Save size={18}/> Projekt speichern</button>
        <label className="file-button">
          <FolderOpen size={18}/> Projekt laden
          <input
            type="file"
            accept=".hcad.json,application/json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void openProjectFile(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <label className="file-button" title="Importiert nur LINE und geschlossene, vierpunktige, achsenparallele Rechteck-LWPOLYLINE ohne Bulge/Breite/Dicke/Sonder-Extrusion.">
          <FolderOpen size={18}/> DXF laden
          <input
            type="file"
            accept=".dxf,application/dxf,text/plain"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void openDxfFile(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <p className="format-note">Importiert nur LINE und geschlossene, vierpunktige, achsenparallele Rechteck-LWPOLYLINE ohne Bulge/Breite/Dicke/Sonder-Extrusion.</p>
        <button onClick={() => download('hermes-cad-sketcher.dxf', exportDxf(model), 'application/dxf')}><Download size={18}/> DXF exportieren</button>
        <button onClick={() => download('hermes-cad-sketcher.stl', exportAsciiStl(model), 'model/stl')}><Download size={18}/> STL exportieren</button>
      </aside>
      <section className="workspace">
        <div className="viewport-placeholder">
          <ThreeViewport
            model={model}
            activeTool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreateLine={createLineFromViewport}
            onCreateRectangle={createRectangleFromViewport}
            onCreateBox={createBoxFromViewport}
            onMeasure={measureFromViewport}
            onMove={moveFromViewport}
          />
          <div className="model-card compact">
            <strong>Interaktiver 3D-Viewport</strong>
            <span>Rechts gedrückt ziehen: Ansicht drehen.</span>
            <span>Linie/Rechteck/Maßband: zwei Klicks auf das Raster.</span>
            <span>Verschieben: Objekt auswählen, Move aktivieren, Start und Ziel anklicken.</span>
            <span>Körper: ein Klick auf das Raster.</span>
            <span>Aktuelle Elemente: {model.allEntities().length}</span>
            <span>Komponenten: {model.allComponents().length}</span>
          </div>
        </div>
        <footer className="statusbar">
          <span>Werkzeug: {tool}</span>
          <span>Auswahl: {selectedId ?? 'keine'}</span>
          <span>Verlauf: {history.past.length} rückgängig / {history.future.length} wiederholbar</span>
          <span>Maßband: {lastMeasurement}</span>
          <span>Projekt: {projectStatus}</span>
          <span>Einheit: mm</span>
        </footer>
      </section>
    </main>
  );
}
