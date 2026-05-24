import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { type Vec3 } from '../core/geometry';
import { type SketchModel, type ToolName } from '../core/model';
import { cancelToolState, createInitialToolState, getDrawingPreview, handleGroundClick, type ToolCommand, type ToolPreview, type ToolState } from '../core/toolState';
import {
  applyOrbitToCamera,
  createModelGroup,
  createOrbitCameraState,
  disposeObjectTree,
  getEntityIdFromObject,
  orbitCameraDrag,
  screenPointToGround,
  type OrbitCameraState
} from './viewportController';
import { resolveMouseInputAction, resolveWheelAction, type MouseAction, type MouseBindings } from './mouseBindings';
import { createOriginGuideGroup, createWorkspaceGrid, cursorBadgeForTool, formatDraftMeasurement, formatEntityMeasurement, getFaceSelectionFromObject, snapPointToModel, zoomOrbitTowardPoint, buildViewportContextMenuItems, type FaceSelection, type ViewportContextMenuCommand, type ViewportContextMenuItem } from './viewportInteractionHelpers';

type ThreeViewportProps = {
  model: SketchModel;
  activeTool: ToolName;
  selectedId?: string;
  onSelect?: (entityId: string | undefined, faceSelection?: FaceSelection) => void;
  onCreateLine?: (start: Vec3, end: Vec3) => void;
  onCreateRectangle?: (first: Vec3, second: Vec3) => void;
  onCreateBox?: (origin: Vec3) => void;
  onMeasure?: (start: Vec3, end: Vec3) => void;
  onMove?: (entityId: string, delta: Vec3) => void;
  onMeasurementPreview?: (message: string | undefined) => void;
  mouseBindings?: MouseBindings;
  onMouseBindingAction?: (action: MouseAction) => void;
  onContextMenuCommand?: (command: ViewportContextMenuCommand) => void;
};

