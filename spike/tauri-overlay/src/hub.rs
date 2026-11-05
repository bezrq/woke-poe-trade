// Shared state between the web server (the overlay page talks to us over the
// same WebSocket protocol as the Electron app), the hotkeys and the Win32 side.
use parking_lot::Mutex;
use serde::Deserialize;
use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicIsize, AtomicU64, Ordering};
use std::sync::OnceLock;
use std::time::Instant;
use tauri::AppHandle;
use tokio::sync::broadcast;

#[derive(Clone, Debug)]
pub struct Zone {
    pub id: String,
    // physical screen pixels
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
    pub activate: bool,
    pub inside: bool,
    pub owner: String,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutAction {
    pub shortcut: String,
    #[serde(default)]
    pub keep_mod_keys: bool,
    pub action: Value,
}

#[derive(Default, Clone, serde::Serialize)]
pub struct MemSample {
    pub at_secs: u64,
    pub processes: u32,
    pub working_set_mb: u64,
    pub private_mb: u64,
    pub own_process_mb: u64,
    pub game_focused: bool,
}

pub struct Hub {
    pub tx: broadcast::Sender<String>,
    pub app: OnceLock<AppHandle>,
    pub started: Instant,
    pub page_loaded_ms: AtomicU64,
    pub interactable: AtomicBool,
    pub game_active: AtomicBool,
    pub overlay_key_used: AtomicBool,
    pub overlay_hwnd: AtomicIsize,
    pub game_hwnd: AtomicIsize,
    pub window_title: Mutex<String>,
    pub restore_clipboard: AtomicBool,
    pub shortcuts: Mutex<Vec<ShortcutAction>>,
    pub zones: Mutex<Vec<Zone>>,
    pub data_dir: PathBuf,
    pub web_dir: PathBuf,
    pub log_file: PathBuf,
    pub mem: Mutex<Vec<MemSample>>,
    pub hotkey_failures: Mutex<Vec<String>>,
    pub copy_ms: Mutex<Vec<u64>>,
}

static HUB: OnceLock<Hub> = OnceLock::new();

pub fn hub() -> &'static Hub {
    HUB.get().expect("hub not initialised")
}

pub fn init(data_dir: PathBuf, web_dir: PathBuf, log_file: PathBuf) -> &'static Hub {
    let (tx, _) = broadcast::channel(256);
    HUB.get_or_init(|| Hub {
        tx,
        app: OnceLock::new(),
        started: Instant::now(),
        page_loaded_ms: AtomicU64::new(0),
        interactable: AtomicBool::new(false),
        game_active: AtomicBool::new(false),
        overlay_key_used: AtomicBool::new(false),
        overlay_hwnd: AtomicIsize::new(0),
        game_hwnd: AtomicIsize::new(0),
        window_title: Mutex::new("Path of Exile".into()),
        restore_clipboard: AtomicBool::new(false),
        shortcuts: Mutex::new(vec![]),
        zones: Mutex::new(vec![]),
        data_dir,
        web_dir,
        log_file,
        mem: Mutex::new(vec![]),
        hotkey_failures: Mutex::new(vec![]),
        copy_ms: Mutex::new(vec![]),
    })
}

impl Hub {
    pub fn send(&self, name: &str, payload: Value) {
        let _ = self.tx.send(json!({ "name": name, "payload": payload }).to_string());
    }

    pub fn log(&self, line: &str) {
        use std::io::Write;
        let secs = self.started.elapsed().as_secs_f32();
        let line = format!("[{secs:8.2}s] {line}\n");
        eprint!("{line}");
        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&self.log_file) {
            let _ = f.write_all(line.as_bytes());
        }
    }

    pub fn config_path(&self) -> PathBuf {
        self.data_dir.join("apt-data").join("config.json")
    }

    pub fn is_interactable(&self) -> bool {
        self.interactable.load(Ordering::SeqCst)
    }

    pub fn send_focus_change(&self) {
        let used = self.overlay_key_used.swap(false, Ordering::SeqCst);
        self.send(
            "MAIN->OVERLAY::focus-change",
            json!({
                "game": self.game_active.load(Ordering::SeqCst),
                "overlay": self.is_interactable(),
                "usingHotkey": used
            }),
        );
    }
}
