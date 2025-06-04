use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct DateRange{
    pub start:chrono::DateTime<Utc>,
    pub end:chrono::DateTime<Utc>
}