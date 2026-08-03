use tantivy::query::{BooleanQuery, FuzzyTermQuery, Occur, Query, TermQuery};
use tantivy::schema::IndexRecordOption;
use tantivy_ext::{Field, SearchIndex};

use crate::tantivy_file_indexer::services::search_index::models::file::TantivyFileModel;

const DELETE_CHUNK_SIZE: usize = 5_000;

/// Collect and delete every indexed document whose path equals `path`
/// or is nested under it (prefix + path separator).
///
/// Returns the number of documents removed.
pub async fn clear_path(
    index: &SearchIndex<TantivyFileModel>,
    path: &str,
) -> Result<u64, String> {
    let keys = collect_paths_under(index, path).map_err(|err| err.to_string())?;
    let total = keys.len() as u64;

    for chunk in keys.chunks(DELETE_CHUNK_SIZE) {
        let terms = chunk
            .iter()
            .map(|key| TantivyFileModel::file_path_string_field().term(key.clone()))
            .collect();
        index
            .remove_by_terms(terms)
            .await
            .map_err(|err| err.to_string())?;
    }

    Ok(total)
}

fn path_variants(path: &str) -> Vec<String> {
    let trimmed = path.trim_end_matches(['\\', '/']).to_string();
    let mut variants = vec![
        trimmed.clone(),
        format!("{}\\", trimmed),
        format!("{}/", trimmed),
        path.to_string(),
    ];
    variants.sort();
    variants.dedup();
    variants
}

fn collect_paths_under(
    index: &SearchIndex<TantivyFileModel>,
    path: &str,
) -> tantivy::Result<Vec<String>> {
    let field = TantivyFileModel::file_path_string_field();
    let trimmed = path.trim_end_matches(['\\', '/']).to_string();

    let mut subqueries: Vec<(Occur, Box<dyn Query>)> = Vec::new();

    for variant in path_variants(path) {
        let term = field.term(variant);
        subqueries.push((
            Occur::Should,
            Box::new(TermQuery::new(term, IndexRecordOption::Basic)),
        ));
    }

    // Prefix matches under path\ / path/ so "C:\Users\foo" does not match "C:\Users\foobar"
    for separator in ['\\', '/'] {
        let prefix = format!("{}{}", trimmed, separator);
        let term = field.term(prefix);
        subqueries.push((
            Occur::Should,
            Box::new(FuzzyTermQuery::new_prefix(term, 0, true)),
        ));
    }

    let query = BooleanQuery::new(subqueries);
    // Large limit: clearing a drive can touch many docs
    let results = index.query(&query, 10_000_000).execute()?;

    let mut keys: Vec<String> = results
        .into_iter()
        .map(|model| model.file_path_string.tantivy_val())
        .collect();
    keys.sort();
    keys.dedup();
    Ok(keys)
}
