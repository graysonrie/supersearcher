pub mod service;
mod core {
    pub mod crawler_queue {
        pub mod queue;
        pub mod filter;
        pub mod trait_impl {
            pub mod crawler_file;
            pub mod crawler_queue_api;
        }
    }
    pub mod indexing_crawler;
    pub mod settings;
}
pub mod tauri_exports;
