use std::sync::Arc;
use tokio::sync::{oneshot, watch, RwLock};
use tokio::task::JoinHandle;

type AtomicOption<T> = Arc<RwLock<Option<T>>>;
#[derive(Clone)]
pub struct CancellableTask {
    current_task: AtomicOption<(watch::Sender<()>, JoinHandle<()>)>,
    completed: (watch::Sender<bool>, watch::Receiver<bool>),
}

impl CancellableTask {
    pub fn new() -> Self {
        let (tx, rx) = watch::channel(false);
        Self {
            current_task: Arc::new(RwLock::new(None)),
            completed: (tx, rx),
        }
    }

    /// Runs a new task, canceling any previously running task.
    pub async fn run<T>(&self, task: JoinHandle<T>) -> Result<T, String>
    where
        T: Send + 'static,
    {
        self.run_internal(task, || {}).await
    }

    async fn run_internal<T, F>(&self, task: JoinHandle<T>, on_cancel: F) -> Result<T, String>
    where
        T: Send + 'static,
        F: Fn() + Send + 'static,
    {
        self.cancel().await;

        let (cancel_tx, mut cancel_rx) = watch::channel(());
        let (result_tx, result_rx) = oneshot::channel();

        let handle = tokio::spawn(async move {
            let result = tokio::select! {
                _ = cancel_rx.changed() => {
                    on_cancel();
                    Err("Task was canceled.")
                },
                res = task => Ok(res),
            };
            let _ = result_tx.send(result);
        });

        self.current_task.write().await.replace((cancel_tx, handle));

        let result = match result_rx.await {
            Ok(Ok(res)) => res.map_err(|e| e.to_string()),
            Ok(Err(e)) => Err(e.to_string()),
            Err(_) => Err("Task completion channel was dropped".into()),
        };
        let _ = self.completed.0.send(true);
        result
    }

    /// Cancels any currently running task.
    pub async fn cancel(&self) {
        let _ = self.completed.0.send(false);
        if let Some((cancel_tx, handle)) = self.current_task.write().await.take() {
            let _ = cancel_tx.send(()); // Signal cancellation
            let _ = handle.await; // Wait for the task to finish
        }
    }

    pub async fn wait_until_complete(&self) {
        let mut rx = self.completed.1.clone();
        while !*rx.borrow() {
            if rx.changed().await.is_err() {
                return; // Channel closed
            }
        }
    }
}
