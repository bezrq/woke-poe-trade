# Path of Exile UI art

Path of Exile's own interface art, (c) Grinding Gear Games, for the game look
(`woke/ui/poe-frame.css`, `woke/ui/poe-options.css`, `woke/ui/poe-content.css`). Like the item tooltip
headers in `../item-frame`, it is GGG's art, used so the overlay looks like
part of the game.

Cut from the game's files (Steam install, `Bundles2`), version 3.29:

| File | Sprite in `Art/UIImages1.txt` (4K) | Use |
| --- | --- | --- |
| frame.png | LoadingScreenBorder TopLeft/Top/TopRight/Left/Right/BottomLeft/Bottom/BottomRight | Window border, 9-slice (44px corners) |
| titlebar-left/middle/right.png | WindowTitlebarLeft/Middle/Right | Window title bar |
| crest.png | WindowTitlebarCenterpiece | The winged crest (not used yet) |
| close.png, close-hover.png | ButtonCloseNormal/Hover | Close button |
| checkbox-on.png, checkbox-off.png | CheckBoxChecked/Unchecked | The switch, as the game's checkbox |
| info.png | InGame/Info | The "i" coin that opens a hint |
| slider-thumb.png | SliderButton | Slider handle |
| button.png | ButtonBackground | Button plate, 9-slice |
| combo.png, combo-hover.png | ButtonComboBoxNormal/Hover | Dropdown arrow (not used yet) |
| stone.png | PanelBottom (the stone between its carved bands) | Window floor: cross-faded into a seamless tile, greyed, warmed and calmed so text reads |
| slot.png | InventorySquare | A bag slot: icon sockets; wells copy its bronze edge |
| category.png | CategoryLine | Heading bar with scroll ends, 9-slice (`poe-content.css`) |
| marker.png | ListSelectionMarker | Copper arrow at the open entry of a list |
| rule-v.png, rule-h.png | LoadingScreenBorderLeft/Top, scaled to 12px | Bronze bar between parts of a window |
| scroll-track.png, scroll-thumb.png | ScrollbarTrack, ScrollbarThumbTop/Middle/Bottom | Scrollbars, 14px wide |
| frame-thin.png | Border2 TopLeft/Top/TopRight/Left/Right/BottomLeft/Bottom/BottomRight | Thin double bronze frame for pop-ups, cards, menus and the icon rail, 9-slice |
| tab.png, tab-on.png | InventoryTabUnSelected/Selected | Tabs, 9-slice |

How: LibBundle3 (github.com/aianlinb/LibGGPK3) reads `Bundles2/_.index.bin`;
`Art/UIImages1.txt` (UTF-16) lists each sprite's sheet and rectangle; the
sheets (`art/textures/interface/2d/2dart/uiimages/.../4k/*.dds`, BC7) are
decoded with Pillow, cut, and scaled to half.
