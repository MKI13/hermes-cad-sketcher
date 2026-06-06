# Function-Parity-Agent-Plan Research Log — 2026-06-06

## Quelle

Marios stellte das Paket `hermes_cad_function_parity_agent_plan.zip` bereit. Es wurde als Arbeitsregelpaket für Hermes CAD übernommen und unter `docs/reference-packs/hermes_cad_function_parity_agent_plan/` archiviert.

## Relevante Regeln aus dem Paket

- Jede sichtbare Funktion muss einen Status haben: `ready`, `experimental` oder `planned`.
- Eine Funktion ist erst fertig, wenn sie Modelllogik, UI, Tests, Dokumentation, SketchUp-Verhaltensvergleich, Rollback-Hinweis und Versionierung hat.
- UI-Buttons ohne belastbare Aktion sind verboten, außer sie sind klar als geplant oder experimentell markiert.
- `CHANGELOG.md` muss existieren und gepflegt werden.
- `npm run check` bleibt Pflicht vor Commit/Push.
- Keine SketchUp-/Trimble-Icons, Logos, Texte, geschützten Layouts oder Code kopieren.
- Keine native SKP/DWG/STEP/IFC/Ruby-Kompatibilität behaupten, solange sie nicht wirklich implementiert und getestet ist.

## Hermes-CAD-Befund für diesen Slice

- `CHANGELOG.md` fehlte.
- `src/ui/workbenchLayout.ts` kannte nur `ready` und `planned`.
- Einige Workbench-Einträge waren als `ready` oder `planned` zu grob markiert, obwohl sie praktisch teilweise vorhanden sind, aber im Ribbon keine vollständige direkte Aktion besitzen.

## Ziel dieses Slices

Dieser Slice ist eine Grundlage, keine große Modellfunktion:

1. Referenzpaket im Repository ablegen.
2. `CHANGELOG.md` anlegen.
3. `AGENTS.md` um die Function-Parity-Regel ergänzen.
4. Workbench-Statusmodell um `experimental` erweitern.
5. Tests ergänzen, die verhindern, dass dekorative/disconnected Workbench-Einträge als `ready` markiert werden.

## Nicht-Ziel

- Kein Geometry-Kernel-Wechsel.
- Keine neue SKP/DWG/IFC/STEP-Unterstützung.
- Kein großes Rewrite der Command-Architektur in diesem Slice.
