use system_info::models::system_info_model::SystemInfoModel;



#[tauri::command]
pub fn get_sys_info()->SystemInfoModel{
    system_info::sys_info::get_sys_info()
}