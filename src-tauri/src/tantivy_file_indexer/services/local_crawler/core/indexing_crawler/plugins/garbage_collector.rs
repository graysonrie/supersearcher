use std::{
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    time::Duration,
};

use tokio::task::JoinHandle;

use crate::tantivy_file_indexer::{
    services::local_db::{service::LocalDbService, tables::app_kv_store::api::AppKvStoreTable},
    shared::async_retry,
};

pub struct GarbageCollectorPlugin {
    db_service: Arc<LocalDbService>,
    kv_table: AppKvStoreTable,

    num_files_processed: AtomicUsize,
    /// How big `num_files_processed` can get before it is persisted to disk
    mini_batch_size: usize,
    /// How big the total files processed counter can get before the garbage collection is invoked
    batch_size: usize,
}

impl GarbageCollectorPlugin {
    pub fn new(db_service: Arc<LocalDbService>, kv_table: AppKvStoreTable) -> Self {
        Self {
            db_service,
            kv_table,
            num_files_processed: AtomicUsize::new(0),
            mini_batch_size: 1000,
            batch_size: 30_000,
        }
    }

    pub async fn register_num_files_processed(self: &Arc<Self>, num: usize) -> Result<(), String> {
        self.num_files_processed.fetch_add(num, Ordering::Relaxed);
        let new_val = self.num_files_processed.load(Ordering::Relaxed);
        if new_val > self.mini_batch_size {
            let counter_ident = "crawlerNumFilesProcessed".to_string();
            // Reset counter of total files processed
            self.num_files_processed.store(0, Ordering::Relaxed);
            // Fetch the persisted counter from disk
            match self
                .kv_table
                .get_or_create::<usize>(&counter_ident, 0)
                .await
            {
                Ok(disk_data) => {
                    if disk_data > self.batch_size {
                        // Write back to disk
                        self.kv_table.set(counter_ident, 0).await?;
                        // Collect the garbage
                        let self_clone = Arc::clone(self);
                        self_clone.dispatch_garbage_collection();
                    } else {
                        self.kv_table
                            .set(counter_ident, disk_data + new_val)
                            .await?;
                    }
                }
                Err(err) => {
                    println!(
                        "GarbageCollectorPlugin: Error registering number of files processed: {}",
                        err
                    );
                }
            }
        }
        Ok(())
    }

    fn dispatch_garbage_collection(self: Arc<Self>) -> JoinHandle<Result<(), String>> {
        tokio::task::spawn(async move { self.collect_garbage_task().await })
    }

    async fn collect_garbage_task(&self) -> Result<(), String> {
        // Attempt to vacuum the db
        println!("GarbageCollectorPlugin: Collecting garbage");
        async_retry::retry_with_backoff(
            |_| self.db_service.vacuum_database(),
            3,
            Duration::from_millis(1000),
        )
        .await
        .map_err(|err| err.to_string())?;

        // Attempt to merge segments. TODO: this is removed for now. Do we need it back?
        // self.search_service
        //     .collect_garbage()
        //     .await
        //     .map_err(|err| err.to_string())?;
        println!("GarbageCollectorPlugin: Successfully collected garbage");
        Ok(())
    }
}
