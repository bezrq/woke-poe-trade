// The same local server the Electron app runs (main/src/server.ts, proxy.ts):
// serves the built overlay, /config, the trade/poe.ninja proxy, and the
// /events WebSocket. Because the overlay only ever talks to this server, the
// Vue code runs unchanged inside WebView2.
use crate::hub::{hub, Zone};
use crate::{actions, overlay};
use axum::body::{Body, Bytes};
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::Request;
use axum::http::{HeaderMap, HeaderName, HeaderValue, Method, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{any, get, post};
use axum::{Json, Router};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::sync::atomic::Ordering;
use std::sync::OnceLock;
use tower_http::services::ServeDir;

pub const PORT: u16 = 8586;

const PROXY_HOSTS: &[&str] = &[
    "www.pathofexile.com",
    "ru.pathofexile.com",
    "pathofexile.tw",
    "poe.kakaogames.com",
    "poe.ninja",
    "www.poeprices.info",
];

fn http() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .cookie_store(true)
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) woke-poe-trade/0.1 (Tauri test; github.com/guybnd/woke-poe-trade)")
            .build()
            .expect("http client")
    })
}

// Bound before the overlay window is created, so the page never loads first.
pub fn bind() -> std::io::Result<std::net::TcpListener> {
    let l = std::net::TcpListener::bind(("127.0.0.1", PORT))?;
    l.set_nonblocking(true)?;
    Ok(l)
}

pub async fn run(std_listener: std::net::TcpListener) {
    let h = hub();
    let app = Router::new()
        .route("/config", get(config))
        .route("/events", get(events))
        .route("/proxy/{*rest}", any(proxy))
        .route("/spike/status", get(status))
        .route("/spike/loaded", post(loaded))
        .route("/spike/focus-game", post(focus_game))
        .fallback_service(ServeDir::new(&h.web_dir));
    let listener = match tokio::net::TcpListener::from_std(std_listener) {
        Ok(l) => l,
        Err(e) => {
            h.log(&format!("error: can't listen on {PORT}: {e}"));
            return;
        }
    };
    h.log(&format!("server listening on {PORT}"));
    let _ = axum::serve(listener, app).await;
}

async fn config() -> Json<Value> {
    let contents = tokio::fs::read_to_string(hub().config_path()).await.ok();
    Json(json!({
        "version": env!("CARGO_PKG_VERSION"),
        "updater": { "state": "initial" },
        "contents": contents
    }))
}

async fn loaded() -> StatusCode {
    let h = hub();
    let ms = h.started.elapsed().as_millis() as u64;
    if h.page_loaded_ms.load(Ordering::SeqCst) == 0 {
        h.page_loaded_ms.store(ms, Ordering::SeqCst);
        h.log(&format!("overlay page loaded {ms} ms after start"));
    }
    StatusCode::NO_CONTENT
}

async fn focus_game() -> StatusCode {
    overlay::assert_game_active();
    StatusCode::NO_CONTENT
}

async fn status() -> Json<Value> {
    let h = hub();
    let mem = h.mem.lock().clone();
    let copy = h.copy_ms.lock().clone();
    Json(json!({
        "uptimeSecs": h.started.elapsed().as_secs(),
        "pageLoadedMs": h.page_loaded_ms.load(Ordering::SeqCst),
        "gameFound": h.game_hwnd.load(Ordering::SeqCst) != 0,
        "gameActive": h.game_active.load(Ordering::SeqCst),
        "overlayInteractable": h.is_interactable(),
        "hotkeys": h.shortcuts.lock().iter().map(|s| s.shortcut.clone()).collect::<Vec<_>>(),
        "hotkeyFailures": h.hotkey_failures.lock().clone(),
        "itemCopyMs": copy,
        "hoverZones": h.zones.lock().len(),
        "memory": mem,
    }))
}

async fn events(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(socket: WebSocket) {
    let h = hub();
    let (mut sink, mut stream) = socket.split();
    let mut rx = h.tx.subscribe();
    let hello = json!({ "name": "MAIN->CLIENT::log-entry", "payload": { "message": "Tauri test build\n" } });
    let _ = sink.send(Message::Text(hello.to_string().into())).await;
    if h.game_hwnd.load(Ordering::SeqCst) != 0 {
        let attached = json!({ "name": "MAIN->OVERLAY::overlay-attached", "payload": null });
        let _ = sink.send(Message::Text(attached.to_string().into())).await;
    }
    // The overlay hides everything until it hears the game has focus. If the
    // game was already focused before the page connected, that event was sent
    // to nobody, so repeat the current state to every new connection.
    let focus = json!({ "name": "MAIN->OVERLAY::focus-change", "payload": {
        "game": h.game_active.load(Ordering::SeqCst),
        "overlay": h.is_interactable(),
        "usingHotkey": false
    } });
    let _ = sink.send(Message::Text(focus.to_string().into())).await;
    h.log(&format!("overlay page connected (game focused: {})", h.game_active.load(Ordering::SeqCst)));

    let forward = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sink.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });
    while let Some(Ok(msg)) = stream.next().await {
        if let Message::Text(text) = msg {
            if let Ok(ev) = serde_json::from_str::<Value>(&text) {
                handle_event(ev).await;
            }
        }
    }
    forward.abort();
}

