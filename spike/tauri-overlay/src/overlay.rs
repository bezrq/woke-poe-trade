// The part electron-overlay-window does for the Electron app, in plain Win32:
// keep a transparent, click-through, topmost window over the game's client
// area, show it only while the game (or the overlay) has focus, and hand focus
// back and forth on Shift+Space. Also: the low-level mouse hook behind the
// dock's hover icons, sending keys, and a memory sampler.
//
// One thread owns the hooks and a message loop; other threads ask it to do
// focus changes by posting it messages (AttachThreadInput needs a thread with
// a message queue).
use crate::hub::{hub, MemSample};
use serde_json::json;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::time::Duration;
use tauri::Manager;
use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM, LRESULT, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::ClientToScreen;
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};
use windows::Win32::System::ProcessStatus::{GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS, PROCESS_MEMORY_COUNTERS_EX};
use windows::Win32::System::Threading::{
    AttachThreadInput, GetCurrentProcessId, GetCurrentThreadId, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_VM_READ,
};
use windows::Win32::UI::Accessibility::{SetWinEventHook, UnhookWinEvent, HWINEVENTHOOK};
use windows::Win32::UI::HiDpi::GetDpiForWindow;
use windows::Win32::UI::Input::KeyboardAndMouse::{
    MapVirtualKeyW, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP,
    MAPVK_VK_TO_VSC, VIRTUAL_KEY,
};
use windows::Win32::UI::WindowsAndMessaging::{
    BringWindowToTop, CallNextHookEx, DispatchMessageW, FindWindowW, GetClientRect, GetCursorPos, GetForegroundWindow,
    GetMessageW, GetWindowTextW, GetWindowThreadProcessId, IsIconic, IsWindow, KillTimer, PostThreadMessageW,
    SetForegroundWindow, SetTimer, SetWindowPos, SetWindowsHookExW, ShowWindow, TranslateMessage, EVENT_OBJECT_DESTROY,
    EVENT_OBJECT_LOCATIONCHANGE, EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_MINIMIZEEND, HHOOK, HWND_TOPMOST, MSG,
    MSLLHOOKSTRUCT, OBJID_WINDOW, SWP_NOACTIVATE, SWP_SHOWWINDOW, SW_HIDE, WH_MOUSE_LL, WINEVENT_OUTOFCONTEXT,
    WINEVENT_SKIPOWNPROCESS, WM_APP, WM_MOUSEMOVE, WM_TIMER,
};

const MSG_ACTIVATE_OVERLAY: u32 = WM_APP + 1;
const MSG_FOCUS_GAME: u32 = WM_APP + 2;
const MSG_FIND_GAME: u32 = WM_APP + 3;
const DWELL_TIMER: usize = 7;
const ACTIVATE_DWELL_MS: u32 = 350;

static HOOK_THREAD: AtomicU32 = AtomicU32::new(0);
static ATTACHED_SENT: AtomicBool = AtomicBool::new(false);
static DWELLING: AtomicBool = AtomicBool::new(false);
static ACTIVATED_BY_HOVER: AtomicBool = AtomicBool::new(false);

thread_local! {
    static LOCATION_HOOK: std::cell::Cell<isize> = const { std::cell::Cell::new(0) };
}

fn hwnd(v: isize) -> HWND {
    HWND(v as *mut core::ffi::c_void)
}

pub fn start(overlay_hwnd: isize) {
    hub().overlay_hwnd.store(overlay_hwnd, Ordering::SeqCst);
    std::thread::spawn(hook_thread);
    std::thread::spawn(memory_sampler);
}

fn post(msg: u32) {
    let t = HOOK_THREAD.load(Ordering::SeqCst);
    if t != 0 {
        unsafe {
            let _ = PostThreadMessageW(t, msg, WPARAM(0), LPARAM(0));
        }
    }
}

pub fn assert_overlay_active() {
    post(MSG_ACTIVATE_OVERLAY);
}
pub fn assert_game_active() {
    post(MSG_FOCUS_GAME);
}
pub fn find_game_now() {
    post(MSG_FIND_GAME);
}

fn set_click_through(on: bool) {
    if let Some(app) = hub().app.get() {
        if let Some(w) = app.get_webview_window("overlay") {
            let _ = w.set_ignore_cursor_events(on);
        }
    }
}

