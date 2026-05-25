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
    expect(contributing).toContain('Claim before coding');
    expect(contributing).toContain('claimed');
    expect(contributing).toContain('Claimed by <agent/person> at <UTC time>');
    expect(contributing).toContain('Do not start code changes before the claim comment is visible');
    expect(contributing).toContain('release the claim');
  });

  it('keeps the agent plan list split into done, partially implemented, and still-open work', async () => {
    const agents = await read('AGENTS.md');
    const auditPlan = await read('docs/plans/2026-05-24-function-audit-and-decisions.md');

    expect(agents).toContain('## Teilweise umgesetzte Funktionen mit offenem Ausbau');
    expect(agents).toContain('## Geplante Erweiterungen');
    expect(agents).toContain('Axis-aligned Rechteck-Extrusion');
    expect(agents).toContain('Freie und rotierte Flächenextrusion');
    expect(auditPlan).toContain('Punkt 11 abgeschlossen');
    expect(auditPlan).toContain('done, partial/core-only, and still missing');
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

  it('keeps GitHub issue templates free of trailing whitespace', async () => {
    const templates = [
      '.github/ISSUE_TEMPLATE/agent-task.md',
      '.github/ISSUE_TEMPLATE/bug-report.md',
    ];

    for (const path of templates) {
      const lines = (await read(path)).split('\n');
      const trailingWhitespaceLines = lines
        .map((line, index) => ({ line, lineNumber: index + 1 }))
        .filter(({ line }) => /[ \t]$/.test(line))
        .map(({ lineNumber }) => lineNumber);

      expect(trailingWhitespaceLines, `${path} trailing whitespace lines`).toEqual([]);
    }
  });
});
