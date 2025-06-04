use sea_orm::entity::prelude::*;
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "recently_indexed")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub path: String,
    pub time: i64, // UNIX time
}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {}
impl RelationTrait for Relation {
    fn def(&self) -> RelationDef {
        panic!("No relations")
    }
}
impl ActiveModelBehavior for ActiveModel {}
