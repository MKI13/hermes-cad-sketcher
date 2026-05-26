import * as THREE from 'three';
import { type BoxEntity, type BoxFaceName, type Entity } from '../core/model';
import type { MaterialDefinition } from '../core/materials';

type FaceSpec = Readonly<{ name: BoxFaceName; points: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] }>;

function cadPointToThree(point: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.z, point.y);
}

export function entityToObject(entity: Entity, materials: readonly MaterialDefinition[] = []): THREE.Object3D {
  const materialDefinition = entity.materialId ? materials.find((material) => material.id === entity.materialId) : undefined;
  const materialColor = entity.material?.color ?? materialDefinition?.color;
  if (entity.type === 'edge') {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(entity.start.x, entity.start.z, entity.start.y), new THREE.Vector3(entity.end.x, entity.end.z, entity.end.y)]);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: materialColor ?? 0x0f172a }));
  }
  if (entity.type === 'face') {
    const geometry = new THREE.BufferGeometry().setFromPoints(entity.vertices.map(cadPointToThree));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: materialColor ?? 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: materialColor ? 0.92 : 0.55, roughness: 0.74, metalness: 0.03 }));
  }
  if (entity.type === 'referenceMesh') {
    const positions: number[] = [];
    for (const triangle of entity.triangles) {
      for (const vertex of triangle.vertices) {
        positions.push(vertex.x, vertex.z, vertex.y);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x94a3b8, side: THREE.DoubleSide, transparent: true, opacity: 0.42, wireframe: true }));
  }
  return boxToLineBuiltObject(entity, materialColor);
}

function boxToLineBuiltObject(entity: BoxEntity, materialColor?: string): THREE.Group {
  const group = new THREE.Group();
  group.userData.solidFutureReady = true;
  group.position.set(entity.origin.x + entity.width / 2, entity.origin.z + entity.height / 2, entity.origin.y + entity.depth / 2);
  group.rotation.y = entity.rotationZ;

  const x0 = -entity.width / 2;
  const x1 = entity.width / 2;
  const y0 = -entity.height / 2;
  const y1 = entity.height / 2;
  const z0 = -entity.depth / 2;
  const z1 = entity.depth / 2;
  const p = {
    lbf: new THREE.Vector3(x0, y0, z1),
    rbf: new THREE.Vector3(x1, y0, z1),
    rbb: new THREE.Vector3(x1, y0, z0),
    lbb: new THREE.Vector3(x0, y0, z0),
    ltf: new THREE.Vector3(x0, y1, z1),
    rtf: new THREE.Vector3(x1, y1, z1),
    rtb: new THREE.Vector3(x1, y1, z0),
    ltb: new THREE.Vector3(x0, y1, z0)
  };

  const faces: FaceSpec[] = [
    { name: 'front', points: [p.lbf, p.rbf, p.rtf, p.ltf] },
    { name: 'back', points: [p.rbb, p.lbb, p.ltb, p.rtb] },
    { name: 'left', points: [p.lbb, p.lbf, p.ltf, p.ltb] },
    { name: 'right', points: [p.rbf, p.rbb, p.rtb, p.rtf] },
    { name: 'top', points: [p.ltf, p.rtf, p.rtb, p.ltb] },
    { name: 'bottom', points: [p.lbb, p.rbb, p.rbf, p.lbf] }
  ];

  for (const face of faces) group.add(createFaceMesh(face, materialColor));

  const edgePoints = [
    p.lbf, p.rbf, p.rbf, p.rbb, p.rbb, p.lbb, p.lbb, p.lbf,
    p.ltf, p.rtf, p.rtf, p.rtb, p.rtb, p.ltb, p.ltb, p.ltf,
    p.lbf, p.ltf, p.rbf, p.rtf, p.rbb, p.rtb, p.lbb, p.ltb
  ];
  const edgeSkeleton = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(edgePoints),
    new THREE.LineBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.95 })
  );
  edgeSkeleton.userData.edgeSkeleton = true;
  group.add(edgeSkeleton);
  return group;
}

function createFaceMesh(face: FaceSpec, materialColor?: string): THREE.Mesh {
  const geometry = new THREE.BufferGeometry().setFromPoints([face.points[0], face.points[1], face.points[2], face.points[3]]);
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: materialColor ?? 0xf59e0b, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide, transparent: true, opacity: materialColor ? 0.9 : 0.62 })
  );
  mesh.userData.boxFace = face.name;
  return mesh;
}
