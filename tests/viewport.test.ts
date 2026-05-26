import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { defaultMaterials } from '../src/core/materials';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { importAsciiStl } from '../src/core/stl';
import {
  BOX_EDGE_MATERIAL,
  BOX_FACE_MATERIAL,
  EDGE_MATERIAL,
  FACE_MATERIAL,
  HOVER_FACE_MATERIAL,
  REFERENCE_MESH_MATERIAL,
  SELECTED_EDGE_MATERIAL,
  SELECTED_FACE_MATERIAL
} from '../src/ui/sceneAdapter';
import {
  createOrbitCameraState,
  orbitCameraDrag,
  cameraPositionFromOrbit,
  createModelGroup,
  disposeObjectTree,
  getEntityIdFromObject,
  isSelectedObject,
  snapToGrid,
  screenPointToDrawingPlane,
  screenPointToGround
} from '../src/ui/viewportController';

describe('interactive Three.js viewport foundation', () => {
  it('orbits camera when the right mouse button drag delta is applied', () => {
    const initial = createOrbitCameraState({ target: vec(0, 0, 0), radius: 1000, azimuth: 0, polar: Math.PI / 3 });
    const next = orbitCameraDrag(initial, { deltaX: 120, deltaY: -60, viewportWidth: 1200, viewportHeight: 800 });

    expect(next.azimuth).toBeGreaterThan(initial.azimuth);
    expect(next.polar).toBeLessThan(initial.polar);
    expect(next.radius).toBe(1000);
  });

  it('clamps polar angle so the camera cannot flip upside down', () => {
    const initial = createOrbitCameraState({ target: vec(0, 0, 0), radius: 1000, azimuth: 0, polar: 0.05 });
    const next = orbitCameraDrag(initial, { deltaX: 0, deltaY: -10000, viewportWidth: 1000, viewportHeight: 1000 });

    expect(next.polar).toBeGreaterThanOrEqual(0.1);
  });

  it('converts orbit state to a Three.js camera position using x/z ground axes and y height', () => {
    const state = createOrbitCameraState({ target: vec(0, 0, 0), radius: 1000, azimuth: 0, polar: Math.PI / 2 });
    const position = cameraPositionFromOrbit(state);

    expect(Math.round(position.x)).toBe(0);
    expect(Math.round(position.y)).toBe(0);
    expect(Math.round(position.z)).toBe(1000);
  });

  it('creates a Three.js group with one child per model entity and stable entity userData', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);
    const line = model.createLine(vec(0, 0, 0), vec(100, 0, 0));

    const group = createModelGroup(model);

    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.children).toHaveLength(2);
    expect(group.children.map((child) => child.userData.entityId)).toEqual([box.id, line.id]);
  });

  it('exports centralized viewport materials with distinct face hover, selected face and selected edge colors', () => {
    expect(EDGE_MATERIAL).toBeInstanceOf(THREE.LineBasicMaterial);
    expect(FACE_MATERIAL).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(BOX_FACE_MATERIAL).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(BOX_EDGE_MATERIAL).toBeInstanceOf(THREE.LineBasicMaterial);
    expect(SELECTED_FACE_MATERIAL).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(HOVER_FACE_MATERIAL).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(SELECTED_EDGE_MATERIAL).toBeInstanceOf(THREE.LineBasicMaterial);
    expect(REFERENCE_MESH_MATERIAL).toBeInstanceOf(THREE.MeshStandardMaterial);

    expect(HOVER_FACE_MATERIAL.color.getHex()).not.toBe(BOX_FACE_MATERIAL.color.getHex());
    expect(SELECTED_FACE_MATERIAL.color.getHex()).not.toBe(HOVER_FACE_MATERIAL.color.getHex());
    expect(SELECTED_EDGE_MATERIAL.color.getHex()).toBe(0x2563eb);
  });

  it('skips hidden entities and renders applied material colors like the Materials tray', () => {
    const model = new SketchModel();
    const painted = model.createRectangle(vec(0, 0, 0), 1000, 500);
    const hidden = model.createLine(vec(0, 0, 0), vec(100, 0, 0));
    model.applyMaterial(painted.id, { name: 'Holz', color: '#b45309' });
    model.hideEntity(hidden.id);

    const group = createModelGroup(model);

    expect(group.children.map((child) => child.userData.entityId)).toEqual([painted.id]);
    const mesh = group.children[0] as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('b45309');
  });

  it('uses stable materialId catalog colors when no legacy material color is stored on the entity', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 50, 25);
    model.applyMaterial(box.id, { materialId: 'wood-light' });

    const group = createModelGroup(model, undefined, defaultMaterials());

    const boxObject = group.children[0] as THREE.Group;
    const mesh = boxObject.children[0] as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('d97706');
  });

  it('renders push/pull preview entities without requiring a full SketchModel instance', () => {
    const model = { allEntities: () => [{ id: 'box_1', type: 'box' as const, origin: vec(0, 0, 0), width: 100, depth: 50, height: 25, rotationZ: 0, materialId: 'wood-light' }] };

    const group = createModelGroup(model, undefined, defaultMaterials());

    expect(group.children).toHaveLength(1);
    const boxObject = group.children[0] as THREE.Group;
    const mesh = boxObject.children[0] as THREE.Mesh;
    expect((mesh.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('d97706');
  });

  it('passes the live material catalog into ThreeViewport push/pull preview rendering', async () => {
    const source = await readFile('src/ui/ThreeViewport.tsx', 'utf8');

    expect(source).not.toContain('createModelGroup({ allEntities: () => [preview.entity] } as SketchModel, undefined)');
    expect(source).toContain('createModelGroup({ allEntities: () => [preview.entity] }');
    expect(source).toContain('model.allMaterials()');
  });

  it('renders STL reference meshes as transparent wireframe mesh geometry', () => {
    const model = new SketchModel();
    const mesh = importAsciiStl(`solid ref
facet normal 0 0 1
outer loop
vertex 0 0 0
vertex 100 0 0
vertex 0 50 0
endloop
endfacet
endsolid ref
`, 'synthetic-reference.stl');
    const entity = model.addReferenceMesh(mesh.name, mesh.triangles);

    const group = createModelGroup(model);
    const object = group.children[0];

    expect(object.userData.entityId).toBe(entity.id);
    expect(object.userData.entityType).toBe('referenceMesh');
    expect(object).toBeInstanceOf(THREE.Mesh);
    expect((object as THREE.Mesh).geometry.getAttribute('position').count).toBe(3);
    const material = (object as THREE.Mesh).material;
    expect(Array.isArray(material)).toBe(false);
    if (!Array.isArray(material)) {
      expect(material.transparent).toBe(true);
      expect((material as THREE.MeshStandardMaterial).wireframe).toBe(true);
    }
  });

  it('keeps selected STL reference meshes gray and wireframe instead of applying selected face fill', () => {
    const model = new SketchModel();
    const mesh = importAsciiStl(`solid ref
facet normal 0 0 1
outer loop
vertex 0 0 0
vertex 100 0 0
vertex 0 50 0
endloop
endfacet
endsolid ref
`, 'synthetic-reference.stl');
    const entity = model.addReferenceMesh(mesh.name, mesh.triangles);

    const group = createModelGroup(model, entity.id);
    const object = group.children[0];

    expect(isSelectedObject(object)).toBe(true);
    expect(object).toBeInstanceOf(THREE.Mesh);
    const material = (object as THREE.Mesh).material;
    expect(Array.isArray(material)).toBe(false);
    if (!Array.isArray(material)) {
      expect((material as THREE.MeshStandardMaterial).wireframe).toBe(true);
      expect((material as THREE.MeshStandardMaterial).color.getHex()).toBe(REFERENCE_MESH_MATERIAL.color.getHex());
      expect((material as THREE.MeshStandardMaterial).color.getHex()).not.toBe(SELECTED_FACE_MATERIAL.color.getHex());
      expect(material.opacity).toBeCloseTo(REFERENCE_MESH_MATERIAL.opacity);
    }
  });

  it('marks only the selected entity object for viewport highlighting', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);
    const line = model.createLine(vec(0, 0, 0), vec(100, 0, 0));

    const group = createModelGroup(model, line.id);

    const byEntityId = new Map(group.children.map((child) => [child.userData.entityId, child]));
    const unselectedBox = byEntityId.get(box.id);
    const selectedLine = byEntityId.get(line.id);
    expect(isSelectedObject(unselectedBox)).toBe(false);
    expect(isSelectedObject(selectedLine)).toBe(true);
    expect(selectedLine).toBeInstanceOf(THREE.Line);
    if (selectedLine instanceof THREE.Line && !Array.isArray(selectedLine.material)) {
      expect(selectedLine.material.color.getHex()).toBe(0x2563eb);
    }
  });

  it('highlights a selected body with blue edge skeleton while keeping its faces translucent', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);

    const group = createModelGroup(model, box.id);
    const selectedBody = group.children[0] as THREE.Group;
    const selectedEdges = selectedBody.children.find((child): child is THREE.LineSegments => child instanceof THREE.LineSegments && child.userData.edgeSkeleton === true);
    const selectedFaces = selectedBody.children.filter((child): child is THREE.Mesh => child instanceof THREE.Mesh && Boolean(child.userData.boxFace));

    expect(selectedEdges).toBeDefined();
    expect(selectedEdges?.material).toBeInstanceOf(THREE.LineBasicMaterial);
    expect((selectedEdges?.material as THREE.LineBasicMaterial).color.getHex()).toBe(0x2563eb);
    expect(selectedFaces).toHaveLength(6);
    expect(selectedFaces.every((face) => (face.material as THREE.MeshStandardMaterial).color.getHex() !== 0x2563eb)).toBe(true);
  });

  it('uses selected face material in preference to hover material for a selected box face', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);

    const group = createModelGroup(model, box.id, [], { hoveredFace: { entityId: box.id, face: 'front' }, selectedFace: { entityId: box.id, face: 'front' } });
    const selectedBody = group.children[0] as THREE.Group;
    const frontFace = selectedBody.children.find((child): child is THREE.Mesh => child instanceof THREE.Mesh && child.userData.boxFace === 'front');

    expect(frontFace).toBeDefined();
    expect((frontFace?.material as THREE.MeshStandardMaterial).color.getHex()).toBe(SELECTED_FACE_MATERIAL.color.getHex());
    expect((frontFace?.material as THREE.MeshStandardMaterial).color.getHex()).not.toBe(HOVER_FACE_MATERIAL.color.getHex());
  });

  it('disposes each replaced base material exactly once when selected and face visual states are applied', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 100, 200, 300);
    const line = model.createLine(vec(0, 0, 0), vec(100, 0, 0));
    const face = model.createRectangle(vec(0, 0, 0), 50, 25);
    const materialDisposals: string[] = [];
    const lineDispose = THREE.LineBasicMaterial.prototype.dispose;
    const meshDispose = THREE.MeshStandardMaterial.prototype.dispose;
    THREE.LineBasicMaterial.prototype.dispose = function disposeLineMaterial() {
      materialDisposals.push(this.uuid);
      return lineDispose.call(this);
    };
    THREE.MeshStandardMaterial.prototype.dispose = function disposeMeshMaterial() {
      materialDisposals.push(this.uuid);
      return meshDispose.call(this);
    };

    try {
      const boxGroup = createModelGroup(model, box.id, [], { hoveredFace: { entityId: box.id, face: 'left' }, selectedFace: { entityId: box.id, face: 'front' } });
      const lineGroup = createModelGroup(model, line.id);
      const faceGroup = createModelGroup(model, face.id);
      const highlightedBox = boxGroup.children[0] as THREE.Group;
      const highlightedBoxMaterials = highlightedBox.children
        .filter((child): child is THREE.Mesh | THREE.LineSegments => child instanceof THREE.Mesh || child instanceof THREE.LineSegments)
        .map((child) => child.material)
        .filter((material) => !Array.isArray(material));
      const highlightedLine = lineGroup.children.find((child): child is THREE.Line => child instanceof THREE.Line && child.userData.entityId === line.id);
      const highlightedFace = faceGroup.children.find((child): child is THREE.Mesh => child instanceof THREE.Mesh && child.userData.entityId === face.id);

      expect(highlightedBoxMaterials).toHaveLength(7);
      expect(highlightedLine).toBeDefined();
      expect(highlightedFace).toBeDefined();
      const activeHighlightUuids = [
        ...highlightedBoxMaterials,
        highlightedLine?.material,
        highlightedFace?.material
      ].filter((material): material is THREE.Material => material instanceof THREE.Material).map((material) => material.uuid);
      expect(new Set(activeHighlightUuids).size).toBe(activeHighlightUuids.length);
      for (const activeUuid of activeHighlightUuids) {
        expect(materialDisposals).not.toContain(activeUuid);
      }
      expect(materialDisposals.length).toBeGreaterThanOrEqual(5);
    } finally {
      THREE.LineBasicMaterial.prototype.dispose = lineDispose;
      THREE.MeshStandardMaterial.prototype.dispose = meshDispose;
    }
  });

  it('wires ThreeViewport hover and selected face visual state into model rendering without rebuilding the WebGL renderer', async () => {
    const source = await readFile('src/ui/ThreeViewport.tsx', 'utf8');

    expect(source).toContain('const hoveredFaceRef = useRef<FaceSelection | undefined>(undefined)');
    expect(source).toContain('let modelGroup = createModelGroup(model, selectedId, model.allMaterials(), { hoveredFace: hoveredFaceRef.current, selectedFace: selectedFaceRef.current })');
    expect(source).toContain('rebuildModelGroup({ hoveredFace: selection.faceSelection, selectedFace: selectedFaceRef.current })');
    expect(source).toMatch(/const rememberSelection = \(entityId:[\s\S]*?rebuildModelGroup\(\{ hoveredFace: hoveredFaceRef\.current, selectedFace: selectedFaceRef\.current \}\);[\s\S]*?};/);
    expect(source).not.toContain('[model, selectedId, hoveredFace]');
  });

  it('finds entity ids on hit ancestors for robust picking', () => {
    const root = new THREE.Group();
    const child = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    root.userData.entityId = 'box_1';
    root.add(child);

    expect(getEntityIdFromObject(child)).toBe('box_1');
  });

  it('disposes geometries and materials in viewport object trees', () => {
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial();
    let geometryDisposed = false;
    let materialDisposed = false;
    geometry.addEventListener('dispose', () => { geometryDisposed = true; });
    material.addEventListener('dispose', () => { materialDisposed = true; });
    group.add(new THREE.Mesh(geometry, material));

    disposeObjectTree(group);

    expect(geometryDisposed).toBe(true);
    expect(materialDisposed).toBe(true);
  });

  it('snaps ground points to the configured millimeter grid', () => {
    expect(snapToGrid(vec(124, 276, 0), 50)).toEqual(vec(100, 300, 0));
    expect(snapToGrid(vec(-124, -276, 0), 100)).toEqual(vec(-100, -300, 0));
  });

  it('projects the center of the screen onto the millimeter ground plane', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100000);
    camera.position.set(123.4, 1000, 1456.7);
    camera.lookAt(new THREE.Vector3(123.4, 0, 456.7));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const groundPoint = screenPointToGround({ x: 500, y: 500, width: 1000, height: 1000 }, camera, 50);

    expect(groundPoint?.x).toBeCloseTo(123.4, 6);
    expect(groundPoint?.y).toBeCloseTo(456.7, 6);
    expect(groundPoint?.z).toBeCloseTo(0, 6);
  });

  it('projects screen points onto vertical red-blue and green-blue drawing planes', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100000);
    camera.position.set(800, 1000, 1200);
    camera.lookAt(new THREE.Vector3(100, 250, 0));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const redBluePoint = screenPointToDrawingPlane({ x: 500, y: 500, width: 1000, height: 1000 }, camera, 'xz');
    expect(redBluePoint?.x).toBeCloseTo(100, 6);
    expect(redBluePoint?.y).toBeCloseTo(0, 6);
    expect(redBluePoint?.z).toBeCloseTo(250, 6);

    camera.lookAt(new THREE.Vector3(0, 250, 100));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const greenBluePoint = screenPointToDrawingPlane({ x: 500, y: 500, width: 1000, height: 1000 }, camera, 'yz');
    expect(greenBluePoint?.x).toBeCloseTo(0, 6);
    expect(greenBluePoint?.y).toBeCloseTo(100, 6);
    expect(greenBluePoint?.z).toBeCloseTo(250, 6);
  });
});
