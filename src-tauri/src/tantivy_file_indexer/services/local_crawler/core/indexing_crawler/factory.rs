use super::{worker, worker_task_handle::CrawlerWorkerTaskHandle};
use std::sync::Arc;
use tokio::sync::mpsc;

use crate::{
    shared::models::sys_file_model::SystemFileModel,
    tantivy_file_indexer::{
        services::local_crawler::core::indexing_crawler::plugins::{
            FiltererPlugin, GarbageCollectorPlugin, ThrottleAmount, ThrottlePlugin,
        },
        shared::indexing_crawler::traits::{
            commit_pipeline::CrawlerCommitPipeline, crawler_queue_api::CrawlerQueueApi,
        },
    },
};

pub struct IndexingCrawlersFactory<C, P>
where
    C: CrawlerQueueApi,
    P: CrawlerCommitPipeline<InputModel = SystemFileModel>,
{
    crawler_queue: Arc<C>,
    pipeline: Arc<P>,
    worker_batch_size: usize,
    garbage_collector: Option<Arc<GarbageCollectorPlugin>>,
    filterer: Option<Arc<FiltererPlugin>>,
    throttle: ThrottlePlugin,
}

impl<C, P> IndexingCrawlersFactory<C, P>
where
    C: CrawlerQueueApi,
    P: CrawlerCommitPipeline<InputModel = SystemFileModel>,
{
    pub fn new(crawler_queue: Arc<C>, pipeline: Arc<P>) -> Self {
        Self {
            crawler_queue,
            pipeline,
            worker_batch_size: 512,
            garbage_collector: None,
            filterer: None,
            throttle: ThrottlePlugin::new(),
        }
    }
    pub fn set_batch_size(mut self, size: usize) -> Self {
        self.worker_batch_size = size;
        self
    }
    pub fn set_garbage_collector(mut self, c: Arc<GarbageCollectorPlugin>) -> Self {
        self.garbage_collector = Some(c);
        self
    }
    pub fn set_filterer(mut self, f: Arc<FiltererPlugin>) -> Self {
        self.filterer = Some(f);
        self
    }
    pub fn set_throttle(&mut self, t: ThrottleAmount) -> &Self {
        self.throttle.set(t);
        self
    }
    /// Returns a handle to the crawler tasks
    pub async fn build(&self, num_workers: u32) -> Vec<CrawlerWorkerTaskHandle> {
        if let Err(err) = self.crawler_queue.set_taken_to_false_all().await {
            println!(
                "Crawler worker manager: unable to reset taken status of all items: {}",
                err
            );
        }

        let mut handles = Vec::new();
        for _ in 0..num_workers {
            let (sender, receiver) = mpsc::channel(10);

            let mut worker = worker::IndexingCrawlerWorker::new(
                Arc::clone(&self.crawler_queue),
                Arc::clone(&self.pipeline),
                self.worker_batch_size,
                receiver,
            );

            // Inject a garbage collector if there is one
            if let Some(g) = &self.garbage_collector {
                let collector = Arc::clone(g);
                worker.inject_garbage_collector(collector);
            }

            // Inject a filterer if there is one
            if let Some(f) = &self.filterer {
                let filterer = Arc::clone(f);
                worker.inject_filterer(filterer);
            }

            // Inject a throttle
            worker.set_throttle(self.throttle.clone());

            let task = tokio::spawn(async move {
                worker.worker_task().await;
            });
            handles.push(CrawlerWorkerTaskHandle::new(sender, task));
        }
        handles
    }
}
