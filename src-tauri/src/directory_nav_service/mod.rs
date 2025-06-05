mod dtos {
    pub mod inline_query_dto;
    pub mod get_files_dtos;
    pub mod sort_files_by_dto;
    pub mod get_icon_dto;
}
mod enums{
    pub mod file_changes;
}
pub mod models {
    pub mod date_range;
}

mod core;
mod util {
    pub mod metadata_inspector;
    pub mod path_ops;
}
pub mod tauri_exports;
pub mod state;