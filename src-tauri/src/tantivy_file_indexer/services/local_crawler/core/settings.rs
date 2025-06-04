use crate::tantivy_file_indexer::services::local_db::tables::app_kv_store::api::AppKvStoreTable;

const KV_STORE_NAME: &str = "crawlerSettings";

/// This is to be stored in the KV table
#[derive(serde::Serialize, serde::Deserialize, Default, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct CrawlerSettings {
    pub max_num_crawlers: u32,
}
impl CrawlerSettings {
    pub async fn get_from_db(kv: &AppKvStoreTable) -> Result<Self, String> {
        kv.get_or_create_default::<Self>(KV_STORE_NAME).await
    }
}
