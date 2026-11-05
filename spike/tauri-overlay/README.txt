Woke PoE Trade - Tauri test build
=================================

A throwaway test, not the real app. It checks whether the toolkit's overlay
can run on Tauri (Rust + the WebView2 that ships with Windows) instead of
Electron, and how much memory that saves.

How to try it
1. Quit the real Woke PoE Trade first (tray icon > Quit), so hotkeys don't clash.
2. Unzip this folder anywhere and run Woke-Tauri-Test.exe. A tray icon appears.
   Your settings are copied from the real app on first run; changes are saved
   separately (%APPDATA%\woke-tauri-test) and never touch the real app.
3. Start Path of Exile (windowed fullscreen) and play for a few minutes.

What to check
- The overlay appears over the game and you can click the game through it.
- Shift+Space makes the overlay clickable, Shift+Space or Esc gives the game focus back.
- Alt-tab away and back: the overlay hides and comes back with the game.
- Price check hotkey on an item opens the price check (prices come from the trade site).
- Hovering the dock icons shows their cards; resting on one makes it clickable.
- The game feels the same (no stutter, no lost keys).

Numbers: tray icon > "Show test numbers" (memory every 15 s, how long price
check copying took, hotkeys that failed). Log: tray icon > "Open log folder".

Not in this test: map/essence/heist scans (OCR), the trade site and poelab
pages shown inside the overlay, Client.txt features (campaign, farming, trade
whispers), loot filter files, PoB, auto-update. Those widgets may show errors.
