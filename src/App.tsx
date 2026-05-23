import React, { useEffect, useState } from 'react';
import { Bot, Box, Component, Copy, Download, FolderOpen, GripVertical, MessageSquare, Move3D, Play, Redo2, Ruler, RotateCw, Save, Square, Slash, Trash2, Undo2, Upload } from 'lucide-react';
import { SketchModel, type BoxFaceName, type ToolName } from './core/model';
import { vec, type Vec3 } from './core/geometry';
import { formatTapeMeasurement } from './core/toolState';
import { exportProjectFile, importProjectFile } from './core/projectFile';
import { exportDxf, importDxfWithReport } from './core/dxf';
import { exportAsciiStl, importAsciiStl } from './core/stl';
import { createHistory, pushHistory, redoHistory, undoHistory, type ModelHistory } from './core/history';
import { runAgentChatCommand, runCadConsoleScript } from './core/cadCommands';
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
import { DEFAULT_TOOLBAR_ORDER, getToolShortcut, reorderToolbar, sanitizeToolbarOrder, toolFromKeyboardEvent } from './ui/toolbarCustomization';
import { nextWorkspaceDock, sanitizeWorkspaceDock, workspaceDockClass, type WorkspaceDock } from './ui/workspaceDock';
import { WORKBENCH_MENUS, WORKBENCH_TOOLS, toolStatusLabel, workbenchGroups, type WorkbenchMenu } from './ui/workbenchLayout';
import { floatingWindowMenuButtonLabel, floatingWindowTitle, menuButtonLabel, menuPanelTitle, type FloatingWindowId } from './ui/workspaceMenuRouting';
import { buildHermesCadAgentRequest, loadOrCreateOwnerId, probeHermesCadBridge, sendHermesCadAgentRequest, shouldFallbackAfterAgentResponse, shouldUseLocalCadFallback, summarizeHermesBridgeIdentity } from './ui/hermesAgentBridge';
import { formatActiveMeasurement, faceSelectionLabel, formatEntityMeasurement, type FaceSelection } from './ui/viewportInteractionHelpers';
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

const TOOLBAR_STORAGE_KEY = 'hermes-cad-toolbar-order';
const WORKSPACE_DOCK_STORAGE_KEY = 'hermes-cad-workspace-dock';

type FloatingWindowState = {
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
};

