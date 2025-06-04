use super::core::crawler_queue::filter;
use super::service::FileCrawlerService;
use crate::tantivy_file_indexer::dtos::add_to_crawler_queue::AddToCrawlerQueueDTO;
use std::{path::Path, sync::Arc};
use tauri::State;

#[tauri::command]
pub async fn add_dirs_to_crawler_queue(
    directories: Vec<AddToCrawlerQueueDTO>,
    service: State<'_, Arc<FileCrawlerService>>,
) -> Result<(), ()> {
    let directories = filter::filter_out_directories_to_add(directories);

    service
        .push_dirs(
            directories
                .into_iter()
                .map(|entry| (Path::new(&entry.dir_path).to_path_buf(), entry.priority))
                .collect(),
        )
        .await;
    Ok(())
}

/// Dispatch the file crawlers if they are not already active
#[tauri::command]
pub async fn dispatch_crawlers(service: State<'_, Arc<FileCrawlerService>>) -> Result<(), String> {
    service.dispatch_crawlers().await
}