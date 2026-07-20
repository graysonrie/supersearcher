use super::tables::crawler_queue::entities::indexed_dir;
use crate::tantivy_file_indexer::dtos::index_schedule::IndexScheduleModel;
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
pub async fn get_index_schedules(
    service: State<'_, Arc<LocalDbService>>,
) -> Result<Vec<IndexScheduleModel>, String> {
    service
        .schedule_table()
        .get_all_schedules()
        .await
        .map(|schedules| schedules.into_iter().map(IndexScheduleModel::from).collect())
        .map_err(|err| format!("Error getting index schedules: {}", err))
}

#[tauri::command]
pub async fn upsert_index_schedule(
    for_directory: String,
    interval_days: i32,
    service: State<'_, Arc<LocalDbService>>,
) -> Result<(), String> {
    if interval_days <= 0 {
        return Err("interval_days must be greater than 0".to_string());
    }

    service
        .schedule_table()
        .upsert_schedule(for_directory, interval_days)
        .await
        .map_err(|err| format!("Error upserting index schedule: {}", err))
}

#[tauri::command]
pub async fn remove_index_schedule(
    for_directory: String,
    service: State<'_, Arc<LocalDbService>>,
) -> Result<(), String> {
    service
        .schedule_table()
        .delete_schedule(for_directory)
        .await
        .map_err(|err| format!("Error removing index schedule: {}", err))
}
