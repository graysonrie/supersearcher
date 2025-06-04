use serde::{Deserialize, Serialize};

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct AddToCrawlerQueueDTO {
    pub dir_path: String,
    pub priority: u32,
}
