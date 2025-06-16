use std::path::Path;

use tauri::{AppHandle, Emitter};

use crate::{
    directory_nav_service::{
        core::files::retrieve::{file_retriever, helper, models::Session},
        dtos::get_files_dtos::GetFilesParamsDTO,
    },
    shared::models::{emit_metadata_model::EmitMetadataModel, sys_file_model::SystemFileModel},
    tantivy_file_indexer::shared::cancel_task::CancellableTask,
};

pub struct FileRetrieverService {
    app_handle: AppHandle,
    pub get_files_task: CancellableTask,
    // TODO: implement
    pub sessions: Vec<Session>,
}

impl FileRetrieverService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            get_files_task: CancellableTask::new(),
            sessions: Vec::new(),
        }
    }
    pub async fn run_get_files_as_models(&self, directory: String, params: GetFilesParamsDTO) {
        // First cancel any existing task
        self.get_files_task.cancel().await;

        let handle = self.app_handle.clone();

        let _handle = self.get_files_task.run(tokio::spawn(async move {
            let result = get_files_as_models(directory, params, handle).await;
            if let Err(err) = result {
                println!("Error when getting files as models: {}", err);
            }
        }));
    }
}

/// Emits with this signature: "{directory_ident}:sys_file_model"
///
/// Where `directory_ident` is the exact same as a full path to a normal directory except all of the slashes are replaced with a double colon
///
/// Returns the number of files that were found in that directory
async fn get_files_as_models(
    directory: String,
    params: GetFilesParamsDTO,
    app_handle: AppHandle,
) -> Result<i32, String> {
    let path = Path::new(&directory);
    let dir_ident = dir_to_ident(&directory);
    let dir_ident = remove_non_alphanumeric(&dir_ident);

    // TODO: implement sort logic

    let mut num_files = 0;
    file_retriever::read_files_incremental(path, |fp| {
        if let Some(model) = helper::create_file_model_from_path(fp) {
            if file_retriever::should_include_file(&model, &params) {
                emit_file(&app_handle, &model, &dir_ident);
                num_files += 1;
            }
        }
    })
    .map_err(|err| err.to_string())?;

    Ok(num_files)
}

fn emit_file(handle: &AppHandle, file: &SystemFileModel, session_ident: &str) {
    // Ident used to be "sys_file_model"
    let event_name = "file_retriever:file";
    let emit_model = EmitMetadataModel::new(file, session_ident);

    handle.emit(event_name, &emit_model).unwrap_or_default();
}

fn remove_non_alphanumeric(ident: &str) -> String {
    ident
        .chars()
        .filter(|c| (c.is_alphanumeric() || *c == '-' || *c == '/' || *c == ':' || *c == '_'))
        .collect()
}

fn dir_to_ident(dir: &str) -> String {
    dir.replace("\\", "/")
}
