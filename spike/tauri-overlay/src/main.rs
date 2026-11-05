// Throwaway test build: can Tauri (Rust + the system WebView2) host the
// toolkit's existing overlay over Path of Exile, and what does it cost?
//
// It runs the same built overlay (renderer/dist, copied next to the exe as
// web/) and speaks the same WebSocket protocol as the Electron app, so the
// Vue code is unchanged. Settings are copied from the real app on first run
// and saved separately, so the real install is never touched.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(not(windows))]
compile_error!("The Tauri overlay test is Windows-only.");

mod actions;
mod hub;
mod overlay;
mod server;

use std::path::PathBuf;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{WebviewUrl, WebviewWindowBuilder};

// The overlay checks for "Electron" in the user agent to turn on its overlay
// behaviour (click-through handling, hover icons, focus hand-off).
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Electron/40.0.0 WokeTauriTest";

// Escape hands focus back to the game (Electron did this in main), and the
// page reports when it has loaded, for the startup time.
const INIT_JS: &str = r#"
window.addEventListener('load', () => { fetch('/spike/loaded', { method: 'POST' }).catch(() => {}) })
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fetch('/spike/focus-game', { method: 'POST' }).catch(() => {})
}, true)
"#;

fn appdata() -> PathBuf {
    std::env::var_os("APPDATA").map(PathBuf::from).unwrap_or_else(std::env::temp_dir)
}

fn main() {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_default();
    let data_dir = appdata().join("woke-tauri-test");
    let _ = std::fs::create_dir_all(data_dir.join("apt-data"));
    let cfg = data_dir.join("apt-data").join("config.json");
    if !cfg.exists() {
        let real = appdata().join("woke-poe-trade").join("apt-data").join("config.json");
        let _ = std::fs::copy(real, &cfg);
    }
    let h = hub::init(data_dir.clone(), exe_dir.join("web"), data_dir.join("test-log.txt"));
    let _ = std::fs::remove_file(&h.log_file);
    h.log(&format!("Woke Tauri test {} starting; data in {}", env!("CARGO_PKG_VERSION"), data_dir.display()));

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let h = hub::hub();
            let _ = h.app.set(app.handle().clone());
            let listener = server::bind().map_err(|e| format!("port {} is taken ({e}); is another test copy running?", server::PORT))?;
            tauri::async_runtime::spawn(server::run(listener));

            let url = format!("http://127.0.0.1:{}/index.html", server::PORT);
            let win = WebviewWindowBuilder::new(app, "overlay", WebviewUrl::External(url.parse()?))
                .title("Woke PoE Trade (Tauri test)")
                .user_agent(USER_AGENT)
                .transparent(true)
                .decorations(false)
                .shadow(false)
                .always_on_top(true)
                .skip_taskbar(true)
                .resizable(false)
                .focused(false)
                .visible(false)
                .initialization_script(INIT_JS)
                .build()?;
            win.set_ignore_cursor_events(true)?;
            overlay::start(win.hwnd()?.0 as isize);

            let status = MenuItem::with_id(app, "status", "Show test numbers", true, None::<&str>)?;
            let log = MenuItem::with_id(app, "log", "Open log folder", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&status, &log, &quit])?;
            let mut tray = TrayIconBuilder::new().menu(&menu).tooltip("Woke PoE Trade (Tauri test)");
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.on_menu_event(|app, ev| match ev.id().as_ref() {
                "status" => open(&format!("http://127.0.0.1:{}/spike/status", server::PORT)),
                "log" => open(&hub::hub().data_dir.display().to_string()),
                "quit" => app.exit(0),
                _ => {}
            })
            .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Tauri test");
}

fn open(target: &str) {
    let _ = std::process::Command::new("explorer").arg(target).spawn();
}
