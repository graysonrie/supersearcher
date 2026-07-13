use std::sync::Arc;

use chrono::Utc;

use crate::tantivy_file_indexer::services::local_crawler::core::indexing_crawler::plugins::WhitelisterPlugin;
use crate::tantivy_file_indexer::shared::indexing_crawler::{
    models::crawler_file::CrawlerFile, traits::crawler_queue_api::CrawlerQueueApi,
};

// Defines what the file crawlers should do when there is no entries left in the queue

/// Attempt to put all of the system disk drives in the queue for indexing
pub async fn create_busy_work<C>(
    queue: Arc<C>,
    whitelister: Option<Arc<WhitelisterPlugin>>,
) -> Result<(), String>
where
    C: CrawlerQueueApi,
{
    let mut entries = Vec::new();

    for drive in system_info::drives::get_system_drives() {
        let path = drive.name;
        entries.push((path.into(), 8));
    }

    if let Some(whitelister) = whitelister {
        whitelister.handle_config_refresh().await;
        entries = whitelister.filter_entries(&entries).await;
    }

    if entries.is_empty() {
        return Ok(());
    }

    let files: Vec<CrawlerFile> = entries
        .into_iter()
        .map(|(path, priority)| CrawlerFile {
            path,
            priority,
            taken: false,
            added_at: Utc::now(),
        })
        .collect();

    queue.push(&files).await.map_err(|err| err.to_string())
}
