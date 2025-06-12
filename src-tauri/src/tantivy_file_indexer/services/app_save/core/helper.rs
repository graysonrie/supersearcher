use std::{
    fs::{self},
    path::{Path, PathBuf},
};

pub fn get_file_path(app_path: &Path, file: &str) -> PathBuf {
    let new_path = app_path.join(file);

    if !app_path.exists() {
        fs::create_dir_all("DesktopSearch").expect("could not create DesktopSearch directory");
    }

    new_path
}
pub fn create_file(app_path: &Path, path: &str) -> PathBuf {
    let new_path = get_file_path(app_path, path);

    if !new_path.exists() {
        if let Some(parent) = Path::new(&new_path).parent() {
            fs::create_dir_all(parent).expect("failed to create directories");
        }
        fs::File::create(&new_path).expect("failed to create path");
    }
    new_path
}

/// Will completely erase the file at the location if it already exists and create a new one
pub fn create_or_overwrite_file(app_path: &Path, path: &str) -> PathBuf {
    let new_path = get_file_path(app_path, path);

    if let Some(parent) = Path::new(&new_path).parent() {
        fs::create_dir_all(parent).expect("failed to create directories");
    }
    fs::File::create(&new_path).expect("failed to create or overwrite file");
    new_path
}
