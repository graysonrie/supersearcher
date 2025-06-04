use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};

use tokio::sync::RwLock;

pub struct FileCrawlerAnalyzerService {
    analyze_every: u64,
    last_timestamp: Arc<RwLock<Instant>>,
    files_processed: Arc<AtomicUsize>,
    data_points: Arc<RwLock<HashMap<String, String>>>,
}

impl FileCrawlerAnalyzerService {
    /**
     * `analyze_every` is a value in seconds which represents how often the analyzer will compile data
     */
    pub fn new(analyze_every: u64) -> Self {
        Self {
            analyze_every,
            last_timestamp: Arc::new(RwLock::new(Instant::now())),
            files_processed: Arc::new(AtomicUsize::new(0)),
            data_points: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn add_to_files_processed(&self, val: usize) {
        self.files_processed.fetch_add(val, Ordering::Relaxed);
    }

    pub async fn record_timestamp(&self) {
        let time = self.last_timestamp.read().await.elapsed();
        if time > Duration::from_secs(self.analyze_every) {
            let files_processed = self.files_processed.load(Ordering::Relaxed) as u64;
            let mut data_points_lock = self.data_points.write().await;
            data_points_lock.insert(
                "Files Crawled".to_string(),
                format!("{} files in {:?}", files_processed, time),
            );
            data_points_lock.insert(
                "Files Crawled Per Second".to_string(),
                (files_processed / time.as_secs()).to_string(),
            );
            // Reset the files processed counter
            self.files_processed.store(0, Ordering::Relaxed);
            // reset the timestamp
            let mut timestamp_lock = self.last_timestamp.write().await;
            *timestamp_lock = Instant::now();
        }
    }

    pub async fn get_data_points(&self) -> HashMap<String, String> {
        self.data_points.read().await.clone()
    }
}