async fn handle_event(ev: Value) {
    let h = hub();
    let name = ev["name"].as_str().unwrap_or_default();
    let payload = &ev["payload"];
    match name {
        "CLIENT->MAIN::update-host-config" => {
            if let Some(t) = payload["windowTitle"].as_str() {
                *h.window_title.lock() = t.to_string();
            }
            h.restore_clipboard
                .store(payload["restoreClipboard"].as_bool().unwrap_or(false), Ordering::SeqCst);
            let list = serde_json::from_value(payload["shortcuts"].clone()).unwrap_or_default();
            actions::register_shortcuts(list);
            overlay::find_game_now();
        }
        "CLIENT->MAIN::save-config" => {
            let contents = payload["contents"].as_str().unwrap_or_default().to_string();
            let path = h.config_path();
            if let Some(dir) = path.parent() {
                let _ = tokio::fs::create_dir_all(dir).await;
            }
            let tmp = path.with_extension("json.writing");
            if tokio::fs::write(&tmp, &contents).await.is_ok() {
                let _ = tokio::fs::rename(&tmp, &path).await;
            }
            h.send("MAIN->CLIENT::config-changed", json!({ "contents": contents }));
        }
        "OVERLAY->MAIN::focus-game" => overlay::assert_game_active(),
        "OVERLAY->MAIN::woke-hover-zones" => {
            let owner = payload["owner"].as_str().unwrap_or_default().to_string();
            let dpr = payload["dpr"].as_f64().unwrap_or(1.0);
            let mut zones = h.zones.lock();
            let prev: Vec<Zone> = zones.iter().filter(|z| z.owner == owner).cloned().collect();
            zones.retain(|z| z.owner != owner);
            for z in payload["zones"].as_array().into_iter().flatten() {
                let id = z["id"].as_str().unwrap_or_default().to_string();
                let px = |k: &str| (z[k].as_f64().unwrap_or(0.0) * dpr).round() as i32;
                let inside = prev.iter().any(|p| p.id == id && p.inside);
                zones.push(Zone {
                    x: px("x"), y: px("y"), w: px("width"), h: px("height"),
                    activate: z["activate"].as_bool().unwrap_or(false),
                    inside, owner: owner.clone(), id,
                });
            }
            for p in prev.iter().filter(|p| p.inside) {
                if !zones.iter().any(|z| z.owner == owner && z.id == p.id) {
                    h.send("MAIN->OVERLAY::woke-hover", json!({ "id": p.id, "inside": false }));
                }
            }
        }
        "CLIENT->MAIN::woke-request" => {
            // The toolkit's own main-side handlers (map scan, PoB, loot filter
            // files, ...) aren't part of this test.
            let id = payload["id"].clone();
            let op = payload["op"].as_str().unwrap_or_default();
            h.send(
                "MAIN->CLIENT::woke-response",
                json!({ "id": id, "ok": false, "error": format!("'{op}' isn't in the Tauri test build") }),
            );
        }
        "CLIENT->MAIN::user-action" => {
            if payload["action"] == "quit" {
                if let Some(app) = h.app.get() {
                    app.exit(0);
                }
            }
        }
        _ => {}
    }
}

async fn proxy(method: Method, headers: HeaderMap, req: Request) -> Response {
    let path_q = req
        .uri()
        .path_and_query()
        .map(|p| p.as_str().to_string())
        .unwrap_or_default();
    let target = path_q.trim_start_matches("/proxy/").to_string();
    let host = target.split('/').next().unwrap_or_default();
    if !PROXY_HOSTS.contains(&host) {
        return StatusCode::FORBIDDEN.into_response();
    }
    let body: Bytes = match axum::body::to_bytes(req.into_body(), 16 * 1024 * 1024).await {
        Ok(b) => b,
        Err(_) => return StatusCode::BAD_REQUEST.into_response(),
    };
    let mut out = reqwest::header::HeaderMap::new();
    for (k, v) in headers.iter() {
        let n = k.as_str();
        if n.starts_with("sec-") || matches!(n, "host" | "origin" | "content-length" | "user-agent" | "connection" | "referer" | "accept-encoding" | "cookie") {
            continue;
        }
        if let (Ok(k), Ok(v)) = (
            reqwest::header::HeaderName::from_bytes(k.as_ref()),
            reqwest::header::HeaderValue::from_bytes(v.as_bytes()),
        ) {
            out.insert(k, v);
        }
    }
    let m = reqwest::Method::from_bytes(method.as_str().as_bytes()).unwrap_or(reqwest::Method::GET);
    let res = match http().request(m, format!("https://{target}")).headers(out).body(body.to_vec()).send().await {
        Ok(r) => r,
        Err(e) => {
            hub().log(&format!("error [proxy] {e} ({host})"));
            return StatusCode::BAD_GATEWAY.into_response();
        }
    };
    let status = StatusCode::from_u16(res.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    let mut rh = HeaderMap::new();
    for (k, v) in res.headers().iter() {
        let n = k.as_str();
        if matches!(n, "content-encoding" | "content-length" | "transfer-encoding" | "connection") {
            continue;
        }
        if let (Ok(k), Ok(v)) = (HeaderName::from_bytes(k.as_ref()), HeaderValue::from_bytes(v.as_bytes())) {
            rh.append(k, v);
        }
    }
    let bytes = res.bytes().await.unwrap_or_default();
    let mut resp = Response::new(Body::from(bytes));
    *resp.status_mut() = status;
    *resp.headers_mut() = rh;
    resp
}
