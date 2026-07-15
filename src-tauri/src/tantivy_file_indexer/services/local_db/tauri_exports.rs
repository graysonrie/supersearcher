use crate::tantivy_file_indexer::services::local_db::models::ScheduleModel;

use super::tables::crawler_queue::entities::indexed_dir;
use std::{collections::HashMap, sync::Arc};
use tauri::State;

use super::service::LocalDbService;

#[tauri::command]
pub async fn view_crawler_queue(
    limit: u64,
    service: State<'_, Arc<LocalDbService>>,
) -> Result<Vec<indexed_dir::Model>, String> {
    service
        .crawler_queue_table()
        .view_taken_files(limit)
        .await
        .map_err(|err| format!("Error viewing crawler queue: {}", err))
}

#[tauri::command]
pub async fn view_crawler_priority_counts(
    service: State<'_, Arc<LocalDbService>>,
) -> Result<HashMap<u32, i64>, String> {
    service
        .crawler_queue_table()
        .get_priority_counts()
        .await
        .map_err(|err| format!("Error viewing crawler priority counts: {}", err))
}

#[tauri::command]
pub async fn add_schedule(
    service: State<'_, Arc<LocalDbService>>,
    model: ScheduleModel,
) -> Result<(), String> {
    service
        .schedule_table()
        .add_schedule(model.into())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_schedule(
    service: State<'_, Arc<LocalDbService>>,
    for_directory: String,
) -> Result<(), String> {
    service
        .schedule_table()
        .delete_schedule(for_directory)
        .await
        .map_err(|e| e.to_string())
}
