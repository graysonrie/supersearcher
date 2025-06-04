use std::{
    fmt::{Debug, Display},
    future::Future,
    sync::Arc,
};

use tokio::sync::Notify;

use super::super::models::crawler_file::CrawlerFile;

pub trait CrawlerQueueApi: Clone + Send + Sync + 'static {
    type Error: Display + Debug + Send;

    fn push(&self, files: &[CrawlerFile]) -> impl Future<Output = Result<(), Self::Error>> + Send;

    /**
    Get the next file from the database without removing it
    */
    fn fetch_next(&self) -> impl Future<Output = Result<Option<CrawlerFile>, Self::Error>> + Send;

    /**
    Get the next files from the database without removing them
    */
    fn fetch(
        &self,
        amount: u64,
    ) -> impl Future<Output = Result<Vec<CrawlerFile>, Self::Error>> + Send;

    fn delete_one(&self, file: CrawlerFile)
        -> impl Future<Output = Result<(), Self::Error>> + Send;

    /// Set the `taken` status of every item in the database to `false`
    fn set_taken_to_false_all(&self) -> impl Future<Output = Result<(), Self::Error>> + Send;

    /// Get the queue Notifier, which gets triggered each time an item gets added to the queue
    fn get_notifier(&self) -> Arc<Notify>;
}
