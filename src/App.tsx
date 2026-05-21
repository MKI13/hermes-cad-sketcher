import React, { useState } from 'react';
import { Box, Component, Download, Move3D, Ruler, RotateCw, Square, Slash, Upload } from 'lucide-react';
import { SketchModel, type ToolName } from './core/model';
import { vec, type Vec3 } from './core/geometry';
import { formatTapeMeasurement } from './core/toolState';
import { exportDxf } from './core/dxf';
import { exportAsciiStl } from './core/stl';
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
  const [model, setModel] = useState(() => {
    const m = new SketchModel();
    const box = m.createBox(vec(0, 0, 0), 2400, 900, 720);
    const line = m.createLine(vec(0, -300, 0), vec(2400, -300, 0));
    m.createComponent('Beispiel-Komponente Tischkörper', [box.id, line.id]);
    return m;
  });
  const [tool, setTool] = useState<ToolName>('select');
  const [selectedId, setSelectedId] = useState<string | undefined>(model.allEntities()[0]?.id);
  const [lastMeasurement, setLastMeasurement] = useState('noch keine Messung');

  const selected = selectedId ? model.getEntity(selectedId) : undefined;

  function mutate(action: (m: SketchModel) => void) {
    const next = SketchModel.fromSnapshot(model.snapshot());
    action(next);
    setModel(next);
  }

  function demoAction() {
    mutate((m) => {
      if (tool === 'line') setSelectedId(m.createLine(vec(0, 0, 0), vec(1000, 0, 0)).id);
      if (tool === 'rectangle') setSelectedId(m.createRectangle(vec(0, 1200, 0), 1000, 700).id);
      if (tool === 'box') setSelectedId(m.createBox(vec(0, 0, 0), 600, 600, 600).id);
      if (tool === 'move' && selectedId) m.moveEntity(selectedId, vec(100, 0, 0));
      if (tool === 'pushPull' && selectedId) m.pushPullBoxFace(selectedId, 100);
      if (tool === 'rotate' && selectedId) m.rotateEntityZ(selectedId, Math.PI / 12);
    });
  }

  function createLineFromViewport(start: Vec3, end: Vec3) {
    mutate((m) => setSelectedId(m.createLine(start, end).id));
  }

  function createRectangleFromViewport(first: Vec3, second: Vec3) {
    const origin = vec(Math.min(first.x, second.x), Math.min(first.y, second.y), 0);
    const width = Math.abs(second.x - first.x);
    const depth = Math.abs(second.y - first.y);
    if (width === 0 || depth === 0) return;
    mutate((m) => setSelectedId(m.createRectangle(origin, width, depth).id));
  }

  function createBoxFromViewport(origin: Vec3) {
    mutate((m) => setSelectedId(m.createBox(origin, 600, 600, 600).id));
  }

  function measureFromViewport(start: Vec3, end: Vec3) {
    setLastMeasurement(formatTapeMeasurement(model, start, end));
  }

  function download(filename: string, content: string, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
        <button className="primary" onClick={demoAction}>Demo-Aktion mit Werkzeug</button>
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
          />
          <div className="model-card compact">
            <strong>Interaktiver 3D-Viewport</strong>
            <span>Rechts gedrückt ziehen: Ansicht drehen.</span>
            <span>Linie/Rechteck/Maßband: zwei Klicks auf das Raster.</span>
            <span>Körper: ein Klick auf das Raster.</span>
            <span>Aktuelle Elemente: {model.allEntities().length}</span>
            <span>Komponenten: {model.allComponents().length}</span>
          </div>
        </div>
        <footer className="statusbar">
          <span>Werkzeug: {tool}</span>
          <span>Auswahl: {selected?.id ?? 'keine'}</span>
          <span>Maßband: {lastMeasurement}</span>
          <span>Einheit: mm</span>
        </footer>
      </section>
    </main>
  );
}
