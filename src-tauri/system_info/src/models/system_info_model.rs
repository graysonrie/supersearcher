use serde::{Deserialize, Serialize};

/// Information about the current user's system
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct SystemInfoModel {
    pub home_directory_path: Option<String>,
    pub desktop_directory_path: Option<String>,
    pub downloads_directory_path: Option<String>,
    pub documents_directory_path: Option<String>,
    pub pictures_directory_path: Option<String>,
}
