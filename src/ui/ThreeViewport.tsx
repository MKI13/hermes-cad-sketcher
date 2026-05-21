import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type Vec3 } from '../core/geometry';
import { type SketchModel, type ToolName } from '../core/model';
import { cancelToolState, createInitialToolState, handleGroundClick, type ToolCommand, type ToolState } from '../core/toolState';
import {
  applyOrbitToCamera,
  createModelGroup,
  createOrbitCameraState,
  orbitCameraDrag,
  screenPointToGround,
  type OrbitCameraState
} from './viewportController';

type ThreeViewportProps = {
  model: SketchModel;
  activeTool: ToolName;
  selectedId?: string;
  onSelect?: (entityId: string | undefined) => void;
  onCreateLine?: (start: Vec3, end: Vec3) => void;
  onCreateRectangle?: (first: Vec3, second: Vec3) => void;
  onCreateBox?: (origin: Vec3) => void;
};

export function ThreeViewport({ model, activeTool, selectedId, onSelect, onCreateLine, onCreateRectangle, onCreateBox }: ThreeViewportProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const orbitRef = useRef<OrbitCameraState>(createOrbitCameraState({ radius: 4200 }));
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const toolStateRef = useRef<ToolState>(createInitialToolState());
  const activeToolRef = useRef(activeTool);
  const onSelectRef = useRef(onSelect);
  const onCreateLineRef = useRef(onCreateLine);
  const onCreateRectangleRef = useRef(onCreateRectangle);
  const onCreateBoxRef = useRef(onCreateBox);
  activeToolRef.current = activeTool;
  onSelectRef.current = onSelect;
  onCreateLineRef.current = onCreateLine;
  onCreateRectangleRef.current = onCreateRectangle;
  onCreateBoxRef.current = onCreateBox;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xe2e8f0);
    renderer.domElement.className = 'three-canvas';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(3000, 5000, 2500);
    scene.add(sun);

    const grid = new THREE.GridHelper(6000, 60, 0x64748b, 0xcbd5e1);
    scene.add(grid);

    const modelGroup = createModelGroup(model);
    scene.add(modelGroup);

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
    };

    const pointerDown = (event: PointerEvent) => {
      if (event.button === 2) {
        dragRef.current = { x: event.clientX, y: event.clientY };
        renderer.domElement.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if (event.button === 0) {
        const rect = renderer.domElement.getBoundingClientRect();
        const groundPoint = screenPointToGround(
          { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height },
          camera,
          50
        );
        if (groundPoint && (activeToolRef.current === 'line' || activeToolRef.current === 'rectangle' || activeToolRef.current === 'box')) {
          const step = handleGroundClick(toolStateRef.current, activeToolRef.current, groundPoint);
          toolStateRef.current = step.state;
          executeCommand(step.command);
          return;
        }
        toolStateRef.current = cancelToolState(toolStateRef.current);
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(modelGroup.children, true)[0];
        onSelectRef.current?.(hit?.object.userData.entityId);
      }
    };

    const pointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
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
    };

    const pointerUp = (event: PointerEvent) => {
      if (dragRef.current) {
        renderer.domElement.releasePointerCapture(event.pointerId);
        dragRef.current = null;
      }
    };

    const contextMenu = (event: MouseEvent) => event.preventDefault();
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toolStateRef.current = cancelToolState(toolStateRef.current);
    };

    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointercancel', pointerUp);
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
      renderer.domElement.removeEventListener('contextmenu', contextMenu);
      window.removeEventListener('keydown', keyDown);
      host.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [model]);

  return (
    <div className="three-viewport" ref={hostRef} data-selected-id={selectedId ?? ''} data-active-tool={activeTool}>
      <div className="viewport-help">Rechts ziehen: Ansicht drehen. Linie/Rechteck: zwei Linksklicks. Escape: Zeichnen abbrechen.</div>
    </div>
  );
}
