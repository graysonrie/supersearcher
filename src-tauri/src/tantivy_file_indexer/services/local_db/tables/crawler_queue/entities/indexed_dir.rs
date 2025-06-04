use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize)]
#[sea_orm(table_name = "crawler_queue")]
#[serde(rename_all = "PascalCase")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub path: String,
    /// Where a higher number means that the directory is more important
    pub priority: u32,
    /// If a directory is "taken", then it means that a crawler is already working on scanning its files and the
    /// other crawlers should not try to pick up this one.
    ///
    /// Upon application startup, all models should have `taken` set to `false`, due to the fact that some crawler
    /// workers could have terminated while they were trying to process a directory.
    pub taken: bool,
    pub added_at:DateTimeUtc
}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {}
impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        panic!("No relations")
    }
}
impl ActiveModelBehavior for ActiveModel {}
