import React from 'react';
import { TrayPanel } from './TrayPanel';

export const RIGHT_TRAY_STORAGE_KEY = 'hermes-cad-right-tray';

export type RightTrayPanelId =
  | 'entity-info'
  | 'outliner'
  | 'components'
  | 'tags'
  | 'materials'
  | 'scenes'
  | 'display-styles'
  | 'hermes-agent';

export type RightTrayPanelDefinition = {
  id: RightTrayPanelId;
  title: string;
  defaultOpen: boolean;
};

export type RightTrayState = {
  open: boolean;
  collapsedPanelIds: RightTrayPanelId[];
};

export const RIGHT_TRAY_PANEL_DEFINITIONS: RightTrayPanelDefinition[] = [
  { id: 'entity-info', title: 'Entity Info / Inspector', defaultOpen: true },
  { id: 'outliner', title: 'Outliner', defaultOpen: true },
  { id: 'components', title: 'Komponenten', defaultOpen: false },
  { id: 'tags', title: 'Tags', defaultOpen: false },
  { id: 'materials', title: 'Materialien', defaultOpen: true },
  { id: 'scenes', title: 'Szenen', defaultOpen: false },
  { id: 'display-styles', title: 'Anzeige / Styles', defaultOpen: false },
  { id: 'hermes-agent', title: 'Hermes Agent', defaultOpen: false }
];

const rightTrayPanelIds = new Set(RIGHT_TRAY_PANEL_DEFINITIONS.map((panel) => panel.id));

export function sanitizeRightTrayState(value: unknown): RightTrayState {
  if (!value || typeof value !== 'object') return { open: true, collapsedPanelIds: [] };
  const candidate = value as { open?: unknown; collapsedPanelIds?: unknown };
  const collapsedPanelIds = Array.isArray(candidate.collapsedPanelIds)
    ? Array.from(new Set(candidate.collapsedPanelIds.filter((id): id is RightTrayPanelId => typeof id === 'string' && rightTrayPanelIds.has(id as RightTrayPanelId))))
    : [];
  return {
    open: typeof candidate.open === 'boolean' ? candidate.open : true,
    collapsedPanelIds
  };
}

export type RightTrayPanelContent = Partial<Record<RightTrayPanelId, React.ReactNode>>;
export type RightTrayPanelIcons = Partial<Record<RightTrayPanelId, React.ReactNode>>;

export type RightTrayProps = {
  state: RightTrayState;
  onOpenChange: (open: boolean) => void;
  onPanelToggle: (id: RightTrayPanelId) => void;
  contents: RightTrayPanelContent;
  icons?: RightTrayPanelIcons;
};

export function RightTray({ state, onOpenChange, onPanelToggle, contents, icons = {} }: RightTrayProps) {
  return (
    <aside
      className={state.open ? 'right-tray open' : 'right-tray collapsed'}
      aria-label="Rechter Hermes Tray"
      data-cad-surface-blocking="false"
      data-legacy-label="Rechte Default-Tray-Leiste"
    >
      <button
        type="button"
        className="right-tray-toggle"
        aria-label={state.open ? 'Rechten Hermes Tray zuklappen' : 'Rechten Hermes Tray aufklappen'}
        title={state.open ? 'Hermes Tray zuklappen' : 'Hermes Tray aufklappen'}
        onClick={() => onOpenChange(!state.open)}
      >
        {state.open ? '›' : '‹'}
      </button>
      {state.open && (
        <div className="right-tray-content">
          <header className="right-tray-title">
            <strong>Hermes Tray</strong>
            <span>einklappbare Panels · Viewport bleibt Priorität</span>
          </header>
          {RIGHT_TRAY_PANEL_DEFINITIONS.map((panel) => {
            const collapsed = state.collapsedPanelIds.includes(panel.id);
            return (
              <TrayPanel
                key={panel.id}
                id={panel.id}
                title={panel.title}
                icon={icons[panel.id]}
                collapsed={collapsed}
                className={panel.id === 'materials' ? 'materials-section' : undefined}
                onToggle={(id) => onPanelToggle(id as RightTrayPanelId)}
              >
                {contents[panel.id] ?? <p>{panel.title} ist vorbereitet.</p>}
              </TrayPanel>
            );
          })}
        </div>
      )}
    </aside>
  );
}
