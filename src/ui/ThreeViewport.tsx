import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type SketchModel } from '../core/model';
import { applyOrbitToCamera, createModelGroup, createOrbitCameraState, orbitCameraDrag, type OrbitCameraState } from './viewportController';

type ThreeViewportProps = {
  model: SketchModel;
  selectedId?: string;
  onSelect?: (entityId: string | undefined) => void;
};

export function ThreeViewport({ model, selectedId, onSelect }: ThreeViewportProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const orbitRef = useRef<OrbitCameraState>(createOrbitCameraState({ radius: 4200 }));
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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

    const pointerDown = (event: PointerEvent) => {
      if (event.button === 2) {
        dragRef.current = { x: event.clientX, y: event.clientY };
        renderer.domElement.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if (event.button === 0) {
        const rect = renderer.domElement.getBoundingClientRect();
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

    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointercancel', pointerUp);
    renderer.domElement.addEventListener('contextmenu', contextMenu);
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointercancel', pointerUp);
      renderer.domElement.removeEventListener('contextmenu', contextMenu);
      host.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [model]);

  return (
    <div className="three-viewport" ref={hostRef} data-selected-id={selectedId ?? ''}>
      <div className="viewport-help">Rechte Maustaste halten und ziehen: Ansicht drehen. Linksklick: Objekt auswählen.</div>
    </div>
  );
}
