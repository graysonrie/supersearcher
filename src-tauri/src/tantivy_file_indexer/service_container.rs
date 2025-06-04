use crate::directory_nav_service;

use super::services::{
    app_save::service::{AppSavePath, AppSaveService},
    local_crawler::service::FileCrawlerService,
    local_db::service::LocalDbService,
    search_index::service::SearchIndexService,
};
use std::{path::PathBuf, sync::Arc};

use tauri::{AppHandle, Manager};
pub struct AppServiceContainer {
    //pub search_service: Arc<SearchIndexService>,
    //pub local_db_service: Arc<LocalDbService>,
    //pub crawler_service: Arc<FileCrawlerService>,
    //pub crawler_analyzer_service: Arc<FileCrawlerAnalyzerService>,
}

impl AppServiceContainer {
    pub async fn new_async(handle: &AppHandle) -> Self {
        let app_name = "SuperSearcher";

        // Ensure that the app service is initialized before the rest to ensure that the AppData save path is created
        let app_save_service = Self::initialize_app_save_service(AppSavePath::AppData, app_name);
        let app_path = app_save_service.save_dir.clone();

        directory_nav_service::state::manage_state(handle);

        //let vector_db_service = Self::initialize_vector_service();
        let search_service = Self::initialize_search_service(app_path, handle);

        let local_db_service =
            Self::initialize_local_db_service(&app_save_service, handle.clone()).await;

        let crawler_service = Self::initialize_crawler_service(
            Arc::clone(&local_db_service),
            Arc::clone(&search_service),
        )
        .await;

        handle.manage(Arc::clone(&search_service));
        handle.manage(Arc::clone(&local_db_service));
        handle.manage(Arc::clone(&crawler_service));
        //handle.manage(Arc::clone(&crawler_analyzer_service));
        //handle.manage(Arc::clone(&vector_db_service));

        handle.manage(Arc::clone(&app_save_service));

        Self {
            //search_service,
            //local_db_service,
            //crawler_service,
            //crawler_analyzer_service,
        }
    }

    fn initialize_search_service(
        app_path: PathBuf,
        app_handle: &AppHandle,
    ) -> Arc<SearchIndexService> {
        Arc::new(SearchIndexService::new(app_path, app_handle))
    }

    fn initialize_app_save_service(save_dir: AppSavePath, app_name: &str) -> Arc<AppSaveService> {
        Arc::new(AppSaveService::new(save_dir, app_name))
    }

    async fn initialize_local_db_service(
        app_save_service: &Arc<AppSaveService>,
        handle: AppHandle,
    ) -> Arc<LocalDbService> {
        Arc::new(LocalDbService::new_async(app_save_service, handle).await)
    }

    async fn initialize_crawler_service(
        db_service: Arc<LocalDbService>,
        search_service: Arc<SearchIndexService>,
    ) -> Arc<FileCrawlerService> {
        Arc::new(FileCrawlerService::new_async(db_service, search_service).await)
    }
}
