import type { EntityInspection } from '../core/inspection';

type InspectorPanelProps = {
  inspection?: EntityInspection;
};

export function InspectorPanel({ inspection }: InspectorPanelProps) {
  if (!inspection) {
    return (
      <section className="inspector-panel" aria-label="Inspektor">
        <strong>Inspektor</strong>
        <p>Kein Element ausgewählt.</p>
      </section>
    );
  }

  return (
    <section className="inspector-panel" aria-label="Inspektor">
      <strong>Inspektor</strong>
      <p>{inspection.title} · {inspection.id}</p>
      <dl>
        {inspection.metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
