import React, { useEffect, useState } from 'react';
import { SketchModel, type BoxFaceName, type DrawingPlane, type Entity, type MaterialAssignment, type ToolName } from './core/model';
import { vec, type Vec3 } from './core/geometry';
import { formatTapeMeasurement } from './core/toolState';
import { parseMeasurementBoxInput } from './core/measurementInput';
import { applyMeasurementBoxInputToModel } from './core/measurementApplication';
import { exportProjectFile, importProjectFile } from './core/projectFile';
import { exportDxf, importDxfWithReport } from './core/dxf';
import { exportAsciiStl, importAsciiStl } from './core/stl';
import { createHistory, pushHistory, redoHistory, undoHistory, type ModelHistory } from './core/history';
import { runAgentChatCommand, runCadConsoleScript } from './core/cadCommands';
import { BoxDimensionsPanel } from './ui/BoxDimensionsPanel';
import { inspectEntity } from './core/inspection';
import { InspectorPanel } from './ui/InspectorPanel';
import { MeasurementBox } from './ui/MeasurementBox';
import { createBoxDraft, createLineDraft, createRectangleDraft, DEFAULT_BOX_DIMENSIONS, parseRectangleDimensionMask, updateRectangleDimensionMaskValue, type RectangleDimensionKey, type RectangleDimensionMask } from './ui/drawingController';
import { SelectedDimensionsPanel, boxDimensionsToInput, parseSelectedBoxDimensions, type DimensionInput } from './ui/SelectedDimensionsPanel';
import { FaceExtrudePanel, parseExtrudeHeight, validateExtrudableFace } from './ui/FaceExtrudePanel';
import { MovePanel, parseMoveDelta, type MoveDeltaInput } from './ui/MovePanel';
import { RotatePanel, parseRotateAngle } from './ui/RotatePanel';
import { PushPullPanel, parsePushPullDelta } from './ui/PushPullPanel';
import { getPrimaryActionLabel, getToolInstructions } from './ui/toolInstructions';
import { shouldDeleteSelectionFromKey } from './ui/selectionControls';
import { DEFAULT_TOOLBAR_ORDER, getToolShortcut, reorderToolbar, sanitizeToolbarOrder, toolFromKeyboardEvent } from './ui/toolbarCustomization';
import { MOUSE_ACTIONS, MOUSE_INPUTS, mouseActionLabel, sanitizeMouseBindings, summarizeMouseBindings, toolFromMouseAction, type MouseAction, type MouseInputId } from './ui/mouseBindings';
import { nextWorkspaceDock, sanitizeWorkspaceDock, workspaceDockClass, type WorkspaceDock } from './ui/workspaceDock';
import { WORKBENCH_MENUS, WORKBENCH_TOOLS, toolStatusLabel, workbenchGroups, type WorkbenchMenu } from './ui/workbenchLayout';
import { floatingWindowMenuButtonLabel, floatingWindowTitle, menuButtonLabel, menuPanelTitle, type FloatingWindowId } from './ui/workspaceMenuRouting';
import { buildHermesCadAgentRequest, loadOrCreateOwnerId, probeHermesCadBridge, sendHermesCadAgentRequest, shouldFallbackAfterAgentResponse, shouldUseLocalCadFallback, summarizeHermesBridgeIdentity } from './ui/hermesAgentBridge';
import { buildDefaultMaterialSwatches, buildMaterialLibrary, materialAssignmentFromLibraryEntry, type BrowserMaterialLibraryEntry, type MaterialLibrary, type MaterialSwatch } from './ui/materialLibrary';
import type { MaterialDefinition } from './core/materials';
import { shouldApplyDxfImportReport, statusFromDxfImportReport } from './ui/dxfImportPolicy';
import { drawingPlaneAppearance } from './ui/drawingPlaneAppearance';
import { formatActiveMeasurement, faceSelectionLabel, formatEntityMeasurement, type FaceSelection, type ViewportContextMenuCommand, type ViewportEntityAction } from './ui/viewportInteractionHelpers';
import { HermesIcon, type HermesIconId } from './ui/HermesIcon';
import './styles.css';

const LazyThreeViewport = React.lazy(() =>
  import('./ui/ThreeViewport').then((module) => ({ default: module.ThreeViewport }))
);

const toolIcon = (id: HermesIconId, label: string) => <HermesIcon id={id} label={label} size={20} />;

const tools: Array<{ id: ToolName; label: string; icon: React.ReactNode }> = [
  { id: 'select', label: 'Auswahl', icon: toolIcon('select-pointer', 'Auswahl') },
  { id: 'line', label: 'Linie', icon: toolIcon('line-tool-clear', 'Linie') },
  { id: 'rectangle', label: 'Quadrat/Rechteck', icon: toolIcon('rectangle-tool-clear', 'Rechteck') },
  { id: 'box', label: 'Körper', icon: toolIcon('box-cube-clear', 'Körper') },
  { id: 'move', label: 'Verschieben', icon: toolIcon('move-tool-clear', 'Verschieben') },
  { id: 'pushPull', label: 'Seite ziehen', icon: toolIcon('push-pull-clear', 'Push/Pull') },
  { id: 'rotate', label: 'Drehen', icon: toolIcon('rotate-tool-clear', 'Drehen') },
  { id: 'tape', label: 'Maßband', icon: toolIcon('tape-measure-clear', 'Maßband') }
];

const TOOLBAR_STORAGE_KEY = 'hermes-cad-toolbar-order';
const WORKSPACE_DOCK_STORAGE_KEY = 'hermes-cad-workspace-dock';
const MOUSE_BINDINGS_STORAGE_KEY = 'hermes-cad-mouse-bindings';

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

type BrowserMaterialLibrary = Omit<MaterialLibrary, 'entries'> & { entries: BrowserMaterialLibraryEntry[] };

function readTextureDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Materialbild konnte nicht als Daten-URL gelesen werden.'));
    });
    reader.addEventListener('error', () => reject(new Error('Materialbild konnte nicht gelesen werden.')));
    reader.readAsDataURL(file);
  });
}

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

function loadMouseBindings(): Record<MouseInputId, MouseAction> {
  if (typeof window === 'undefined') return sanitizeMouseBindings({});
  try {
    return sanitizeMouseBindings(JSON.parse(window.localStorage.getItem(MOUSE_BINDINGS_STORAGE_KEY) ?? '{}'));
  } catch {
    return sanitizeMouseBindings({});
  }
}

