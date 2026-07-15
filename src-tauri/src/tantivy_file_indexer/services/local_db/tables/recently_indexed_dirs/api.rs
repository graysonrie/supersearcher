use std::sync::Arc;

use chrono::Utc;
use sea_orm::{ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, QueryFilter};
use sqlx::{Sqlite, Transaction};

use crate::tantivy_file_indexer::services::local_db::table_creator::generate_table;

use super::entities::recently_indexed_dir;

pub struct RecentlyIndexedDirectoriesTable {
    db: Arc<DatabaseConnection>,
}

impl RecentlyIndexedDirectoriesTable {
    pub async fn new_async(db: Arc<DatabaseConnection>) -> Self {
        if let Err(e) = generate_table(&db, recently_indexed_dir::Entity).await {
            eprintln!("Error generating recently indexed dir table: {e}");

            if let Err(table_err) = db
                .execute_unprepared(
                    "ALTER TABLE recently_indexed ADD COLUMN allow_reindexing_after_time TEXT",
                )
                .await
            {
                eprintln!("Error adding allow_reindexing_after_time column: {table_err}");
            }
        }

        Self { db }
    }

    pub async fn upsert_many(
        &self,
        models: &[recently_indexed_dir::Model],
    ) -> Result<(), sqlx::Error> {
        // Start a transaction
        let mut transaction: Transaction<'_, Sqlite> =
            self.db.get_sqlite_connection_pool().begin().await?;

        // Raw SQL is needed because SQLite is picky about on conflict operations
        // Prepare raw SQL for upsert
        let query = r#"
            INSERT INTO recently_indexed (path, time)
            VALUES (?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET
                time = excluded.time;
        "#;

        // Execute the query for each model
        for model in models {
            sqlx::query(query)
                .bind(&model.path)
                .bind(model.time)
                .bind(model.allow_reindexing_after_time)
                .execute(&mut *transaction)
                .await?;
        }

        // Commit the transaction
        transaction.commit().await?;
        Ok(())
    }

    pub async fn contains_dir(&self, dir_path: String) -> Result<bool, sea_orm::DbErr> {
        let exists = recently_indexed_dir::Entity::find()
            .filter(recently_indexed_dir::Column::Path.eq(dir_path))
            .one(&*self.db)
            .await?
            .is_some();
        Ok(exists)
    }

    /**
    Returns the number of files that were removed

    `cutoff_time` is a value in minutes
    */
    pub async fn refresh(&self, cutoff_time: f64) -> Result<u64, sea_orm::DbErr> {
        // removes old entries
        // Todo: add more sophisticated logic
        let now = Utc::now().timestamp();

        // Calculate the cutoff time (5 minutes ago)
        let cutoff_time = now - ((cutoff_time * 60.0) as i64);

        let delete = recently_indexed_dir::Entity::delete_many()
            .filter(recently_indexed_dir::Column::Time.lt(cutoff_time))
            .exec(&*self.db)
            .await?;

        Ok(delete.rows_affected)
    }
}
