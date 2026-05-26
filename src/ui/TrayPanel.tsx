import React from 'react';

export type TrayPanelProps = {
  id: string;
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onToggle: (id: string) => void;
};

export function TrayPanel({ id, title, collapsed, children, icon, className, onToggle }: TrayPanelProps) {
  return (
    <section
      className={['right-tray-panel', collapsed ? 'collapsed' : 'open', className ?? ''].filter(Boolean).join(' ')}
      data-tray-panel-id={id}
      aria-label={`Tray Panel ${title}`}
    >
      <header className="right-tray-panel-header">
        <strong>{icon}{title}</strong>
        <button
          type="button"
          className="right-tray-panel-toggle"
          aria-label={`Panel ${title} ${collapsed ? 'ausklappen' : 'einklappen'}`}
          title={collapsed ? `${title} ausklappen` : `${title} einklappen`}
          onClick={() => onToggle(id)}
        >
          {collapsed ? '+' : '−'}
        </button>
      </header>
      {!collapsed && <div className="right-tray-panel-body">{children}</div>}
    </section>
  );
}
