use std::{future::Future, path::Path, sync::Arc};

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
}

impl FileRetrieverService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            get_files_task: CancellableTask::new(),
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
        if let Err(e) = _handle.await {
            println!("Get files handle error: {}", e);
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
) -> Result<i32, String> {
    let path = Path::new(&directory);
    let dir_ident = dir_to_ident(&directory);

    // TODO: implement sort logic
    // match params.sort_by {
    //     Some(ref sort_params) => {
    //         // Files can't be output as we get to them, they must be preprocessed first
    //         let files =
    //             file_retriever::read_files_and_process(path).map_err(|err| err.to_string())?;
    //         let mut filtered: Vec<SystemFileModel> = files
    //             .into_iter()
    //             .filter(|file| file_retriever::should_include_file(file, &params))
    //             .collect();
    //         // Now we can sort the files:
    //         file_sorter::sort_files(&mut filtered, sort_params);
    //         for model in filtered.iter() {
    //             emit_file(&app_handle, model);
    //         }
    //     }
    //     None => {
    // Output files as we get to them
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
    //     }
    // }

    Ok(num_files)
}

fn emit_file(handle: &AppHandle, file: &SystemFileModel, directory_ident: &str) {
    let ident = "sys_file_model";

    handle.emit(&ident, &file).unwrap_or_default();
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
