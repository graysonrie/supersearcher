use std::path::Path;

use crate::tantivy_file_indexer::{
    dtos::add_to_crawler_queue::AddToCrawlerQueueDTO,
    services::local_crawler::core::indexing_crawler::plugins::FiltererPlugin,
};

/// Reviews the directories that the user wants to add and removes the ones that are likely worthless. Example: cache directories
pub fn filter_out_directories_to_add(
    directories: Vec<AddToCrawlerQueueDTO>,
) -> Vec<AddToCrawlerQueueDTO> {
    let directories: Vec<AddToCrawlerQueueDTO> = directories
        .into_iter()
        .filter(|dto| !FiltererPlugin::high_noise_ratio(Path::new(&dto.dir_path)))
        .collect();

    directories
}