export function ThreeViewport({ model, activeTool, selectedId, onSelect, onCreateLine, onCreateRectangle, onCreateBox, onMeasure, onMove, onMeasurementPreview, mouseBindings, onMouseBindingAction, onContextMenuCommand }: ThreeViewportProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 28, y: 28 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ViewportContextMenuItem[] } | undefined>();
  const cursorBadge = cursorBadgeForTool(activeTool);
  const [viewportError, setViewportError] = useState<string | undefined>(() =>
    typeof HTMLCanvasElement === 'undefined' || typeof WebGLRenderingContext === 'undefined'
      ? 'WebGL konnte in diesem Browser nicht gestartet werden.'
      : undefined
  );
  const orbitRef = useRef<OrbitCameraState>(createOrbitCameraState({ radius: 4200 }));
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const toolStateRef = useRef<ToolState>(createInitialToolState());
  const activeToolRef = useRef(activeTool);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const onCreateLineRef = useRef(onCreateLine);
  const onCreateRectangleRef = useRef(onCreateRectangle);
  const onCreateBoxRef = useRef(onCreateBox);
  const onMeasureRef = useRef(onMeasure);
  const onMoveRef = useRef(onMove);
  const onMeasurementPreviewRef = useRef(onMeasurementPreview);
  const mouseBindingsRef = useRef<MouseBindings>({});
  const onMouseBindingActionRef = useRef(onMouseBindingAction);
  const onContextMenuCommandRef = useRef(onContextMenuCommand);
  activeToolRef.current = activeTool;
  selectedIdRef.current = selectedId;
  onSelectRef.current = onSelect;
  onCreateLineRef.current = onCreateLine;
  onCreateRectangleRef.current = onCreateRectangle;
  onCreateBoxRef.current = onCreateBox;
  onMeasureRef.current = onMeasure;
  onMoveRef.current = onMove;
  onMeasurementPreviewRef.current = onMeasurementPreview;
  mouseBindingsRef.current = (mouseBindings ?? {}) as MouseBindings;
  onMouseBindingActionRef.current = onMouseBindingAction;
  onContextMenuCommandRef.current = onContextMenuCommand;

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
      if (command.type === 'createRectangle') onCreateRectangleRef.current?.(command.first, command.second);
      if (command.type === 'createBox') onCreateBoxRef.current?.(command.origin);
      if (command.type === 'measureDistance') onMeasureRef.current?.(command.start, command.end);
      if (command.type === 'moveEntity') onMoveRef.current?.(command.entityId, command.delta);
    };

    const toPreviewVector = (point: Vec3) => new THREE.Vector3(point.x, point.z + 3, point.y);

    const rectanglePreviewCorners = (first: Vec3, second: Vec3): Vec3[] => [
      first,
      { x: second.x, y: first.y, z: first.z },
      second,
      { x: first.x, y: second.y, z: second.z }
    ];

    const createPreviewObject = (preview: ToolPreview): THREE.Object3D => {
      if (preview.type === 'linePreview') {
        const geometry = new THREE.BufferGeometry().setFromPoints([toPreviewVector(preview.start), toPreviewVector(preview.end)]);
        return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.9 }));
      }

      const corners = rectanglePreviewCorners(preview.first, preview.second);
      const group = new THREE.Group();
      group.name = 'drawing-preview';
      const fillGeometry = new THREE.BufferGeometry().setFromPoints([toPreviewVector(corners[0]), toPreviewVector(corners[1]), toPreviewVector(corners[2]), toPreviewVector(corners[0]), toPreviewVector(corners[2]), toPreviewVector(corners[3])]);
      fillGeometry.setIndex([0, 1, 2, 3, 4, 5]);
      group.add(new THREE.Mesh(fillGeometry, new THREE.MeshBasicMaterial({ color: 0x2563eb, side: THREE.DoubleSide, transparent: true, opacity: 0.16 })));
      const outlineGeometry = new THREE.BufferGeometry().setFromPoints([...corners.map(toPreviewVector), toPreviewVector(corners[0])]);
      group.add(new THREE.Line(outlineGeometry, new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.95 })));
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

    const updateDrawingPreview = (groundPoint?: Vec3) => {
      clearDrawingPreview();
      const preview = groundPoint ? getDrawingPreview(toolStateRef.current, activeToolRef.current, groundPoint) : undefined;
      if (preview) {
        previewObject = createPreviewObject(preview);
        scene.add(previewObject);
      }
      render();
    };

    const updateMeasurementPreview = (groundPoint?: Vec3) => {
      const draft = groundPoint ? formatDraftMeasurement(toolStateRef.current, activeToolRef.current, groundPoint) : undefined;
      if (draft) {
        onMeasurementPreviewRef.current?.(draft);
        return;
      }
      onMeasurementPreviewRef.current?.(undefined);
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
      const rawGroundPoint = screenPointToGround(
        { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height },
        camera,
        50
      );
      const groundPoint = rawGroundPoint ? snapPointToModel(rawGroundPoint, model).point : undefined;
      const usesGroundPoint =
        activeToolRef.current === 'line' ||
        activeToolRef.current === 'rectangle' ||
        activeToolRef.current === 'box' ||
        activeToolRef.current === 'tape' ||
        (activeToolRef.current === 'move' && selectedIdRef.current !== undefined);
      if (groundPoint && usesGroundPoint) {
        const step = handleGroundClick(toolStateRef.current, activeToolRef.current, groundPoint, selectedIdRef.current);
        toolStateRef.current = step.state;
        executeCommand(step.command);
        updateDrawingPreview(groundPoint);
        updateMeasurementPreview(groundPoint);
        return;
      }
      toolStateRef.current = cancelToolState(toolStateRef.current);
      updateDrawingPreview();
      updateMeasurementPreview();
      const selection = pickSelectionAtPointer(event);
      onSelectRef.current?.(selection.entityId, selection.faceSelection);
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
      setCursorPosition({ x: event.clientX - rect.left + 16, y: event.clientY - rect.top + 18 });
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

      const rawGroundPoint = screenPointToGround(
        { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height },
        camera,
        50
      );
      const groundPoint = rawGroundPoint ? snapPointToModel(rawGroundPoint, model).point : undefined;
      updateDrawingPreview(groundPoint);
      const draftMeasurement = groundPoint ? formatDraftMeasurement(toolStateRef.current, activeToolRef.current, groundPoint) : undefined;
      onMeasurementPreviewRef.current?.(draftMeasurement ?? (activeToolRef.current === 'tape' ? pickMeasurementAtPointer(event) : undefined));
    };

    const wheel = (event: WheelEvent) => {
      if (resolveWheelAction(mouseBindingsRef.current) !== 'zoom') return;
      const rect = renderer.domElement.getBoundingClientRect();
      const rawGroundPoint = screenPointToGround(
        { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height },
        camera,
        50
      );
      const groundPoint = rawGroundPoint ? snapPointToModel(rawGroundPoint, model).point : undefined;
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
    };

    const contextMenu = (event: MouseEvent) => {
      event.preventDefault();
      toolStateRef.current = cancelToolState(toolStateRef.current);
      updateDrawingPreview();
      onMeasurementPreviewRef.current?.(undefined);
      const selection = pickSelectionAtPointer(event);
      const contextSelectedId = selection.entityId ?? selectedIdRef.current;
      if (selection.entityId) onSelectRef.current?.(selection.entityId, selection.faceSelection);
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
        setContextMenu(undefined);
        updateDrawingPreview();
        onMeasurementPreviewRef.current?.(undefined);
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
      <div
        className="cursor-tool-badge cursor-arrow-only"
        aria-label="Mauszeiger: normaler Pfeil ohne störendes Werkzeug-Symbol"
        style={{ left: cursorPosition.x, top: cursorPosition.y }}
      >
        <span className="cursor-arrow">↖</span>
      </div>
      <div className="viewport-help">3D-Arbeitsfläche: links = Werkzeugaktion, Mittelklick ziehen = Ansicht drehen, Rechtsklick = Bearbeitungsmenü, Mausrad = Zoom am Mauspunkt. Escape: Aktion abbrechen.</div>
    </div>
  );
}
