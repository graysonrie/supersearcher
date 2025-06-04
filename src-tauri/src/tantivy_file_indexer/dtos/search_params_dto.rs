use serde::{Deserialize, Serialize};
use tantivy::time::OffsetDateTime;
use super::super::enums::search_query_type::SearchQueryType;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct SearchParamsDTO {
    pub name: Option<String>,
    pub metadata: Option<String>,
    pub date_modified_range: Option<DateRange>,
    pub date_created_range: Option<DateRange>,
    pub file_path: Option<String>,

    pub num_results: u32,
    pub query_type: SearchQueryType
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct DateRange {
    pub start: OffsetDateTime,
    pub end: OffsetDateTime,
}
