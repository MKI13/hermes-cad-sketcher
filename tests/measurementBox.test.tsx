import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MeasurementBox } from '../src/ui/MeasurementBox';

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

    expect(markup).toContain('Aktive Maßeingabe');
    expect(markup).toContain('value="1200"');
    expect(markup).toContain('placeholder="1200 · 1200,600 · &lt;100,0,0&gt; · 45°"');
    expect(markup).toContain('Linie: 1200 mm');
    expect(markup).toContain('Bereit');
    expect(markup).toContain('type="submit"');
    expect(markup).toContain('Übernehmen');
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
