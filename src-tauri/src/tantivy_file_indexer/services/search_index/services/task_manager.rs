use crate::tantivy_file_indexer::shared::cancel_task::CancellableTask;

pub struct TaskManagerService {
    pub task: CancellableTask,
}

impl TaskManagerService {
    pub fn new() -> Self {
        Self {
            task: CancellableTask::new(),
        }
    }
}
