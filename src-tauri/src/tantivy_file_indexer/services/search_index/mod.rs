pub mod models {
    pub mod file;
}
pub mod pipelines {
    pub mod tantivy_pipeline;
    pub mod clear_path;
    mod util;
}
mod services {
    pub mod task_manager;
}
mod core {
    pub mod engine;
}
pub mod service;
pub mod tauri_exports;
