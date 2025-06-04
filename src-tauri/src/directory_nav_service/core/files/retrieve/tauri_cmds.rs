use super::file_retriever;
use super::file_sorter;
use crate::directory_nav_service::dtos::get_files_dtos::GetFilesParamsDTO;
use crate::shared::models::sys_file_model::SystemFileModel;

use super::helper;
use std::path::Path;
use tauri::AppHandle;
use tauri::Emitter;

#[tauri::command]
pub async fn get_files_as_models(
    directory: String,
    params: GetFilesParamsDTO,
    app_handle: AppHandle,
) -> Result<(), String> {
    let path = Path::new(&directory);

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
            let mut files_to_add = Vec::new();
            file_retriever::read_files_incremental(path, |fp| {
                if let Some(model) = helper::create_file_model_from_path(fp) {
                    if file_retriever::should_include_file(&model, &params) {
                        emit_file(&app_handle, &model);
                        files_to_add.push(model);
                    }
                }
            })
            .map_err(|err| err.to_string())?;
    //     }
    // }

    Ok(())
}

fn emit_file(handle: &AppHandle, file: &SystemFileModel) {
    handle.emit("sys_file_model", &file).unwrap_or_default();
}
