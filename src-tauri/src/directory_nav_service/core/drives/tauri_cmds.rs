
use system_info::models::drive_model::DriveModel;

#[tauri::command]
pub fn get_drives() -> Vec<DriveModel> {
    system_info::drives::get_system_drives()
}
