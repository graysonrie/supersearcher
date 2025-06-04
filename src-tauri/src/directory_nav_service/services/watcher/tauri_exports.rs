use super::service::DirectoryWatcherService;
use std::{path::Path, sync::Arc};
use tauri::{AppHandle, Emitter, State};

/// Returns the emit event identifier string that the frontend can listen with
#[tauri::command]
pub fn watch_directory(
    path: String,
    app_handle: AppHandle,
    watcher_service: State<'_, Arc<DirectoryWatcherService>>,
) -> String {
    let path = Path::new(&path);
    let ident = "directory_watcher_event".to_string();
    let ident_clone = ident.clone();
    let on_changes = move || {
        if let Err(err) = app_handle.emit(&ident, "Changes") {
            println!("WatchDirectory - Error emitting changes via Tauri: {}", err);
        }
        println!("Directory watcher service backend: noticed changes");
    };
    watcher_service.watch(path.to_path_buf(), on_changes);
    ident_clone
}

#[tauri::command]
pub async fn stop_watching_directory(
    watcher_service: State<'_, Arc<DirectoryWatcherService>>,
) -> Result<(), String> {
    watcher_service.stop_watching().await;
    Ok(())
}
