use crate::shared::models::sys_file_model::SystemFileModel;

#[derive(serde::Serialize,serde::Deserialize)]
pub struct Session{
    pub directory:String,
    pub files:Vec<SystemFileModel>
}