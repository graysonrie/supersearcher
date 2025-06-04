use crate::{
    shared::models::sys_file_model::SystemFileModel,
    tantivy_file_indexer::{
        dtos::{
            search_params_dto::SearchParamsDTO, streaming_search_dto::StreamingSearchParamsDTO,
        },
        shared::indexing_crawler::traits::commit_pipeline::CrawlerCommitPipeline,
    },
};

use super::{
    core::engine::{querier::Querier, query_builder::constructor::QueryConstructor},
    models::file::TantivyFileModel,
    pipelines::tantivy_pipeline::TantivyPipeline,
    services::task_manager::TaskManagerService,
};
use std::{path::PathBuf, sync::Arc};

use tantivy_ext::{index::index_builder::SearchIndexBuilder, SearchIndex};
use tauri::{AppHandle, Manager};
use tokio::task::JoinHandle;

pub struct SearchIndexService {
    /// Dictates how crawlers store documents
    pub pipeline: Arc<TantivyPipeline>,
    querier: Arc<Querier>,
    search_index: SearchIndex<TantivyFileModel>,
}

impl SearchIndexService {
    pub fn new(app_path: PathBuf, handle: &AppHandle) -> Self {
        let index_path = app_path.join("TantivyOut");

        let index = SearchIndexBuilder::new(index_path)
            .with_memory_budget(50_000_000)
            .with_recycle_after(10_000)
            .build();
        let index_clone = index.clone();
        let backend = index_clone.get_tantivy_backend();

        let constructor = Arc::new(QueryConstructor::new(
            SearchIndex::<TantivyFileModel>::schema().clone(),
            backend.reader.clone(),
        ));

        handle.manage(Arc::new(TaskManagerService::new()));

        // Create the commit pipeline
        let pipeline = TantivyPipeline::new(index.clone());

        Self {
            search_index: index,
            pipeline: Arc::new(pipeline),
            querier: Arc::new(Querier::new(
                backend.reader.clone(),
                Arc::clone(&constructor),
            )),
        }
    }

    /// Spawns a tokio task for the query
    pub fn streaming_query<EmitFn>(
        &self,
        params: StreamingSearchParamsDTO,
        emit: EmitFn,
    ) -> JoinHandle<tantivy::Result<()>>
    where
        EmitFn: Fn(Vec<TantivyFileModel>) + Send + 'static,
    {
        let querier_clone = Arc::clone(&self.querier);
        tokio::spawn(async move {
            querier_clone
                .advanced_query_streamed(
                    params.params,
                    emit,
                    params.num_events,
                    params.starting_size,
                )
                .await
        })
    }

    /// Spawns a tokio task for the query
    pub fn streaming_query_organized<EmitFn>(
        &self,
        params: StreamingSearchParamsDTO,
        emit: EmitFn,
    ) -> JoinHandle<()>
    where
        EmitFn: Fn(&[TantivyFileModel]) + Send + 'static,
    {
        let querier_clone = Arc::clone(&self.querier);
        tokio::spawn(async move {
            querier_clone
                .organized_query_streamed(
                    params.params,
                    emit,
                    params.num_events,
                    params.starting_size,
                )
                .await
        })
    }

    pub fn query(
        &self,
        params: &SearchParamsDTO,
    ) -> Result<Vec<TantivyFileModel>, tantivy::TantivyError> {
        self.querier.advanced_query(params)
    }

    pub async fn get_file_from_index(&self, file: SystemFileModel) -> Option<SystemFileModel> {
        self.pipeline.get_one(file).await.map(|model| model.into())
    }

    pub async fn upsert_file_to_index(&self, file: SystemFileModel) -> Result<(), String> {
        self.pipeline.upsert_one(file).await
    }

    pub fn get_pipeline(&self) -> Arc<TantivyPipeline> {
        Arc::clone(&self.pipeline)
    }

    /// Returns true if the file exists in the file system. If the file does not exist, it is removed from the index.
    pub async fn validate_file_exists(&self, path: &str) -> Result<bool, tantivy::TantivyError> {
        if PathBuf::from(path).exists() {
            return Ok(true);
        }
        let path_str = path.to_string();
        let terms = vec![TantivyFileModel::file_path_string_field().term(path_str)];
        self.search_index.remove_by_terms(terms).await?;
        Ok(false)
    }
}

