use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct DriveModel {
    pub name: String,
    pub label: Option<String>,
    pub total_space: u64,
    pub available_space: u64,
}
