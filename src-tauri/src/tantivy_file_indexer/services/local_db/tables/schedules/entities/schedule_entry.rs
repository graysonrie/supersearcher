use chrono::Duration;
use sea_orm::{entity::prelude::*, ActiveValue::NotSet, Set};

use crate::tantivy_file_indexer::services::local_db::models::ScheduleModel;
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "schedules")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i32,

    /// A path to the directory
    pub for_directory: String,

    /// How often the schedule should run (ex: every 30 days)
    pub duration: DurationMicros,

    /// [the crawlers] add a note on that schedule of the first TIME the item was indexed.
    /// When adding stuff to the recently indexed table, they do TODAYS_TIME +
    /// SCHEDULE_DURATION - FIRST_INDEXED_TIME
    ///
    /// Crawlers will set this value to the current time only IF:
    /// * The
    pub first_indexed_time: DateTime,
}

#[derive(Clone, Debug, PartialEq, Eq, DeriveValueType)]
pub struct DurationMicros(pub i64);

impl DurationMicros {
    pub fn from_chrono(duration: Duration) -> Option<Self> {
        duration.num_microseconds().map(Self)
    }

    pub fn into_chrono(self) -> Duration {
        Duration::microseconds(self.0)
    }
}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {}
impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        panic!("No relations")
    }
}
impl ActiveModelBehavior for ActiveModel {}

impl From<ScheduleModel> for ActiveModel {
    fn from(value: ScheduleModel) -> Self {
        ActiveModel {
            id: NotSet,
            for_directory: Set(value.for_directory),
            duration: Set(DurationMicros(value.duration_micros)),
            first_indexed_time: Set(chrono::Utc::now().naive_utc()),
        }
    }
}
