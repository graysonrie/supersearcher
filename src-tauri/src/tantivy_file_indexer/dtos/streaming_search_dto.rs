use serde::{Deserialize, Serialize};

use super::search_params_dto::SearchParamsDTO;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct StreamingSearchParamsDTO {
    pub stream_identifier: String,
    /// The number of queries to be called in total
    pub num_events: usize,
    /// The number of results to return initially
    pub starting_size: usize,
    pub params: SearchParamsDTO,
}
