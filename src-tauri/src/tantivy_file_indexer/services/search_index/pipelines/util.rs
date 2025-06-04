use std::collections::HashSet;

use tantivy::{query::TermQuery, Term};
use tantivy_ext::{Field, SearchIndex};

use crate::{
    shared::models::sys_file_model::SystemFileModel,
    tantivy_file_indexer::services::search_index::models::file::TantivyFileModel,
};

/// Helper function to map errors into strings
pub fn map_err<T, E: ToString>(result: Result<T, E>) -> Result<T, String> {
    result.map_err(|err| err.to_string())
}

/// Helper function to get stale models. The `models` parameter represents the new models and `children` are the old ones
pub fn classify_stale_models(
    children: &[SystemFileModel],
    models: &[TantivyFileModel],
) -> Vec<String> {
    // Build a HashSet of file paths from `models`
    let model_paths: HashSet<String> = models
        .iter()
        .map(|file| file.file_path_string.tantivy_val())
        .collect();

    // Filter out stale `children` whose file paths are not in `model_paths`
    // Extract the file paths since those are the keys
    children
        .iter()
        .filter(|child| !model_paths.contains(&child.file_path))
        .map(|x| x.file_path.clone())
        .collect()
}

fn search_by_term(
    index: &SearchIndex<TantivyFileModel>,
    term: Term,
) -> tantivy::Result<Vec<TantivyFileModel>> {
    let query = TermQuery::new(term, tantivy::schema::IndexRecordOption::Basic);
    // Search using the query
    let top_docs = index.query(&query, 1_000_000).execute()?;
    Ok(top_docs)
}

/// `model` is expected to be a directory. A search will be made to find all models whose `parent_path` matches the given directory file path
pub fn search_by_directory(
    index: &SearchIndex<TantivyFileModel>,
    directory_path: String,
) -> tantivy::Result<Vec<TantivyFileModel>> {
    let term = TantivyFileModel::parent_directory_field().term(directory_path);
    search_by_term(index, term)
}

pub fn search_by_path(
    index: &SearchIndex<TantivyFileModel>,
    file_path: String,
) -> tantivy::Result<Option<TantivyFileModel>> {
    let term = TantivyFileModel::file_path_string_field().term(file_path);
    let mut results = search_by_term(index, term)?;
    match results.len() {
        0 => Ok(None),
        1 => Ok(Some(results.pop().unwrap())),
        val => {
            panic!("Duplicate keys exist in index. Found {} entries", val)
        }
    }
}
