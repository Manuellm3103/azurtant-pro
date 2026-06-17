// AzurTant PRO - Tauri Library (for Android build)
//
// This file is required by Tauri 2.x for Android builds.
// It exposes the `run()` function that the mobile entry point calls.

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Configure window for desktop only
            #[cfg(all(desktop, not(mobile)))]
            {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.set_title("AzurTant PRO - Sistema Multi-Agente para Zero Employees");
                    let _ = win.center();
                }
            }
            // Mobile setup
            #[cfg(mobile)]
            {
                println!("AzurTant PRO mobile app started");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running AzurTant PRO");
}
