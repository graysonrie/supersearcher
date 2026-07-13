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

/// Trim trailing slashes and normalize separators for comparison.
pub fn normalize_directory_path(path: &str) -> String {
    path.trim_end_matches(['\\', '/'])
        .replace('/', "\\")
        .to_ascii_lowercase()
}

/// Returns true if `path` is the same as or a subdirectory of any entry in `whitelist`.
pub fn is_path_under_whitelist_root(path: &Path, whitelist: &[String]) -> bool {
    let path_normalized = normalize_directory_path(&path.to_string_lossy());

    whitelist.iter().any(|root| {
        let root_normalized = normalize_directory_path(root);

        if path_normalized == root_normalized {
            return true;
        }

        let root_prefix = format!("{}\\", root_normalized);

        path_normalized.starts_with(&root_prefix)
    })
}

/// Empty whitelist means all directories are allowed.
pub fn is_directory_whitelisted(path: &Path, whitelist: &[String]) -> bool {
    if whitelist.is_empty() {
        return true;
    }

    is_path_under_whitelist_root(path, whitelist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn normalize_directory_path_trims_trailing_slashes() {
        assert_eq!(normalize_directory_path("C:\\"), "c:");
        assert_eq!(normalize_directory_path("C:"), "c:");
        assert_eq!(normalize_directory_path("C:/Users/"), "c:\\users");
    }

    #[test]
    fn drive_roots_are_equivalent() {
        let whitelist = vec!["C:".to_string()];
        assert!(is_path_under_whitelist_root(Path::new("C:"), &whitelist));
        assert!(is_path_under_whitelist_root(Path::new("C:\\"), &whitelist));
        assert!(is_path_under_whitelist_root(
            Path::new("C:\\Users"),
            &whitelist
        ));
    }

    #[test]
    fn nested_directories_match_with_boundary() {
        let whitelist = vec!["C:\\Users".to_string()];
        assert!(is_path_under_whitelist_root(
            Path::new("C:\\Users\\foo"),
            &whitelist
        ));
        assert!(!is_path_under_whitelist_root(
            Path::new("C:\\UsersBackup"),
            &whitelist
        ));
        assert!(!is_path_under_whitelist_root(
            Path::new("C:\\Windows"),
            &whitelist
        ));
    }

    #[test]
    fn empty_whitelist_allows_all() {
        assert!(is_directory_whitelisted(Path::new("C:\\Windows"), &[]));
    }

    #[test]
    fn non_empty_whitelist_blocks_unlisted_roots() {
        let whitelist = vec!["D:".to_string()];
        assert!(!is_directory_whitelisted(Path::new("C:\\"), &whitelist));
        assert!(is_directory_whitelisted(Path::new("D:\\Games"), &whitelist));
    }

    #[test]
    fn forward_slash_whitelist_matches_windows_paths() {
        let whitelist = vec!["S:/".to_string()];
        assert!(is_directory_whitelisted(Path::new("S:\\"), &whitelist));
        assert!(is_directory_whitelisted(Path::new("S:\\Games"), &whitelist));
        assert!(!is_directory_whitelisted(Path::new("X:\\"), &whitelist));
    }
}
