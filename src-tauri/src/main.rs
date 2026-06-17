// AzurTant PRO - Desktop entry point
// Calls the library's run() function. Android uses the mobile_entry_point in lib.rs.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    azurant_pro_lib::run()
}
