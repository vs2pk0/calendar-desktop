/*
 * @Author: DaLong Li
 * @Date: 2026-02-05 15:45:33
 * @LastEditTime: 2026-02-06 16:57:21
 * @LastEditors: DaLong Li
 * @Description: 
 * 生命在于运动，代码在于抽动。
 */
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn update_tray_title(app: tauri::AppHandle, title: String) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_title(Some(title));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            #[cfg(all(desktop, target_os = "macos"))]
            {
                use tauri::tray::TrayIconBuilder;
                if let Some(icon) = app.default_window_icon() {
                    let _ = TrayIconBuilder::with_id("main-tray")
                        .icon(icon.clone())
                        .title("")
                        .build(app);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, update_tray_title])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
