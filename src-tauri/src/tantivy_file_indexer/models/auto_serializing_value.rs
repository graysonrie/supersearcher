use serde::{de::DeserializeOwned, Serialize};
use tokio::sync::RwLock;

struct Inner<T>
where
    T: Serialize + Clone + DeserializeOwned,
{
    data: T,
    serialized: serde_json::Value,
}

pub struct AutoSerializingValue<T>
where
    T: Serialize + Clone + DeserializeOwned,
{
    inner: RwLock<Inner<T>>,
}

impl<T> AutoSerializingValue<T>
where
    T: Serialize + Clone + DeserializeOwned,
{
    pub fn new(data: T) -> Self {
        let serialized = serde_json::to_value(data.clone()).unwrap();
        Self {
            inner: RwLock::new(Inner { data, serialized }),
        }
    }

    pub async fn set(&self, data: T) {
        let mut inner_lock = self.inner.write().await;
        inner_lock.data = data.clone();
        inner_lock.serialized = serde_json::to_value(data).unwrap();
    }

    pub async fn get_data(&self) -> T {
        let inner_lock = self.inner.read().await;
        inner_lock.data.clone()
    }

    pub async fn get_json(&self) -> serde_json::Value {
        let inner_lock = self.inner.read().await;
        inner_lock.serialized.clone()
    }
}