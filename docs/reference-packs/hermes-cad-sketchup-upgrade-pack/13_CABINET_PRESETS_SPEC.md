# Cabinet Presets Spec

Hermes CAD soll mit fertigen parametrischen Schrankvorlagen starten.

## Preset 1 – Einfacher Korpus

Parameter:

- width: 600 mm
- height: 720 mm
- depth: 560 mm
- side_thickness: 19 mm
- back_thickness: 8 mm
- shelf_count: 1
- door_count: 0/1/2
- material: Spanplatte 19 mm
- back_material: HDF 8 mm

Bauteile:

- Left Side
- Right Side
- Bottom
- Top
- Back
- Shelf optional
- Doors optional

## Preset 2 – Unterschrank mit Türen

Zusätzlich:

- plinth_height
- toe_kick_depth
- hinge_type
- handle_type
- door_overlay
- reveal_gap

## Preset 3 – Schubladenschrank

Zusätzlich:

- drawer_count
- drawer_front_gap
- drawer_box_material
- runner_type
- handle_position

## Preset 4 – Kleiderschrank

Zusätzlich:

- section_count
- clothes_rod
- shelf_zones
- door_type: hinged/sliding later
- sockel/feet
- top_panel_mode

## Preset 5 – Hängeschrank

Zusätzlich:

- wall_mount_hardware
- reduced_depth
- lift_up_door optional
- glass_door optional

## BOM Felder

Jeder erzeugte Teil braucht:

```yaml
part_name:
part_type:
length:
width:
thickness:
material:
quantity:
grain_direction:
edge_front:
edge_back:
edge_left:
edge_right:
drilling:
hardware:
notes:
```

## Validierung

- width > 100 mm
- height > 100 mm
- depth > 80 mm
- thickness > 0
- side_thickness * 2 < width
- top_bottom_thickness * 2 < height
- shelf_count >= 0
- drawer_count >= 0
- gaps dürfen nicht negativ sein

## User Experience

Der Nutzer soll nicht erst Formeln verstehen müssen.

Er braucht:

- einfache Parameter.
- gute Standardwerte.
- Live-Vorschau.
- Warnungen bei unmöglichen Maßen.
- Reset zu Standard.
- Speichern als eigene Vorlage.
