use std::path::PathBuf;

use sea_orm::prelude::DateTimeUtc;

#[derive(Clone, Debug)]
pub struct CrawlerFile {
    pub path: PathBuf,
    pub priority: u32,
    pub taken: bool,
    pub added_at:DateTimeUtc,
}
