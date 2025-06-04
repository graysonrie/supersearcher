use rand::{Rng, SeedableRng};
use std::{sync::Arc, time::Duration};
use tokio::sync::mpsc::error::TryRecvError;

use crate::{
    shared::models::sys_file_model::SystemFileModel,
    tantivy_file_indexer::{
        services::local_crawler::core::indexing_crawler::{idle, plugins::{FiltererPlugin, GarbageCollectorPlugin, ThrottleAmount, ThrottlePlugin}},
        shared::{
            async_retry,
            indexing_crawler::{
                models::crawler_file::CrawlerFile,
                traits::{
                    commit_pipeline::CrawlerCommitPipeline, crawler_queue_api::CrawlerQueueApi,
                },
            },
        },
    },
};

use super::{
    crawler::{self, CrawlerError},

    task_manager::{CrawlerManagerMessageReceiver, CrawlerMessage},
};

pub struct IndexingCrawlerWorker<C, P>
where
    C: CrawlerQueueApi,
    P: CrawlerCommitPipeline<InputModel = SystemFileModel>,
{
    crawler_queue: Arc<C>,
    pipeline: Arc<P>,
    batch_size: usize,
    /// Message channel to receive orders from the task manager
    receiver: CrawlerManagerMessageReceiver,
    channel_closed: bool,

    garbage_collector: Option<Arc<GarbageCollectorPlugin>>,
    filterer: Option<Arc<FiltererPlugin>>,
    throttle: ThrottlePlugin,
}

