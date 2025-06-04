use sea_orm::{ConnectionTrait, DatabaseConnection, EntityTrait, Schema};

pub async fn generate_table<E>(
    db: &DatabaseConnection,
    entity: E,
) -> Result<sea_orm::ExecResult, sea_orm::DbErr>
where
    E: EntityTrait,
{
    let builder = db.get_database_backend();
    let create_table = Schema::new(builder).create_table_from_entity(entity);

    db.execute(builder.build(&create_table)).await
}

/**
Simply prints an error if something goes wrong
*/
pub async fn generate_table_lenient<E>(db: &DatabaseConnection, entity: E)
where
    E: EntityTrait,
{
    if let Err(err) = generate_table(db, entity).await {
        println!("Warning: Error generating table: {}", err);
    }
}
