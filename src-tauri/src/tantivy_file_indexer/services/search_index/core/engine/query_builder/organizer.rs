use std::cmp::Ordering;

use tantivy_ext::Field;

use crate::tantivy_file_indexer::services::search_index::models::file::TantivyFileModel;

/// Only take into account scores and just sort the files based off that
pub fn sort_by_score(paths: &mut Vec<TantivyFileModel>) -> &mut Vec<TantivyFileModel> {
    paths.sort_by(|a, b| {
        b.score
            .tantivy_val()
            .partial_cmp(&a.score.tantivy_val())
            .unwrap_or(Ordering::Equal)
    });
    paths
}
