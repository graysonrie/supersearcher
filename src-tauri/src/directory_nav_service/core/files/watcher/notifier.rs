use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Result, Watcher};
use std::path::Path;
use std::sync::mpsc::channel;
use std::time::{Duration, Instant};

pub fn watcher_task<F>(dir_path: &Path, on_changes: F) -> Result<()>
where
    F: Fn(),
{
    let (tx, rx) = channel();

    let config = Config::default().with_poll_interval(Duration::from_secs(2));
    let mut watcher = RecommendedWatcher::new(tx, config)?;

    watcher.watch(dir_path, RecursiveMode::NonRecursive)?;

    println!("Watching for changes in {}", dir_path.to_string_lossy());

    let mut last_event = Instant::now();
    let debounce_duration = Duration::from_millis(250);  // Adjust this value as needed

    for event in rx {
        match event {
            Ok(event) => match event.kind {
                EventKind::Modify(notify::event::ModifyKind::Name(_))
                | EventKind::Create(_)
                | EventKind::Remove(_) => {
                    let now = Instant::now();
                    if now.duration_since(last_event) > debounce_duration {
                        on_changes();
                        last_event = now;
                    }
                }
                _ => {}
            },
            Err(e) => println!("Error watching files: {:?}", e),
        }
    }
    Ok(())
}