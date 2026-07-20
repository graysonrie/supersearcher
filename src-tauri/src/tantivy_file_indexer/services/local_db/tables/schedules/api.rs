use std::{path::Path, sync::Arc};

use chrono::Utc;
use sea_orm::*;
use sqlx::{Sqlite, Transaction};
use tokio::sync::RwLock;

use crate::tantivy_file_indexer::{
    services::local_db::table_creator::generate_table_lenient,
    util::path::normalize_directory_path,
};

use super::entities::schedule_entry;

pub struct ScheduleTable {
    db: Arc<DatabaseConnection>,
    loaded_schedules: RwLock<Vec<schedule_entry::Model>>,
}

impl ScheduleTable {
    pub async fn new_async(db: Arc<DatabaseConnection>) -> Self {
        generate_table_lenient(&db, schedule_entry::Entity).await;

        let schedules = Self::fetch_all_schedules(&db)
            .await
            .unwrap_or_default();

        Self {
            db,
            loaded_schedules: RwLock::new(schedules),
        }
    }

    fn normalize_path(path: impl AsRef<Path>) -> String {
        normalize_directory_path(&path.as_ref().to_string_lossy())
    }

    pub async fn upsert_schedule(
        &self,
        for_directory: impl AsRef<Path>,
        interval_days: i32,
    ) -> Result<(), sea_orm::DbErr> {
        let normalized = Self::normalize_path(for_directory);

        let existing = self.get_schedule_by_directory(&normalized).await?;

        let last_run_at = existing.as_ref().and_then(|s| s.last_run_at);

        let mut transaction: Transaction<'_, Sqlite> = self
            .db
            .get_sqlite_connection_pool()
            .begin()
            .await
            .map_err(|err| sea_orm::DbErr::Custom(err.to_string()))?;

        let query = r#"
            INSERT INTO schedules (for_directory, interval_days, last_run_at)
            VALUES (?, ?, ?)
            ON CONFLICT(for_directory) DO UPDATE SET
                interval_days = excluded.interval_days;
        "#;

        sqlx::query(query)
            .bind(&normalized)
            .bind(interval_days)
            .bind(last_run_at)
            .execute(&mut *transaction)
            .await
            .map_err(|err| sea_orm::DbErr::Custom(err.to_string()))?;

        transaction.commit().await.map_err(|err| sea_orm::DbErr::Custom(err.to_string()))?;

        self.refresh_loaded_schedules().await
    }

    pub async fn get_all_schedules(&self) -> Result<Vec<schedule_entry::Model>, sea_orm::DbErr> {
        Self::fetch_all_schedules(&self.db).await
    }

    async fn fetch_all_schedules(
        db: &DatabaseConnection,
    ) -> Result<Vec<schedule_entry::Model>, sea_orm::DbErr> {
        schedule_entry::Entity::find().all(db).await
    }

    pub async fn delete_schedule(
        &self,
        for_directory: impl AsRef<Path>,
    ) -> Result<(), sea_orm::DbErr> {
        let normalized = Self::normalize_path(for_directory);

        schedule_entry::Entity::delete_many()
            .filter(schedule_entry::Column::ForDirectory.eq(normalized))
            .exec(&*self.db)
            .await?;

        self.refresh_loaded_schedules().await
    }

    pub async fn is_idle_push_allowed(&self, path: impl AsRef<Path>) -> Result<bool, sea_orm::DbErr> {
        let normalized = Self::normalize_path(path);

        let schedule = match self.get_schedule_by_directory(&normalized).await? {
            Some(schedule) => schedule,
            None => return Ok(true),
        };

        Ok(Self::is_due(&schedule))
    }

    pub async fn has_schedule(&self, path: impl AsRef<Path>) -> Result<bool, sea_orm::DbErr> {
        let normalized = Self::normalize_path(path);
        Ok(self
            .get_schedule_by_directory(&normalized)
            .await?
            .is_some())
    }

    pub async fn mark_run(&self, path: impl AsRef<Path>) -> Result<(), sea_orm::DbErr> {
        let normalized = Self::normalize_path(path);

        if self.get_schedule_by_directory(&normalized).await?.is_none() {
            return Ok(());
        }

        let now = Utc::now().timestamp();

        schedule_entry::Entity::update_many()
            .filter(schedule_entry::Column::ForDirectory.eq(&normalized))
            .col_expr(
                schedule_entry::Column::LastRunAt,
                sea_orm::sea_query::SimpleExpr::Value(now.into()),
            )
            .exec(&*self.db)
            .await?;

        self.refresh_loaded_schedules().await
    }

    fn is_due(schedule: &schedule_entry::Model) -> bool {
        match schedule.last_run_at {
            None => true,
            Some(last_run_at) => {
                let interval_secs = i64::from(schedule.interval_days) * 86_400;
                Utc::now().timestamp() >= last_run_at + interval_secs
            }
        }
    }

    async fn get_schedule_by_directory(
        &self,
        normalized: &str,
    ) -> Result<Option<schedule_entry::Model>, sea_orm::DbErr> {
        let schedules = self.loaded_schedules.read().await;
        Ok(schedules
            .iter()
            .find(|schedule| schedule.for_directory == normalized)
            .cloned())
    }

    async fn refresh_loaded_schedules(&self) -> Result<(), sea_orm::DbErr> {
        let schedules = Self::fetch_all_schedules(&self.db).await?;
        let mut lock = self.loaded_schedules.write().await;
        *lock = schedules;
        Ok(())
    }
}
