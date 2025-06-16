use chrono::Utc;

use crate::shared::converters::system_time_to_chrono_datetime;
use crate::shared::models::sys_file_model::SystemFileModel;
use std::{os::windows::fs::MetadataExt, path::PathBuf, time::SystemTime};

pub fn create_file_model_from_path(file_path: PathBuf) -> Option<SystemFileModel> {
    match file_path.metadata() {
        Ok(meta) => {
            let is_directory = meta.is_dir();
            let size = meta.file_size();
            let file_name = file_path.file_name()?.to_string_lossy().to_string();

            let date_modified = sys_date_to_chrono(meta.modified());
            let date_created = sys_date_to_chrono(meta.created());

            Some(SystemFileModel {
                name: file_name,
                file_path: file_path.to_string_lossy().to_string(),
                date_modified,
                date_created,
                size,
                score: 0.0,
                is_directory,
            })
        }
        Err(err) => {
            println!("Error accessing file metadata: {}", err);
            None
        }
    }
}

fn sys_date_to_chrono(date: std::io::Result<SystemTime>) -> chrono::DateTime<Utc> {
    match date {
        Ok(sys_time) => system_time_to_chrono_datetime(sys_time).expect(&format!(
            "Error converting system time to chrono time. Given time: {:?}",
            date.unwrap()
        )),
        Err(err) => {
            println!("Error accessing date kn file: {}", err);
            chrono::Utc::now()
        }
    }
}
