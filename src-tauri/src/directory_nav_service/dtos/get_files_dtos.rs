use serde::{Deserialize, Serialize};

use super::sort_files_by_dto::SortFilesByDTO;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct GetFilesParamsDTO{
    pub show_hidden: bool,
    pub sort_by: Option<SortFilesByDTO>
}
