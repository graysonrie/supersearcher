use std::sync::Arc;
use tauri::{AppHandle, Manager};

use super::services::watcher::service::DirectoryWatcherService;

pub fn manage_state(handle: &AppHandle) {
    let png_cache = getfileicon::prelude::EasyPngCache::new(100);
    handle.manage(png_cache);
    handle.manage(Arc::new(DirectoryWatcherService::new()));
}
