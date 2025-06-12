use crate::directory_nav_service::core::files::retrieve::service::FileRetrieverService;
use crate::directory_nav_service::dtos::get_files_dtos::GetFilesParamsDTO;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_files_as_models(
    directory: String,
    params: GetFilesParamsDTO,
    retriever: State<'_, Arc<FileRetrieverService>>,
) -> Result<(), String> {
    retriever.run_get_files_as_models(directory, params).await;
    Ok(())
}
