// AzurTant PRO - Tauri Backend
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main");
            match window {
                Some(win) => {
                    win.set_title("AzurTant PRO - Sistema Multi-Agente para Zero Employees")?;
                    win.center()?;
                    println!("Window created and configured successfully");
                }
                None => {
                    eprintln!("ERROR: Could not get main window");
                    return Err("Window not found".into());
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}