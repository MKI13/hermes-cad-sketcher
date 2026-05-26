import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { type Vec3 } from '../core/geometry';
import { type DrawingPlane, type EntityId, type SketchModel, type ToolName, type BoxFaceName } from '../core/model';
import { cancelToolState, createInitialToolState, getDrawingPreview, handleGroundClick, type ToolCommand, type ToolPreview, type ToolState } from '../core/toolState';
import { secondPointForRectangleDimensions, type RectangleDimensions } from './drawingController';
import {
  applyOrbitToCamera,
  createModelGroup,
  createOrbitCameraState,
  disposeObjectTree,
  getEntityIdFromObject,
  orbitCameraDrag,
  screenPointToDrawingPlane,
  type OrbitCameraState
} from './viewportController';
import { resolveMouseInputAction, resolveWheelAction, type MouseAction, type MouseBindings } from './mouseBindings';
import { createOriginGuideGroup, createPushPullPreview, createWorkspaceGrid, formatDraftMeasurement, formatEntityMeasurement, getFaceSelectionFromObject, pushPullPreviewMeasurement, snapCueLabel, snapPointToModel, zoomOrbitTowardPoint, buildViewportContextMenuItems, type FaceSelection, type ViewportContextMenuCommand, type ViewportContextMenuItem } from './viewportInteractionHelpers';
import { beginPushPullDrag, finishPushPullDrag, pointForPushPullPointerDelta, updatePushPullDrag, type PushPullDragState } from './pushPullInteraction';

type ThreeViewportProps = {
  model: SketchModel;
  activeTool: ToolName;
  selectedId?: string;
  onSelect?: (entityId: string | undefined, faceSelection?: FaceSelection) => void;
  onCreateLine?: (start: Vec3, end: Vec3) => void;
  onCreateRectangle?: (first: Vec3, second: Vec3, plane: DrawingPlane) => void;
  onCreateBox?: (origin: Vec3) => void;
  onMeasure?: (start: Vec3, end: Vec3) => void;
  onMove?: (entityId: string, delta: Vec3) => void;
  onPushPull?: (entityId: string, delta: number, faceSelection?: FaceSelection) => void;
  onMeasurementPreview?: (message: string | undefined) => void;
  onMeasurementDraftContext?: (context: MeasurementDraftContext | undefined) => void;
  mouseBindings?: MouseBindings;
  onMouseBindingAction?: (action: MouseAction) => void;
  onContextMenuCommand?: (command: ViewportContextMenuCommand) => void;
  drawingPlane?: DrawingPlane;
  rectangleDimensions?: RectangleDimensions;
};

export type MeasurementDraftContext =
  | { tool: 'line'; start: Vec3; pointer: Vec3 }
  | { tool: 'rectangle'; start: Vec3; pointer: Vec3; plane: DrawingPlane };

