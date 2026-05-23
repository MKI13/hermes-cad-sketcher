import { describe, expect, it } from 'vitest';
import { buildHermesCadAgentRequest, HERMES_CAD_BRIDGE_URL, isAllowedHermesCadBridgeUrl, isLoopbackBridgeUrl, isSameOriginBridgePath, shouldUseLocalCadFallback, summarizeHermesBridgeIdentity } from '../src/ui/hermesAgentBridge';

describe('Hermes CAD local agent bridge', () => {
  it('uses the same CAD app origin so a second PC can reach the bridge through the serving PC', () => {
    expect(HERMES_CAD_BRIDGE_URL).toBe('/hermes-cad/agent');
    expect(isSameOriginBridgePath(HERMES_CAD_BRIDGE_URL)).toBe(true);
    expect(isAllowedHermesCadBridgeUrl(HERMES_CAD_BRIDGE_URL)).toBe(true);
    expect(isLoopbackBridgeUrl('http://127.0.0.1:8766/hermes-cad/agent')).toBe(true);
    expect(isLoopbackBridgeUrl('http://192.168.178.21:8766/hermes-cad/agent')).toBe(false);
  });

  it('builds a drawing-mode request with program context and without browser API secrets', () => {
    const request = buildHermesCadAgentRequest({
      ownerId: 'pc-owner-123',
      message: 'erstelle einen Korpus',
      selectedId: 'box_1',
      modelSnapshot: { unit: 'mm', entities: [] }
    });

    expect(request.program).toBe('Hermes CAD Sketching Programm');
    expect(request.mode).toBe('drawing');
    expect(request.ownerId).toBe('pc-owner-123');
    expect(request.userPolicy).toBe('local-pc-agent-only');
    expect(JSON.stringify(request)).not.toMatch(/api[_-]?key|bearer|token/i);
  });

  it('summarizes the connected local Hermes identity for the UI', () => {
    expect(summarizeHermesBridgeIdentity({ user: 'marios', hostname: 'Marios-Hermes', profile: 'default' })).toBe('Lokaler Hermes Agent: marios@Marios-Hermes · Profil default · Zeichnungsmodus');
  });

  it('keeps normal Telegram-like chat on the Hermes bridge instead of falling back to the CAD parser', () => {
    expect(shouldUseLocalCadFallback('Hallo Hermes bist du bereit eine Test zu machen?')).toBe(false);
    expect(shouldUseLocalCadFallback('erstelle box 0 0 0 600 400 200')).toBe(true);
    expect(shouldUseLocalCadFallback('ruby: line(0, 0, 0, 100, 0, 0)')).toBe(true);
  });

  it('uses the offline CAD parser only for explicit CAD commands when the agent returns a failure', async () => {
    const { shouldFallbackAfterAgentResponse } = await import('../src/ui/hermesAgentBridge');

    expect(shouldFallbackAfterAgentResponse({ ok: false, message: 'Modell nicht verfügbar', commands: '' }, 'erstelle box 0 0 0 600 400 200')).toBe(true);
    expect(shouldFallbackAfterAgentResponse({ ok: false, message: 'Modell nicht verfügbar', commands: '' }, 'Hallo Hermes')).toBe(false);
    expect(shouldFallbackAfterAgentResponse({ ok: true, message: 'ok', commands: '' }, 'erstelle box 0 0 0 600 400 200')).toBe(false);
  });
});
