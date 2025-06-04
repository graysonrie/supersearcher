use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use winapi::um::fileapi::GetFileAttributesW;
use winapi::um::winnt::FILE_ATTRIBUTE_HIDDEN;

#[cfg(target_os = "windows")]
pub fn is_hidden(path: &Path) -> bool {
    // Convert the path to a wide string for Windows API compatibility
    let wide_path: Vec<u16> = OsStr::new(path)
        .encode_wide()
        .chain(Some(0)) // Null-terminate
        .collect();

    // Get the file attributes
    unsafe {
        let attributes = GetFileAttributesW(wide_path.as_ptr());
        if attributes == u32::MAX {
            // If GetFileAttributesW returns INVALID_FILE_ATTRIBUTES, an error occurred
            false
        } else {
            (attributes & FILE_ATTRIBUTE_HIDDEN) != 0
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn is_hidden(path: &Path) -> bool {
    path.to_str().map(|x| x.starts_with('.')).unwrap_or(false)
}