fn hook_thread() {
    unsafe {
        HOOK_THREAD.store(GetCurrentThreadId(), Ordering::SeqCst);
        let _fg = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, None, Some(on_win_event), 0, 0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS,
        );
        let _min = SetWinEventHook(
            EVENT_SYSTEM_MINIMIZEEND, EVENT_SYSTEM_MINIMIZEEND, None, Some(on_win_event), 0, 0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS,
        );
        let _mouse: Option<HHOOK> = SetWindowsHookExW(WH_MOUSE_LL, Some(on_mouse), None, 0).ok();
        find_game();
        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            match msg.message {
                MSG_ACTIVATE_OVERLAY => do_activate_overlay(),
                MSG_FOCUS_GAME => do_focus_game(),
                MSG_FIND_GAME => find_game(),
                WM_TIMER if msg.wParam.0 == DWELL_TIMER => {
                    let _ = KillTimer(None, DWELL_TIMER);
                    DWELLING.store(false, Ordering::SeqCst);
                    let h = hub();
                    if !h.is_interactable() && h.zones.lock().iter().any(|z| z.inside && z.activate) {
                        ACTIVATED_BY_HOVER.store(true, Ordering::SeqCst);
                        do_activate_overlay();
                    }
                }
                _ => {
                    let _ = TranslateMessage(&msg);
                    DispatchMessageW(&msg);
                }
            }
        }
    }
}

fn window_title(w: HWND) -> String {
    let mut buf = [0u16; 256];
    let n = unsafe { GetWindowTextW(w, &mut buf) };
    String::from_utf16_lossy(&buf[..n.max(0) as usize])
}

// Called on the hook thread.
fn find_game() {
    let title = hub().window_title.lock().clone();
    let wide: Vec<u16> = title.encode_utf16().chain(std::iter::once(0)).collect();
    let found = unsafe { FindWindowW(None, windows::core::PCWSTR(wide.as_ptr())) }.unwrap_or_default();
    if !found.is_invalid() {
        set_game(found);
        let fg = unsafe { GetForegroundWindow() };
        on_foreground(fg);
    }
}

fn set_game(w: HWND) {
    let h = hub();
    if h.game_hwnd.swap(w.0 as isize, Ordering::SeqCst) == w.0 as isize {
        return;
    }
    h.log(&format!("game window found ({:?})", w.0));
    // Location changes from the game's process only, so moving the mouse
    // elsewhere doesn't wake us.
    let mut pid = 0u32;
    unsafe { GetWindowThreadProcessId(w, Some(&mut pid)) };
    LOCATION_HOOK.with(|c| unsafe {
        if c.get() != 0 {
            let _ = UnhookWinEvent(HWINEVENTHOOK(c.get() as *mut _));
        }
        let hk = SetWinEventHook(
            EVENT_OBJECT_DESTROY, EVENT_OBJECT_LOCATIONCHANGE, None, Some(on_win_event),
            pid, 0, WINEVENT_OUTOFCONTEXT,
        );
        c.set(hk.0 as isize);
    });
    if !ATTACHED_SENT.swap(true, Ordering::SeqCst) {
        h.send("MAIN->OVERLAY::overlay-attached", serde_json::Value::Null);
    }
}

unsafe extern "system" fn on_win_event(
    _hook: HWINEVENTHOOK, event: u32, w: HWND, id_object: i32, _id_child: i32, _thread: u32, _time: u32,
) {
    let h = hub();
    let game = h.game_hwnd.load(Ordering::SeqCst);
    match event {
        EVENT_SYSTEM_FOREGROUND | EVENT_SYSTEM_MINIMIZEEND => {
            if game == 0 || !unsafe { IsWindow(Some(hwnd(game))) }.as_bool() {
                if window_title(w) == *h.window_title.lock() {
                    set_game(w);
                }
            }
            on_foreground(unsafe { GetForegroundWindow() });
        }
        EVENT_OBJECT_LOCATIONCHANGE if w.0 as isize == game && id_object == OBJID_WINDOW.0 => {
            if h.game_active.load(Ordering::SeqCst) || h.is_interactable() {
                cover_game();
            }
        }
        EVENT_OBJECT_DESTROY if w.0 as isize == game && id_object == OBJID_WINDOW.0 => {
            h.game_hwnd.store(0, Ordering::SeqCst);
            hide_overlay();
            h.log("game window closed");
        }
        _ => {}
    }
}

fn cover_game() {
    let h = hub();
    let game = hwnd(h.game_hwnd.load(Ordering::SeqCst));
    let ov = hwnd(h.overlay_hwnd.load(Ordering::SeqCst));
    unsafe {
        if IsIconic(game).as_bool() {
            return;
        }
        let mut rc = RECT::default();
        if GetClientRect(game, &mut rc).is_err() {
            return;
        }
        let mut pt = POINT { x: 0, y: 0 };
        let _ = ClientToScreen(game, &mut pt);
        let (w, hgt) = (rc.right - rc.left, rc.bottom - rc.top);
        if w <= 0 || hgt <= 0 {
            return;
        }
        let _ = SetWindowPos(ov, Some(HWND_TOPMOST), pt.x, pt.y, w, hgt, SWP_NOACTIVATE | SWP_SHOWWINDOW);
    }
}

