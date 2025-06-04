use std::path::Path;

/// Example:
///
/// Given `directory1/directory2/some_file.txt`, the function will return `directory1/directory2`
///
/// Given `directory1/directory2`, it will just return `directory1/directory2`
#[tauri::command]
pub fn format_path_into_dir(path: &str) -> Option<String> {
    let os_path = Path::new(path);

    if !os_path.is_dir() && os_path.extension().is_some() {
        return os_path
            .parent()
            .map(|x| Some(x.to_string_lossy().to_string()))
            .unwrap_or(None);
    }
    Some(path.to_string())
}