export function createInitialSketchModel(): SketchModel {
  return new SketchModel();
}

export function materialLabelForEntity(entity: Entity | undefined, materials: readonly MaterialDefinition[]): string {
  if (!entity) return 'Standard';
  return entity.material?.name ?? materials.find((material) => material.id === entity.materialId)?.name ?? 'Standard';
}

export default function App() {
  const [initialModel] = useState(createInitialSketchModel);
  const [model, setModel] = useState(initialModel);
  const [history, setHistory] = useState<ModelHistory>(() => createHistory(initialModel.snapshot()));
  const [tool, setTool] = useState<ToolName>('select');
  const [activeMenu, setActiveMenu] = useState<WorkbenchMenu | undefined>();
  const [workspaceDock, setWorkspaceDock] = useState<WorkspaceDock>(loadWorkspaceDock);
  const [toolbarOrder, setToolbarOrder] = useState<ToolName[]>(loadToolbarOrder);
  const [mouseBindings, setMouseBindings] = useState<Record<MouseInputId, MouseAction>>(loadMouseBindings);
  const [draggedTool, setDraggedTool] = useState<ToolName | undefined>();
  const [selectedId, setSelectedId] = useState<string | undefined>(model.allEntities()[0]?.id);
  const [selectedBoxFace, setSelectedBoxFace] = useState<FaceSelection | undefined>();
  const [lastMeasurement, setLastMeasurement] = useState('noch keine Messung');
  const [liveMeasurement, setLiveMeasurement] = useState<string | undefined>();
  const [measurementBoxValue, setMeasurementBoxValue] = useState('');
  const [measurementBoxStatus, setMeasurementBoxStatus] = useState('mm · Enter übernimmt das Maß für das aktive Werkzeug');
  const [projectStatus, setProjectStatus] = useState('Projekt nicht gespeichert');
  const [boxDimensions, setBoxDimensions] = useState(DEFAULT_BOX_DIMENSIONS);
  const [drawingPlane, setDrawingPlane] = useState<DrawingPlane>('xy');
  const [useRectangleDimensionMask, setUseRectangleDimensionMask] = useState(false);
  const [rectangleDimensionMask, setRectangleDimensionMask] = useState<RectangleDimensionMask>({ width: '1000', depth: '500' });
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
  const [rightTrayOpen, setRightTrayOpen] = useState(true);
  const [materialLibrary, setMaterialLibrary] = useState<BrowserMaterialLibrary | undefined>();
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string | undefined>();
  const [agentBridgeStatus, setAgentBridgeStatus] = useState('Lokaler Hermes Agent des CAD-App-Hosts · Zeichnungsmodus · noch nicht verbunden');
  const [floatingWindows, setFloatingWindows] = useState<Partial<Record<FloatingWindowId, FloatingWindowState>>>({});
  const [floatingWindowDrag, setFloatingWindowDrag] = useState<FloatingWindowDrag | undefined>();

  const selected = selectedId ? model.getEntity(selectedId) : undefined;
  const selectedInspection = selected ? inspectEntity(selected) : undefined;
  const selectedMeasurement = selected ? formatEntityMeasurement(selected) : undefined;
  const selectedFaceLabel = selectedBoxFace && selectedBoxFace.entityId === selectedId ? faceSelectionLabel(selectedBoxFace) : faceSelectionLabel();
  const activeMeasurement = formatActiveMeasurement({ draft: liveMeasurement, selected: selectedMeasurement, last: lastMeasurement });
  const activeBoxFace = selectedBoxFace && selectedBoxFace.entityId === selectedId ? selectedBoxFace.face : undefined;
  const selectedPushPullSelection = selectedId ? { entityId: selectedId, face: selected?.type === 'box' ? activeBoxFace : undefined } : undefined;
  const rectangleMaskResult = parseRectangleDimensionMask(rectangleDimensionMask);
  const activeRectangleDimensions = useRectangleDimensionMask && rectangleMaskResult.ok ? { width: rectangleMaskResult.width, depth: rectangleMaskResult.depth } : undefined;
  const drawingPlaneLabels: Record<DrawingPlane, string> = {
    xy: drawingPlaneAppearance('xy').label,
    xz: drawingPlaneAppearance('xz').label,
    yz: drawingPlaneAppearance('yz').label
  };
  const activeEditContext = model.activeEditContext();
  const activeContextLabel = activeEditContext.type === 'root'
    ? 'Root / lose Geometrie'
    : `Komponente ${activeEditContext.componentId}`;
  const selectedEditBlocked = Boolean(selectedId && !model.canEditEntity(selectedId));
  const selectedComponentId = selected?.componentId;
  const canOpenSelectedComponent = Boolean(selectedComponentId && activeEditContext.type === 'root');

  function handleRectangleDimensionMaskChange(key: RectangleDimensionKey, event: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = event.currentTarget.value;
    setRectangleDimensionMask((current) => updateRectangleDimensionMaskValue(current, key, rawValue));
  }

  const activeDrawingPlaneAppearance = drawingPlaneAppearance(drawingPlane);
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
  const materialSwatches = buildDefaultMaterialSwatches();
  const tagCatalog = model.allTags();
  const materialCatalog = model.allMaterials();
  const selectedMaterialLabel = materialLabelForEntity(selected, materialCatalog);
  const visibleMaterialCategory = selectedMaterialCategory ?? materialLibrary?.categories[0];
  const visibleMaterialEntries = materialLibrary?.entries.filter((entry) => !visibleMaterialCategory || entry.category === visibleMaterialCategory) ?? [];
  const mouseBindingPanel = (
    <details className="mouse-bindings-panel" aria-label="Mausbelegung pro Nutzer" data-mouse-bindings={summarizeMouseBindings(mouseBindings)}>
      <summary>
        <strong>Mausbelegung pro Nutzer</strong>
        <span>Standard: links Werkzeug, mittlere Taste Ansicht, Rechtsklick Kontextmenü, Rad Zoom</span>
      </summary>
      <p>Standard: Linke Taste nutzt das aktive Werkzeug, mittlere Taste dreht die Ansicht, Rechtsklick öffnet das Arbeitsflächen-Kontextmenü, Mausrad zoomt. Zusatzbuttons, zum Beispiel bei der Logitech G604, kann jeder Nutzer selbst belegen.</p>
      <div className="mouse-bindings-grid">
        {MOUSE_INPUTS.map((input) => (
          <label key={input.id}>
            <span>{input.label}</span>
            <small>{input.browserHint}</small>
            <select
              aria-label={`${input.label} Funktion`}
              value={mouseBindings[input.id]}
              onChange={(event) => updateMouseBinding(input.id, event.currentTarget.value as MouseAction)}
            >
              {MOUSE_ACTIONS.filter((action) => input.id === 'wheel' ? action === 'none' || action === 'zoom' : action !== 'zoom').map((action) => (
                <option key={action} value={action}>{mouseActionLabel(action)}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button type="button" onClick={resetMouseBindings}>Standard wiederherstellen</button>
    </details>
  );

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

  function createRectangleFromViewport(first: Vec3, second: Vec3, plane: DrawingPlane) {
    const draft = createRectangleDraft(first, second, plane);
    if (!draft.ok) return;
    let measurement: string | undefined;
    mutate((m) => {
      const entity = m.createRectangle(draft.origin, draft.width, draft.depth, {}, draft.plane);
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

  function applyMeasurementBoxInput() {
    const raw = measurementBoxValue.trim();
    if (!raw) {
      setMeasurementBoxStatus('Bitte ein Maß eingeben, z. B. 1200 oder 1200,600.');
      return;
    }
    const parsed = parseMeasurementBoxInput(tool, raw);
    if (!parsed.ok) {
      setMeasurementBoxStatus(parsed.error);
      return;
    }

    try {
      if (parsed.kind === 'rectangle') {
        setRectangleDimensionMask({ width: String(parsed.width), depth: String(parsed.depth) });
        setUseRectangleDimensionMask(true);
        setTool('rectangle');
        let action: 'created' | 'resized' | undefined;
        mutate((m) => {
          const applied = applyMeasurementBoxInputToModel(m, {
            tool: 'rectangle',
            rawInput: raw,
            drawingPlane,
            selectedId,
            defaultOrigin: vec(0, 0, 0)
          });
          if (!applied.ok) throw new Error(applied.error);
          const updated = m.getEntity(applied.entityId);
          if (!updated) throw new Error('Rechteck konnte nicht erstellt oder geändert werden.');
          action = applied.action === 'resized' ? 'resized' : 'created';
          setSelectedId(updated.id);
          setLiveMeasurement(formatEntityMeasurement(updated));
        });
        setMeasurementBoxStatus(action === 'resized'
          ? `Rechteck live geändert: ${parsed.width} × ${parsed.depth} mm.`
          : `Rechteck direkt erstellt: ${parsed.width} × ${parsed.depth} mm.`);
        return;
      }

      if (parsed.kind === 'box') {
        setBoxDimensions({ width: parsed.width, depth: parsed.depth, height: parsed.height });
        setTool('box');
        let action: 'created' | 'resized' | undefined;
        mutate((m) => {
          const applied = applyMeasurementBoxInputToModel(m, {
            tool: 'box',
            rawInput: raw,
            drawingPlane,
            selectedId,
            defaultOrigin: vec(0, 0, 0)
          });
          if (!applied.ok) throw new Error(applied.error);
          const updated = m.getEntity(applied.entityId);
          if (!updated || updated.type !== 'box') throw new Error('Körper konnte nicht erstellt oder geändert werden.');
          action = applied.action === 'resized' ? 'resized' : 'created';
          setSelectedId(updated.id);
          setSelectedDimensions(boxDimensionsToInput(updated));
          setLiveMeasurement(formatEntityMeasurement(updated));
        });
        setMeasurementBoxStatus(action === 'resized'
          ? `Körper live geändert: ${parsed.width} × ${parsed.depth} × ${parsed.height} mm.`
          : `Körper direkt erstellt: ${parsed.width} × ${parsed.depth} × ${parsed.height} mm.`);
        return;
      }

      if (parsed.kind === 'vector') {
        setMoveDelta({ x: String(parsed.x), y: String(parsed.y), z: String(parsed.z) });
        if (!selectedId) {
          setMeasurementBoxStatus(`Verschiebung vorbereitet: ${parsed.x}, ${parsed.y}, ${parsed.z} mm. Erst Objekt auswählen.`);
          return;
        }
        moveFromViewport(selectedId, vec(parsed.x, parsed.y, parsed.z));
        setMeasurementBoxStatus(`Verschoben um ${parsed.x}, ${parsed.y}, ${parsed.z} mm.`);
        return;
      }

      if (parsed.kind === 'distance') {
        if (tool === 'line') {
          if (!selectedId || selected?.type !== 'edge') {
            setMeasurementBoxStatus(`Linienmaß ${parsed.value} mm vorbereitet. Eine vorhandene Linie auswählen oder neue Linie zeichnen.`);
            setLiveMeasurement(`Linienmaß: ${parsed.value} mm`);
            return;
          }
          mutate((m) => {
            const updated = m.resizeLineLength(selectedId, parsed.value);
            setSelectedId(updated.id);
            setLiveMeasurement(formatEntityMeasurement(updated));
          });
          setMeasurementBoxStatus(`Linie auf ${parsed.value} mm gesetzt.`);
          return;
        }

        if (tool === 'pushPull') {
          setPushPullDeltaHeight(String(parsed.value));
          if (!selectedId || (selected?.type !== 'box' && selected?.type !== 'face')) {
            setMeasurementBoxStatus(`Push/Pull-Distanz ${parsed.value} mm vorbereitet. Erst Körper oder Fläche auswählen.`);
            return;
          }
          let appliedAction: 'extruded' | 'resized' | undefined;
          mutate((m) => {
            const applied = applyMeasurementBoxInputToModel(m, {
              tool: 'pushPull',
              rawInput: raw,
              drawingPlane,
              selectedId,
              selectedBoxFace: selected?.type === 'box' ? activeBoxFace : undefined
            });
            if (!applied.ok) throw new Error(applied.error);
            const updated = m.getEntity(applied.entityId);
            if (!updated || updated.type !== 'box') throw new Error('Push/Pull konnte keinen Körper erzeugen oder ändern.');
            appliedAction = applied.action === 'extruded' ? 'extruded' : 'resized';
            setSelectedId(updated.id);
            setSelectedBoxFace(undefined);
            setSelectedDimensions(boxDimensionsToInput(updated));
            setLiveMeasurement(formatEntityMeasurement(updated));
          });
          setMeasurementBoxStatus(appliedAction === 'extruded'
            ? `Fläche per Push/Pull zu Körper extrudiert: ${parsed.value} mm.`
            : `Push/Pull um ${parsed.value} mm angewendet.`);
          return;
        }

        setMeasurementBoxStatus(`Maß ${parsed.value} mm übernommen. Werkzeug ${tool} nutzt es als Referenz.`);
        setLiveMeasurement(`Maß: ${parsed.value} mm`);
      }
    } catch (error) {
      setMeasurementBoxStatus(error instanceof Error ? error.message : 'Maß konnte nicht angewendet werden.');
    }
  }

  function handleViewportSelect(entityId: string | undefined, faceSelection?: FaceSelection) {
    if (!entityId) {
      setSelectedId(undefined);
      setSelectedBoxFace(undefined);
      return;
    }
    const target = model.selectionTargetForEntity(entityId);
    setSelectedId(entityId);
    setSelectedBoxFace(target.type === 'entity' && faceSelection?.entityId === entityId ? faceSelection : undefined);
    if (target.type === 'component') {
      setProjectStatus(`Komponente ${target.componentId} außen gewählt. Doppelklick/Edit-Kontext folgt in #50; innere Geometrie ist geschützt.`);
    }
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
    if (!selectedPushPullSelection || (selected?.type !== 'box' && selected?.type !== 'face')) return;
    const parsed = parsePushPullDelta(pushPullDeltaHeight);
    if (!parsed.ok) return;
    applyPushPullSelection(selectedPushPullSelection.entityId, parsed.deltaHeight, selectedPushPullSelection.face ? { entityId: selectedPushPullSelection.entityId, face: selectedPushPullSelection.face } : undefined);
  }

  function applyPushPullSelection(entityId: string, deltaHeight: number, faceSelection?: FaceSelection) {
    const entity = model.getEntity(entityId);
    if (!entity || (entity.type !== 'box' && entity.type !== 'face')) return;
    if (entity.type === 'face') {
      try {
        let extruded = false;
        mutate((m) => {
          const box = m.extrudeFaceToBox(entityId, deltaHeight);
          setSelectedId(box.id);
          setSelectedBoxFace(undefined);
          setSelectedDimensions(boxDimensionsToInput(box));
          setLiveMeasurement(formatEntityMeasurement(box));
          extruded = true;
        });
        if (extruded) {
          setFaceExtrusionStatus('Fläche per Push/Pull zu Körper extrudiert');
          setProjectStatus('Fläche per Push/Pull zu Körper extrudiert');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Fläche konnte nicht per Push/Pull extrudiert werden.';
        setFaceExtrusionStatus(message);
        setProjectStatus(message);
      }
      return;
    }
    try {
      mutate((m) => {
        const face = faceSelection?.entityId === entityId ? faceSelection.face : 'top';
        const updated = m.pushPullBoxFace(entityId, face, deltaHeight);
        setSelectedId(entityId);
        setSelectedBoxFace(faceSelection?.entityId === entityId ? faceSelection : undefined);
        setSelectedDimensions(boxDimensionsToInput(updated));
        setLiveMeasurement(formatEntityMeasurement(updated));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Push/Pull konnte nicht angewendet werden.';
      setProjectStatus(message);
    }
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

  function updateMouseBinding(input: MouseInputId, action: MouseAction) {
    setMouseBindings((current) => sanitizeMouseBindings({ ...current, [input]: action }));
  }

  function resetMouseBindings() {
    setMouseBindings(sanitizeMouseBindings({}));
    setProjectStatus('Mausbelegung auf Standard zurückgesetzt');
  }

  async function openMaterialFolder(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    const parsed = buildMaterialLibrary(selectedFiles);
    const nextLibrary: BrowserMaterialLibrary = {
      ...parsed,
      entries: await Promise.all(parsed.entries.map(async (entry) => {
        const sourceFile = selectedFiles.find((file) => (file.webkitRelativePath || file.name) === entry.relativePath);
        const textureDataUrl = sourceFile ? await readTextureDataUrl(sourceFile) : undefined;
        return { ...entry, previewUrl: textureDataUrl, textureDataUrl };
      }))
    };
    setMaterialLibrary(nextLibrary);
    setSelectedMaterialCategory(nextLibrary.categories[0]);
    setProjectStatus(nextLibrary.entries.length > 0
      ? `Materialordner geladen: ${nextLibrary.rootLabel} · ${nextLibrary.entries.length} Bilder werden in Projektdateien eingebettet`
      : 'Der gewählte Materialordner enthält keine unterstützten Bilddateien.');
  }

  function applyMaterialToSelection(material: MaterialAssignment) {
    if (!selectedId) {
      setProjectStatus('Bitte erst eine Fläche oder einen Körper auswählen, dann Material anwenden.');
      return;
    }
    mutate((m) => {
      m.applyMaterial(selectedId, material);
    });
    setProjectStatus(`Material angewendet: ${material.name ?? material.materialId ?? 'default'}`);
  }

  function materialFromImageEntry(entry: BrowserMaterialLibraryEntry): MaterialAssignment {
    return materialAssignmentFromLibraryEntry(entry);
  }

  function materialFromSwatch(swatch: MaterialSwatch): MaterialAssignment {
    return { materialId: swatch.id };
  }

  function hideSelectedEntity() {
    if (!selectedId) return;
    mutate((m) => {
      m.hideEntity(selectedId);
      setSelectedId(undefined);
    });
    setProjectStatus('Auswahl ausgeblendet.');
  }

  function openSelectedComponentContext() {
    if (!selectedComponentId) return;
    mutate((m) => {
      m.openComponent(selectedComponentId);
    });
    setProjectStatus(`Komponente ${selectedComponentId} geöffnet. Innere Kanten und Flächen sind jetzt bearbeitbar.`);
  }

  function closeEditContext() {
    mutate((m) => {
      m.closeActiveContext();
    });
    setProjectStatus('Bearbeitungskontext geschlossen. Root / lose Geometrie aktiv.');
  }

  function makeSelectedComponent(prefix: 'Gruppe' | 'Komponente') {
    if (!selectedId) return;
    mutate((m) => {
      const component = m.createComponent(`${prefix} aus Auswahl`, [selectedId]);
      m.openComponent(component.id);
      setSelectedId(component.entityIds[0]);
    });
    setProjectStatus(`${prefix} aus Auswahl erstellt und zum Bearbeiten geöffnet.`);
  }

  function reportSelectedArea() {
    if (!selected) return;
    setProjectStatus(formatEntityMeasurement(selected));
    setLiveMeasurement(formatEntityMeasurement(selected));
  }

  function handleEntityContextAction(action: ViewportEntityAction) {
    if (action === 'entityInfo') {
      openFloatingWindow('inspector');
      setProjectStatus('Entity Info geöffnet.');
      return;
    }
    if (action === 'erase') {
      deleteSelectedEntity();
      return;
    }
    if (action === 'hide') {
      hideSelectedEntity();
      return;
    }
    if (action === 'makeGroup') {
      makeSelectedComponent('Gruppe');
      return;
    }
    if (action === 'makeComponent') {
      makeSelectedComponent('Komponente');
      return;
    }
    if (action === 'area') reportSelectedArea();
  }

  function handleMouseBindingAction(action: MouseAction) {
    const nextTool = toolFromMouseAction(action);
    if (nextTool) {
      setTool(nextTool);
      setProjectStatus(`Werkzeug per Maus gewählt: ${tools.find((item) => item.id === nextTool)?.label ?? nextTool}`);
      return;
    }
    if (action === 'undo') {
      undoModelChange();
      return;
    }
    if (action === 'redo') {
      redoModelChange();
      return;
    }
    if (action === 'delete') deleteSelectedEntity();
  }

  function handleViewportContextMenuCommand(command: ViewportContextMenuCommand) {
    if (command.type === 'mouseAction') {
      handleMouseBindingAction(command.action);
      return;
    }
    if (command.type === 'entityAction') {
      handleEntityContextAction(command.action);
      return;
    }
    openFloatingWindow(command.windowId);
    setProjectStatus(`Fenster geöffnet: ${floatingWindowTitle(command.windowId)}`);
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
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MOUSE_BINDINGS_STORAGE_KEY, JSON.stringify(mouseBindings));
  }, [mouseBindings]);

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
      if (!shouldApplyDxfImportReport(report)) {
        setProjectStatus(statusFromDxfImportReport(report, file.name));
        return;
      }
      setModel(report.model);
      setHistory(createHistory(report.model.snapshot()));
      setSelectedId(report.model.allEntities()[0]?.id);
      setProjectStatus(statusFromDxfImportReport(report, file.name));
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
        <button onClick={saveProjectFile}><HermesIcon id="save-project-clear" label="Projekt speichern" size={18} /> Projekt speichern</button>
        <label className="file-button">
          <HermesIcon id="open-project-clear" label="Öffnen" size={18} /> Projekt laden
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
          <HermesIcon id="open-project-clear" label="Öffnen" size={18} /> DXF laden
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
          <HermesIcon id="open-project-clear" label="Öffnen" size={18} /> STL-Referenz laden
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
        <button onClick={() => download('hermes-cad-sketcher.dxf', exportDxf(model), 'application/dxf')}><HermesIcon id="export-file-clear" label="Export" size={18} /> DXF exportieren</button>
        <button onClick={() => download('hermes-cad-sketcher.stl', exportAsciiStl(model), 'model/stl')}><HermesIcon id="export-file-clear" label="Export" size={18} /> STL exportieren</button>
        <p className="format-note">Importiert nur LINE und geschlossene, vierpunktige, achsenparallele Rechteck-LWPOLYLINE ohne Bulge/Breite/Dicke/Sonder-Extrusion.</p>
        <p className="format-note">DXF-Einheiten: $INSUNITS=4 wird als Millimeter importiert; fehlende Einheiten werden sichtbar als Millimeter angenommen, andere Einheiten werden abgelehnt.</p>
        <p className="format-note">STL-Import: ASCII-STL wird nur als Referenzmesh geladen, nicht als editierbarer Körper oder validiertes Fertigungsmesh.</p>
      </section>
      <section className="function-group edit-function-group" aria-label="Bearbeiten & Maße">
        <strong>Bearbeiten &amp; Maße</strong>
        <div className="history-controls" aria-label="Verlauf">
          <button title="Letzte Modelländerung rückgängig machen" onClick={undoModelChange} disabled={!history.canUndo}>
            <HermesIcon id="undo-clear" label="Rückgängig" size={18} /> Rückgängig
          </button>
          <button title="Rückgängig gemachte Modelländerung wiederholen" onClick={redoModelChange} disabled={!history.canRedo}>
            <HermesIcon id="redo-clear" label="Wiederholen" size={18} /> Wiederholen
          </button>
        </div>
        <p className="tool-instruction">{getToolInstructions(tool)}</p>
        <button onClick={duplicateSelectedComponent} disabled={!selected?.componentId}><HermesIcon id="duplicate-component-clear" label="Komponente duplizieren" size={18} /> Komponente duplizieren</button>
        <button title="Ausgewähltes Element löschen (Delete/Backspace)" disabled={!selectedId} onClick={deleteSelectedEntity}>
          <HermesIcon id="eraser-clear" label="Auswahl löschen" size={18} /> Auswahl löschen
        </button>
        <MovePanel disabled={!selectedId} delta={moveDelta} onDeltaChange={setMoveDelta} onApply={applyMoveDelta} />
        <RotatePanel disabled={!selectedId} angleDegrees={rotateAngleDegrees} onAngleChange={setRotateAngleDegrees} onApply={applyRotateAngle} />
        <PushPullPanel
          disabled={!selectedId || (selected?.type !== 'box' && selected?.type !== 'face')}
          selectedType={selected?.type}
          selectedBox={selected?.type === 'box' ? selected : undefined}
          selectedBoxFace={activeBoxFace}
          selectedFace={selected?.type === 'face' ? selected : undefined}
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
          <strong><HermesIcon id="ruby-console-clear" label="Ruby-Konsole" size={16} /> Ruby-Konsole</strong>
          <p>Befehle: line, rectangle, box, move, rotate_z, resize, push_pull, extrude, delete</p>
          <p>Keine SketchUp-Ruby-API und keine .rb/.rbz Plugin-Kompatibilität. Diese Konsole ist eine sichere Hermes-CAD-Befehls-DSL in Millimeter.</p>
          <textarea
            aria-label="Ruby-Konsole CAD-Befehle"
            value={rubyConsoleInput}
            onChange={(event) => setRubyConsoleInput(event.currentTarget.value)}
            rows={4}
          />
          <button type="button" onClick={executeRubyConsole}><HermesIcon id="command-play-clear" label="Befehl ausführen" size={18} /> Ruby-Befehl ausführen</button>
          <small>{rubyConsoleLog}</small>
        </section>
        <section className="cad-command-panel" aria-label="Agent-Chat">
          <strong><HermesIcon id="hermes-agent-clear" label="Hermes Agent" size={16} /> Agent-Chat</strong>
          <p>Hermes antwortet hier wie im Telegram-Chat, bekommt zusätzlich den Zeichnungsmodus und kann bei Bedarf CAD-Befehle ausführen.</p>
          <p>Du kannst normal schreiben, zum Beispiel „Hallo Hermes …“, oder direkte Befehle wie „erstelle box …“ senden.</p>
          <textarea
            aria-label="Nachricht an Hermes"
            value={agentChatInput}
            onChange={(event) => setAgentChatInput(event.currentTarget.value)}
            rows={3}
          />
          <button type="button" onClick={executeAgentChat}><HermesIcon id="agent-chat-clear" label="Agent Chat" size={18} /> An Hermes senden</button>
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
          <button onClick={saveProjectFile}><HermesIcon id="save-project-clear" label="Projekt speichern" size={18} /> Projekt speichern</button>
          <label className="file-button"><HermesIcon id="open-project-clear" label="Öffnen" size={18} /> Projekt laden<input type="file" accept=".hcad.json,application/json" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void openProjectFile(file); event.currentTarget.value = ''; }} /></label>
          <label className="file-button"><HermesIcon id="open-project-clear" label="Öffnen" size={18} /> DXF laden<input type="file" accept=".dxf,application/dxf,text/plain" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void openDxfFile(file); event.currentTarget.value = ''; }} /></label>
          <label className="file-button"><HermesIcon id="open-project-clear" label="Öffnen" size={18} /> STL-Referenz laden<input type="file" accept=".stl,model/stl,text/plain" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void openStlFile(file); event.currentTarget.value = ''; }} /></label>
          <button onClick={() => download('hermes-cad-sketcher.dxf', exportDxf(model), 'application/dxf')}><HermesIcon id="export-file-clear" label="Export" size={18} /> DXF exportieren</button>
          <button onClick={() => download('hermes-cad-sketcher.stl', exportAsciiStl(model), 'model/stl')}><HermesIcon id="export-file-clear" label="Export" size={18} /> STL exportieren</button>
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

  const rightTray = (
    <aside className={rightTrayOpen ? 'right-tray open' : 'right-tray collapsed'} aria-label="Rechte Default-Tray-Leiste">
      <button
        type="button"
        className="right-tray-toggle"
        aria-label={rightTrayOpen ? 'Rechte Tray-Leiste zuklappen' : 'Rechte Tray-Leiste aufklappen'}
        title={rightTrayOpen ? 'Default Tray zuklappen' : 'Default Tray aufklappen'}
        onClick={() => setRightTrayOpen((open) => !open)}
      >
        {rightTrayOpen ? '›' : '‹'}
      </button>
      {rightTrayOpen && (
        <div className="right-tray-content">
          <header className="right-tray-title">
            <strong>Default Tray</strong>
            <span>klappbare rechte Leiste</span>
          </header>
          <details className="tray-section"><summary>Hermes Agent</summary><p>Lokaler Hermes Agent des CAD-App-Hosts · Zeichnungsmodus</p><p>SketchUp 2025 Recherche: Umgebungen, PBR-Materialien und Generate Textures sind als eigene Hermes-CAD-Ideen vorgemerkt.</p></details>
          {mouseBindingPanel}
          <details className="tray-section" open>
            <summary><HermesIcon id="inspector-clear" label="Inspector" size={16} /> Entity Info</summary>
            <dl>
              <div><dt>Auswahl</dt><dd>{selectedId ?? 'keine'}</dd></div>
              <div><dt>Typ</dt><dd>{selected?.type ?? 'Arbeitsfläche'}</dd></div>
              <div><dt>Fläche</dt><dd>{selectedFaceLabel.replace('Fläche: ', '').replace('Fläche ausgewählt: ', '')}</dd></div>
              <div><dt>Material</dt><dd>{selectedMaterialLabel}</dd></div>
            </dl>
          </details>
          <details className="tray-section" open>
            <summary>Zeichnen &amp; Maße</summary>
            <label>
              <span>Zeichenebene</span>
              <select aria-label="Zeichenebene" value={drawingPlane} onChange={(event) => setDrawingPlane(event.currentTarget.value as DrawingPlane)}>
                <option value="xy">{drawingPlaneLabels.xy}</option>
                <option value="xz">{drawingPlaneLabels.xz}</option>
                <option value="yz">{drawingPlaneLabels.yz}</option>
              </select>
            </label>
            <div className={`drawing-plane-indicator ${activeDrawingPlaneAppearance.className}`} aria-label="Aktive Zeichenebene mit Achsfarben">
              <strong>{activeDrawingPlaneAppearance.label}</strong>
              <span className="plane-axis-chip" style={{ backgroundColor: activeDrawingPlaneAppearance.colors[0] }}>{activeDrawingPlaneAppearance.axisNames[0]}</span>
              <span className="plane-axis-chip" style={{ backgroundColor: activeDrawingPlaneAppearance.colors[1] }}>{activeDrawingPlaneAppearance.axisNames[1]}</span>
            </div>
            <small>{activeDrawingPlaneAppearance.helperText}</small>
            <p>Stufenloses Zeichnen ist aktiv: der Mauspunkt wird nicht mehr auf feste Rasterabstände gerundet.</p>
            <label>
              <input type="checkbox" checked={useRectangleDimensionMask} onChange={(event) => setUseRectangleDimensionMask(event.currentTarget.checked)} />
              genaue Rechteck-Maßmaske verwenden
            </label>
            <div className="dimension-grid">
              <label><span>Breite mm</span><input aria-label="Rechteck Breite mm" value={rectangleDimensionMask.width} onChange={(event) => handleRectangleDimensionMaskChange('width', event)} /></label>
              <label><span>Tiefe/Höhe mm</span><input aria-label="Rechteck Tiefe oder Höhe mm" value={rectangleDimensionMask.depth} onChange={(event) => handleRectangleDimensionMaskChange('depth', event)} /></label>
            </div>
            <small>{useRectangleDimensionMask ? (rectangleMaskResult.ok ? `Aktiv: ${rectangleMaskResult.width} mm × ${rectangleMaskResult.depth} mm, Richtung kommt von der Maus.` : rectangleMaskResult.error) : 'Aus: zweite Mausklick-Position bestimmt die Größe frei.'}</small>
          </details>
          <details className="tray-section"><summary><HermesIcon id="outliner-clear" label="Outliner" size={16} /> Outliner</summary><p>{model.allEntities().length} Elemente im Modell.</p></details>
          <details className="tray-section"><summary><HermesIcon id="component-clear" label="Komponenten" size={16} /> Components</summary><p>{model.allComponents().length} Komponenten im Modell.</p></details>
          <details className="tray-section"><summary><HermesIcon id="styles-clear" label="Styles" size={16} /> Styles</summary><p>Schlichter CAD-Stil mit Achsen, Kanten und millimetersicherem Raster.</p></details>
          <details className="tray-section">
            <summary><HermesIcon id="tags-clear" label="Tags" size={16} /> Tags</summary>
            <p>Tags: {tagCatalog.length} · sichtbar: {tagCatalog.filter((tag) => tag.visible).length}</p>
            <ul>
              {tagCatalog.map((tag) => <li key={tag.id}>{tag.name}</li>)}
            </ul>
            <small>Tag-Sichtbarkeit ist im Modell vorbereitet; UI-Umschalter folgen separat.</small>
          </details>
          <details className="tray-section"><summary>Shadows</summary><p>Schatten und Tageslicht bleiben als Ansichtsfunktion vorgemerkt.</p></details>
          <details className="tray-section"><summary><HermesIcon id="scenes-clear" label="Szenen" size={16} /> Scenes</summary><p>Szenen und Ansichten werden hier gesammelt.</p></details>
          <details className="tray-section"><summary>Instructor</summary><p>Körperflächen können ausgewählt und anschließend verschoben oder gezogen werden.</p></details>
          <details className="tray-section materials-section" open>
            <summary><HermesIcon id="materials-clear" label="Materialien" size={16} /> Materials</summary>
            <p>Auswahl mit Material belegen: erst Fläche oder Körper auswählen, dann Farbfeld anklicken.</p>
            <div className="materials-toolbar" aria-label="Material-Auswahl">
              <span>Materialordner: {materialLibrary?.rootLabel ?? 'Standard-Farbfelder'}</span>
              <span>Startmaterialien: {materialSwatches.length}</span>
              <label className="material-folder-button">
                Ordner vom PC wählen
                <input
                  type="file"
                  multiple
                  accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"
                  onChange={(event) => {
                    void openMaterialFolder(event.currentTarget.files);
                    event.currentTarget.value = '';
                  }}
                  {...{ webkitdirectory: '', directory: '' }}
                />
              </label>
            </div>
            {materialLibrary && materialLibrary.categories.length > 0 && (
              <select
                className="material-category-select"
                aria-label="Material-Kategorie"
                value={visibleMaterialCategory}
                onChange={(event) => setSelectedMaterialCategory(event.currentTarget.value)}
              >
                {materialLibrary.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            )}
            <div className="material-grid" aria-label="Material-Farbfelder">
              {visibleMaterialEntries.length > 0 ? visibleMaterialEntries.map((entry) => (
                <button
                  key={entry.relativePath}
                  type="button"
                  className="material-swatch material-image-swatch"
                  aria-label={`Material ${entry.name}`}
                  title={`${entry.category} / ${entry.name}`}
                  style={entry.previewUrl ? { backgroundImage: `url(${entry.previewUrl})` } : undefined}
                  onClick={() => applyMaterialToSelection(materialFromImageEntry(entry))}
                />
              )) : materialSwatches.map((swatch, index) => (
                <button
                  key={`${swatch.color}-${index}`}
                  type="button"
                  className="material-swatch"
                  aria-label={`Material ${swatch.name}`}
                  title={`${swatch.category} / ${swatch.name}`}
                  style={{ backgroundColor: swatch.color }}
                  onClick={() => applyMaterialToSelection(materialFromSwatch(swatch))}
                />
              ))}
            </div>
          </details>
        </div>
      )}
    </aside>
  );

  function renderWindowContent(id: FloatingWindowId) {
    if (id === 'history') return <><div className="history-controls" aria-label="Verlauf"><button title="Letzte Modelländerung rückgängig machen" onClick={undoModelChange} disabled={!history.canUndo}><HermesIcon id="undo-clear" label="Rückgängig" size={18} /> Rückgängig</button><button title="Rückgängig gemachte Modelländerung wiederholen" onClick={redoModelChange} disabled={!history.canRedo}><HermesIcon id="redo-clear" label="Wiederholen" size={18} /> Wiederholen</button></div><button onClick={duplicateSelectedComponent} disabled={!selected?.componentId}><HermesIcon id="duplicate-component-clear" label="Komponente duplizieren" size={18} /> Komponente duplizieren</button><button title="Ausgewähltes Element löschen" disabled={!selectedId} onClick={deleteSelectedEntity}><HermesIcon id="eraser-clear" label="Auswahl löschen" size={18} /> Auswahl löschen</button></>;
    if (id === 'move') return <MovePanel disabled={!selectedId} delta={moveDelta} onDeltaChange={setMoveDelta} onApply={applyMoveDelta} />;
    if (id === 'rotate') return <RotatePanel disabled={!selectedId} angleDegrees={rotateAngleDegrees} onAngleChange={setRotateAngleDegrees} onApply={applyRotateAngle} />;
    if (id === 'pushPull') return <PushPullPanel disabled={!selectedId || (selected?.type !== 'box' && selected?.type !== 'face')} selectedType={selected?.type} selectedBox={selected?.type === 'box' ? selected : undefined} selectedBoxFace={activeBoxFace} selectedFace={selected?.type === 'face' ? selected : undefined} deltaHeight={pushPullDeltaHeight} onDeltaHeightChange={setPushPullDeltaHeight} onApply={applyPushPullDelta} />;
    if (id === 'dimensions') return <SelectedDimensionsPanel disabled={!selectedId || selected?.type !== 'box'} selectedType={selected?.type} dimensions={selectedDimensions} onDimensionsChange={setSelectedDimensions} onApply={applySelectedDimensions} />;
    if (id === 'extrude') return <FaceExtrudePanel disabled={!selectedId || selected?.type !== 'face'} selectedType={selected?.type} selectedFace={selected?.type === 'face' ? selected : undefined} height={extrudeHeight} onHeightChange={(height) => { setExtrudeHeight(height); setFaceExtrusionStatus(''); }} onApply={applyFaceExtrusion} statusMessage={faceExtrusionStatus} />;
    if (id === 'inspector') return <InspectorPanel inspection={selectedInspection} />;
    if (id === 'boxDimensions') return <BoxDimensionsPanel dimensions={boxDimensions} onChange={setBoxDimensions} />;
    if (id === 'rubyConsole') return <section className="cad-command-panel" aria-label="Ruby-Konsole"><p>Befehle: line, rectangle, box, move, rotate_z, resize, push_pull, extrude, delete</p><p>Keine SketchUp-Ruby-API und keine .rb/.rbz Plugin-Kompatibilität.</p><textarea aria-label="Ruby-Konsole CAD-Befehle" value={rubyConsoleInput} onChange={(event) => setRubyConsoleInput(event.currentTarget.value)} rows={4}/><button type="button" onClick={executeRubyConsole}><HermesIcon id="command-play-clear" label="Befehl ausführen" size={18} /> Ruby-Befehl ausführen</button><small>{rubyConsoleLog}</small></section>;
    return <section className="cad-command-panel" aria-label="Hermes Agent Zeichnungsmodus"><p>Hermes antwortet wie im Telegram-Chat und bekommt zusätzlich Zeichnungsmodus, Modellkontext und Auswahl über die Bridge des CAD-App-Hosts.</p><p>{agentBridgeStatus}</p><textarea aria-label="Nachricht an Hermes" value={agentChatInput} onChange={(event) => setAgentChatInput(event.currentTarget.value)} rows={4}/><button type="button" onClick={() => void executeAgentChat()}><HermesIcon id="agent-chat-clear" label="Agent Chat" size={18} /> An Hermes senden</button><small>{agentChatLog}</small></section>;
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
    <main className={`app-shell icon-rail-left sketchup-surface ${rightTrayOpen ? 'right-tray-open' : 'right-tray-closed'}`}>
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
                <span className="drag-grip" aria-hidden="true">⋮</span>
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
        {activeMenuPanel}
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
          <React.Suspense fallback={<div className="viewport-loading" aria-live="polite">3D-Viewport wird geladen …</div>}>
            <LazyThreeViewport
              model={model}
              activeTool={tool}
              selectedId={selectedId}
              onSelect={handleViewportSelect}
              onCreateLine={createLineFromViewport}
              onCreateRectangle={createRectangleFromViewport}
              onCreateBox={createBoxFromViewport}
              onMeasure={measureFromViewport}
              onMove={moveFromViewport}
              onPushPull={applyPushPullSelection}
              onMeasurementPreview={setLiveMeasurement}
              mouseBindings={mouseBindings}
              onMouseBindingAction={handleMouseBindingAction}
              onContextMenuCommand={handleViewportContextMenuCommand}
              drawingPlane={drawingPlane}
              rectangleDimensions={activeRectangleDimensions}
            />
          </React.Suspense>
          <div className="model-card compact">
            <strong>Interaktiver 3D-Viewport</strong>
            <span>Mausbelegung pro Nutzer: links Werkzeugaktion, mittlere Taste Ansicht drehen, Rechtsklick öffnet das Arbeitsflächen-Kontextmenü, Rad Zoom; Zusatzbuttons sind frei belegbar.</span>
            <span>Linie/Rechteck/Maßband: zwei Klicks auf das Raster.</span>
            <span>Verschieben: Objekt auswählen, Move aktivieren, Start und Ziel anklicken.</span>
            <span>Körper: ein Klick auf das Raster.</span>
            <span>Körperflächen können ausgewählt und anschließend verschoben oder gezogen werden.</span>
            <span>Elemente: {model.allEntities().length}</span>
            <span>Komponenten: {model.allComponents().length}</span>
          </div>
        </div>
        <footer className="statusbar">
          <MeasurementBox
            activeMeasurement={activeMeasurement}
            value={measurementBoxValue}
            status={measurementBoxStatus}
            onValueChange={setMeasurementBoxValue}
            onApply={applyMeasurementBoxInput}
          />
          <span>Werkzeug: {tool}</span>
          <span>Auswahl: {selectedId ?? 'keine'}</span>
          <span>Kontext: {activeContextLabel}</span>
          {selectedEditBlocked ? <span>Bearbeitung: erst Komponente öffnen</span> : <span>Bearbeitung: aktiv</span>}
          {canOpenSelectedComponent ? <button type="button" onClick={openSelectedComponentContext}>Komponente öffnen</button> : null}
          {activeEditContext.type !== 'root' ? <button type="button" onClick={closeEditContext}>Kontext schließen</button> : null}
          <button type="button" disabled={!selectedId} onClick={() => makeSelectedComponent('Gruppe')}>Gruppe erstellen</button>
          <button type="button" disabled={!selectedId} onClick={() => makeSelectedComponent('Komponente')}>Komponente erstellen</button>
          <span>Fläche: {selectedFaceLabel.replace('Fläche: ', '').replace('Fläche ausgewählt: ', '')}</span>
          <span>Verlauf: {history.past.length} rückgängig / {history.future.length} wiederholbar</span>
          <span>Maßband: {lastMeasurement}</span>
          <span>Projekt: {projectStatus}</span>
          <span>Einheit: mm</span>
        </footer>
      </section>
      {rightTray}
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
