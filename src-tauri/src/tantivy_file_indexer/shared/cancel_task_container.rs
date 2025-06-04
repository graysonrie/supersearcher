use super::cancel_task::CancellableTask;
use std::{collections::HashMap, hash::Hash};
use tokio::task::JoinHandle;

pub struct CancellableTaskContainer<Id>
where
    Id: Eq + Hash,
{
    tasks: HashMap<Id, CancellableTask>,
}

impl<Id> CancellableTaskContainer<Id>
where
    Id: Eq + Hash,
{
    pub fn new() -> Self {
        Self {
            tasks: HashMap::new(),
        }
    }
    pub fn run_task<T>(&mut self, id: Id, task: JoinHandle<T>) -> Result<(), String>
    where
        T: Send + 'static,
    {
        match self.tasks.get(&id) {
            Some(t) => t.run_unwatched(task),
            None => {
                let cancellable_task = CancellableTask::new();
                cancellable_task
                    .run_unwatched(task)
                    .map_err(|e| e.to_string())?;
                self.tasks.insert(id, cancellable_task);
                Ok(())
            }
        }
    }
}
