use super::util;
use crate::shared::models::sys_file_model::SystemFileModel;
use crate::tantivy_file_indexer::services::search_index::core::engine::ranker;
use crate::tantivy_file_indexer::{
    services::search_index::models::file::TantivyFileModel,
    shared::indexing_crawler::traits::commit_pipeline::CrawlerCommitPipeline,
};
use std::collections::HashMap;
use tantivy_ext::SearchIndex;

/// Pipeline where Tantivy is used as the main database. SQLite is used as a queue
pub struct TantivyPipeline {
    index: SearchIndex<TantivyFileModel>,
}

impl TantivyPipeline {
    pub fn new(index: SearchIndex<TantivyFileModel>) -> Self {
        Self { index }
    }
}

impl CrawlerCommitPipeline for TantivyPipeline {
    type IndexedModel = TantivyFileModel;
    type InputModel = SystemFileModel;
    type Error = String;

    async fn get_children(&self, parent_key: String) -> Result<Vec<SystemFileModel>, Self::Error> {
        let files = util::map_err(util::search_by_directory(&self.index, parent_key))?;
        Ok(files.into_iter().map(|x| x.into()).collect())
    }

    /// Upsert files and rank them as well
    async fn upsert_many(
        &self,
        models: Vec<Self::InputModel>,
        parent_key: String,
    ) -> Result<(), Self::Error> {
        let children = self.get_children(parent_key).await?;

        // Create a HashMap for quick lookup of children by `file_path`
        let child_map: HashMap<&str, &SystemFileModel> = children
            .iter()
            .map(|child| (child.file_path.as_str(), child))
            .collect();

        // Separate models into existing and brand_new
        let mut existing: Vec<(TantivyFileModel, &SystemFileModel)> = Vec::new();
        let mut brand_new: Vec<TantivyFileModel> = Vec::new();

        for model in models {
            if let Some(child) = child_map.get(model.file_path.as_str()) {
                existing.push((model.into(), *child));
            } else {
                brand_new.push(model.into());
            }
        }

        // Rank the files as a part of preprocessing
        let tantivy_models: Vec<TantivyFileModel> = rank_files(existing, brand_new);

        // Classify and remove stale files
        let stale_keys = util::classify_stale_models(&children, &tantivy_models);

        self.remove_many(stale_keys).await?;

        util::map_err(self.index.add(&tantivy_models).await)?;

        Ok(())
    }

    async fn upsert_one(&self, model: Self::InputModel) -> Result<(), Self::Error> {
        let model: TantivyFileModel = model.into();
        util::map_err(self.index.add(&[model]).await)?;
        Ok(())
    }

    async fn get_one(&self, model: Self::InputModel) -> Option<Self::IndexedModel> {
        util::search_by_path(&self.index, model.file_path).unwrap_or(None)
    }

    async fn remove_many(&self, keys: Vec<String>) -> Result<(), Self::Error> {
        if !keys.is_empty() {
            let terms = keys
                .into_iter()
                .map(|key| TantivyFileModel::file_path_string_field().term(key))
                .collect();
            util::map_err(self.index.remove_by_terms(terms).await)?;
        }
        Ok(())
    }
}

/// Returns the files you passed in, aggregated and ranked
fn rank_files(
    existing: Vec<(TantivyFileModel, &SystemFileModel)>,
    brand_new: Vec<TantivyFileModel>,
) -> Vec<TantivyFileModel> {
    let mut tantivy_models: Vec<TantivyFileModel> = Vec::new();
    tantivy_models.extend(
        existing
            .into_iter()
            .map(|(new_file, old_file)| ranker::rank_existing_file(new_file, old_file)),
    );

    tantivy_models.extend(brand_new.into_iter().map(ranker::rank_new_file));
    tantivy_models
}
