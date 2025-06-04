use crate::tantivy_file_indexer::shared::cancel_task::CancellableTask;
use std::{path::PathBuf, sync::Arc};
use tokio::sync::RwLock;

use super::notifier;

pub struct DirectoryWatcherService {
    watcher_task: CancellableTask,
    is_watching: RwLock<bool>,
}

impl DirectoryWatcherService {
    pub fn new() -> Self {
        Self {
            watcher_task: CancellableTask::new(),
            is_watching: RwLock::new(false),
        }
    }
    pub async fn watch<F>(self: &Arc<Self>, dir: PathBuf, on_changes: F)
    where
        F: Fn() + Send + 'static,
    {
        if *self.is_watching.read().await {
            self.watcher_task.cancel().await;
        }

        let task = tokio::task::spawn(async move { notifier::watcher_task(&dir, on_changes) });
        let self_clone = Arc::clone(self);

        *self_clone.is_watching.write().await = true;

        tokio::task::spawn(async move {
            if let Err(err) = self_clone.watcher_task.run(task).await {
                println!("Directory watcher task error: {}", err);
            }
            *self_clone.is_watching.write().await = false;
        });
    }
    pub async fn stop_watching(&self) {
        self.watcher_task.cancel().await;
    }
}
