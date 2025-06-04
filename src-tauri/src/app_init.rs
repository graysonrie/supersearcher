use std::sync::Arc;

use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;

use crate::tantivy_file_indexer::service_container::AppServiceContainer;

pub struct IsAppRunning {
    pub running: Arc<Mutex<bool>>,
}

/// Check to see if the backend is fully initialized and all state is managed
#[tauri::command]
pub async fn is_running(is_running: State<'_, IsAppRunning>) -> Result<bool, String> {
    let running = *is_running.running.lock().await;
    Ok(running)
}

pub fn initialize_app(handle: AppHandle) {
    handle.manage(IsAppRunning {
        running: Arc::new(Mutex::new(false)),
    });

    let handle_clone = handle.clone();
    tauri::async_runtime::spawn(async move { initialize_app_async(handle_clone).await });
}

pub async fn initialize_app_async(handle: AppHandle) {
    AppServiceContainer::new_async(&handle).await;
    // Notify that the app is all set up:
    *handle.state::<IsAppRunning>().running.lock().await = true;
    println!("All services managed");
}
