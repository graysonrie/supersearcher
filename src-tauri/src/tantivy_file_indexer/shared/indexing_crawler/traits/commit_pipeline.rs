use std::{
    fmt::{Debug, Display},
    future::Future,
};



/// A service that is able to take in documents and commit them to the Tantivy index and/or the database
pub trait CrawlerCommitPipeline: Send + Sync + 'static {
    type IndexedModel: tantivy_ext::Index;
    type InputModel: Into<Self::IndexedModel>;
    type Error: Display + Debug + Send;

    /**
    Get all of the paths that exist inside the specified directory
     */
    fn get_children(
        &self,
        parent_key: String,
    ) -> impl Future<Output = Result<Vec<Self::InputModel>, Self::Error>> + Send;

    fn upsert_many(
        &self,
        models: Vec<Self::InputModel>,
        parent_key: String,
    ) -> impl Future<Output = Result<(), Self::Error>> + Send;

    fn upsert_one(
        &self,
        model: Self::InputModel,
    ) -> impl Future<Output = Result<(), Self::Error>> + Send;

    /// Given an input, view the corresponding entry in the index, given that it exists
    fn get_one(
        &self,
        model: Self::InputModel,
    ) -> impl Future<Output = Option<Self::IndexedModel>> + Send;

    fn remove_many(
        &self,
        keys: Vec<String>,
    ) -> impl Future<Output = Result<(), Self::Error>> + Send;
}
