use std::{collections::HashMap, sync::Arc};
use tokio::sync::RwLock;

type AtomicJson = Arc<serde_json::Value>;

#[derive(Clone)]
/// Backend code does not necessarily 'subscribe' to events, rather, `set` calls to the KV table in the database trigger their values to be updated in
/// a lightweight storage here. Rust code is able to 'check in' on the values without triggering a database call
pub struct BackendSubscriptionList {
    kv_cache: Arc<RwLock<HashMap<String, AtomicJson>>>,
}

impl BackendSubscriptionList {
    pub fn new() -> Self {
        Self {
            kv_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    pub async fn key_changed(&self, key: &str, new_val: serde_json::Value) {
        let mut kv_lock = self.kv_cache.write().await;
        kv_lock.insert(key.into(), Arc::new(new_val));
    }
    pub async fn get_key_status(&self, key: &str) -> Option<AtomicJson> {
        let kv_lock = self.kv_cache.read().await;
        kv_lock.get(key).map(Arc::clone)
    }
}
