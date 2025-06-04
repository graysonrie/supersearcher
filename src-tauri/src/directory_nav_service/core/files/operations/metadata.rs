use std::fs;

/// Will return `false` if the provided path is not a directory or the program was unable to open it
pub fn is_directory_accessible(path:&str)->bool{
    fs::read_dir(path).is_ok()
}
