use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct VectorSearchParamsModel {
    pub query: String,
    pub collection: String,
}
