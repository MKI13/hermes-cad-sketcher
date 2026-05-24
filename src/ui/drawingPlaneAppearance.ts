import type { DrawingPlane } from '../core/model';

export type DrawingPlaneAppearance = Readonly<{
  label: string;
  axisNames: readonly [string, string];
  colors: readonly [string, string];
  className: string;
  helperText: string;
}>;

const AXIS_COLORS = {
  x: '#dc2626',
  y: '#16a34a',
  z: '#2563eb'
} as const;

const APPEARANCES: Record<DrawingPlane, DrawingPlaneAppearance> = {
  xy: {
    label: 'Grundfläche X/Y',
    axisNames: ['X rot', 'Y grün'],
    colors: [AXIS_COLORS.x, AXIS_COLORS.y],
    className: 'drawing-plane-xy',
    helperText: 'Aktive Ebene: X rot und Y grün. Extrusion geht entlang Z blau.'
  },
  xz: {
    label: 'Vertikal X/Z',
    axisNames: ['X rot', 'Z blau'],
    colors: [AXIS_COLORS.x, AXIS_COLORS.z],
    className: 'drawing-plane-xz',
    helperText: 'Aktive Ebene: X rot und Z blau. Extrusion geht entlang Y grün.'
  },
  yz: {
    label: 'Vertikal Y/Z',
    axisNames: ['Y grün', 'Z blau'],
    colors: [AXIS_COLORS.y, AXIS_COLORS.z],
    className: 'drawing-plane-yz',
    helperText: 'Aktive Ebene: Y grün und Z blau. Extrusion geht entlang X rot.'
  }
};

export function drawingPlaneAppearance(plane: DrawingPlane): DrawingPlaneAppearance {
  return APPEARANCES[plane];
}
