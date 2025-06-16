use std::{path::Path, sync::Arc, time::Duration};

use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;

use crate::{
    directory_nav_service::{
        core::files::retrieve::{file_retriever, helper},
        dtos::get_files_dtos::GetFilesParamsDTO,
    },
    shared::models::sys_file_model::SystemFileModel,
    tantivy_file_indexer::shared::cancel_task::CancellableTask,
};

pub struct FileRetrieverService {
    app_handle: AppHandle,
    pub get_files_task: CancellableTask,
    pub active_dir: Arc<RwLock<Option<String>>>,
}

impl FileRetrieverService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            get_files_task: CancellableTask::new(),
            active_dir: Arc::new(RwLock::new(None)),
        }
    }
    pub async fn run_get_files_as_models(&self, directory: String, params: GetFilesParamsDTO) {
        // First cancel any existing task
        self.get_files_task.cancel().await;
        {
            let mut active_dir_lock = self.active_dir.write().await;
            *active_dir_lock = Some(directory.clone());
        }

        let handle = self.app_handle.clone();
        let active_dir = Arc::clone(&self.active_dir);

        if let Err(e) = self
            .get_files_task
            .run(tokio::spawn(async move {
                let result = get_files_as_models(directory, params, handle, active_dir).await;
                if let Err(err) = result {
                    println!("Error when getting files as models: {}", err);
                }
            }))
            .await
        {
            println!("Get files task error: {}", e);
        }
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
    active_dir: Arc<RwLock<Option<String>>>,
) -> Result<i32, String> {
    let path = Path::new(&directory);

    // Output files as we get to them
    let mut num_files = 0;
    file_retriever::read_files_incremental_async(path, |fp| {
        let params = params.clone();
        let app_handle = app_handle.clone();
        let directory = directory.clone();
        let active_dir = Arc::clone(&active_dir);
        Box::pin(async move {
            if let Some(ref active_dir) = *active_dir.read().await {
                if directory != *active_dir {
                    // Cancel early here because for whatever reason the cancellable task does not seem to do it
                    return;
                }
            }
            if let Some(model) = helper::create_file_model_from_path(fp) {
                if file_retriever::should_include_file(&model, &params) {
                    emit_file(&app_handle, &model);
                    num_files += 1;
                    // TODO: somewhat arbitrary number. Maybe leave up to user preference depending
                    // on what their conputer can handle
                    tokio::time::sleep(Duration::from_millis(5)).await;
                }
            }
        })
    })
    .await
    .map_err(|err| err.to_string())?;

    Ok(num_files)
}

fn emit_file(handle: &AppHandle, file: &SystemFileModel) {
    let ident = "sys_file_model";

    handle.emit(ident, &file).unwrap_or_default();
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
