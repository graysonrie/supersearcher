use std::path::{Component, Path};

/// Get the components of a path
///
/// # Arguments
///
/// * `path` - The path to get the components of
///
/// # Returns
///
/// The components of the path including the disk drive if we are on windows
pub fn get_path_components(path: &Path) -> Vec<String> {
    let mut components = Vec::new();

    for component in path.components() {
        let comp_str = match component {
            Component::Prefix(prefix) => prefix.as_os_str().to_string_lossy().to_string(),
            Component::RootDir => String::from("\\"),
            Component::CurDir => String::from("."),
            Component::ParentDir => String::from(".."),
            Component::Normal(c) => c.to_string_lossy().to_string(),
        };
        components.push(comp_str);
    }

    components
}
