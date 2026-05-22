import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaceExtrudePanel, parseExtrudeHeight, validateExtrudableFace } from '../src/ui/FaceExtrudePanel';
import { vec } from '../src/core/geometry';

describe('FaceExtrudePanel', () => {
  it('parses positive finite extrusion heights in millimeters', () => {
    expect(parseExtrudeHeight('300')).toEqual({ ok: true, height: 300 });
    expect(parseExtrudeHeight('25.5')).toEqual({ ok: true, height: 25.5 });
  });

  it('rejects empty, non-finite and non-positive extrusion heights', () => {
    expect(parseExtrudeHeight('').ok).toBe(false);
    expect(parseExtrudeHeight('NaN').ok).toBe(false);
    expect(parseExtrudeHeight('Infinity').ok).toBe(false);
    expect(parseExtrudeHeight('0').ok).toBe(false);
    expect(parseExtrudeHeight('-10').ok).toBe(false);
  });

  it('renders face extrusion controls for selected rectangles/faces', () => {
    const markup = renderToStaticMarkup(
      <FaceExtrudePanel
        disabled={false}
        selectedType="face"
        selectedFace={{ id: 'face_1', type: 'face', vertices: [vec(0, 0, 0), vec(100, 0, 0), vec(100, 50, 0), vec(0, 50, 0)] }}
        height="300"
        onHeightChange={() => undefined}
        onApply={() => undefined}
        statusMessage="Fläche zu Körper extrudiert"
      />
    );

    expect(markup).toContain('Fläche extrudieren');
    expect(markup).toContain('Extrusionshöhe in Millimeter');
    expect(markup).toContain('mm');
    expect(markup).toContain('Fläche zu Körper extrudiert');
  });

  it('disables applying invalid extrusion heights and shows an inline error', () => {
    const markup = renderToStaticMarkup(
      <FaceExtrudePanel
        disabled={false}
        selectedType="face"
        selectedFace={{ id: 'face_1', type: 'face', vertices: [vec(0, 0, 0), vec(100, 0, 0), vec(100, 50, 0), vec(0, 50, 0)] }}
        height="0"
        onHeightChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Extrusion braucht eine positive endliche Höhe in Millimeter.');
  });

  it('disables unsupported rotated or skewed faces before model mutation', () => {
    const rotatedFace = { id: 'face_rotated', type: 'face' as const, vertices: [vec(0, 0, 0), vec(70, 70, 0), vec(35, 105, 0), vec(-35, 35, 0)] };

    expect(validateExtrudableFace(rotatedFace, { ok: true, height: 300 })).toEqual({
      ok: false,
      error: 'Extrusion unterstützt im MVP nur axis-aligned Rechteckflächen.'
    });

    const markup = renderToStaticMarkup(
      <FaceExtrudePanel disabled={false} selectedType="face" selectedFace={rotatedFace} height="300" onHeightChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Extrusion unterstützt im MVP nur axis-aligned Rechteckflächen.');
  });

  it('disables degenerate and self-intersecting axis-aligned corner faces before model mutation', () => {
    const degenerateFace = { id: 'face_degenerate', type: 'face' as const, vertices: [vec(0, 0, 0), vec(0, 50, 0), vec(0, 50, 0), vec(0, 0, 0)] };
    const bowTieFace = { id: 'face_bow_tie', type: 'face' as const, vertices: [vec(0, 0, 0), vec(100, 50, 0), vec(100, 0, 0), vec(0, 50, 0)] };

    expect(validateExtrudableFace(degenerateFace, { ok: true, height: 300 })).toEqual({
      ok: false,
      error: 'Extrusion unterstützt im MVP nur axis-aligned Rechteckflächen.'
    });
    expect(validateExtrudableFace(bowTieFace, { ok: true, height: 300 })).toEqual({
      ok: false,
      error: 'Extrusion unterstützt im MVP nur axis-aligned Rechteckflächen.'
    });
  });
});
