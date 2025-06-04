use crate::{get_parent_directory, shared::models::sys_file_model::SystemFileModel};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(tantivy_ext::TantivySearchIndex, Clone, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct TantivyFileModel {
    #[tantivy_ext("primary_key")]
    /// This field is the same as the `file_path` field, but not tokenized and just acts as a primary key
    pub file_path_string: tantivy_ext::FastStr,
    /// This field is tokenized and used for searches
    pub file_path: tantivy_ext::Tokenized,
    pub parent_directory: tantivy_ext::FastStr,
    pub date_modified: tantivy_ext::Date,
    pub date_created: tantivy_ext::Date,
    pub score: tantivy_ext::Score,
    pub popularity: tantivy_ext::FastF64,
}

impl From<SystemFileModel> for TantivyFileModel {
    fn from(value: SystemFileModel) -> TantivyFileModel {
        let parent_directory = get_parent_directory(&value.file_path);
        TantivyFileModel {
            file_path_string: value.file_path.clone().into(),
            file_path: value.file_path.into(),
            parent_directory: parent_directory.into(),
            date_modified: value.date_modified.into(),
            date_created: value.date_created.into(),
            score: 0.0.into(),
            popularity: 0.0.into(),
        }
    }
}

impl From<TantivyFileModel> for SystemFileModel {
    fn from(value: TantivyFileModel) -> SystemFileModel {
        let file_path_str = value.file_path.tantivy_val();
        let path = Path::new(&file_path_str);
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        SystemFileModel {
            name,
            file_path: value.file_path.tantivy_val(),
            date_modified: value.date_modified.into(),
            date_created: value.date_created.into(),
            score: value.score.tantivy_val(),
            size: 0, //TODO: ensure this is not needed
            is_directory: path.is_dir(),
        }
    }
}
