use tantivy::{collector::TopDocs, query::Query, Searcher};

/// Execute a standard query, applying a popularity bias to the results
pub fn execute_query<Q>(
    searcher: &Searcher,
    num_results: usize,
    query: &Q,
) -> tantivy::Result<Vec<(f64, tantivy::DocAddress)>>
where
    Q: Query + Sized,
{
    searcher.search(
        query,
        &TopDocs::with_limit(num_results).tweak_score(|segment_reader: &tantivy::SegmentReader| {
            let popularity_field = segment_reader
                .fast_fields()
                .f64("popularity")
                .expect("Failed to access popularity field");
            move |doc, original_score| {
                // Default to 1 if no popularity
                let pop_score = popularity_field.first(doc).unwrap_or(1.0);
                apply_popularity(original_score, pop_score)
            }
        }),
    )
}

fn apply_popularity(existing_score: f32, popularity_score: f64) -> f64 {
    // No log base 10 anymore
    (existing_score as f64) + popularity_score
}
