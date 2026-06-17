// AzurTant PRO - Tauri Library (Android entry point)
//
// For Tauri 2.x, the lib.rs is required for Android builds.
// The desktop entry (main.rs) just calls run() from here.

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Show the main window on startup
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running AzurTant PRO");
}
