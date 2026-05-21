import * as THREE from 'three';
import { type Entity } from '../core/model';

export function entityToObject(entity: Entity): THREE.Object3D {
  if (entity.type === 'edge') {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(entity.start.x, entity.start.z, entity.start.y), new THREE.Vector3(entity.end.x, entity.end.z, entity.end.y)]);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x0f172a }));
  }
  if (entity.type === 'face') {
    const shape = new THREE.Shape(entity.vertices.map((v) => new THREE.Vector2(v.x, v.y)));
    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }
  const geometry = new THREE.BoxGeometry(entity.width, entity.height, entity.depth);
  const material = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7, metalness: 0.05 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(entity.origin.x + entity.width / 2, entity.origin.z + entity.height / 2, entity.origin.y + entity.depth / 2);
  mesh.rotation.y = entity.rotationZ;
  return mesh;
}
