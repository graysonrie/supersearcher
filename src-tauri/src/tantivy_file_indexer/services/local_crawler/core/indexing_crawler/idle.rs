use std::sync::Arc;

use chrono::Utc;

use crate::tantivy_file_indexer::shared::indexing_crawler::{
    models::crawler_file::CrawlerFile, traits::crawler_queue_api::CrawlerQueueApi,
};
/*
Defines what the file crawlers should do when there is no entries left in the queue
*/

/// Attempt to put all of the system disk drives in the queue for indexing
pub async fn create_busy_work<C>(queue: Arc<C>) -> Result<(), String>
where
    C: CrawlerQueueApi,
{
    let mut files = Vec::new();

    for drive in system_info::drives::get_system_drives() {
        let path = drive.name;
        let file = CrawlerFile {
            path: path.into(),
            priority: 8,
            taken: false,
            added_at:Utc::now()
        };
        files.push(file);
    }
    queue.push(&files).await.map_err(|err| err.to_string())
}
