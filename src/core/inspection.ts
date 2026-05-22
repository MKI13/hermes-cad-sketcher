import { entityBoundingBox, formatMillimeters, type Entity } from './model';
import { add, bbox, rotateAroundZ, vec, type Vec3 } from './geometry';

export type InspectionMetric = Readonly<{
  label: string;
  value: string;
}>;

export type EntityInspection = Readonly<{
  id: string;
  type: Entity['type'];
  title: string;
  metrics: InspectionMetric[];
  boundingBox: ReturnType<typeof entityBoundingBox>;
}>;

export function inspectEntity(entity: Entity): EntityInspection {
  const boundingBox = inspectableBoundingBox(entity);
  const baseMetrics: InspectionMetric[] = [
    { label: 'Bounding Box Min', value: formatVector(boundingBox.min) },
    { label: 'Bounding Box Größe', value: formatVector(boundingBox.size) }
  ];

  if (entity.type === 'edge') {
    return {
      id: entity.id,
      type: entity.type,
      title: 'Linie',
      metrics: [
        { label: 'Länge', value: formatMillimeters(distanceFromBoxDiagonal(boundingBox.size)) },
        { label: 'Start', value: formatVector(entity.start) },
        { label: 'Ende', value: formatVector(entity.end) },
        ...baseMetrics
      ],
      boundingBox
    };
  }

  if (entity.type === 'face') {
    return {
      id: entity.id,
      type: entity.type,
      title: 'Rechteck/Fläche',
      metrics: [
        { label: 'Breite', value: formatMillimeters(boundingBox.size.x) },
        { label: 'Tiefe', value: formatMillimeters(boundingBox.size.y) },
        ...baseMetrics
      ],
      boundingBox
    };
  }

  return {
    id: entity.id,
    type: entity.type,
    title: 'Körper',
    metrics: [
      { label: 'Breite', value: formatMillimeters(entity.width) },
      { label: 'Tiefe', value: formatMillimeters(entity.depth) },
      { label: 'Höhe', value: formatMillimeters(entity.height) },
      { label: 'Rotation Z', value: formatDegrees(entity.rotationZ) },
      ...baseMetrics
    ],
    boundingBox
  };
}

export function formatVector(vector: Vec3): string {
  return `${formatNumber(vector.x)} / ${formatNumber(vector.y)} / ${formatNumber(vector.z)} mm`;
}

function inspectableBoundingBox(entity: Entity) {
  if (entity.type !== 'box' || entity.rotationZ === 0) return entityBoundingBox(entity);
  return bbox(boxWorldPoints(entity));
}

function boxWorldPoints(entity: Extract<Entity, { type: 'box' }>): Vec3[] {
  const localPoints = [
    vec(0, 0, 0),
    vec(entity.width, 0, 0),
    vec(entity.width, entity.depth, 0),
    vec(0, entity.depth, 0),
    vec(0, 0, entity.height),
    vec(entity.width, 0, entity.height),
    vec(entity.width, entity.depth, entity.height),
    vec(0, entity.depth, entity.height)
  ];
  const center = add(entity.origin, vec(entity.width / 2, entity.depth / 2, 0));
  return localPoints.map((point) => rotateAroundZ(add(entity.origin, point), entity.rotationZ, center));
}

function formatDegrees(radians: number): string {
  return `${formatNumber((radians * 180) / Math.PI)}°`;
}

function distanceFromBoxDiagonal(vector: Vec3): number {
  return Math.hypot(vector.x, vector.y, vector.z);
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(2)));
}
