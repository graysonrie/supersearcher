use super::entities::indexed_dir;
use crate::tantivy_file_indexer::services::local_db::table_creator::generate_table_lenient;
use sea_orm::{
    prelude::Expr, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect,
};
use sqlx::{Sqlite, Transaction};
use std::{collections::HashMap, sync::Arc};

#[derive(Clone)]
pub struct CrawlerQueueTable {
    db: Arc<DatabaseConnection>,
}

impl CrawlerQueueTable {
    pub async fn new_async(db: Arc<DatabaseConnection>) -> Self {
        generate_table_lenient(&db, indexed_dir::Entity).await;

        Self { db }
    }

    pub async fn upsert_many(&self, models: &[indexed_dir::Model]) -> Result<(), sqlx::Error> {
        // Start a transaction
        let mut transaction: Transaction<'_, Sqlite> =
            self.db.get_sqlite_connection_pool().begin().await?;

        // Raw SQL is needed because SQLite is picky about on conflict operations
        // Prepare raw SQL for upsert
        let query = r#"
            INSERT INTO crawler_queue (path, priority, taken, added_at)
            VALUES (?, ?, ?, ?) 
            ON CONFLICT(path) DO UPDATE SET
                priority = excluded.priority,
                taken = excluded.taken,
                added_at = excluded.added_at
        "#;

        // Execute the query for each model
        for model in models {
            sqlx::query(query)
                .bind(&model.path)
                .bind(model.priority)
                .bind(model.taken)
                .bind(model.added_at)
                .execute(&mut *transaction)
                .await?;
        }

        // Commit the transaction
        transaction.commit().await?;
        Ok(())
    }

    /// Completely removes the given models from the database
    ///
    /// Returns the number of items that were deleted
    pub async fn delete_many(&self, models: &[indexed_dir::Model]) -> Result<u64, sea_orm::DbErr> {
        let paths_to_delete: Vec<String> = models.iter().map(|entry| entry.path.clone()).collect();

        // Delete the fetched entries using the 'IN' filter
        let result = indexed_dir::Entity::delete_many()
            .filter(indexed_dir::Column::Path.is_in(paths_to_delete))
            .exec(&*self.db)
            .await?;
        Ok(result.rows_affected)
    }

    /// Retrieves the next most popular directories in the collection without removing them
    pub async fn get_many(&self, amount: u64) -> Result<Vec<indexed_dir::Model>, sea_orm::DbErr> {
        let next_entries = self.get_next_entries(amount).await?;

        Ok(next_entries)
    }

    /**
    Retrieve the top n entries from the database
    */
    pub async fn view_taken_files(
        &self,
        limit: u64,
    ) -> Result<Vec<indexed_dir::Model>, sea_orm::DbErr> {
        indexed_dir::Entity::find()
            // .filter(indexed_dir::Column::Taken.eq(false))
            .order_by_desc(indexed_dir::Column::AddedAt)
            .limit(limit)
            .all(&*self.db)
            .await
    }

    /**
    ### Example output:

    Priority 1: 2 items

    Priority 2: 1 items

    Priority 3: 3 items
     */
    pub async fn get_priority_counts(&self) -> Result<HashMap<u32, i64>, sea_orm::DbErr> {
        use indexed_dir::Entity as IndexedDir;

        let results = IndexedDir::find()
            .select_only() // Only select specific columns
            .column(indexed_dir::Column::Priority) // Select the priority column
            .column_as(Expr::col(indexed_dir::Column::Priority).count(), "count") // Count occurrences
            .group_by(indexed_dir::Column::Priority) // Group by priority
            .into_tuple::<(u32, i64)>() // Convert the result into (priority, count) tuples
            .all(&*self.db)
            .await?;

        // Convert the results into a HashMap for easier use
        let priority_counts = results.into_iter().collect::<HashMap<u32, i64>>();

        Ok(priority_counts)
    }

    pub async fn mark_all_as_not_taken(&self) -> Result<(), sea_orm::DbErr> {
        indexed_dir::Entity::update_many()
            .col_expr(indexed_dir::Column::Taken, false.into())
            .exec(&*self.db)
            .await?;
        Ok(())
    }

    /// Finds the next most popular models from the database that aren't taken
    async fn get_next_entries(
        &self,
        amount: u64,
    ) -> Result<Vec<indexed_dir::Model>, sea_orm::DbErr> {
        indexed_dir::Entity::find()
            .filter(indexed_dir::Column::Taken.eq(false))
            .order_by_asc(indexed_dir::Column::Priority)
            // Order by ascending to ensure that lower numbers are nearer to the top (The lower the number, the higher the priority)
            .limit(amount)
            .all(&*self.db)
            .await
    }

    /// Example: passing in `is_taken` as true will set the `taken` field in all of the provided models to `true`
    pub async fn mark_taken(
        &self,
        models: &[indexed_dir::Model],
        is_taken: bool,
    ) -> Result<sea_orm::UpdateResult, sea_orm::DbErr> {
        let paths_to_modify: Vec<String> = models.iter().map(|entry| entry.path.clone()).collect();

        indexed_dir::Entity::update_many()
            .filter(indexed_dir::Column::Path.is_in(paths_to_modify))
            .col_expr(indexed_dir::Column::Taken, is_taken.into())
            .exec(&*self.db)
            .await
    }
}
