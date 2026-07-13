use std::{
    path::{Path, PathBuf},
    sync::Arc,
};

use sea_orm::DbErr;

use crate::tantivy_file_indexer::{
    models::auto_serializing_value::AutoSerializingValue,
    services::{
        local_crawler::core::crawler_queue::queue::CrawlerQueue,
        local_db::tables::{
            app_kv_store::api::AppKvStoreTable,
            crawler_queue::entities::indexed_dir,
        },
    },
    util::path::is_directory_whitelisted,
};

type JsonVal<T> = AutoSerializingValue<T>;

pub struct WhitelisterPlugin {
    kv_store: AppKvStoreTable,
    queue: Arc<CrawlerQueue>,
    whitelisted_directories: JsonVal<Vec<String>>,
}

impl WhitelisterPlugin {
    pub fn new(kv_store: AppKvStoreTable, queue: Arc<CrawlerQueue>) -> Self {
        Self {
            kv_store,
            queue,
            whitelisted_directories: JsonVal::new(Vec::new()),
        }
    }

    /// Reload whitelist config from the KV store and return whether it changed.
    pub async fn refresh_config(&self) -> Result<bool, String> {
        let previous = self.whitelisted_directories.get_json().await;
        let current: Vec<String> = self
            .kv_store
            .get("crawlerWhitelistedDirectories")
            .await?
            .unwrap_or_default();
        let current_json =
            serde_json::to_value(&current).map_err(|err| err.to_string())?;
        let did_update = previous != current_json;
        self.whitelisted_directories.set(current).await;
        Ok(did_update)
    }

    pub async fn is_restricted(&self) -> bool {
        !self.whitelisted_directories.get_data().await.is_empty()
    }

    pub async fn is_allowed(&self, path: &Path) -> bool {
        let whitelist = self.whitelisted_directories.get_data().await;
        is_directory_whitelisted(path, &whitelist)
    }

    pub async fn filter_entries(&self, entries: &[(PathBuf, u32)]) -> Vec<(PathBuf, u32)> {
        let whitelist = self.whitelisted_directories.get_data().await;
        if whitelist.is_empty() {
            return entries.to_vec();
        }

        entries
            .iter()
            .filter(|(path, _)| is_directory_whitelisted(path, &whitelist))
            .cloned()
            .collect()
    }

    pub async fn purge_non_whitelisted(&self) -> Result<u64, DbErr> {
        if !self.is_restricted().await {
            return Ok(0);
        }

        let whitelist = self.whitelisted_directories.get_data().await;
        let all = self.queue.get_all().await?;
        let to_remove: Vec<indexed_dir::Model> = all
            .into_iter()
            .filter(|entry| !is_directory_whitelisted(Path::new(&entry.path), &whitelist))
            .collect();

        if to_remove.is_empty() {
            return Ok(0);
        }

        let count = to_remove.len() as u64;
        self.queue.delete_many(to_remove).await?;
        Ok(count)
    }

    /// Called when the whitelist config is written or needs to be re-synced.
    pub async fn on_whitelist_config_updated(self: &Arc<Self>) {
        if let Err(err) = self.refresh_config().await {
            println!("Crawler whitelister: failed to refresh config: {}", err);
            return;
        }

        if !self.is_restricted().await {
            return;
        }

        match self.purge_non_whitelisted().await {
            Ok(count) if count > 0 => {
                println!(
                    "Crawler whitelister: Removed {} non-whitelisted directories from queue",
                    count
                );
            }
            Ok(_) => {}
            Err(err) => {
                println!("Crawler whitelister: purge failed: {}", err);
            }
        }
    }

    pub async fn handle_config_refresh(self: &Arc<Self>) {
        let should_purge = match self.refresh_config().await {
            Ok(true) => self.is_restricted().await,
            Ok(false) => false,
            Err(err) => {
                println!("Crawler whitelister: failed to refresh config: {}", err);
                false
            }
        };

        if should_purge {
            match self.purge_non_whitelisted().await {
                Ok(count) if count > 0 => {
                    println!(
                        "Crawler whitelister: Removed {} non-whitelisted directories from queue",
                        count
                    );
                }
                Ok(_) => {}
                Err(err) => {
                    println!("Crawler whitelister: purge failed: {}", err);
                }
            }
        }
    }
}
