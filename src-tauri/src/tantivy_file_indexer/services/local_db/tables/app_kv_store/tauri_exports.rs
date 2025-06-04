use std::sync::Arc;

use tauri::State;

use crate::tantivy_file_indexer::services::local_db::service::LocalDbService;

use super::models::frontend_subscription::FrontendKvSubscriptionModel;

#[tauri::command]
pub async fn kv_store_set(
    key: String,
    value: serde_json::Value,
    local_db: State<'_,Arc<LocalDbService>>
) -> Result<(), String> {
    local_db.kv_store_table().set(key, value).await?;
    Ok(())
}

#[tauri::command]
pub async fn kv_store_get(
    key: String,
    local_db: State<'_,Arc<LocalDbService>>
) -> Result<Option<serde_json::Value>, String> {
    let value = local_db.kv_store_table().get(&key).await?;
    Ok(value)
}

#[tauri::command]
/// Returns the event identifier and the most recent JSON data stored for that key. Formatted like this:
/// 
/// ```rust
/// struct FrontendKvSubscriptionModel{
///     pub identifier:String,
///     pub last_data: Option<serde_json::Value>
/// }
/// ```
pub async fn kv_store_subscribe_to_key(
    key: String,
    local_db: State<'_,Arc<LocalDbService>>
) -> Result<FrontendKvSubscriptionModel, String> {
    let last_data: Option<serde_json::Value> = local_db.kv_store_table().get(&key).await?;
    let identifier = local_db.kv_store_table().tauri_subscribe_to_key(&key).await;
    Ok(FrontendKvSubscriptionModel {
        identifier,
        last_data,
    })
}
