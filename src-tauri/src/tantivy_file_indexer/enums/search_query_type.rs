use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum SearchQueryType {
    Term,
    Fuzzy,
    Hybrid
}
