# Path of Exile 2 UI art

Path of Exile 2's own interface art, (c) Grinding Gear Games, for the game
look's "PoE 2" UI style (Settings > Look & icon row > UI style; `woke/ui/art-sets.css`).
The same pieces as `../poe-ui`, under the same file names, cut from PoE 2's
files (Steam install, `Bundles2`) with the same scripts. PoE 2 keeps each UI
piece as its own texture (`art/textures/interface/2d/2dart/uiimages/{common,ingame}/4k/*.dds`)
instead of in sprite sheets; the sprite names match PoE 1's (WindowTitlebarLeft,
LoadingScreenBorder*, CheckBoxChecked, Info, PanelBottom, InventorySquare,
CategoryLine, Border2*, InventoryTab*, Scrollbar*, and so on; see `../poe-ui/README.md`).

PoE 2's title bar middle has black edge columns; they are trimmed so the tile
repeats without seams.

Two pieces differ from the PoE 1 recipe:
- `stone.png`: PoE 2's PanelBottom is a row of gothic arches. The floor is cut
  exactly three arches wide (one arch repeats every 162px at 4K) so it tiles
  side to side with no blending; rows join through a short blend. Then the
  same quiet grey, warm treatment as PoE 1's floor.
- `frame-thin.png`: PoE 2's Border2 pieces are darker than PoE 1's; brightened
  to PoE 1's level so pop-up frames read as a border.
