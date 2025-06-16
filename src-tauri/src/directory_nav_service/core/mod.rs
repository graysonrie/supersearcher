pub mod files {
    pub mod inline_search {
        pub mod tauri_cmds;
    }
    pub mod operations {
        mod cmd_prompt;
        mod common;
        mod file_reader;
        mod metadata;
        pub mod tauri_cmds;
    }
    pub mod retrieve {
        mod file_retriever;
        mod file_sorter;
        mod helper;
        mod models;
        pub mod tauri_cmds;
        pub mod service;
    }
    pub mod user_input_validator {
        pub mod tauri_cmds;
    }
    pub mod icons {
        pub mod tauri_cmds;
    }
    pub mod watcher;
}
pub mod drives {
    pub mod tauri_cmds;
}
pub mod sys {
    pub mod tauri_cmds;
}
