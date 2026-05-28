# Hermes CAD Session-Handoff — 2026-05-28

## Zweck
Sicherer Übergabestand für eine neue Session. Keine Secrets, Tokens oder Zugangsdaten enthalten.

## Besprochen und entschieden

- Hermes CAD soll SketchUp-ähnlicher werden: große freie Zeichenfläche, kompakte Werkzeugleisten, rechter Hermes Tray, keine übergroßen blockierenden Panels.
- Der Agent soll nicht heimlich per Maus im Programm herumzeichnen. Er soll normale Chat-Anfragen in eine sichere Hermes-CAD-Befehlsschicht übersetzen. Das ist keine echte SketchUp-Ruby-API, sondern eine kontrollierte CAD-DSL.
- Fertige, sichere Befehle darf der Agent ausführen. Bei größeren oder unklaren Aktionen soll er zuerst verständlich zeigen, was er verstanden hat, und bei Bedarf eine Vorschau/Bestätigung ermöglichen.
- Material-/Texturwünsche sollen im ersten Schritt echte CAD-Materialzuweisungen/Farben setzen. KI-generierte Bild-/PBR-Texturen bleiben ein späterer Ausbauschritt.
- Kreis/Durchmesser-Befehle sind noch nicht sauber als echte CAD-Geometrie fertig. Nächster Schritt wäre: `circle(...)`/Kreisfläche mit Durchmesser, Einheitenumrechnung und Tests.
- Die alte Genauigkeit war unzureichend: Punkte durften nicht automatisch auf ein grobes Raster gezwungen werden, wenn Marios eigentlich stufenlos oder auf einer Kante zeichnen will.
- Snap-Verhalten soll CAD-/SketchUp-ähnlich sein: Endpunkte und Mittelpunkte bevorzugen, zusätzlich direkt auf vorhandene Kanten rasten, sonst freie Punkte nicht auf Raster zwingen.
- Der feste 10-cm-Raster passte nicht für Möbel-/Detailarbeit. Raster muss konfigurierbar sein und abschaltbar bleiben.
- Der Untergrund soll flach und grau mit Horizont wirken, nicht wie ein industrielles Spezial-CAD-Raster.
- Zoom muss für Detailarbeit sehr nah an Kanten heran und für große Zeichnungen weit heraus können.

## Umgesetzte Funktionen in Hermes CAD Sketcher

- Agent/Bridge und CAD-Command-Runner unterstützen Material-/Texturbefehle wie `material(...)` und `texture(...)`.
- Snap wurde verbessert:
  - Endpunkte und Mittelpunkte bleiben bevorzugt.
  - Kanten-Snap wurde ergänzt.
  - Wenn kein sinnvoller Fangpunkt vorhanden ist, bleibt der Punkt frei statt automatisch auf Raster zu springen.
  - Achsenführung nutzt den echten Abstand statt heimlich auf Rastermaße zu runden.
- Viewport-Basis wurde verbessert:
  - flacher grauer Arbeitsuntergrund,
  - Horizont-/Randlinie,
  - konfigurierbarer Rasterabstand im rechten Tray unter „Anzeige / Styles“,
  - Rasterlinien können ausgeschaltet werden,
  - Zoom-Grenzen wurden deutlich erweitert.
- Tests wurden angepasst/ergänzt für Snap, Kanten-Snap, Raster/Surface und UI-Anzeige.

## Verifikation

Letzter geprüfter Stand:

- `npm run check` auf `newpc` im Repository `~/hermes-cad-sketcher` erfolgreich.
- Ergebnis: 52 Testdateien, 334 Tests bestanden.
- TypeScript-/Vite-Build erfolgreich.
- `hermes-cad-sketcher.service` läuft auf `newpc`.
- Port `5173` ist offen.
- Live-App unter `http://192.168.178.27:5173/` antwortet mit HTTP 200.
- Browser-Snapshot bestätigt, dass „Rasterabstand mm“ und „Flacher grauer Untergrund mit Horizont“ in der App vorhanden sind. Der Tool-Browser selbst hatte WebGL-Kontextfehler, was bereits als Headless-/Sandbox-Limit bekannt ist, nicht als App-Beweis gegen die UI.

## Repo-Stand vor finalem Speichern

Repository auf `newpc`:

- Pfad: `/home/mariosk/hermes-cad-sketcher`
- Branch: `local/live-cad-review`
- Remote-Basis: `origin/main`
- Vor finalem Speichern: Branch war lokal voraus und hatte uncommitted Änderungen.
- Keine Pushes oder Main-Merges ohne Marios-Freigabe.

## Nächste sinnvolle Schritte

1. Echte Kreisfunktion bauen:
   - `circle(...)`, Durchmesser/Radius, Einheiten wie cm/m/mm erkennen,
   - Kreis oder Kreisfläche als echte CAD-Geometrie erzeugen,
   - Agent soll Sätze wie „Mach einen Kreis mit 30 cm Durchmesser“ zuverlässig ausführen.
2. Vorschau-/Bestätigungsfluss für Agent-Kommandos:
   - Agent zeigt geplante Geometrie verständlich an,
   - Programm kann Preview zeigen,
   - Bestätigung führt aus.
3. Zoom und Fangverhalten live mit echter GPU/Brave auf newpc visuell prüfen, weil der Tool-Browser keinen WebGL-Kontext bekam.
4. Weitere SketchUp-ähnliche Präzisionsarbeit:
   - wirklich genaue Auswahl auf Kanten/Flächen,
   - eventuell Fangpunkt-Toleranz abhängig von Zoomstufe,
   - bessere sichtbare Fanghinweise.

## Bedienhinweis für Marios

Im rechten Tray unter „Anzeige / Styles“:

- Rasterabstand mm ändern, z. B. `10`, `25`, `100`, `500`, `1000`.
- Rasterlinien bei Bedarf ausschalten.
- Für Detailarbeit nah an Kanten heranzoomen und mit Kanten-/Endpunkt-/Midpoint-Snap arbeiten.
