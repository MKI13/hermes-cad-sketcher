# Hermes CAD Versionseintrag – SketchUp Upgrade Pack

Datum: 2026-06-06
Typ: lokale geprüfte Upgrade-Pack-Version auf `newpc`

## Versionierungsstand

- Arbeitsbranch: `local/sketchup-upgrade-pack-20260606-181701`
- Sicherheits-Checkpoint vor Paket: `0b7c675c9d2e49e7968cb0281ea98056ce2e4a17`
- Rollback-Tag: `rollback/pre-sketchup-upgrade-pack-20260606-181701`
- Backup-Verzeichnis: `/home/mariosk/hermes-cad-sketcher-backups/pre-upgrade-pack-20260606-181701`

## Enthalten

- ZIP-Referenzpaket unter `docs/reference-packs/hermes-cad-sketchup-upgrade-pack/`.
- Recherche, Audit und ADR für Komponenten/Definitionen/Instanzen.
- Kernmodell mit `ComponentDefinition`, geteilter Definition beim Duplizieren, `Make Unique`, `Explode` und Definition-Sync im offenen Kontext.
- UI-Hinweise und Aktionen im Komponenten-Tray.

## Rollback

Auf `newpc`:

```bash
cd ~/hermes-cad-sketcher
git switch local/sketchup-upgrade-pack-20260606-181701
git reset --hard 0b7c675c9d2e49e7968cb0281ea98056ce2e4a17
git clean -fd
systemctl --user restart hermes-cad-sketcher.service
```

Alternativ liegen Vorher-Patches und ungetrackte Dateien im Backup-Verzeichnis.

## Remote/Main-Regel

Nicht auf `main` gepusht. Nicht gemergt. Diese Version ist lokal auf `newpc` geprüft und live geschaltet.
