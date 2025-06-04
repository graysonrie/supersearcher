use getfileicon::prelude::EasyPngCache;
use tauri::State;

use crate::directory_nav_service::dtos::get_icon_dto::GetIconDTO;

/// Get the icon of a file as a base64 encoded string
#[tauri::command]
pub async fn get_file_icon(
    path: &str,
    cache: State<'_, EasyPngCache>,
) -> Result<GetIconDTO, String> {
    //println!("Getting file icon for path: {}", path);
    match cache.get(path).await {
        Some(image) => {
            let png = image.as_base64_png().map_err(|e| e.to_string())?;
            let width = image.width;
            let height = image.height;
            let dto = GetIconDTO {
                base64_icon: png.base64,
                width,
                height,
                default_icon: png.is_default,
            };
            //println!("File icon found for path: {}", path);
            Ok(dto)
        }
        None => Err(format!("File icon not found for path: {}", path)),
    }
}
