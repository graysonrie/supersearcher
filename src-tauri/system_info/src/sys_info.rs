use crate::models::system_info_model::SystemInfoModel;



pub fn get_sys_info()->SystemInfoModel{
    // TODO: this may need to be conditional
    sys_info_windows()
}

fn sys_info_windows() -> SystemInfoModel {

    let home_directory_path: Option<String> =
    dirs::home_dir().map(|x| x.to_string_lossy().into_owned());

    let desktop_directory_path: Option<String> =
    dirs::desktop_dir().map(|x| x.to_string_lossy().into_owned());

    let downloads_directory_path: Option<String> =
    dirs::download_dir().map(|x| x.to_string_lossy().into_owned());

    let documents_directory_path: Option<String> =
    dirs::document_dir().map(|x| x.to_string_lossy().into_owned());

    let pictures_directory_path: Option<String> =
    dirs::picture_dir().map(|x| x.to_string_lossy().into_owned());

    SystemInfoModel {
        home_directory_path,
        desktop_directory_path,
        downloads_directory_path,
        documents_directory_path,
        pictures_directory_path
    }
}