use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct InlineQueryDTO {
    pub query: String,
}