fn hide_overlay() {
    let ov = hwnd(hub().overlay_hwnd.load(Ordering::SeqCst));
    unsafe {
        let _ = ShowWindow(ov, SW_HIDE);
    }
}

fn on_foreground(fg: HWND) {
    let h = hub();
    let game = h.game_hwnd.load(Ordering::SeqCst);
    let ov = h.overlay_hwnd.load(Ordering::SeqCst);
    let is_game = game != 0 && fg.0 as isize == game;
    let is_overlay = fg.0 as isize == ov;
    if is_game || is_overlay {
        cover_game();
    } else {
        hide_overlay();
        if h.interactable.swap(false, Ordering::SeqCst) {
            set_click_through(true);
        }
    }
    let was = h.game_active.swap(is_game, Ordering::SeqCst);
    if was != is_game {
        if is_game && h.interactable.swap(false, Ordering::SeqCst) {
            set_click_through(true);
        }
        h.send_focus_change();
    }
}

fn force_foreground(target: HWND) {
    unsafe {
        let fg = GetForegroundWindow();
        let fg_thread = GetWindowThreadProcessId(fg, None);
        let me = GetCurrentThreadId();
        let attach = fg_thread != 0 && fg_thread != me;
        if attach {
            let _ = AttachThreadInput(me, fg_thread, true);
        }
        let _ = SetForegroundWindow(target);
        let _ = BringWindowToTop(target);
        if attach {
            let _ = AttachThreadInput(me, fg_thread, false);
        }
    }
}

fn do_activate_overlay() {
    let h = hub();
    if h.is_interactable() {
        return;
    }
    h.interactable.store(true, Ordering::SeqCst);
    h.game_active.store(false, Ordering::SeqCst);
    set_click_through(false);
    force_foreground(hwnd(h.overlay_hwnd.load(Ordering::SeqCst)));
    h.send_focus_change();
}

fn do_focus_game() {
    let h = hub();
    ACTIVATED_BY_HOVER.store(false, Ordering::SeqCst);
    if !h.is_interactable() {
        return;
    }
    h.interactable.store(false, Ordering::SeqCst);
    set_click_through(true);
    let game = h.game_hwnd.load(Ordering::SeqCst);
    if game != 0 {
        force_foreground(hwnd(game));
        h.game_active.store(true, Ordering::SeqCst);
    }
    h.send_focus_change();
}

// Hover zones (dock icons): same logic as main/src/woke/hover.ts.
unsafe extern "system" fn on_mouse(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 && wparam.0 as u32 == WM_MOUSEMOVE {
        let info = unsafe { &*(lparam.0 as *const MSLLHOOKSTRUCT) };
        let (x, y) = (info.pt.x, info.pt.y);
        let h = hub();
        if let Some(mut zones) = h.zones.try_lock() {
            if !zones.is_empty() {
                if ACTIVATED_BY_HOVER.load(Ordering::SeqCst) && !h.is_interactable() {
                    ACTIVATED_BY_HOVER.store(false, Ordering::SeqCst);
                }
                let mut in_activate = false;
                for z in zones.iter_mut() {
                    let inside = x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h;
                    if inside != z.inside {
                        z.inside = inside;
                        h.send("MAIN->OVERLAY::woke-hover", json!({ "id": z.id, "inside": inside }));
                    }
                    in_activate |= inside && z.activate;
                }
                drop(zones);
                if in_activate {
                    if !DWELLING.load(Ordering::SeqCst) && !ACTIVATED_BY_HOVER.load(Ordering::SeqCst) && !h.is_interactable() {
                        DWELLING.store(true, Ordering::SeqCst);
                        unsafe { SetTimer(None, DWELL_TIMER, ACTIVATE_DWELL_MS, None) };
                    }
                } else {
                    if DWELLING.swap(false, Ordering::SeqCst) {
                        let _ = unsafe { KillTimer(None, DWELL_TIMER) };
                    }
                    if ACTIVATED_BY_HOVER.swap(false, Ordering::SeqCst) && h.is_interactable() {
                        post(MSG_FOCUS_GAME);
                    }
                }
            }
        }
    }
    unsafe { CallNextHookEx(None, code, wparam, lparam) }
}

