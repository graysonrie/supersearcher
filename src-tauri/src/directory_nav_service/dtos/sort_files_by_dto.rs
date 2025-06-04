use serde::{Deserialize, Serialize};
use super::super::models::date_range::DateRange;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")] 
pub enum OldestNewest {
    Oldest,
    Newest,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")] 
pub enum LargestSmallest {
    Largest,
    Smallest,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct SortFilesByDTO{
    pub date_modified_range: Option<DateRange>,
    pub date_modified: Option<OldestNewest>,

    pub date_created_range: Option<DateRange>,
    pub date_created: Option<OldestNewest>,

    pub extensions: Vec<String>,

    pub size: Option<LargestSmallest>,

    /** If `false`, then the results will only include directories. If `None`, then nothing happens */
    pub files_only: Option<bool>
}