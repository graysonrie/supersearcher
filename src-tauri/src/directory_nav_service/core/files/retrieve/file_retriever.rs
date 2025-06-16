use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::{
    directory_nav_service::{
        dtos::get_files_dtos::GetFilesParamsDTO, util::metadata_inspector::is_hidden,
    },
    shared::models::sys_file_model::SystemFileModel,
};

/** Where the `PathBuf` in the closure represents the current path getting read */
pub fn read_files_incremental<F>(
    dir_path: &Path,
    mut for_each_file: F,
) -> Result<(), std::io::Error>
where
    F: FnMut(PathBuf),
{
    let read = fs::read_dir(dir_path)?;
    for entry in read.flatten() {
        let path = entry.path();
        for_each_file(path);
    }
    Ok(())
}

/** Whether or not the file meets the criteria specified in the parameters */
pub fn should_include_file(file: &SystemFileModel, params: &GetFilesParamsDTO) -> bool {
    let path = Path::new(&file.file_path);
    if !params.show_hidden && is_hidden(path) {
        return false;
    }
    if let Some(ref sort_params) = params.sort_by {
        if let Some(ref date) = sort_params.date_created_range {
            if file.date_created < date.start || file.date_created > date.end {
                return false;
            }
        }
        if let Some(ref date) = sort_params.date_modified_range {
            if file.date_modified < date.start || file.date_modified > date.end {
                return false;
            }
        }
        if !sort_params.extensions.is_empty() {
            if let Some(extension) = file.get_ext() {
                // Exclude all files without the specified extension
                let extension = extension.to_lowercase();
                if !sort_params
                    .extensions
                    .iter()
                    .any(|ext| ext.to_lowercase() == extension)
                {
                    return false;
                }
            }
        }
        if let Some(files_only) = sort_params.files_only{
            if (file.is_dir() && files_only) ||  (!file.is_dir() && !files_only){
                return false;
            }
        }
    }
    true
}
