pub mod service;
mod table_creator;
pub mod tauri_exports;
pub mod tables {

    pub mod crawler_queue {
        pub mod api;
        pub mod entities {
            pub mod indexed_dir;
        }
    }
    pub mod recently_indexed_dirs {
        pub mod api;
        pub mod entities {
            pub mod recently_indexed_dir;
        }
    }
    pub mod app_kv_store{
        pub mod api;
        mod models{
            pub mod frontend_subscription;
        }
        pub mod entities{
            pub mod kv_pair;
        }
        mod subscription{
            pub mod backend;
            pub mod tauri_subscription_list;
        }
        pub mod tauri_exports;
    }
}
