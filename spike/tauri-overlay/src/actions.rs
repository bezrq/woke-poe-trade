// Hotkeys from the overlay's config (same list Electron registers in
// main/src/shortcuts/Shortcuts.ts) and what they do. Only the actions the
// test needs: overlay toggle, item copy (price check etc.), widget events.
use crate::hub::{hub, ShortcutAction};
use crate::overlay;
use serde_json::json;
use std::str::FromStr;
use std::sync::atomic::Ordering;
use std::time::{Duration, Instant};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const POLL_DELAY: Duration = Duration::from_millis(24);
const POLL_LIMIT: Duration = Duration::from_millis(500);

pub fn is_mod(key: &str) -> bool {
    matches!(key, "Ctrl" | "Shift" | "Alt")
}

fn to_shortcut(s: &str) -> Option<Shortcut> {
    let mut mods = Modifiers::empty();
    let mut code = None;
    for key in s.split(" + ") {
        match key {
            "Ctrl" => mods |= Modifiers::CONTROL,
            "Shift" => mods |= Modifiers::SHIFT,
            "Alt" => mods |= Modifiers::ALT,
            k if k.len() == 1 && k.as_bytes()[0].is_ascii_uppercase() => code = Code::from_str(&format!("Key{k}")).ok(),
            k if k.len() == 1 && k.as_bytes()[0].is_ascii_digit() => code = Code::from_str(&format!("Digit{k}")).ok(),
            k => code = Code::from_str(k).ok(),
        }
    }
    Some(Shortcut::new(if mods.is_empty() { None } else { Some(mods) }, code?))
}

pub fn register_shortcuts(list: Vec<ShortcutAction>) {
    let h = hub();
    let Some(app) = h.app.get() else { return };
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    let mut failed = vec![];
    for entry in &list {
        if entry.action["type"] == "test-only" {
            continue;
        }
        let Some(sc) = to_shortcut(&entry.shortcut) else {
            failed.push(format!("{} (unknown key)", entry.shortcut));
            continue;
        };
        let e = entry.clone();
        let res = gs.on_shortcut(sc, move |_app, _sc, ev| {
            if ev.state == ShortcutState::Pressed {
                let e = e.clone();
                std::thread::spawn(move || run_action(&e));
            }
        });
        if let Err(err) = res {
            failed.push(format!("{} ({err})", entry.shortcut));
        }
    }
    if !failed.is_empty() {
        h.log(&format!("hotkeys that failed to register: {failed:?}"));
    }
    h.log(&format!("registered {} hotkeys", list.len() - failed.len()));
    *h.hotkey_failures.lock() = failed;
    *h.shortcuts.lock() = list;
}

fn release_keys(entry: &ShortcutAction) {
    let keys: Vec<&str> = entry.shortcut.split(" + ").collect();
    if entry.keep_mod_keys {
        for k in keys.iter().filter(|k| !is_mod(k)) {
            overlay::key(k, false);
        }
    } else {
        for k in keys.iter().rev() {
            overlay::key(k, false);
        }
    }
}

fn run_action(entry: &ShortcutAction) {
    let h = hub();
    let kind = entry.action["type"].as_str().unwrap_or_default();
    release_keys(entry);
    match kind {
        "toggle-overlay" => {
            h.overlay_key_used.store(true, Ordering::SeqCst);
            if h.is_interactable() {
                overlay::assert_game_active();
            } else {
                overlay::assert_overlay_active();
            }
        }
        "trigger-event" => {
            h.send("MAIN->CLIENT::widget-action", json!({ "target": entry.action["target"] }));
            if entry.action["focusOverlay"].as_bool().unwrap_or(false) {
                overlay::assert_overlay_active();
            }
        }
        "copy-item" => copy_item(entry),
        other => h.log(&format!("hotkey action '{other}' isn't in the Tauri test build")),
    }
}

fn is_poe_item(text: &str) -> bool {
    const FIRST_LINES: &[&str] = &[
        "Item Class: ", "Класс предмета: ", "Classe d'objet: ", "Gegenstandsklasse: ",
        "Classe do Item: ", "Clase de objeto: ", "ชนิดไอเทม: ", "아이템 종류: ", "物品種類: ", "物品类别: ",
    ];
    FIRST_LINES.iter().any(|l| text.starts_with(l))
}

fn copy_item(entry: &ShortcutAction) {
    let h = hub();
    let start = Instant::now();
    let position = overlay::cursor_dip();
    let Ok(mut cb) = arboard::Clipboard::new() else {
        h.log("error: clipboard unavailable");
        return;
    };
    let before = cb.get_text().unwrap_or_default();
    if is_poe_item(&before) {
        let _ = cb.set_text(String::new());
    }

    // Ctrl+C, without toggling Ctrl when the hotkey already holds it.
    let held_ctrl = entry.keep_mod_keys && entry.shortcut.split(" + ").any(|k| k == "Ctrl");
    if !held_ctrl {
        overlay::key("Ctrl", true);
    }
    overlay::key("C", true);
    overlay::key("C", false);
    if !held_ctrl {
        overlay::key("Ctrl", false);
    }

    let text = loop {
        std::thread::sleep(POLL_DELAY);
        let after = cb.get_text().unwrap_or_default();
        if is_poe_item(&after) {
            break Some(after);
        }
        if start.elapsed() > POLL_LIMIT {
            break None;
        }
    };
    if h.restore_clipboard.load(Ordering::SeqCst) {
        let _ = cb.set_text(before);
    }
    let Some(text) = text else {
        h.log("warn: no item text found after Ctrl+C");
        return;
    };
    let ms = start.elapsed().as_millis() as u64;
    {
        let mut c = h.copy_ms.lock();
        c.push(ms);
        if c.len() > 20 {
            c.remove(0);
        }
    }
    let focus = entry.action["focusOverlay"].as_bool().unwrap_or(false);
    h.send(
        "MAIN->CLIENT::item-text",
        json!({
            "target": entry.action["target"],
            "clipboard": text,
            "position": { "x": position.0, "y": position.1 },
            "focusOverlay": focus
        }),
    );
    if focus {
        overlay::assert_overlay_active();
    }
}
