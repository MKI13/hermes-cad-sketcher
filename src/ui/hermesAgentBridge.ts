export const HERMES_CAD_BRIDGE_URL = '/hermes-cad/agent';
export const HERMES_CAD_IDENTITY_URL = '/hermes-cad/identity';

export type HermesBridgeIdentity = Readonly<{
  user: string;
  hostname: string;
  profile: string;
}>;

export type HermesCadAgentRequest = Readonly<{
  schema: 'hermes-cad-agent-request/v1';
  program: 'Hermes CAD Sketching Programm';
  mode: 'drawing';
  userPolicy: 'local-pc-agent-only';
  ownerId: string;
  message: string;
  selectedId?: string;
  modelSnapshot: unknown;
}>;

export type HermesCadAgentResponse = Readonly<{
  ok: boolean;
  message: string;
  commands?: string;
}>;

export function isLoopbackBridgeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost');
  } catch {
    return false;
  }
}

export function isSameOriginBridgePath(url: string): boolean {
  return url === HERMES_CAD_BRIDGE_URL || url === HERMES_CAD_IDENTITY_URL;
}

export function isAllowedHermesCadBridgeUrl(url: string): boolean {
  return isSameOriginBridgePath(url) || isLoopbackBridgeUrl(url);
}

export function buildHermesCadAgentRequest(input: { ownerId: string; message: string; selectedId?: string; modelSnapshot: unknown }): HermesCadAgentRequest {
  return {
    schema: 'hermes-cad-agent-request/v1',
    program: 'Hermes CAD Sketching Programm',
    mode: 'drawing',
    userPolicy: 'local-pc-agent-only',
    ownerId: input.ownerId,
    message: input.message,
    selectedId: input.selectedId,
    modelSnapshot: input.modelSnapshot
  };
}

export function summarizeHermesBridgeIdentity(identity: HermesBridgeIdentity): string {
  return `Lokaler Hermes Agent: ${identity.user}@${identity.hostname} · Profil ${identity.profile} · Zeichnungsmodus`;
}

export function shouldUseLocalCadFallback(message: string): boolean {
  const normalized = message.trim().replace(/^\s*(agent|hermes|ai)\s*:\s*/i, '');
  if (/^(ruby|cad|console)\s*:/i.test(message)) return true;
  if (/^[\p{L}_][\p{L}\p{N}_]*\s*\(/u.test(normalized)) return true;
  const lower = normalized.toLowerCase();
  return /\b(erstelle|zeichne|create|add)\b.*\b(box|körper|koerper|rechteck|rectangle|linie|line)\b/.test(lower)
    || /\b(verschiebe|move|drehe|rotate|extrudiere|extrude|lösche|loesche|delete)\b.*\b(auswahl|selected)\b/.test(lower);
}

export function shouldFallbackAfterAgentResponse(response: HermesCadAgentResponse, message: string): boolean {
  return !response.ok && !response.commands && shouldUseLocalCadFallback(message);
}

export function loadOrCreateOwnerId(storage: Pick<Storage, 'getItem' | 'setItem'>, key = 'hermes-cad-local-owner-id'): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const generated = `owner-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  storage.setItem(key, generated);
  return generated;
}

export async function probeHermesCadBridge(fetcher: typeof fetch = fetch): Promise<HermesBridgeIdentity> {
  const response = await fetcher(HERMES_CAD_IDENTITY_URL, { method: 'GET' });
  if (!response.ok) throw new Error('Lokale Hermes-CAD-Bridge ist nicht erreichbar.');
  return await response.json() as HermesBridgeIdentity;
}

export async function sendHermesCadAgentRequest(request: HermesCadAgentRequest, fetcher: typeof fetch = fetch): Promise<HermesCadAgentResponse> {
  if (!isAllowedHermesCadBridgeUrl(HERMES_CAD_BRIDGE_URL)) throw new Error('Hermes CAD nutzt nur die lokale Bridge des CAD-App-Hosts.');
  const response = await fetcher(HERMES_CAD_BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw new Error(`Hermes Agent Bridge antwortet mit HTTP ${response.status}.`);
  return await response.json() as HermesCadAgentResponse;
}
