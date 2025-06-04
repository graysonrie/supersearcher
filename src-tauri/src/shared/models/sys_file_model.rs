use std::{os::windows::fs::MetadataExt, path::{Path, PathBuf}};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::shared::converters::system_time_to_chrono_datetime;

// TODO: move this to the models folder
#[derive(Clone, Deserialize, Serialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct SystemFileModel {
    pub name: String,
    pub file_path: String,
    pub date_modified: DateTime<Utc>,
    pub date_created: DateTime<Utc>,
    /// The size of the file, in bytes
    pub size: u64,
    pub score: f32, // Consider making popularity more elaborate
    pub is_directory: bool,
}

impl SystemFileModel {
    pub fn try_new_from_meta(path: PathBuf, meta: &std::fs::Metadata) -> Result<Self,String> {
        let size = meta.file_size();

        let date_modified =
            system_time_to_chrono_datetime(meta.modified().map_err(|err| err.to_string())?);

        let date_created =
            system_time_to_chrono_datetime(meta.created().map_err(|err| err.to_string())?);

        let name = path
            .file_name()
            .ok_or("File name was badly formatted")
            .map_err(|err| err.to_string())?
            .to_string_lossy()
            .to_string();

        let model = SystemFileModel {
            name,
            file_path: path.to_string_lossy().to_string(),
            date_modified,
            date_created,
            size,
            score: 1.0, // Assuming score doesn't matter here
            is_directory: path.is_dir(),
        };
        Ok(model)
    }

    pub fn get_ext(&self)->Option<String>{
        let path = Path::new(&self.file_path);
        path.extension().map(|x|x.to_string_lossy().to_string())
    }

    pub fn is_dir(&self)->bool{
        let path = Path::new(&self.file_path);
        path.is_dir()
    }
}
