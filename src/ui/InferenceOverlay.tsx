import { type CSSProperties } from 'react';
import { describeInference, inferenceLabel, type Inference } from '../core/inference';

export type OverlayPoint = { x: number; y: number };

export type InferenceOverlayProps = {
  cursor: OverlayPoint;
  inference?: Inference;
  snapPoint?: OverlayPoint;
  axisLine?: { start: OverlayPoint; end: OverlayPoint };
};

export function InferenceOverlay({ cursor, inference, snapPoint, axisLine }: InferenceOverlayProps) {
  if (!inference || inference.kind === 'free') return null;
  const label = inferenceLabel(inference.kind);
  const labelStyle: CSSProperties = { left: cursor.x + 14, top: cursor.y - 18 };
  const axisLineStyle = axisLine ? axisLineToStyle(axisLine) : undefined;
  return (
    <>
      {'axis' in inference && axisLineStyle && (
        <div
          className={`inference-axis-line inference-axis-line--${inference.axis}`}
          data-axis={inference.axis}
          data-color={inference.axisLine.color}
          aria-hidden="true"
          style={axisLineStyle}
        />
      )}
      {'entityId' in inference && snapPoint && (
        <div
          className="snap-marker"
          aria-hidden="true"
          style={{ left: snapPoint.x, top: snapPoint.y }}
        />
      )}
      <div className="snap-cue" aria-label={`Fanghinweis ${label}`} title={describeInference(inference)} style={labelStyle}>
        {label}
      </div>
    </>
  );
}

function axisLineToStyle(axisLine: { start: OverlayPoint; end: OverlayPoint }): CSSProperties {
  const dx = axisLine.end.x - axisLine.start.x;
  const dy = axisLine.end.y - axisLine.start.y;
  return {
    left: axisLine.start.x,
    top: axisLine.start.y,
    width: Math.hypot(dx, dy),
    transform: `rotate(${Math.atan2(dy, dx)}rad)`
  };
}
