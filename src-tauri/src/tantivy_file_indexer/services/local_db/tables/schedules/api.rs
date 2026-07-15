use std::{path::Path, sync::Arc};

use chrono::NaiveDateTime;
use sea_orm::*;
use tokio::sync::RwLock;

use crate::tantivy_file_indexer::{
    services::local_db::{
        table_creator::generate_table_lenient, tables::schedules::entities::schedule_entry,
    },
    util::path::{is_path_under_whitelist_root, normalize_directory_path},
};

pub struct ScheduleTable {
    db: Arc<DatabaseConnection>,
    loaded_schedules: RwLock<Vec<schedule_entry::Model>>,
}

impl ScheduleTable {
    pub async fn new_async(db: Arc<DatabaseConnection>) -> Self {
        generate_table_lenient(&db, schedule_entry::Entity).await;

        let schedules = Self::get_all_schedules(&db)
            .await
            .expect("failed to get initial schedules");

        Self {
            db,
            loaded_schedules: RwLock::new(schedules),
        }
    }

    /// checks to see if the given time falls under the range for the schedule.
    /// You should be using this to check to see if a directory should be pushed to the crawler queue.
    /// If the result of this is `None` then you should push it to the queue.
    ///
    /// Returns `None` if there is no schedule for that directory OR if the schedule is outside the range.
    ///
    /// In the special case that the schedule exists but the current `time` is AHEAD of the schedule -- that
    /// is, `time` > `first_indexed_time` + `duration`, it will set the
    /// `first_indexed_time` to the current time, putting the schedule back into effect
    ///
    /// In the case that the schedule exists but the `time` is BEHIND the `first_indexed_time` of the schedule,
    /// it will return `None`
    ///
    /// Otherwise, if `time` is BETWEEN `first_indexed_time` and `duration`, it will return the schedule
    pub async fn is_time_under_effect_of_a_schedule(
        &self,
        for_directory: impl AsRef<Path>,
        time: chrono::DateTime<chrono::Utc>,
    ) -> Result<Option<schedule_entry::Model>, DbErr> {
        if let Some(schedule) = self.get_schedule_for_directory(for_directory).await? {
            let first_indexed_time: chrono::prelude::DateTime<chrono::Utc> =
                chrono::DateTime::from_naive_utc_and_offset(
                    schedule.first_indexed_time,
                    chrono::Utc,
                );
            let schedule_end_time = first_indexed_time + schedule.duration.clone().into_chrono();
            if time > first_indexed_time && time < schedule_end_time {
                return Ok(Some(schedule));
            }
            if time <= first_indexed_time {
                // In this case, we are looking at a file
                //TODO
            }
        }
        Ok(None)
    }

    /// Finds all schedules for the for_directory (there should just be one anyway) and sets their
    /// `first_indexed_time` field to the current time
    pub async fn set_schedule_first_indexed_time(
        &self,
        for_directory: impl AsRef<Path>,
    ) -> Result<(), DbErr> {
        schedule_entry::Entity::update_many()
            .filter(schedule_entry::Column::ForDirectory.eq(for_directory.as_ref().to_str()))
            .col_expr(
                schedule_entry::Column::FirstIndexedTime,
                sea_orm::sea_query::SimpleExpr::Value(chrono::Utc::now().naive_utc().into()),
            )
            .exec(&*self.db)
            .await?;

        self.refresh_loaded_schedules().await?;

        Ok(())
    }

    pub async fn add_schedule(&self, model: schedule_entry::ActiveModel) -> Result<(), DbErr> {
        schedule_entry::Entity::insert(model)
            .exec(&*self.db)
            .await?;

        self.refresh_loaded_schedules().await?;
        Ok(())
    }

    pub async fn get_all_schedules(
        db: &DatabaseConnection,
    ) -> Result<Vec<schedule_entry::Model>, DbErr> {
        schedule_entry::Entity::find().all(db).await
    }

    pub async fn refresh_loaded_schedules(&self) -> Result<(), DbErr> {
        let schedules = Self::get_all_schedules(&self.db).await?;

        let mut lock = self.loaded_schedules.write().await;
        *lock = schedules;
        Ok(())
    }

    /// Deletes all schedules for a given directory
    pub async fn delete_schedule(&self, for_directory: impl AsRef<Path>) -> Result<(), DbErr> {
        schedule_entry::Entity::delete_many()
            .filter(
                schedule_entry::Column::ForDirectory
                    .eq(for_directory.as_ref().to_string_lossy().to_string()),
            )
            .exec(&*self.db)
            .await?;

        self.refresh_loaded_schedules().await?;
        Ok(())
    }

    /// Returns the most specific schedule that covers `for_directory`.
    ///
    /// A schedule matches when its directory is exactly `for_directory` or an ancestor of it.
    /// Among matches, the closest (longest path) wins.
    ///
    /// NOTE: this checks the `loaded_schedules` field, so it is expected to be up-to-date
    async fn get_schedule_for_directory(
        &self,
        for_directory: impl AsRef<Path>,
    ) -> Result<Option<schedule_entry::Model>, DbErr> {
        let path = for_directory.as_ref();
        let schedules = self.loaded_schedules.read().await;

        Ok(schedules
            .iter()
            .filter(|schedule| {
                is_path_under_whitelist_root(path, std::slice::from_ref(&schedule.for_directory))
            })
            .max_by_key(|schedule| normalize_directory_path(&schedule.for_directory).len())
            .cloned())
    }

    /// If an error happens along the way, it is ignored, so the schedule doesn't get applied and None is returned
    pub async fn compute_allow_reindexing_after_time(
        &self,
        dir_path: impl AsRef<Path>,
    ) -> Option<NaiveDateTime> {
        match self.get_schedule_for_directory(dir_path).await {
            Ok(opt_schedule) => opt_schedule.map(|schedule| {
                let now = chrono::Utc::now().naive_utc();
                let elapsed = now - schedule.first_indexed_time;
                now + (schedule.duration.into_chrono() - elapsed)
            }),
            Err(e) => {
                eprintln!(
                    "Error computing reindexing time in compute_allow_reindexing_after_time: {}",
                    e
                );
                None
            }
        }
    }
}
