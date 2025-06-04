use super::query_builder::{constructor::QueryConstructor, executor, organizer};
use std::{collections::HashSet, sync::Arc};

use tantivy::{IndexReader, TantivyDocument};
use tantivy_ext::{Field, Index};

use crate::tantivy_file_indexer::{
    dtos::search_params_dto::SearchParamsDTO,
    services::search_index::models::file::TantivyFileModel,
};

pub struct Querier {
    reader: IndexReader,
    constructor: Arc<QueryConstructor>,
}

impl Querier {
    pub fn new(reader: IndexReader, constructor: Arc<QueryConstructor>) -> Self {
        Self {
            reader,
            constructor,
        }
    }
    /// Where `min_results` indicated how many documents should initially be fetched, and max_results is the value to work up to
    ///
    /// `step_size`: the number of events that will get emitted in total
    pub async fn advanced_query_streamed<EmitFn>(
        &self,
        search_params: SearchParamsDTO,
        emit: EmitFn,
        step_size: usize,
        min_results: usize,
    ) -> tantivy::Result<()> where
        EmitFn: Fn(Vec<TantivyFileModel>),
    {
        let searcher = self.reader.searcher();
        let query = self
            .constructor
            .construct_query(&search_params)?;

        let max_results = search_params.num_results as usize;

        let step_by = (max_results - min_results) / step_size;
        let mut current_out_amt = min_results;
        let mut prev_ids: HashSet<String> = HashSet::new();

        for _ in 0..step_size {
            match executor::execute_query(&searcher, current_out_amt, &query) {
                Ok(top_docs) => {
                    let mut output_docs: Vec<TantivyFileModel> = Vec::new();
                    for (_score, address) in top_docs {
                        if let Ok(doc) = searcher.doc(address) {
                            let tantivy_doc = TantivyFileModel::from_document(doc, _score as f32);

                            // TODO: there should be a function to get the primary key as a string
                            // Since the file path is the primary key, we directly get it here
                            if prev_ids.insert(tantivy_doc.file_path.tantivy_val()) {
                                output_docs.push(tantivy_doc);
                            }
                        } else { 
                            println!("Failed to retrieve document for address {:?}", address);
                        }
                    }
                    // Send the batch of documents
                    emit(output_docs);
                    current_out_amt += step_by;
                }
                Err(err) => {
                    println!("Error executing query: {}", err);
                }
            }
        }
        Ok(())
    }

    /// Whereas the other query functions just return the items however they were presented in the index, this function adds an extra post-processing
    /// step where files belonging to the same drive, folders, sharing the same extension, etc. are grouped together.
    ///  
    /// ### NOTE:
    /// this function slightly differs from `advanced_query_streamed` in the fact that the emit function will emit all of the organized files
    /// that get accumulated, meaning that the frontend needs to REPLACE its list of files with whatever gets emitted, as opposed to appending the
    /// emitted result.
    pub async fn organized_query_streamed<EmitFn>(
        &self,
        search_params: SearchParamsDTO,
        emit: EmitFn,
        step_size: usize,
        min_results: usize,
    ) where
        EmitFn: Fn(&[TantivyFileModel]),
    {
        let searcher = self.reader.searcher();
        let query = self
            .constructor
            .construct_query(&search_params)
            .expect("Query could not be constructed");

        let max_results = search_params.num_results as usize;

        // Avoid division by zero
        let step_by = if step_size > 0 {
            (max_results.saturating_sub(min_results)) / step_size
        } else {
            max_results - min_results
        };

        let mut current_out_amt = min_results;

        // Track unique document keys
        let mut seen_keys = HashSet::new();

        let mut accumulated_docs: Vec<TantivyFileModel> = Vec::new();

        for _ in 0..step_size {
            match executor::execute_query(&searcher, current_out_amt, &query) {
                Ok(top_docs) => {
                    for (_score, address) in top_docs {
                        if let Ok(doc) = searcher.doc(address) {
                            let model = TantivyFileModel::from_document(doc, _score as f32);

                            // Deduplicate documents
                            if seen_keys.insert(model.file_path.tantivy_val()) {
                                accumulated_docs.push(model);
                            }
                        } else {
                            eprintln!("Failed to retrieve document for address {:?}", address);
                        }
                    }

                    // Organize and emit the batch
                    Self::organize_docs_score(&mut accumulated_docs);
                    emit(&accumulated_docs);

                    // Move the window forward
                    current_out_amt += step_by;
                }
                Err(err) => {
                    eprintln!("Error executing query: {}", err);
                    break; // Exit loop on error
                }
            }
        }
    }

 

    fn organize_docs_score(docs: &mut Vec<TantivyFileModel>) {
        organizer::sort_by_score(docs);
    }

    pub fn advanced_query(
        &self,
        search_params: &SearchParamsDTO,
    ) -> tantivy::Result<Vec<TantivyFileModel>> {
        let searcher = self.reader.searcher();
        let query = self
            .constructor
            .construct_query(search_params)
            .expect("Query could not be constructed");

        // Execute the query and collect the results
        let top_docs =
            executor::execute_query(&searcher, search_params.num_results as usize, &query)?;

        let results: Vec<TantivyFileModel> = top_docs
            .into_iter()
            .map(|(_score, doc_address)| {
                let doc: TantivyDocument = searcher.doc(doc_address).unwrap();
                TantivyFileModel::from_document(doc, _score as f32)
            })
            .collect();

        Ok(results)
    }
}
