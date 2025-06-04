use std::{path::PathBuf, sync::Arc};

use crate::tantivy_file_indexer::{
    services::local_db::tables::crawler_queue::entities::indexed_dir,
    shared::indexing_crawler::{
        models::crawler_file::CrawlerFile, traits::crawler_queue_api::CrawlerQueueApi,
    },
};

use super::super::queue::CrawlerQueue;

impl CrawlerQueueApi for CrawlerQueue {
    type Error = String;

    /// Adds the files to the crawler queue, as well as marks them as being indexed recently.
    /// TODO: Maybe the addition to 'recently_indexed_dirs_table' should come later
    fn push(
        &self,
        files: &[CrawlerFile],
    ) -> impl std::future::Future<Output = Result<(), Self::Error>> + Send {
        let entries: Vec<(PathBuf, u32)> = files.iter().map(|x| x.clone().into()).collect();
        async move {
            // Crawler queue handles any errors
            // Also automatically adds the files to the recently_indexed table and refreshes it
            self.push_many(&entries)
                .await
                .map_err(|err| err.to_string())?;
            Ok(())
        }
    }

    async fn fetch_next(&self) -> Result<Option<CrawlerFile>, Self::Error> {
        self.fetch(1).await.map(|mut entries| entries.pop())
    }

    async fn fetch(&self, amount: u64) -> Result<Vec<CrawlerFile>, Self::Error> {
        let models = self
            .fetch_many(amount)
            .await
            .map_err(|err| err.to_string())?;
        Ok(models.into_iter().map(|x| x.into()).collect())
    }

    fn delete_one(
        &self,
        file: CrawlerFile,
    ) -> impl std::future::Future<Output = Result<(), Self::Error>> + Send {
        let model: indexed_dir::Model = file.into();
        async move {
            self.delete_many(vec![model])
                .await
                .map_err(|err| err.to_string())
        }
    }

    async fn set_taken_to_false_all(&self) -> Result<(), Self::Error> {
        self.set_taken_to_false_all()
            .await
            .map_err(|err| err.to_string())
    }

    fn get_notifier(&self) -> std::sync::Arc<tokio::sync::Notify> {
        Arc::clone(&self.notify)
    }
}
