use std::path::{Path, PathBuf};

pub fn get_directory_path(file_path: &str) -> Option<PathBuf> {
    let path = Path::new(file_path);
    path.parent().map(|p| p.to_path_buf())
}

pub fn get_root_path(file_path: &str) -> Option<&Path> {
    let path = Path::new(file_path);
    path.components().next().and_then(|comp| {
        if let std::path::Component::RootDir | std::path::Component::Prefix(_) = comp {
            Some(Path::new(comp.as_os_str()))
        } else {
            None
        }
    })
}
