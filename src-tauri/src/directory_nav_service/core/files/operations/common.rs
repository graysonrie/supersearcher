use clipboard_win::{formats, get_clipboard, is_format_avail, set_clipboard, Clipboard, Setter};
use copypasta::{ClipboardContext, ClipboardProvider};
use std::fs;
use std::path::Path;

// Operations such as moving files, deleting, etc. the basics
// TODO: provide Tauri commands

/// Given that `source_path` points to a directory or file path, this function will move it into the `target_dir`
pub fn move_path_into_directory(target_dir: &Path, source_path: &Path) -> std::io::Result<()> {
    // Ensure the target directory exists
    if !target_dir.is_dir() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Target directory does not exist",
        ));
    }

    // Extract the file or directory name from the source path
    let file_name = source_path.file_name().ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "Source path does not have a valid file or directory name",
        )
    })?;

    // Build the destination path
    let destination = target_dir.join(file_name);
    fs::rename(source_path, destination)?;

    Ok(())
}

pub fn copy_paths_to_clipboard(paths: Vec<String>) -> Result<(), String> {
    let _clip = Clipboard::new_attempts(10).map_err(|e| e.to_string())?;
    // Open the clipboard and set the files
    formats::FileList
        .write_clipboard(&paths)
        .map_err(|e| e.to_string())?;

    println!("File paths copied to clipboard!");
    Ok(())
}

pub fn files_exist_in_clipboard() -> bool {
    is_format_avail(formats::FileList.into())
}

pub fn paste_files_to_directory(destination_dir: &str) -> Result<(), String> {
    // Open the clipboard
    let _clipboard = Clipboard::new_attempts(10).map_err(|e| e.to_string())?;
    // Ensure the clipboard contains a file list
    if !is_format_avail(formats::FileList.into()) {
        return Err("No files found in the clipboard".to_string());
    }

    // Read the file paths from the clipboard
    let file_paths: Vec<String> = get_clipboard(formats::FileList)
        .map_err(|e| e.to_string())?
        .into_iter()
        .collect();

    // Copy each file into the target directory
    for file_path in file_paths {
        let source_path = Path::new(&file_path);
        let file_name = source_path
            .file_name()
            .ok_or_else(|| format!("Invalid file path: {}", file_path))?;
        let target_path = Path::new(destination_dir).join(file_name);

        fs::copy(&source_path, &target_path)
            .map_err(|e| format!("Failed to copy file {}: {}", file_path, e))?;
    }

    println!("Files pasted into directory: {}", destination_dir);
    Ok(())
}

pub fn create_new_file(directory: &str, file_name: &str) -> Result<(), String> {
    let path = Path::new(directory).join(file_name);
    fs::File::create(path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn create_new_directory(directory: &str, directory_name: &str) -> Result<(), String> {
    let path = Path::new(directory).join(directory_name);
    fs::create_dir_all(path).map_err(|e| e.to_string())?;
    Ok(())
}

/// Moves the file into the recycle bin. Not permanently deleting it
pub fn delete_path(path: &str) -> Result<(), trash::Error> {
    trash::delete(path)
}
