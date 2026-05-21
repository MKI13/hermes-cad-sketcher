export type Vec3 = Readonly<{ x: number; y: number; z: number }>;

export const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };

export function vec(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return vec(a.x + b.x, a.y + b.y, a.z + b.z);
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return vec(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function scale(a: Vec3, factor: number): Vec3 {
  return vec(a.x * factor, a.y * factor, a.z * factor);
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function length(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

export function distance(a: Vec3, b: Vec3): number {
  return length(sub(a, b));
}

export function rotateAroundZ(point: Vec3, angleRadians: number, origin: Vec3 = ORIGIN): Vec3 {
  const translated = sub(point, origin);
  const c = Math.cos(angleRadians);
  const s = Math.sin(angleRadians);
  return add(vec(translated.x * c - translated.y * s, translated.x * s + translated.y * c, translated.z), origin);
}

export function bbox(points: Vec3[]): { min: Vec3; max: Vec3; size: Vec3 } {
  if (points.length === 0) return { min: ORIGIN, max: ORIGIN, size: ORIGIN };
  const min = vec(
    Math.min(...points.map((p) => p.x)),
    Math.min(...points.map((p) => p.y)),
    Math.min(...points.map((p) => p.z))
  );
  const max = vec(
    Math.max(...points.map((p) => p.x)),
    Math.max(...points.map((p) => p.y)),
    Math.max(...points.map((p) => p.z))
  );
  return { min, max, size: sub(max, min) };
}

export function almostEqual(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) <= epsilon;
}
