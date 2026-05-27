import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MeasurementBox, resolveGlobalMeasurementKey } from '../src/ui/MeasurementBox';

function findElementByType(node: React.ReactNode, type: string): React.ReactElement<Record<string, unknown>> | undefined {
  if (!React.isValidElement(node)) return undefined;
  if (node.type === type) return node as React.ReactElement<Record<string, unknown>>;

  const props = node.props as { children?: React.ReactNode };
  for (const child of React.Children.toArray(props.children)) {
    const found = findElementByType(child, type);
    if (found) return found;
  }
  return undefined;
}

describe('MeasurementBox', () => {
  it('renders the active measurement plus a SketchUp-like command input', () => {
    const markup = renderToStaticMarkup(
      <MeasurementBox
        activeMeasurement="Linie: 1200 mm"
        value="1200"
        status="Bereit"
        onValueChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('Maße');
    expect(markup).toContain('value="1200"');
    expect(markup).toContain('placeholder="600,400,720 · 1200,600 · 1200 · &lt;100,0,0&gt; · 45°"');
    expect(markup).toContain('Linie: 1200 mm');
    expect(markup).toContain('Bereit');
    expect(markup).toContain('type="submit"');
    expect(markup).toContain('OK');
  });

  it('captures numeric measurement typing globally without stealing form fields or arrow locks', () => {
    expect(resolveGlobalMeasurementKey({ key: '4' }, '123')).toEqual({ type: 'value', value: '1234' });
    expect(resolveGlobalMeasurementKey({ key: ',' }, '1200')).toEqual({ type: 'value', value: '1200,' });
    expect(resolveGlobalMeasurementKey({ key: 'Backspace' }, '1200')).toEqual({ type: 'value', value: '120' });
    expect(resolveGlobalMeasurementKey({ key: 'Enter' }, '120')).toEqual({ type: 'apply' });
    expect(resolveGlobalMeasurementKey({ key: 'Escape' }, '120')).toEqual({ type: 'cancel' });
    expect(resolveGlobalMeasurementKey({ key: 'ArrowUp' }, '120')).toEqual({ type: 'ignore' });
    expect(resolveGlobalMeasurementKey({ key: '7', targetTagName: 'INPUT' }, '120')).toEqual({ type: 'ignore' });
    expect(resolveGlobalMeasurementKey({ key: '7', ctrlKey: true }, '120')).toEqual({ type: 'ignore' });
  });

  it('calls onApply when Enter is pressed inside the command input', () => {
    const apply = vi.fn();
    const element = MeasurementBox({
      activeMeasurement: 'noch keine Messung',
      value: '1200',
      onValueChange: () => undefined,
      onApply: apply
    });
    const input = findElementByType(element, 'input');
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    expect(input).toBeDefined();
    const onKeyDown = input?.props.onKeyDown as ((event: { key: string; preventDefault: () => void; stopPropagation: () => void }) => void) | undefined;
    onKeyDown?.({ key: 'Enter', preventDefault, stopPropagation });

    expect(apply).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });
});
