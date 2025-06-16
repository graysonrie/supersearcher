use std::sync::Arc;

use crate::tantivy_file_indexer::services::app_save::service::AppSaveService;

use super::tables::{
    app_kv_store::api::AppKvStoreTable, crawler_queue::api::CrawlerQueueTable,
    recently_indexed_dirs::api::RecentlyIndexedDirectoriesTable,
};
use sea_orm::{ConnectionTrait, DatabaseConnection, Statement};
use sqlx::sqlite::SqlitePool;
use tauri::AppHandle;

pub struct LocalDbService {
    connection: Arc<DatabaseConnection>,
    recently_indexed_dirs_table: RecentlyIndexedDirectoriesTable,
    crawler_queue_table: CrawlerQueueTable,
    kv_store_table: AppKvStoreTable,
}

impl LocalDbService {
    // consider using a config here
    pub async fn new_async(save_service: &AppSaveService, app_handle: AppHandle) -> Self {
        let db_path = save_service.create_path("file_index.db");
        let db_url = format!("sqlite://{}", db_path.to_string_lossy());

        // Starts out as a SQLX pool, but 'into' is called to turn it into a Sea ORM database connection
        let db: Arc<DatabaseConnection> =
            Arc::new(SqlitePool::connect(&db_url).await.unwrap().into());

        // initialize the tables
        let recently_indexed_dirs_table =
            RecentlyIndexedDirectoriesTable::new_async(db.clone()).await;

        let crawler_queue_table = CrawlerQueueTable::new_async(db.clone()).await;

        let kv_store_table = AppKvStoreTable::new_async(db.clone(), app_handle).await;

        Self {
            connection: db,
            recently_indexed_dirs_table,
            crawler_queue_table,
            kv_store_table,
        }
    }

    pub fn recently_indexed_dirs_table(&self) -> &RecentlyIndexedDirectoriesTable {
        &self.recently_indexed_dirs_table
    }

    pub fn crawler_queue_table(&self) -> &CrawlerQueueTable {
        &self.crawler_queue_table
    }

    pub fn kv_store_table(&self) -> &AppKvStoreTable {
        &self.kv_store_table
    }

    /// Since SQLite doesn't automatically free unused memory, you can use this to shrink the size of the database
    pub async fn vacuum_database(&self) -> Result<(), sea_orm::DbErr> {
        // Execute the VACUUM command
        self.connection
            .execute(Statement::from_string(
                self.connection.get_database_backend(),
                "VACUUM;".to_owned(),
            ))
            .await?;
        Ok(())
    }
}
