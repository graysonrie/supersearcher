use std::path::PathBuf;

use chrono::Utc;

use crate::tantivy_file_indexer::{
    services::local_db::tables::{
        crawler_queue::entities::indexed_dir, recently_indexed_dirs::entities::recently_indexed_dir,
    },
    shared::indexing_crawler::models::crawler_file::CrawlerFile,
};

impl From<CrawlerFile> for indexed_dir::Model {
    fn from(val: CrawlerFile) -> Self {
        Self {
            path: val.path.to_string_lossy().to_string(),
            priority: val.priority,
            taken: val.taken,
            added_at: val.added_at  
        }
    }
}

impl From<indexed_dir::Model> for CrawlerFile {
    fn from(val: indexed_dir::Model) -> Self {
        Self {
            path: PathBuf::from(val.path),
            priority: val.priority,
            taken: val.taken,
            added_at: val.added_at
        }
    }
}

impl From<CrawlerFile> for (PathBuf, u32) {
    fn from(value: CrawlerFile) -> Self {
        (value.path, value.priority)
    }
}

impl From<(PathBuf, u32)> for CrawlerFile {
    fn from(value: (PathBuf, u32)) -> Self {
        Self {
            path: value.0,
            priority: value.1,
            taken: false,
            added_at: Utc::now()
        }
    }
}

impl From<CrawlerFile> for recently_indexed_dir::Model {
    fn from(val: CrawlerFile) -> Self {
        Self {
            path: val.path.to_string_lossy().to_string(),
            time: Utc::now().timestamp(),
        }
    }
}