export function ThreeViewport({ model, activeTool, selectedId, onSelect, onCreateLine, onCreateRectangle, onCreateBox, onMeasure, onMove, onPushPull, onMeasurementPreview, onMeasurementDraftContext, mouseBindings, onMouseBindingAction, onContextMenuCommand, drawingPlane = 'xy', rectangleDimensions }: ThreeViewportProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ViewportContextMenuItem[] } | undefined>();
  const [snapCue, setSnapCue] = useState<{ x: number; y: number; label: string } | undefined>();
  const [pushPullDrag, setPushPullDrag] = useState<PushPullDragState | undefined>();
  const [viewportError, setViewportError] = useState<string | undefined>(() =>
    typeof HTMLCanvasElement === 'undefined' || typeof WebGLRenderingContext === 'undefined'
      ? 'WebGL konnte in diesem Browser nicht gestartet werden.'
      : undefined
  );
  const orbitRef = useRef<OrbitCameraState>(createOrbitCameraState({ radius: 4200 }));
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const pushPullDragRef = useRef<PushPullDragState | undefined>(undefined);
  const pushPullPointerStartRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const toolStateRef = useRef<ToolState>(createInitialToolState());
  const activeToolRef = useRef(activeTool);
  const selectedIdRef = useRef(selectedId);
  const selectedFaceRef = useRef<FaceSelection | undefined>(undefined);
  const onSelectRef = useRef(onSelect);
  const onCreateLineRef = useRef(onCreateLine);
  const onCreateRectangleRef = useRef(onCreateRectangle);
  const onCreateBoxRef = useRef(onCreateBox);
  const onMeasureRef = useRef(onMeasure);
  const onMoveRef = useRef(onMove);
  const onPushPullRef = useRef(onPushPull);
  const onMeasurementPreviewRef = useRef(onMeasurementPreview);
  const onMeasurementDraftContextRef = useRef(onMeasurementDraftContext);
  const mouseBindingsRef = useRef<MouseBindings>({});
  const onMouseBindingActionRef = useRef(onMouseBindingAction);
  const onContextMenuCommandRef = useRef(onContextMenuCommand);
  const drawingPlaneRef = useRef<DrawingPlane>(drawingPlane);
  const rectangleDimensionsRef = useRef<RectangleDimensions | undefined>(rectangleDimensions);
  activeToolRef.current = activeTool;
  selectedIdRef.current = selectedId;
  if (selectedFaceRef.current?.entityId !== selectedId) selectedFaceRef.current = undefined;
  onSelectRef.current = onSelect;
  onCreateLineRef.current = onCreateLine;
  onCreateRectangleRef.current = onCreateRectangle;
  onCreateBoxRef.current = onCreateBox;
  onMeasureRef.current = onMeasure;
  onMoveRef.current = onMove;
  onPushPullRef.current = onPushPull;
  onMeasurementPreviewRef.current = onMeasurementPreview;
  onMeasurementDraftContextRef.current = onMeasurementDraftContext;
  mouseBindingsRef.current = (mouseBindings ?? {}) as MouseBindings;
  onMouseBindingActionRef.current = onMouseBindingAction;
  onContextMenuCommandRef.current = onContextMenuCommand;
  drawingPlaneRef.current = drawingPlane;
  rectangleDimensionsRef.current = rectangleDimensions;

  const setActivePushPullDrag = (drag: PushPullDragState | undefined, pointer?: { x: number; y: number }) => {
    pushPullDragRef.current = drag;
    pushPullPointerStartRef.current = drag ? pointer : undefined;
    setPushPullDrag(drag);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = (() => {
      try {
        return new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        setViewportError('WebGL konnte in diesem Browser nicht gestartet werden.');
        return undefined;
      }
    })();
    if (!renderer) return;
    setViewportError(undefined);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xe2e8f0);
    renderer.domElement.className = 'three-canvas';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(3000, 5000, 2500);
    scene.add(sun);

    const grid = createWorkspaceGrid();
    scene.add(grid);
    const originGuides = createOriginGuideGroup(10000);
    scene.add(originGuides);

    const modelGroup = createModelGroup(model, selectedId);
    scene.add(modelGroup);
    let previewObject: THREE.Object3D | undefined;

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100000);
    applyOrbitToCamera(camera, orbitRef.current);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };

    const render = () => renderer.render(scene, camera);

    const executeCommand = (command?: ToolCommand) => {
      if (!command) return;
      if (command.type === 'createLine') onCreateLineRef.current?.(command.start, command.end);
      if (command.type === 'createRectangle') onCreateRectangleRef.current?.(command.first, command.second, command.plane);
      if (command.type === 'createBox') onCreateBoxRef.current?.(command.origin);
      if (command.type === 'measureDistance') onMeasureRef.current?.(command.start, command.end);
      if (command.type === 'moveEntity') onMoveRef.current?.(command.entityId, command.delta);
    };

    const rememberSelection = (entityId: EntityId | undefined, faceSelection?: FaceSelection) => {
      selectedFaceRef.current = faceSelection && faceSelection.entityId === entityId ? faceSelection : undefined;
      onSelectRef.current?.(entityId, selectedFaceRef.current);
    };

    const toPreviewVector = (point: Vec3) => new THREE.Vector3(point.x, point.z + 3, point.y);

    const rectanglePreviewCorners = (first: Vec3, second: Vec3, plane: DrawingPlane): Vec3[] => {
      if (plane === 'xz') return [first, { x: second.x, y: first.y, z: first.z }, second, { x: first.x, y: first.y, z: second.z }];
      if (plane === 'yz') return [first, { x: first.x, y: second.y, z: first.z }, second, { x: first.x, y: first.y, z: second.z }];
      return [first, { x: second.x, y: first.y, z: first.z }, second, { x: first.x, y: second.y, z: second.z }];
    };

    const previewColor = (plane: DrawingPlane) => {
      if (plane === 'xz') return 0xdc2626;
      if (plane === 'yz') return 0x2563eb;
      return 0x16a34a;
    };

    const createPreviewObject = (preview: ToolPreview): THREE.Object3D => {
      if (preview.type === 'pushPullPreview') {
        const object = createModelGroup({ allEntities: () => [preview.entity] }, undefined, model.allMaterials());
        object.name = 'push-pull-preview';
        return object;
      }

      if (preview.type === 'linePreview') {
        const geometry = new THREE.BufferGeometry().setFromPoints([toPreviewVector(preview.start), toPreviewVector(preview.end)]);
        return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.9 }));
      }

      const corners = rectanglePreviewCorners(preview.first, preview.second, preview.plane);
      const color = previewColor(preview.plane);
      const group = new THREE.Group();
      group.name = 'drawing-preview';
      const fillGeometry = new THREE.BufferGeometry().setFromPoints([toPreviewVector(corners[0]), toPreviewVector(corners[1]), toPreviewVector(corners[2]), toPreviewVector(corners[0]), toPreviewVector(corners[2]), toPreviewVector(corners[3])]);
      fillGeometry.setIndex([0, 1, 2, 3, 4, 5]);
      group.add(new THREE.Mesh(fillGeometry, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.16 })));
      const outlineGeometry = new THREE.BufferGeometry().setFromPoints([...corners.map(toPreviewVector), toPreviewVector(corners[0])]);
      group.add(new THREE.Line(outlineGeometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 })));
      return group;
    };

    const disposeObject = (object: THREE.Object3D) => {
      object.traverse((child) => {
        const mesh = child as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
        else mesh.material?.dispose();
      });
    };

    const clearDrawingPreview = () => {
      if (!previewObject) return;
      scene.remove(previewObject);
      disposeObject(previewObject);
      previewObject = undefined;
    };

    const rectangleAwarePoint = (point: Vec3): Vec3 => {
      const dimensions = rectangleDimensionsRef.current;
      const state = toolStateRef.current;
      if (!dimensions || activeToolRef.current !== 'rectangle' || state.mode !== 'drawing' || state.tool !== 'rectangle') return point;
      return secondPointForRectangleDimensions(state.pendingPoint, point, dimensions, state.plane);
    };

    const updateDrawingPreview = (groundPoint?: Vec3) => {
      clearDrawingPreview();
      const previewPoint = groundPoint ? rectangleAwarePoint(groundPoint) : undefined;
      let preview = previewPoint ? getDrawingPreview(toolStateRef.current, activeToolRef.current, previewPoint) : undefined;
      if (previewPoint && pushPullDragRef.current) {
        const step = updatePushPullDrag(pushPullDragRef.current, previewPoint, (selection, delta) => createPushPullPreview(model, selection, delta));
        if (step.preview.ok) preview = { type: 'pushPullPreview', entity: step.preview.entity };
      }
      if (preview) {
        previewObject = createPreviewObject(preview);
        scene.add(previewObject);
      }
      render();
    };

    const updateMeasurementPreview = (groundPoint?: Vec3) => {
      const previewPoint = groundPoint ? rectangleAwarePoint(groundPoint) : undefined;
      const draft = previewPoint ? formatDraftMeasurement(toolStateRef.current, activeToolRef.current, previewPoint) : undefined;
      if (draft) {
        onMeasurementPreviewRef.current?.(draft);
        if (toolStateRef.current.mode === 'drawing' && activeToolRef.current === 'line' && previewPoint) {
          onMeasurementDraftContextRef.current?.({ tool: 'line', start: toolStateRef.current.pendingPoint, pointer: previewPoint });
        } else if (toolStateRef.current.mode === 'drawing' && activeToolRef.current === 'rectangle' && previewPoint) {
          onMeasurementDraftContextRef.current?.({ tool: 'rectangle', start: toolStateRef.current.pendingPoint, pointer: previewPoint, plane: toolStateRef.current.plane });
        }
        return;
      }
      if (previewPoint && pushPullDragRef.current) {
        const step = updatePushPullDrag(pushPullDragRef.current, previewPoint, (selection, delta) => createPushPullPreview(model, selection, delta));
        onMeasurementPreviewRef.current?.(step.preview.ok ? pushPullPreviewMeasurement(step.preview.entity, step.delta) : step.preview.error);
        return;
      }
      onMeasurementPreviewRef.current?.(undefined);
      onMeasurementDraftContextRef.current?.(undefined);
    };

    const pointForPushPullDrag = (event: PointerEvent | MouseEvent, state: PushPullDragState): Vec3 | undefined => {
      const start = pushPullPointerStartRef.current;
      if (!start) return state.startPoint;
      return pointForPushPullPointerDelta(state, { x: event.clientX - start.x, y: event.clientY - start.y });
    };

    const pickMeasurementAtPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(modelGroup.children, true)[0];
      const id = getEntityIdFromObject(hit?.object);
      const entity = id ? model.getEntity(id) : undefined;
      return entity ? formatEntityMeasurement(entity) : undefined;
    };

    const pickSelectionAtPointer = (event: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(modelGroup.children, true)[0];
      const entityId = getEntityIdFromObject(hit?.object);
      return { entityId, faceSelection: getFaceSelectionFromObject(hit?.object) };
    };

    const performActiveToolAction = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const rawGroundPoint = screenPointToDrawingPlane(
        { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height },
        camera,
        drawingPlaneRef.current
      );
      const groundPoint = rawGroundPoint ? rectangleAwarePoint(rawGroundPoint) : undefined;
      const usesGroundPoint =
        activeToolRef.current === 'line' ||
        activeToolRef.current === 'rectangle' ||
        activeToolRef.current === 'box' ||
        activeToolRef.current === 'tape' ||
        activeToolRef.current === 'pushPull' ||
        (activeToolRef.current === 'move' && selectedIdRef.current !== undefined);
      if (groundPoint && activeToolRef.current === 'pushPull') {
        const picked = pickSelectionAtPointer(event);
        const entityId = picked.entityId ?? selectedIdRef.current;
        if (picked.entityId) rememberSelection(picked.entityId, picked.faceSelection);
        const selectedEntity = entityId ? model.getEntity(entityId) : undefined;
        const selectedFace = picked.faceSelection ?? (selectedFaceRef.current?.entityId === entityId ? selectedFaceRef.current : undefined);
        const drag = beginPushPullDrag(entityId, selectedEntity?.type === 'box' ? selectedFace : undefined, groundPoint);
        if (drag) {
          setActivePushPullDrag(drag, { x: event.clientX, y: event.clientY });
          updateDrawingPreview(groundPoint);
          updateMeasurementPreview(groundPoint);
          return;
        }
      }
      if (groundPoint && usesGroundPoint) {
        const step = handleGroundClick(toolStateRef.current, activeToolRef.current, groundPoint, selectedIdRef.current, drawingPlaneRef.current);
        toolStateRef.current = step.state;
        executeCommand(step.command);
        updateDrawingPreview(groundPoint);
        updateMeasurementPreview(groundPoint);
        return;
      }
      toolStateRef.current = cancelToolState(toolStateRef.current);
      setActivePushPullDrag(undefined);
      updateDrawingPreview();
      setSnapCue(undefined);
      updateMeasurementPreview();
      const selection = pickSelectionAtPointer(event);
      rememberSelection(selection.entityId, selection.faceSelection);
    };

    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 2) setContextMenu(undefined);
      const action = resolveMouseInputAction(mouseBindingsRef.current, event.button);
      if (action === 'orbit') {
        dragRef.current = { x: event.clientX, y: event.clientY };
        renderer.domElement.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if (action === 'contextMenu') {
        return;
      }
      if (action === 'toolAction') {
        event.preventDefault();
        performActiveToolAction(event);
        return;
      }
      if (action !== 'none') {
        event.preventDefault();
        onMouseBindingActionRef.current?.(action);
      }
    };

    const pointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (dragRef.current) {
        const last = dragRef.current;
        orbitRef.current = orbitCameraDrag(orbitRef.current, {
          deltaX: event.clientX - last.x,
          deltaY: event.clientY - last.y,
          viewportWidth: host.clientWidth,
          viewportHeight: host.clientHeight
        });
        dragRef.current = { x: event.clientX, y: event.clientY };
        applyOrbitToCamera(camera, orbitRef.current);
        render();
        return;
      }

      const drag = pushPullDragRef.current;
      const dragPoint = drag ? pointForPushPullDrag(event, drag) : undefined;
      const rawGroundPoint = dragPoint ?? screenPointToDrawingPlane(
        { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height },
        camera,
        drawingPlaneRef.current
      );
      const groundPoint = rawGroundPoint;
      if (rawGroundPoint) {
        const snap = snapPointToModel(rawGroundPoint, model);
        setSnapCue(snap.snapped ? { x: event.clientX - rect.left + 14, y: event.clientY - rect.top - 18, label: snapCueLabel(snap.kind) } : undefined);
      } else {
        setSnapCue(undefined);
      }
      updateDrawingPreview(groundPoint);
      updateMeasurementPreview(groundPoint);
    };

    const wheel = (event: WheelEvent) => {
      if (resolveWheelAction(mouseBindingsRef.current) !== 'zoom') return;
      const rect = renderer.domElement.getBoundingClientRect();
      const rawGroundPoint = screenPointToDrawingPlane(
        { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height },
        camera,
        drawingPlaneRef.current
      );
      const groundPoint = rawGroundPoint;
      if (!groundPoint) return;
      event.preventDefault();
      orbitRef.current = zoomOrbitTowardPoint(orbitRef.current, groundPoint, event.deltaY);
      applyOrbitToCamera(camera, orbitRef.current);
      render();
    };

    const pointerUp = (event: PointerEvent) => {
      if (dragRef.current) {
        renderer.domElement.releasePointerCapture(event.pointerId);
        dragRef.current = null;
      }
      const drag = pushPullDragRef.current;
      const rawGroundPoint = drag ? pointForPushPullDrag(event, drag) : undefined;
      if (drag && rawGroundPoint) {
        const result = finishPushPullDrag(drag, rawGroundPoint);
        const preview = result ? createPushPullPreview(model, result.selection, result.delta) : undefined;
        setActivePushPullDrag(undefined);
        clearDrawingPreview();
        if (result && preview?.ok) {
          onPushPullRef.current?.(result.selection.entityId, result.delta, result.selection.face ? { entityId: result.selection.entityId, face: result.selection.face } : undefined);
        } else if (preview && !preview.ok) {
          onMeasurementPreviewRef.current?.(preview.error);
        }
        updateMeasurementPreview();
        render();
      }
    };

    const contextMenu = (event: MouseEvent) => {
      event.preventDefault();
      toolStateRef.current = cancelToolState(toolStateRef.current);
      setActivePushPullDrag(undefined);
      updateDrawingPreview();
      setSnapCue(undefined);
      onMeasurementPreviewRef.current?.(undefined);
      onMeasurementDraftContextRef.current?.(undefined);
      const selection = pickSelectionAtPointer(event);
      const contextSelectedId = selection.entityId ?? selectedIdRef.current;
      if (selection.entityId) rememberSelection(selection.entityId, selection.faceSelection);
      const selectedEntityType = contextSelectedId ? model.getEntity(contextSelectedId)?.type : undefined;
      const hostRect = host.getBoundingClientRect();
      setContextMenu({
        x: Math.max(8, Math.min(event.clientX - hostRect.left, hostRect.width - 230)),
        y: Math.max(8, Math.min(event.clientY - hostRect.top, hostRect.height - 260)),
        items: buildViewportContextMenuItems({ selectedEntityType })
      });
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toolStateRef.current = cancelToolState(toolStateRef.current);
        setActivePushPullDrag(undefined);
        setContextMenu(undefined);
        updateDrawingPreview();
        setSnapCue(undefined);
        onMeasurementPreviewRef.current?.(undefined);
        onMeasurementDraftContextRef.current?.(undefined);
      }
    };

    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointercancel', pointerUp);
    renderer.domElement.addEventListener('wheel', wheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', contextMenu);
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', keyDown);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointercancel', pointerUp);
      renderer.domElement.removeEventListener('wheel', wheel);
      renderer.domElement.removeEventListener('contextmenu', contextMenu);
      window.removeEventListener('keydown', keyDown);
      clearDrawingPreview();
      if (modelGroup.parent) modelGroup.parent.remove(modelGroup);
      if (originGuides.parent) originGuides.parent.remove(originGuides);
      disposeObjectTree(modelGroup);
      disposeObjectTree(originGuides);
      host.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [model, selectedId]);

  function runContextMenuCommand(command: ViewportContextMenuCommand) {
    setContextMenu(undefined);
    if (command.type === 'mouseAction') {
      onMouseBindingActionRef.current?.(command.action);
      return;
    }
    onContextMenuCommandRef.current?.(command);
  }

  return (
    <div className="three-viewport" ref={hostRef} data-selected-id={selectedId ?? ''} data-active-tool={activeTool}>
      {viewportError && <div className="viewport-error"><strong>3D-Viewport nicht verfügbar</strong><span>{viewportError}</span></div>}
      {contextMenu && (
        <section
          className="viewport-context-menu"
          aria-label="Arbeitsflächen-Kontextmenü"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <strong>Arbeitsfläche bearbeiten</strong>
          {contextMenu.items.map((item) => (
            <button key={item.label} type="button" onClick={() => runContextMenuCommand(item.command)}>
              {item.label}
            </button>
          ))}
        </section>
      )}
      {snapCue && <div className="snap-cue" aria-label={`Fanghinweis ${snapCue.label}`} style={{ left: snapCue.x, top: snapCue.y }}>{snapCue.label}</div>}
      <div className="viewport-help">3D-Arbeitsfläche: links = Werkzeugaktion, Mittelklick ziehen = Ansicht drehen, Rechtsklick = Bearbeitungsmenü, Mausrad = Zoom am Mauspunkt. Escape: Aktion abbrechen.</div>
    </div>
  );
}
