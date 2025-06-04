use std::{path::Path, process::Command};

/// TODO: look at this in the future, as I think it only works on Windows for now.
///
/// Opens the location of the file in the OS native file explorer
pub fn open_in_explorer(path: &str) -> Result<(), String> {
    match Path::new(path).parent() {
        Some(dir) => {
            let path = Path::new(&dir);
            if path.exists() && path.is_dir() {
                Command::new("explorer")
                    .arg(path)
                    .spawn()
                    .map_err(|err| err.to_string())?;
            } else {
                eprintln!("Path does not exist or is not a directory.");
            }
            Ok(())
        }
        None => Err(format!(
            "Failed to get the location of {} and open it in the OS explorer",
            path
        )),
    }
}
