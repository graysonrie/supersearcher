use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct GetIconDTO {
    pub base64_icon: String,
    pub width: u32,
    pub height: u32,
    pub default_icon: bool,
}