type FloatingWindowDrag = {
  id: FloatingWindowId;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

function loadToolbarOrder(): ToolName[] {
  if (typeof window === 'undefined') return DEFAULT_TOOLBAR_ORDER;
  try {
    return sanitizeToolbarOrder(JSON.parse(window.localStorage.getItem(TOOLBAR_STORAGE_KEY) ?? '[]'));
  } catch {
    return DEFAULT_TOOLBAR_ORDER;
  }
}

function loadWorkspaceDock(): WorkspaceDock {
  if (typeof window === 'undefined') return 'left';
  return sanitizeWorkspaceDock(window.localStorage.getItem(WORKSPACE_DOCK_STORAGE_KEY));
}

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
  const [activeMenu, setActiveMenu] = useState<WorkbenchMenu | undefined>();
  const [workspaceDock, setWorkspaceDock] = useState<WorkspaceDock>(loadWorkspaceDock);
  const [toolbarOrder, setToolbarOrder] = useState<ToolName[]>(loadToolbarOrder);
  const [draggedTool, setDraggedTool] = useState<ToolName | undefined>();
  const [selectedId, setSelectedId] = useState<string | undefined>(model.allEntities()[0]?.id);
  const [selectedBoxFace, setSelectedBoxFace] = useState<FaceSelection | undefined>();
  const [lastMeasurement, setLastMeasurement] = useState('noch keine Messung');
  const [liveMeasurement, setLiveMeasurement] = useState<string | undefined>();
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
  const [rubyConsoleInput, setRubyConsoleInput] = useState('box(0, 0, 0, 600, 400, 200)');
  const [rubyConsoleLog, setRubyConsoleLog] = useState('Bereit für CAD-Befehle.');
  const [agentChatInput, setAgentChatInput] = useState('Hallo Hermes, bist du bereit einen Test zu machen?');
  const [agentChatLog, setAgentChatLog] = useState('Agent-Chat bereit.');
  const [agentChatWindowOpen, setAgentChatWindowOpen] = useState(false);
  const [agentBridgeStatus, setAgentBridgeStatus] = useState('Lokaler Hermes Agent des CAD-App-Hosts · Zeichnungsmodus · noch nicht verbunden');
  const [floatingWindows, setFloatingWindows] = useState<Partial<Record<FloatingWindowId, FloatingWindowState>>>({});
  const [floatingWindowDrag, setFloatingWindowDrag] = useState<FloatingWindowDrag | undefined>();

  const selected = selectedId ? model.getEntity(selectedId) : undefined;
  const selectedInspection = selected ? inspectEntity(selected) : undefined;
  const selectedMeasurement = selected ? formatEntityMeasurement(selected) : undefined;
  const selectedFaceLabel = selectedBoxFace && selectedBoxFace.entityId === selectedId ? faceSelectionLabel(selectedBoxFace) : faceSelectionLabel();
  const activeMeasurement = formatActiveMeasurement({ draft: liveMeasurement, selected: selectedMeasurement, last: lastMeasurement });
  const orderedTools = toolbarOrder.map((id) => tools.find((item) => item.id === id)).filter((item): item is (typeof tools)[number] => Boolean(item));
  const shortcutSummaryLabels: Record<ToolName, string> = {
    select: 'Auswahl',
    line: 'Linie',
    rectangle: 'Rechteck',
    box: 'Körper',
    move: 'Verschieben',
    pushPull: 'Push/Pull',
    rotate: 'Drehen',
    tape: 'Maßband'
  };
  const shortcutSummary = DEFAULT_TOOLBAR_ORDER
    .map((toolId) => `${getToolShortcut(toolId)} ${shortcutSummaryLabels[toolId]}`)
    .join(' · ');

  useEffect(() => {
    if (selected?.type === 'box') setSelectedDimensions(boxDimensionsToInput(selected));
  }, [selected?.id, selected?.type, selected?.type === 'box' ? selected.width : undefined, selected?.type === 'box' ? selected.depth : undefined, selected?.type === 'box' ? selected.height : undefined]);

  function mutate(action: (m: SketchModel) => void) {
    const next = SketchModel.fromSnapshot(model.snapshot());
    action(next);
    setModel(next);
    setHistory((current) => pushHistory(current, next.snapshot()));
  }

  function applyCommandResult(result: ReturnType<typeof runCadConsoleScript>, setLog: (message: string) => void) {
    setLog(result.message);
    setProjectStatus(result.message.split('\n').at(-1) ?? result.message);
    if (result.changed) {
      setModel(result.nextModel);
      setHistory((current) => pushHistory(current, result.nextModel.snapshot()));
    }
    if (result.selectedId !== selectedId) setSelectedId(result.selectedId);
  }

  function executeRubyConsole() {
    applyCommandResult(runCadConsoleScript(model, rubyConsoleInput, selectedId), setRubyConsoleLog);
  }

  async function connectHermesAgent() {
    try {
      const identity = await probeHermesCadBridge();
      setAgentBridgeStatus(summarizeHermesBridgeIdentity(identity));
      setAgentChatWindowOpen(true);
      openFloatingWindow('hermesAgent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lokale Hermes-CAD-Bridge ist nicht erreichbar.';
      setAgentBridgeStatus(`${message} Starte auf dem CAD-App-Host den lokalen Bridge-Dienst; andere PCs desselben Users erreichen ihn über die CAD-Seite.`);
      setAgentChatWindowOpen(true);
      openFloatingWindow('hermesAgent');
    }
  }

  async function executeAgentChat() {
    try {
      const ownerId = typeof window === 'undefined' ? 'server-render-owner' : loadOrCreateOwnerId(window.localStorage);
      const response = await sendHermesCadAgentRequest(buildHermesCadAgentRequest({
        ownerId,
        message: agentChatInput,
        selectedId,
        modelSnapshot: model.snapshot()
      }));
      if (response.commands) applyCommandResult(runCadConsoleScript(model, response.commands, selectedId), setAgentChatLog);
      else if (shouldFallbackAfterAgentResponse(response, agentChatInput)) applyCommandResult(runAgentChatCommand(model, agentChatInput, selectedId), setAgentChatLog);
      else setAgentChatLog(response.message);
      setAgentBridgeStatus(response.ok ? 'Lokaler Hermes Agent des CAD-App-Hosts hat im Zeichnungsmodus geantwortet.' : response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hermes Agent Bridge nicht erreichbar.';
      setAgentBridgeStatus(`${message} Freier Chat wie in Telegram braucht die lokale Hermes-Bridge des CAD-App-Hosts.`);
      if (!shouldUseLocalCadFallback(agentChatInput)) {
        setAgentChatLog(`${message}\nFreier Chat wie in Telegram läuft über den lokalen Hermes Agent des CAD-App-Hosts. Öffne die CAD-Seite über die gleiche Adresse oder starte dort den Bridge-Dienst.`);
        return;
      }
      applyCommandResult(runAgentChatCommand(model, agentChatInput, selectedId), setAgentChatLog);
    }
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
    let measurement: string | undefined;
    mutate((m) => {
      const entity = m.createLine(draft.start, draft.end);
      setSelectedId(entity.id);
      measurement = formatEntityMeasurement(entity);
    });
    setLiveMeasurement(measurement);
  }

  function createRectangleFromViewport(first: Vec3, second: Vec3) {
    const draft = createRectangleDraft(first, second);
    if (!draft.ok) return;
    let measurement: string | undefined;
    mutate((m) => {
      const entity = m.createRectangle(draft.origin, draft.width, draft.depth);
      setSelectedId(entity.id);
      measurement = formatEntityMeasurement(entity);
    });
    setLiveMeasurement(measurement);
  }

  function createBoxFromViewport(origin: Vec3) {
    const draft = createBoxDraft(origin, boxDimensions);
    if (!draft.ok) return;
    let measurement: string | undefined;
    mutate((m) => {
      const entity = m.createBox(draft.origin, draft.width, draft.depth, draft.height);
      setSelectedId(entity.id);
      measurement = formatEntityMeasurement(entity);
    });
    setLiveMeasurement(measurement);
  }

  function measureFromViewport(start: Vec3, end: Vec3) {
    const measured = formatTapeMeasurement(model, start, end);
    setLastMeasurement(measured);
    setLiveMeasurement(`Maßband: ${measured}`);
  }

  function handleViewportSelect(entityId: string | undefined, faceSelection?: FaceSelection) {
    setSelectedId(entityId);
    setSelectedBoxFace(faceSelection && faceSelection.entityId === entityId ? faceSelection : undefined);
  }

  function moveFromViewport(entityId: string, delta: Vec3) {
    let measurement: string | undefined;
    mutate((m) => {
      const entity = m.moveEntity(entityId, delta);
      setSelectedId(entityId);
      measurement = formatEntityMeasurement(entity);
    });
    setLiveMeasurement(measurement);
  }

  function applyMoveDelta() {
    if (!selectedId) return;
    const parsed = parseMoveDelta(moveDelta);
    if (!parsed.ok) return;
    if (selected?.type === 'box' && selectedBoxFace?.entityId === selectedId) {
      const faceDelta = deltaForSelectedFace(selectedBoxFace.face, parsed.delta);
      if (faceDelta === 0) return;
      mutate((m) => {
        const updated = m.pushPullBoxFace(selectedId, selectedBoxFace.face, faceDelta);
        setSelectedId(selectedId);
        setSelectedDimensions(boxDimensionsToInput(updated));
        setLiveMeasurement(formatEntityMeasurement(updated));
      });
      return;
    }
    moveFromViewport(selectedId, parsed.delta);
  }

  function deltaForSelectedFace(face: BoxFaceName, delta: Vec3): number {
    if (face === 'right') return delta.x;
    if (face === 'left') return -delta.x;
    if (face === 'front') return delta.y;
    if (face === 'back') return -delta.y;
    if (face === 'top') return delta.z;
    return -delta.z;
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
      const face = selectedBoxFace?.entityId === selectedId ? selectedBoxFace.face : 'top';
      const updated = m.pushPullBoxFace(selectedId, face, parsed.deltaHeight);
      setSelectedId(selectedId);
      setSelectedDimensions(boxDimensionsToInput(updated));
      setLiveMeasurement(formatEntityMeasurement(updated));
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

  function defaultFloatingWindow(id: FloatingWindowId): FloatingWindowState {
    const index = ['history', 'move', 'rotate', 'pushPull', 'dimensions', 'extrude', 'inspector', 'boxDimensions', 'rubyConsole', 'hermesAgent'].indexOf(id);
    return { open: true, minimized: false, maximized: false, left: 120 + (index % 4) * 34, top: 150 + (index % 5) * 28, width: id === 'hermesAgent' ? 460 : 380, height: id === 'hermesAgent' ? 430 : 360 };
  }

  function openFloatingWindow(id: FloatingWindowId) {
    if (id === 'hermesAgent') setAgentChatWindowOpen(true);
    setFloatingWindows((current) => ({ ...current, [id]: { ...(current[id] ?? defaultFloatingWindow(id)), open: true, minimized: false } }));
  }

  function updateFloatingWindow(id: FloatingWindowId, patch: Partial<FloatingWindowState>) {
    setFloatingWindows((current) => ({ ...current, [id]: { ...(current[id] ?? defaultFloatingWindow(id)), ...patch } }));
  }

  function closeFloatingWindow(id: FloatingWindowId) {
    if (id === 'hermesAgent') setAgentChatWindowOpen(false);
    updateFloatingWindow(id, { open: false });
  }

  function beginFloatingWindowDrag(id: FloatingWindowId, state: FloatingWindowState, event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, select, a')) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const windowElement = event.currentTarget.parentElement;
    const rect = windowElement?.getBoundingClientRect();
    setFloatingWindowDrag({
      id,
      pointerId: event.pointerId,
      offsetX: rect ? event.clientX - rect.left : event.clientX - state.left,
      offsetY: rect ? event.clientY - rect.top : event.clientY - state.top
    });
    if (state.maximized) updateFloatingWindow(id, { maximized: false, left: 80, top: 80 });
  }

  function moveFloatingWindowDrag(id: FloatingWindowId, state: FloatingWindowState, event: React.PointerEvent<HTMLElement>) {
    if (!floatingWindowDrag || floatingWindowDrag.id !== id || floatingWindowDrag.pointerId !== event.pointerId) return;
    const viewportWidth = typeof window === 'undefined' ? 1600 : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight;
    updateFloatingWindow(id, {
      left: Math.max(8, Math.min(event.clientX - floatingWindowDrag.offsetX, viewportWidth - Math.min(state.width, viewportWidth - 16))),
      top: Math.max(8, Math.min(event.clientY - floatingWindowDrag.offsetY, viewportHeight - 54))
    });
  }

  function endFloatingWindowDrag(id: FloatingWindowId, event: React.PointerEvent<HTMLElement>) {
    if (!floatingWindowDrag || floatingWindowDrag.id !== id || floatingWindowDrag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setFloatingWindowDrag(undefined);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKSPACE_DOCK_STORAGE_KEY, workspaceDock);
  }, [workspaceDock]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(toolbarOrder));
  }, [toolbarOrder]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (selectedId && shouldDeleteSelectionFromKey(event)) {
        event.preventDefault();
        deleteSelectedEntity();
        return;
      }
      const nextTool = toolFromKeyboardEvent({
        key: event.key,
        targetTagName: event.target instanceof HTMLElement ? event.target.tagName : undefined,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey
      });
      if (!nextTool) return;
      event.preventDefault();
      setTool(nextTool);
      setProjectStatus(`Werkzeug per Tastatur gewählt: ${tools.find((item) => item.id === nextTool)?.label ?? nextTool}`);
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
      setProjectStatus(`DXF geladen: ${report.importedEntities} importiert, ${skipped} übersprungen; ${report.unitStatus.message} (${file.name})`);
    } catch (error) {
      setProjectStatus(error instanceof Error ? error.message : 'DXF konnte nicht geladen werden.');
    }
  }

  async function openStlFile(file: File) {
    try {
      const text = await file.text();
      const mesh = importAsciiStl(text, file.name);
      const next = SketchModel.fromSnapshot(model.snapshot());
      const entity = next.addReferenceMesh(mesh.name, mesh.triangles);
      setModel(next);
      setHistory((current) => pushHistory(current, next.snapshot()));
      setSelectedId(entity.id);
      setProjectStatus(`STL-Referenzmesh geladen: ${mesh.triangleCount} Dreiecke; nicht als editierbarer Körper importiert. (${file.name})`);
    } catch (error) {
      setProjectStatus(error instanceof Error ? error.message : 'STL konnte nicht als ASCII-Referenzmesh geladen werden.');
    }
  }

  const detailedControls = (
    <section className="top-function-workspace" aria-label="Klassischer CAD-Arbeitsplatz Funktionen">
      <section className="function-group file-function-group" aria-label="Datei & Import/Export">
        <strong>Datei &amp; Import/Export</strong>
        <button className="primary" onClick={loadExampleModel}>{getPrimaryActionLabel()}</button>
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
        <label className="file-button" title="Importiert ASCII-STL nur als nicht editierbares Referenzmesh.">
          <FolderOpen size={18}/> STL-Referenz laden
          <input
            type="file"
            accept=".stl,model/stl,text/plain"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void openStlFile(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <button onClick={() => download('hermes-cad-sketcher.dxf', exportDxf(model), 'application/dxf')}><Download size={18}/> DXF exportieren</button>
        <button onClick={() => download('hermes-cad-sketcher.stl', exportAsciiStl(model), 'model/stl')}><Download size={18}/> STL exportieren</button>
        <p className="format-note">Importiert nur LINE und geschlossene, vierpunktige, achsenparallele Rechteck-LWPOLYLINE ohne Bulge/Breite/Dicke/Sonder-Extrusion.</p>
        <p className="format-note">DXF-Einheiten: $INSUNITS=4 wird als Millimeter importiert; fehlende Einheiten werden sichtbar als Millimeter angenommen, andere Einheiten werden abgelehnt.</p>
        <p className="format-note">STL-Import: ASCII-STL wird nur als Referenzmesh geladen, nicht als editierbarer Körper oder validiertes Fertigungsmesh.</p>
      </section>
      <section className="function-group edit-function-group" aria-label="Bearbeiten & Maße">
        <strong>Bearbeiten &amp; Maße</strong>
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
        <button title="Ausgewähltes Element löschen (Delete/Backspace)" disabled={!selectedId} onClick={deleteSelectedEntity}>
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
      </section>
      <section className="function-group ai-function-group" aria-label="Fenster & AI">
        <strong>Fenster &amp; AI</strong>
        <section className="settings-panel" aria-label="Einstellungen">
          <strong>Einstellungen</strong>
          <p>Fenster und Arbeitsbereiche ein- oder ausblenden.</p>
          <button type="button" onClick={() => setAgentChatWindowOpen((open) => !open)}>
            {agentChatWindowOpen ? 'AI-Chat-Fenster schließen' : 'AI-Chat-Fenster öffnen'}
          </button>
        </section>
        <section className="cad-command-panel" aria-label="Ruby-Konsole">
          <strong><Play size={16}/> Ruby-Konsole</strong>
          <p>Befehle: line, rectangle, box, move, rotate_z, resize, push_pull, extrude, delete</p>
          <p>Keine SketchUp-Ruby-API und keine .rb/.rbz Plugin-Kompatibilität. Diese Konsole ist eine sichere Hermes-CAD-Befehls-DSL in Millimeter.</p>
          <textarea
            aria-label="Ruby-Konsole CAD-Befehle"
            value={rubyConsoleInput}
            onChange={(event) => setRubyConsoleInput(event.currentTarget.value)}
            rows={4}
          />
          <button type="button" onClick={executeRubyConsole}><Play size={18}/> Ruby-Befehl ausführen</button>
          <small>{rubyConsoleLog}</small>
        </section>
        <section className="cad-command-panel" aria-label="Agent-Chat">
          <strong><Bot size={16}/> Agent-Chat</strong>
          <p>Hermes antwortet hier wie im Telegram-Chat, bekommt zusätzlich den Zeichnungsmodus und kann bei Bedarf CAD-Befehle ausführen.</p>
          <p>Du kannst normal schreiben, zum Beispiel „Hallo Hermes …“, oder direkte Befehle wie „erstelle box …“ senden.</p>
          <textarea
            aria-label="Nachricht an Hermes"
            value={agentChatInput}
            onChange={(event) => setAgentChatInput(event.currentTarget.value)}
            rows={3}
          />
          <button type="button" onClick={executeAgentChat}><MessageSquare size={18}/> An Hermes senden</button>
          <small>{agentChatLog}</small>
        </section>
      </section>
    </section>
  );

  const activeMenuPanel = activeMenu ? (
    <section className="menu-function-panel" aria-label={`${menuPanelTitle(activeMenu)} Funktionen`}>
      <strong>{menuPanelTitle(activeMenu)}</strong>
      {activeMenu === 'Datei' && (
        <div className="menu-button-links">
          <button className="primary" onClick={loadExampleModel}>{getPrimaryActionLabel()}</button>
          <button onClick={saveProjectFile}><Save size={18}/> Projekt speichern</button>
          <label className="file-button"><FolderOpen size={18}/> Projekt laden<input type="file" accept=".hcad.json,application/json" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void openProjectFile(file); event.currentTarget.value = ''; }} /></label>
          <label className="file-button"><FolderOpen size={18}/> DXF laden<input type="file" accept=".dxf,application/dxf,text/plain" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void openDxfFile(file); event.currentTarget.value = ''; }} /></label>
          <label className="file-button"><FolderOpen size={18}/> STL-Referenz laden<input type="file" accept=".stl,model/stl,text/plain" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void openStlFile(file); event.currentTarget.value = ''; }} /></label>
          <button onClick={() => download('hermes-cad-sketcher.dxf', exportDxf(model), 'application/dxf')}><Download size={18}/> DXF exportieren</button>
          <button onClick={() => download('hermes-cad-sketcher.stl', exportAsciiStl(model), 'model/stl')}><Download size={18}/> STL exportieren</button>
        </div>
      )}
      {activeMenu === 'Bearbeiten' && (
        <div className="menu-button-links">
          <button onClick={() => openFloatingWindow('history')}>{floatingWindowMenuButtonLabel('history')}</button>
          <button onClick={() => openFloatingWindow('move')}>{floatingWindowMenuButtonLabel('move')}</button>
          <button onClick={() => openFloatingWindow('rotate')}>{floatingWindowMenuButtonLabel('rotate')}</button>
          <button onClick={() => openFloatingWindow('pushPull')}>{floatingWindowMenuButtonLabel('pushPull')}</button>
          <button onClick={() => openFloatingWindow('dimensions')}>{floatingWindowMenuButtonLabel('dimensions')}</button>
          <button onClick={() => openFloatingWindow('extrude')}>{floatingWindowMenuButtonLabel('extrude')}</button>
          <button onClick={() => openFloatingWindow('inspector')}>{floatingWindowMenuButtonLabel('inspector')}</button>
          <button onClick={() => openFloatingWindow('boxDimensions')}>{floatingWindowMenuButtonLabel('boxDimensions')}</button>
        </div>
      )}
      {(activeMenu === 'Zeichnen' || activeMenu === 'Werkzeuge' || activeMenu === 'Kamera' || activeMenu === 'Ansicht') && (
        <section className="workbench-ribbon" aria-label="Werkzeuggruppen nach SketchUp-2025-Recherche">
          {workbenchGroups().map((group) => (
            <div className="workbench-group" key={group}>
              <strong>{group}</strong>
              <div>
                {WORKBENCH_TOOLS.filter((item) => item.group === group).map((item) => (
                  <button key={item.id} type="button" disabled={!item.tool} title={`${item.label} · ${toolStatusLabel(item.status)}`} onClick={() => item.tool && setTool(item.tool)}>
                    <span>{item.label}</span><small>{toolStatusLabel(item.status)}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {activeMenu === 'Fenster' && (
        <div className="menu-button-links">
          <button type="button" onClick={connectHermesAgent}>Hermes Agent verbinden</button>
          <button type="button" onClick={() => openFloatingWindow('hermesAgent')}>Hermes Zeichnungsmodus-Fenster öffnen</button>
          <button type="button" onClick={() => openFloatingWindow('rubyConsole')}>Ruby-Konsole als Fenster öffnen</button>
        </div>
      )}
      {activeMenu === 'Hilfe' && <p className="format-note">Der lokale Hermes Agent des CAD-App-Hosts bedient diese CAD-Sitzung. Der Agent erhält Zeichnungsmodus und Modellkontext.</p>}
    </section>
  ) : undefined;

  function renderWindowContent(id: FloatingWindowId) {
    if (id === 'history') return <><div className="history-controls" aria-label="Verlauf"><button title="Letzte Modelländerung rückgängig machen" onClick={undoModelChange} disabled={!history.canUndo}><Undo2 size={18}/> Rückgängig</button><button title="Rückgängig gemachte Modelländerung wiederholen" onClick={redoModelChange} disabled={!history.canRedo}><Redo2 size={18}/> Wiederholen</button></div><button onClick={duplicateSelectedComponent} disabled={!selected?.componentId}><Copy size={18}/> Komponente duplizieren</button><button title="Ausgewähltes Element löschen" disabled={!selectedId} onClick={deleteSelectedEntity}><Trash2 size={18}/> Auswahl löschen</button></>;
    if (id === 'move') return <MovePanel disabled={!selectedId} delta={moveDelta} onDeltaChange={setMoveDelta} onApply={applyMoveDelta} />;
    if (id === 'rotate') return <RotatePanel disabled={!selectedId} angleDegrees={rotateAngleDegrees} onAngleChange={setRotateAngleDegrees} onApply={applyRotateAngle} />;
    if (id === 'pushPull') return <PushPullPanel disabled={!selectedId || selected?.type !== 'box'} selectedType={selected?.type} selectedBox={selected?.type === 'box' ? selected : undefined} deltaHeight={pushPullDeltaHeight} onDeltaHeightChange={setPushPullDeltaHeight} onApply={applyPushPullDelta} />;
    if (id === 'dimensions') return <SelectedDimensionsPanel disabled={!selectedId || selected?.type !== 'box'} selectedType={selected?.type} dimensions={selectedDimensions} onDimensionsChange={setSelectedDimensions} onApply={applySelectedDimensions} />;
    if (id === 'extrude') return <FaceExtrudePanel disabled={!selectedId || selected?.type !== 'face'} selectedType={selected?.type} selectedFace={selected?.type === 'face' ? selected : undefined} height={extrudeHeight} onHeightChange={(height) => { setExtrudeHeight(height); setFaceExtrusionStatus(''); }} onApply={applyFaceExtrusion} statusMessage={faceExtrusionStatus} />;
    if (id === 'inspector') return <InspectorPanel inspection={selectedInspection} />;
    if (id === 'boxDimensions') return <BoxDimensionsPanel dimensions={boxDimensions} onChange={setBoxDimensions} />;
    if (id === 'rubyConsole') return <section className="cad-command-panel" aria-label="Ruby-Konsole"><p>Befehle: line, rectangle, box, move, rotate_z, resize, push_pull, extrude, delete</p><p>Keine SketchUp-Ruby-API und keine .rb/.rbz Plugin-Kompatibilität.</p><textarea aria-label="Ruby-Konsole CAD-Befehle" value={rubyConsoleInput} onChange={(event) => setRubyConsoleInput(event.currentTarget.value)} rows={4}/><button type="button" onClick={executeRubyConsole}><Play size={18}/> Ruby-Befehl ausführen</button><small>{rubyConsoleLog}</small></section>;
    return <section className="cad-command-panel" aria-label="Hermes Agent Zeichnungsmodus"><p>Hermes antwortet wie im Telegram-Chat und bekommt zusätzlich Zeichnungsmodus, Modellkontext und Auswahl über die Bridge des CAD-App-Hosts.</p><p>{agentBridgeStatus}</p><textarea aria-label="Nachricht an Hermes" value={agentChatInput} onChange={(event) => setAgentChatInput(event.currentTarget.value)} rows={4}/><button type="button" onClick={() => void executeAgentChat()}><MessageSquare size={18}/> An Hermes senden</button><small>{agentChatLog}</small></section>;
  }

  function renderFloatingWindow(id: FloatingWindowId) {
    const title = floatingWindowTitle(id);
    const state = id === 'hermesAgent' && agentChatWindowOpen ? (floatingWindows[id] ?? defaultFloatingWindow(id)) : floatingWindows[id];
    if (!state?.open) return null;
    const windowStyle: React.CSSProperties = state.maximized
      ? { left: 72, top: 88, width: 'calc(100vw - 96px)', height: state.minimized ? 48 : 'calc(100vh - 120px)' }
      : { left: state.left, top: state.top, width: state.width, height: state.minimized ? 48 : state.height };
    return (
      <section
        className={[
          'floating-tool-window',
          state.minimized ? 'minimized' : '',
          state.maximized ? 'maximized' : ''
        ].filter(Boolean).join(' ')}
        aria-label={`${title} Fenster`}
        style={windowStyle}
      >
        <header
          aria-label="Fenster über Titelleiste ziehen"
          onPointerDown={(event) => beginFloatingWindowDrag(id, state, event)}
          onPointerMove={(event) => moveFloatingWindowDrag(id, state, event)}
          onPointerUp={(event) => endFloatingWindowDrag(id, event)}
          onPointerCancel={(event) => endFloatingWindowDrag(id, event)}
        >
          <strong>{title}</strong>
          <div className="floating-window-controls" aria-label="Fenstersteuerung">
            <button type="button" aria-label="Fenster minimieren" title="Minimieren" onClick={() => updateFloatingWindow(id, { minimized: !state.minimized })}>{state.minimized ? '▴' : '▾'}</button>
            <button type="button" aria-label="Fenster maximieren" title="Groß machen" onClick={() => updateFloatingWindow(id, { maximized: !state.maximized, minimized: false })}>{state.maximized ? '▣' : '□'}</button>
            <button type="button" aria-label="Fenster schließen" title="Schließen" onClick={() => closeFloatingWindow(id)}>×</button>
          </div>
        </header>
        {!state.minimized && <div className="floating-window-body">{renderWindowContent(id)}</div>}
      </section>
    );
  }

  return (
    <main className="app-shell icon-rail-left">
      <header className={activeMenu ? 'top-toolbar workspace-open' : 'top-toolbar workspace-collapsed'} aria-label="Schnell-Werkzeugleiste">
        <nav className="classic-menu" aria-label="Klassischer CAD-Arbeitsplatz">
          <strong>Klassischer CAD-Arbeitsplatz</strong>
          <div className="menu-strip">
            {WORKBENCH_MENUS.map((menu) => (
              <button
                key={menu}
                type="button"
                className={activeMenu === menu ? 'active' : undefined}
                aria-label={menuButtonLabel(menu)}
                onClick={() => setActiveMenu((current) => current === menu ? undefined : menu)}
              >
                {menu}
              </button>
            ))}
          </div>
        </nav>
        <div className="top-toolbar-title">
          <h1>Hermes CAD Sketcher</h1>
          <p className="subtitle">Linke Maustaste: Standardaktion des aktiven Werkzeugs. Auswahl: klicken · Linie/Körper: Punkte setzen · Fläche: klicken zum Ziehen.</p>
        </div>
        <div className="quick-toolbar" role="toolbar" aria-label="Schnell-Werkzeugleiste">
          {orderedTools.map((item) => {
            const shortcut = getToolShortcut(item.id);
            return (
              <button
                key={item.id}
                type="button"
                draggable
                className={tool === item.id ? 'tool-icon active' : 'tool-icon'}
                title={`${item.label} · Taste ${shortcut} · Icon ziehen zum Verschieben`}
                aria-label={`Werkzeug ${item.label}, Tastenkürzel ${shortcut}`}
                onClick={() => setTool(item.id)}
                onDragStart={(event) => {
                  setDraggedTool(item.id);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', item.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const droppedTool = draggedTool ?? event.dataTransfer.getData('text/plain');
                  if (!droppedTool) return;
                  setToolbarOrder((current) => reorderToolbar(current, droppedTool as ToolName, item.id));
                  setDraggedTool(undefined);
                }}
                onDragEnd={() => setDraggedTool(undefined)}
              >
                <GripVertical size={12} aria-hidden="true" />
                {item.icon}
                <span className="tool-shortcut">{shortcut}</span>
                <span className="tool-label">{item.label}</span>
              </button>
            );
          })}
          <button type="button" className="compact-ai-toggle" onClick={() => void connectHermesAgent()}>
            Hermes Agent verbinden
          </button>
        </div>
        <p className="shortcut-hint">Shortcuts: {shortcutSummary} · Delete/Backspace löscht Auswahl nur außerhalb von Eingabefeldern.</p>
        <p className="agent-policy-note">Lokaler Hermes Agent des CAD-App-Hosts · Zeichnungsmodus</p>
        {activeMenuPanel}
        <p className="research-note">SketchUp 2025 Recherche: Umgebungen, PBR-Materialien und Generate Textures sind als eigene Hermes-CAD-Ideen vorgemerkt.</p>
      </header>
      <aside className="toolbar icon-rail" aria-label="Seitliche Icon-Werkzeugleiste">
        {orderedTools.map((item) => {
          const shortcut = getToolShortcut(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={tool === item.id ? 'icon-rail-button active' : 'icon-rail-button'}
              title={`${item.label} · Taste ${shortcut}`}
              aria-label={`Werkzeug ${item.label} wählen`}
              onClick={() => setTool(item.id)}
            >
              {item.icon}
              <span className="tool-label">{item.label}</span>
            </button>
          );
        })}
      </aside>
      <section className="workspace">
        <div className="viewport-placeholder">
          <ThreeViewport
            model={model}
            activeTool={tool}
            selectedId={selectedId}
            onSelect={handleViewportSelect}
            onCreateLine={createLineFromViewport}
            onCreateRectangle={createRectangleFromViewport}
            onCreateBox={createBoxFromViewport}
            onMeasure={measureFromViewport}
            onMove={moveFromViewport}
            onMeasurementPreview={setLiveMeasurement}
          />
          <div className="model-card compact">
            <strong>Interaktiver 3D-Viewport</strong>
            <span>Mausrad: Zoom auf den Punkt unter der Maus.</span>
            <span>Linie/Rechteck/Maßband: zwei Klicks auf das Raster.</span>
            <span>Verschieben: Objekt auswählen, Move aktivieren, Start und Ziel anklicken.</span>
            <span>Körper: ein Klick auf das Raster.</span>
            <span>Körperflächen können ausgewählt und anschließend verschoben oder gezogen werden.</span>
            <span>Aktuelle Elemente: {model.allEntities().length}</span>
            <span>Komponenten: {model.allComponents().length}</span>
          </div>
          <section className="measurement-field" aria-label="Einheitenfeld">
            <strong>Einheitenfeld</strong>
            <span>Aktuelles Maß</span>
            <output>{activeMeasurement}</output>
            <small>mm · m² bei Flächen</small>
          </section>
        </div>
        <footer className="statusbar">
          <span>Werkzeug: {tool}</span>
          <span>Auswahl: {selectedId ?? 'keine'}</span>
          <span>Fläche: {selectedFaceLabel.replace('Fläche: ', '').replace('Fläche ausgewählt: ', '')}</span>
          <span>Verlauf: {history.past.length} rückgängig / {history.future.length} wiederholbar</span>
          <span>Maßband: {lastMeasurement}</span>
          <span>Projekt: {projectStatus}</span>
          <span>Einheit: mm</span>
        </footer>
      </section>
      {renderFloatingWindow('history')}
      {renderFloatingWindow('move')}
      {renderFloatingWindow('rotate')}
      {renderFloatingWindow('pushPull')}
      {renderFloatingWindow('dimensions')}
      {renderFloatingWindow('extrude')}
      {renderFloatingWindow('inspector')}
      {renderFloatingWindow('boxDimensions')}
      {renderFloatingWindow('rubyConsole')}
      {renderFloatingWindow('hermesAgent')}
    </main>
  );
}
