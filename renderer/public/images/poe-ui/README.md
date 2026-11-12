# Path of Exile UI art

Path of Exile's own interface art, (c) Grinding Gear Games, for the game look
(`woke/ui/poe-frame.css`, `woke/ui/poe-options.css`). Like the item tooltip
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

How: LibBundle3 (github.com/aianlinb/LibGGPK3) reads `Bundles2/_.index.bin`;
`Art/UIImages1.txt` (UTF-16) lists each sprite's sheet and rectangle; the
sheets (`art/textures/interface/2d/2dart/uiimages/.../4k/*.dds`, BC7) are
decoded with Pillow, cut, and scaled to half.
