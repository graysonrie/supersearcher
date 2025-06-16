use directory_nav_service::tauri_exports::*;
use tantivy_file_indexer::{
    services::local_crawler::tauri_exports::*, /*services::local_db::tables::files::tauri_exports::*,*/
    services::local_db::tables::app_kv_store::tauri_exports::*,
    services::local_db::tauri_exports::*, services::search_index::tauri_exports::*,
};
use tauri::Manager;
mod app_init;
mod directory_nav_service;
mod shared;
mod tantivy_file_indexer;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_drag::init())
        .invoke_handler(tauri::generate_handler![
            get_files_as_models,
            request_get_files_cancel,
            format_path_into_dir,
            get_directory_path,
            get_root_path,
            get_parent_directory,
            open_file,
            read_file_bytes,
            read_file,
            read_file_range,
            read_file_range_bytes,
            is_path_a_file,
            get_drives,
            search_files_inline,
            search_index_query,
            search_index_query_streaming,
            search_index_query_streaming_organized,
            //get_num_stored_files,
            //save_json_local, REMOVED IN FAVOR OF KV STORAGE
            //load_json_local, REMOVED IN FAVOR OF KV STORAGE
            //vector_db_query,
            add_dirs_to_crawler_queue,
            view_crawler_queue,
            view_crawler_priority_counts,
            //get_crawler_analyzer_data,
            app_init::is_running,
            is_directory_accessible,
            get_file_from_index,
            upsert_file_to_index,
            validate_file_exists,
            get_sys_info,
            // Common commands:
            move_path_into_directory,
            delete_file,
            open_in_explorer,
            // Key value JSON storage:
            kv_store_set,
            kv_store_get,
            kv_store_subscribe_to_key,
            dispatch_crawlers,
            watch_directory,
            stop_watching_directory,
            get_file_icon,
            copy_paths_to_clipboard,
            paste_files_to_directory,
            files_exist_in_clipboard,
            create_new_file,
            create_new_directory,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            app_init::initialize_app(app_handle);

            let window = app.get_webview_window("main").unwrap();
            #[cfg(target_os = "macos")]
            window_vibrancy::apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
            window_vibrancy::apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
