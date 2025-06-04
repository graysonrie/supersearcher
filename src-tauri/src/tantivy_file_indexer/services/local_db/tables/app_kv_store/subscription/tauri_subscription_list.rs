use std::sync::Arc;

use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;
use uuid::Uuid;

pub struct EmitSubscription {
    key: String,
    event_name: String,
}

#[derive(Clone)]
/// Freely cloneable as all of the underlying data is cheap
pub struct TauriSubscriptionList {
    events: Arc<RwLock<Vec<EmitSubscription>>>,
    app_handle: AppHandle,
}

impl TauriSubscriptionList {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            events: Arc::new(RwLock::new(Vec::new())),
            app_handle,
        }
    }

    /// Returns the name of the event that the backend will emit to the frontend
    /// 
    /// Event name format: 
    /// ```rust
    /// "kv_subscription:{uuid}"
    /// ```
    pub async fn add_subscription(&self, key: &str) -> String {
        let mut events_lock = self.events.write().await;

        let uuid = Uuid::new_v4().to_string();
        let event_name = format!("kv_subscription:{}",uuid);
        let event_name_clone = event_name.clone();

        events_lock.push(EmitSubscription {
            key: key.into(),
            event_name,
        });
        event_name_clone
    }

    /// Event name format: 
    /// ```rust
    /// "kv_subscription:{uuid}"
    /// ```
    pub async fn emit_to_subscribers(&self, key: &str, value: &serde_json::Value) {
        for event in self.events.read().await.iter() {
            if event.key == key {
                if let Err(err) = self.app_handle.emit(&event.event_name, value) {
                    println!("AppKVStore - TauriSubscriptionList: Error emitting to Tauri subscribers: {}",err);
                }
            }
        }
    }
}
