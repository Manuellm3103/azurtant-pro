// AzurTant PRO - Tauri Main Entry Point (Desktop)
//
// Calls the library's `run()` function. This is the Windows/Linux/macOS entry.
// Android uses the mobile entry point in lib.rs.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    azurant_pro_lib::run()
}