fn vk_of(name: &str) -> Option<u16> {
    Some(match name {
        "Ctrl" => 0x11, "Shift" => 0x10, "Alt" => 0x12, "Space" => 0x20, "Enter" => 0x0D, "Tab" => 0x09,
        "Backspace" => 0x08, "Escape" => 0x1B, "PageUp" => 0x21, "PageDown" => 0x22, "End" => 0x23, "Home" => 0x24,
        "ArrowLeft" => 0x25, "ArrowUp" => 0x26, "ArrowRight" => 0x27, "ArrowDown" => 0x28, "Insert" => 0x2D,
        "Delete" => 0x2E,
        k if k.len() == 1 && (k.as_bytes()[0].is_ascii_uppercase() || k.as_bytes()[0].is_ascii_digit()) => k.as_bytes()[0] as u16,
        k if k.starts_with('F') && k[1..].parse::<u16>().map(|n| (1..=24).contains(&n)).unwrap_or(false) => {
            0x70 + k[1..].parse::<u16>().unwrap() - 1
        }
        _ => return None,
    })
}

pub fn key(name: &str, down: bool) {
    let Some(vk) = vk_of(name) else { return };
    unsafe {
        let scan = MapVirtualKeyW(vk as u32, MAPVK_VK_TO_VSC) as u16;
        let input = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(vk),
                    wScan: scan,
                    dwFlags: if down { Default::default() } else { KEYEVENTF_KEYUP },
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };
        SendInput(&[input], std::mem::size_of::<INPUT>() as i32);
    }
}

// Cursor in DIPs (what Electron's screen.getCursorScreenPoint gives the overlay).
pub fn cursor_dip() -> (i32, i32) {
    let h = hub();
    unsafe {
        let mut pt = POINT::default();
        let _ = GetCursorPos(&mut pt);
        let game = h.game_hwnd.load(Ordering::SeqCst);
        let dpi = if game != 0 { GetDpiForWindow(hwnd(game)) } else { 96 };
        let scale = if dpi == 0 { 1.0 } else { dpi as f64 / 96.0 };
        ((pt.x as f64 / scale).round() as i32, (pt.y as f64 / scale).round() as i32)
    }
}

// Every 15 s: this process plus everything it started (WebView2's browser,
// GPU, network and renderer processes).
fn memory_sampler() {
    let h = hub();
    loop {
        std::thread::sleep(Duration::from_secs(15));
        let s = sample();
        h.log(&format!(
            "memory: {} processes, {} MB working set, {} MB private (this exe {} MB), game focused: {}",
            s.processes, s.working_set_mb, s.private_mb, s.own_process_mb, s.game_focused
        ));
        let mut m = h.mem.lock();
        m.push(s);
        if m.len() > 40 {
            m.remove(0);
        }
    }
}

fn sample() -> MemSample {
    let h = hub();
    let me = unsafe { GetCurrentProcessId() };
    let mut pairs: Vec<(u32, u32)> = vec![];
    unsafe {
        if let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
            let mut e = PROCESSENTRY32W { dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32, ..Default::default() };
            if Process32FirstW(snap, &mut e).is_ok() {
                loop {
                    pairs.push((e.th32ProcessID, e.th32ParentProcessID));
                    if Process32NextW(snap, &mut e).is_err() {
                        break;
                    }
                }
            }
            let _ = CloseHandle(snap);
        }
    }
    let mut tree = vec![me];
    let mut i = 0;
    while i < tree.len() {
        let parent = tree[i];
        for &(pid, ppid) in &pairs {
            if ppid == parent && pid != parent && !tree.contains(&pid) {
                tree.push(pid);
            }
        }
        i += 1;
    }
    let mut out = MemSample {
        at_secs: h.started.elapsed().as_secs(),
        game_focused: h.game_active.load(Ordering::SeqCst),
        ..Default::default()
    };
    for pid in tree {
        unsafe {
            let Ok(p) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ, false, pid) else { continue };
            let mut c = PROCESS_MEMORY_COUNTERS_EX {
                cb: std::mem::size_of::<PROCESS_MEMORY_COUNTERS_EX>() as u32,
                ..Default::default()
            };
            if GetProcessMemoryInfo(p, &mut c as *mut _ as *mut PROCESS_MEMORY_COUNTERS, c.cb).is_ok() {
                out.processes += 1;
                out.working_set_mb += (c.WorkingSetSize / 1048576) as u64;
                out.private_mb += (c.PrivateUsage / 1048576) as u64;
                if pid == me {
                    out.own_process_mb = (c.PrivateUsage / 1048576) as u64;
                }
            }
            let _ = CloseHandle(p);
        }
    }
    out
}
