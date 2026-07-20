use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct IndexScheduleModel {
    pub for_directory: String,
    pub interval_days: i32,
    pub last_run_at: Option<i64>,
}

impl From<crate::tantivy_file_indexer::services::local_db::tables::schedules::entities::schedule_entry::Model>
    for IndexScheduleModel
{
    fn from(value: crate::tantivy_file_indexer::services::local_db::tables::schedules::entities::schedule_entry::Model) -> Self {
        Self {
            for_directory: value.for_directory,
            interval_days: value.interval_days,
            last_run_at: value.last_run_at,
        }
    }
}
