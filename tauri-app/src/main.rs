#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn save_file(app: tauri::AppHandle, name: String, data: Vec<u8>) -> Result<bool, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .set_file_name(&name)
        .save_file(move |path| {
            let _ = tx.send(path);
        });
    let path = rx.await.map_err(|e| e.to_string())?;
    match path {
        Some(p) => {
            let p = p.into_path().map_err(|e| e.to_string())?;
            std::fs::write(&p, &data).map_err(|e| e.to_string())?;
            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
async fn set_zoom(app: tauri::AppHandle, zoom: f64) -> Result<(), String> {
    use tauri::Manager;
    let window = app.get_webview_window("main").ok_or("window not found")?;
    window.set_zoom(zoom).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_file, set_zoom])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
