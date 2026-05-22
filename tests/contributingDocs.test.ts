import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function read(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

describe('agent-friendly contribution surface', () => {
  it('documents a contributor workflow with tests, CAD scope limits, and coordination rules', async () => {
    const contributing = await read('CONTRIBUTING.md');

    expect(contributing).toContain('npm ci');
    expect(contributing).toContain('npm run check');
    expect(contributing).toContain('npm run smoke:browser');
    expect(contributing).toContain('dev/v0.2');
    expect(contributing).toContain('Millimeter');
    expect(contributing).toContain('Keine native DWG- oder SKP-Unterstützung behaupten');
    expect(contributing).toContain('Keine SketchUp-Ruby-Plugin-Kompatibilität');
    expect(contributing).toContain('Issues');
    expect(contributing).toContain('Acceptance Criteria');
    expect(contributing).toContain('Agenten');
  });

  it('provides an agent task issue template with acceptance and verification fields', async () => {
    const template = await read('.github/ISSUE_TEMPLATE/agent-task.md');

    expect(template).toContain('name: Agent task');
    expect(template).toContain('labels: agent-friendly');
    expect(template).toContain('## Ziel');
    expect(template).toContain('## Scope');
    expect(template).toContain('## Acceptance Criteria');
    expect(template).toContain('## Verification');
    expect(template).toContain('npm run check');
    expect(template).toContain('CAD-/Dateiformat-Grenzen');
    expect(template).toContain('Keine echten Kunden- oder privaten Dateien');
  });

  it('provides a bug report template that asks for repro steps and CAD/file-format boundaries', async () => {
    const template = await read('.github/ISSUE_TEMPLATE/bug-report.md');

    expect(template).toContain('name: Bug report');
    expect(template).toContain('## Schritte zur Reproduktion');
    expect(template).toContain('## Erwartetes Verhalten');
    expect(template).toContain('## Tatsächliches Verhalten');
    expect(template).toContain('## Betroffene CAD-/Dateiformat-Grenze');
    expect(template).toContain('synthetische');
    expect(template).toContain('npm run check');
  });
});
