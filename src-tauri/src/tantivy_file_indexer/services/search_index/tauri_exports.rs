use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

use crate::{
    shared::models::{emit_metadata_model::EmitMetadataModel, sys_file_model::SystemFileModel},
    tantivy_file_indexer::dtos::{
            search_params_dto::SearchParamsDTO, streaming_search_dto::StreamingSearchParamsDTO,
        },
};

use super::{service::SearchIndexService, services::task_manager::TaskManagerService};

/**
The frontent expects SystemFileModels, so we will map the Tantivy models to this
*/
#[tauri::command]
pub async fn search_index_query(
    params: SearchParamsDTO,
    service: State<'_, Arc<SearchIndexService>>,
) -> Result<Vec<SystemFileModel>, String> {
    let service = Arc::clone(&service);

    let handle = tokio::task::spawn(async move {
        match service.query(&params) {
            Ok(result) => Ok(result
                .into_iter()
                .map(|x| x.into())
                .collect::<Vec<SystemFileModel>>()),
            Err(err) => Err(err.to_string()),
        }
    });

    // Await the result from the spawned task
    match handle.await {
        Ok(res) => res,
        Err(err) => Err(format!("Task failed: {}", err)),
    }
}

// TODO: you may be able to remove this if organized querying is superior
/// Emits an event in the format {STREAM_IDENTIFIER}:search_result to the frontend
#[tauri::command]
pub async fn search_index_query_streaming(
    params: StreamingSearchParamsDTO,
    app_handle: AppHandle,
    search_service: State<'_, Arc<SearchIndexService>>,
    task_manager: State<'_, Arc<TaskManagerService>>,
) -> Result<(), String> {
    let event_name = format!("{}:search_result", params.stream_identifier);
    let search_service_clone = Arc::clone(&search_service);

    let emit_metadata = params.params.file_path.clone().unwrap_or(String::from(""));

    task_manager
        .task
        .run(search_service_clone.streaming_query(params, move |files| {
            let sys_models: Vec<SystemFileModel> = files.into_iter().map(|x| x.into()).collect();
            let model_output = EmitMetadataModel::new(sys_models, &emit_metadata);

            match app_handle.emit(&event_name, model_output) {
                Ok(_) => {}
                Err(err) => println!("{}", err),
            }
        }))
        .await? // Because the task could fail due to being cancelled
        .map_err(|err| err.to_string())?; // Because the actual function running returns a Result

    Ok(())
}

#[tauri::command]
pub async fn search_index_query_streaming_organized(
    params: StreamingSearchParamsDTO,
    app_handle: AppHandle,
    search_service: State<'_, Arc<SearchIndexService>>,
    task_manager: State<'_, Arc<TaskManagerService>>,
) -> Result<(), String> {
    let event_name = format!("{}:search_result", params.stream_identifier);
    let search_service_clone = Arc::clone(&search_service);

    // Emit the file path since it gets used as the search query.
    // The frontend will check and ensure that only events emitted with the correct search query will get shown to the user
    let emit_metadata = params.params.file_path.clone().unwrap_or(String::from(""));

    task_manager
        .task
        .run(
            search_service_clone.streaming_query_organized(params, move |files| {
                // The frontend expects the payload to be wrapped in a EmitMetadataModel
                let model_output = EmitMetadataModel::new(files, &emit_metadata);

                match app_handle.emit(&event_name, model_output) {
                    Ok(_) => {}
                    Err(err) => println!("{}", err),
                }
            }),
        )
        .await?;

    Ok(())
}

/// Can be handy for changing the fields of a file, such as the popularity, to some other value
#[tauri::command]
pub async fn upsert_file_to_index(
    file: SystemFileModel,
    search_service: State<'_, Arc<SearchIndexService>>,
) -> Result<(), String> {
    search_service.upsert_file_to_index(file).await
}

#[tauri::command]
pub async fn get_file_from_index(
    file: SystemFileModel,
    search_service: State<'_, Arc<SearchIndexService>>,
) -> Result<Option<SystemFileModel>, String> {
    Ok(search_service.get_file_from_index(file).await)
}

#[tauri::command]
pub async fn validate_file_exists(
    path: String,
    search_service: State<'_, Arc<SearchIndexService>>,
) -> Result<bool, String> {
    search_service.validate_file_exists(&path).await.map_err(|err| err.to_string())
}

