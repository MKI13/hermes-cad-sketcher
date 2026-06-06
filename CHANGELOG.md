# Changelog

Alle wichtigen Änderungen an Hermes CAD Sketcher werden hier festgehalten.

## Unreleased

### Added

- Function-Parity-Agent-Plan als verbindliche Arbeitsregel integriert: sichtbare Funktionen müssen `ready`, `experimental` oder `planned` sein und dürfen keine Deko-Funktionen sein.
- Referenzpaket `hermes_cad_function_parity_agent_plan` unter `docs/reference-packs/` abgelegt.
- Release-/Rollback-Notiz für den Function-Parity-Grundlagen-Slice ergänzt.

### Changed

- Workbench-Statusmodell um `experimental` erweitert, damit teilweise vorhandene Funktionen ehrlich markiert werden können.
- Kamera-Navigation, Komponenten, Tags und Materialien werden im Workbench-Ribbon nicht mehr als fertig behauptet, wenn der Ribbon-Button selbst keine vollständige direkte Aktion ausführt.
