use crate::directory_nav_service::dtos::inline_query_dto::InlineQueryDTO;
use crate::shared::models::sys_file_model::SystemFileModel;

#[tauri::command]
pub async fn search_files_inline(
    _query: InlineQueryDTO,
    //files_display: State<'_, Arc<FilesDisplayState>>,
) -> Result<Vec<SystemFileModel>, String> {
    //Ok(files_display.query(query).await)
    Err("Inline search for backend is disabled".into())
}
