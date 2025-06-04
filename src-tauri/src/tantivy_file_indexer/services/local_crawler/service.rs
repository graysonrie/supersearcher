use crate::tantivy_file_indexer::services::local_crawler::core::indexing_crawler::plugins::{
    FiltererPlugin, GarbageCollectorPlugin,
};
use crate::tantivy_file_indexer::services::local_db::service::LocalDbService;
use crate::tantivy_file_indexer::services::search_index::service::SearchIndexService;
use crate::tantivy_file_indexer::shared::async_retry;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

use super::core::crawler_queue::queue::{CrawlerQueue, Priority};
use super::core::indexing_crawler::factory;
use super::core::indexing_crawler::task_manager;

pub struct FileCrawlerService {
    /// True if the file crawlers are already crawling around
    has_dispatched_crawlers: RwLock<bool>,

    queue: Arc<CrawlerQueue>,
    search_index: Arc<SearchIndexService>,
    local_db_service: Arc<LocalDbService>,
}

impl FileCrawlerService {
    pub async fn new_async(
        local_db_service: Arc<LocalDbService>,
        search_index: Arc<SearchIndexService>,
    ) -> Self {
        let queue = Arc::new(CrawlerQueue::new(Arc::clone(&local_db_service)));
        Self {
            has_dispatched_crawlers: RwLock::new(false),
            queue,
            search_index: Arc::clone(&search_index),
            local_db_service,
        }
    }

    /// Once built, the crawlers will get dispatched and start working
    ///
    /// If this function gets called while the crawlers are already dispatched, nothing will happen
    pub async fn dispatch_crawlers(&self) -> Result<(), String> {
        let mut has_dispatched_crawlers_lock = self.has_dispatched_crawlers.write().await;
        if *has_dispatched_crawlers_lock {
            return Err("Crawlers have already been dispatched".to_string());
        }
        *has_dispatched_crawlers_lock = true;

        let pipeline = self.search_index.get_pipeline();
        let crawler_queue = Arc::clone(&self.queue);
        crawler_queue
            .set_taken_to_false_all()
            .await
            .map_err(|err| err.to_string())?;

        // Create the garbage collector and inject it
        let collector = Arc::new(GarbageCollectorPlugin::new(
            Arc::clone(&self.local_db_service),
            self.local_db_service.kv_store_table().clone(),
        ));

        let filterer = Arc::new(FiltererPlugin::new(
            self.local_db_service.kv_store_table().clone(),
        ));

        let factory = factory::IndexingCrawlersFactory::new(crawler_queue, pipeline)
            .set_garbage_collector(collector)
            .set_filterer(filterer);

        // Hand off the rest of the building to the task manager
        // Currently the only way this can fail is if the DB can't be accessed since the crawler settings need to be retrieved
        task_manager::build_managed(factory, Arc::clone(&self.local_db_service)).await?;
        Ok(())
    }

    pub async fn push_dirs(&self, paths: Vec<(PathBuf, Priority)>) {
        if let Err(err) = async_retry::retry_with_backoff(
            |_| self.queue.push_many(&paths),
            4,
            Duration::from_millis(1000),
        )
        .await
        {
            println!(
                "FileCrawlerService - Failed to push directories to queue. Err: {}",
                err
            );
        }
    }
}