impl<C, P> IndexingCrawlerWorker<C, P>
where
    C: CrawlerQueueApi,
    P: CrawlerCommitPipeline<InputModel = SystemFileModel>,
{
    /// Note that `worker_task` must be called in order for the background operations to start
    ///
    /// `batch_size` is the number of files that will be processed before the indexer commits them in bulk
    pub fn new(
        crawler_queue: Arc<C>,
        pipeline: Arc<P>,
        batch_size: usize,
        receiver: CrawlerManagerMessageReceiver,
    ) -> Self {
        Self {
            crawler_queue,
            pipeline,
            batch_size,
            receiver,
            channel_closed: false,

            garbage_collector: None,
            filterer: None,
            throttle: ThrottlePlugin::new(),
        }
    }

    pub fn inject_garbage_collector(&mut self, c: Arc<GarbageCollectorPlugin>) {
        self.garbage_collector = Some(c);
    }

    pub fn inject_filterer(&mut self, f: Arc<FiltererPlugin>) {
        self.filterer = Some(f);
    }

    pub fn set_throttle<T>(&mut self, t: T)
    where
        T: Into<ThrottleAmount>,
    {
        self.throttle.set(t);
    }

    pub async fn worker_task(&mut self) {
        let mut files_bank: Vec<(CrawlerFile, Vec<SystemFileModel>)> = Vec::new();
        let mut num_files_processed = 0;

        self.random_wait().await;
        loop {
            // Since not every directory will have a lot of files, save up a bunch of files and then commit all of them
            match self.staggered_fetch_next().await {
                Ok(file_option) => match file_option {
                    Some(file) => {
                        if let Some(filterer) = &self.filterer {
                            if !filterer.should_crawl_directory(&file.path).await {
                                println!("File Crawler - Filterer recommends not crawling directory: {}. Skipping it.",file.path.to_string_lossy());
                                // Fetched a directory that shouldn't be crawled:
                                // Example: 'node_modules'
                                self.remove_from_crawler_queue(&file).await;
                                continue;
                            }
                        }

                        let inner_files = self.handle_crawl(&file).await;
                        let len = inner_files.len();
                        num_files_processed += len;
                        //println!("Crawler processed {} files", len);
                        // Register this number of files to the garbage collector, if there is one
                        if let Some(collector) = &self.garbage_collector {
                            if let Err(err) = collector.register_num_files_processed(len).await {
                                println!("Error registering files to gbg collector: {}", err);
                            }
                        }

                        files_bank.push((file, inner_files));

                        if num_files_processed >= self.batch_size {
                            // Commit all and drain the bank of files
                            num_files_processed = 0;
                            files_bank.clear();
                            // ! REENABLE THIS:
                            //files_bank = self.commit_files_bank(files_bank).await;
                        }
                    }
                    None if !files_bank.is_empty() => {
                        // There isn't another item in the queue, but the crawler is still hanging on to files
                        num_files_processed = 0;
                        files_bank = self.commit_files_bank(files_bank).await;
                    }
                    None => {
                        // stagger the update since multiple crawlers may finish at the same time
                        self.random_wait().await;
                        let queue_clone = Arc::clone(&self.crawler_queue);
                        if let Err(err) = idle::create_busy_work(queue_clone).await {
                            println!("Crawler Worker - Error creating busy work: {}", err);
                        }
                    }
                },
                Err(err) => {
                    eprintln!(
                    "File crawler task encountered an error trying to fetch item from queue: {}. Retrying.",
                    err
                );
                    self.random_wait().await;
                }
            }
            // Handle messages from the task manager:
            let mut kill = false;
            // Handle all incoming messages
            while let Some(message) = self.get_next_receiver_msg() {
                match message {
                    CrawlerMessage::Kill => {
                        kill = true;
                        break;
                    }
                    CrawlerMessage::Throttle => self.throttle.upgrade(),
                }
            }
            // Break the outer loop
            if kill {
                self.commit_files_bank(files_bank).await;
                break;
            }
        }
        println!("Crawler worker has been killed due to task manager saying so");
    }

    fn get_next_receiver_msg(&mut self) -> Option<CrawlerMessage> {
        if self.channel_closed {
            return None;
        }
        match self.receiver.try_recv() {
            Ok(message) => return Some(message),
            Err(err) => {
                if let TryRecvError::Disconnected = err {
                    println!(
                        "WARNING: Disconnection between crawler and its task manager communication channel: {}",
                        err
                    );
                    self.channel_closed = true;
                }
                // Otherwise, it'll be an `Empty` error, which we don't care about
            }
        }
        None
    }

    /// Indexes the items, but applies a throttle while creating the batches
    async fn handle_index_batched(&self, dir: &CrawlerFile, files: Vec<SystemFileModel>) {
        let batch_size = 128;
        let mut batch = Vec::new();
        for (i, file) in files.into_iter().enumerate() {
            batch.push(file);
            self.throttle.rest_short().await;
            if i % batch_size == 0 {
                // Commit the batch
                self.handle_index(dir, std::mem::take(&mut batch)).await;
            }
        }
        if !batch.is_empty() {
            self.handle_index(dir, batch).await;
        }
    }

    async fn handle_index(&self, dir: &CrawlerFile, files: Vec<SystemFileModel>) {
        let parent_path = dir.path.to_string_lossy().to_string();

        match self.pipeline.upsert_many(files, parent_path).await {
            Ok(_) => {
                // If all goes well, then the directory can be removed from the crawler queue
                self.remove_from_crawler_queue(dir).await;
            }
            Err(err) => {
                println!("Error indexing files: {}", err);
            }
        }
    }

    /// Returns all of the files that were found in the given directory
    async fn handle_crawl(&self, directory: &CrawlerFile) -> Vec<SystemFileModel>
    where
        C: CrawlerQueueApi,
    {
        let filterer_clone = self.filterer.clone();
        match crawler::crawl(
            directory,
            Arc::clone(&self.crawler_queue),
            filterer_clone,
        )
        .await
        {
            Ok(dtos) => {
                return dtos;
            }
            Err(err) => match err {
                CrawlerError::PushToQueue(err) => {
                    println!(
                        "Crawler could not push found directories to queue: {}.
            The original directory will stay in the queue for re-indexing",
                        err
                    );
                }
                CrawlerError::ReadDir(err) | CrawlerError::NotDir(err) => {
                    println!(
                        "Crawler could not read directory: {}. Removing it from the queue",
                        err
                    );
                    // Something must be wrong with the directory, so go ahead and remove it from the queue early
                    self.remove_from_crawler_queue(directory).await
                }
            },
        }
        Vec::new()
    }

    async fn commit_files_bank(
        &self,
        mut files: Vec<(CrawlerFile, Vec<SystemFileModel>)>,
    ) -> Vec<(CrawlerFile, Vec<SystemFileModel>)> {
        //println!("Crawler is committing files bank");
        if files.is_empty() {
            return files;
        }
        for (dir, inner_files) in files.drain(..) {
            //println!("Draining {}", dir.path.to_string_lossy());
            self.handle_index_batched(&dir, inner_files).await;
        }
        files
    }

    async fn remove_from_crawler_queue(&self, directory: &CrawlerFile) {
        if let Err(err) = async_retry::retry_with_backoff(
            |_| self.crawler_queue.delete_one(directory.clone()),
            5,
            Duration::from_millis(1000),
        )
        .await
        {
            println!(
                "FileCrawlerWorker - Error removing directory from queue: {}",
                err
            );
        }
    }

    /// Attempt to fetch the next item from the crawler queue, applying backoff if failing
    async fn staggered_fetch_next(&self) -> Result<Option<CrawlerFile>, String> {
        async_retry::retry_with_backoff(
            |_| self.crawler_queue.fetch_next(),
            8,
            Duration::from_millis(200),
        )
        .await
    }

    /// Stall for 100-2000 ms
    async fn random_wait(&self) {
        // thread safe rng
        let mut rng = rand_chacha::ChaChaRng::from_entropy();
        tokio::time::sleep(Duration::from_millis(rng.gen_range(100..=2000))).await;
    }
}
