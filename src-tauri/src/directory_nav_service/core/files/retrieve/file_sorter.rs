use crate::directory_nav_service::dtos::sort_files_by_dto::{LargestSmallest, OldestNewest};
use crate::{
    directory_nav_service::dtos::sort_files_by_dto::SortFilesByDTO,
    shared::models::sys_file_model::SystemFileModel,
};

// ! Possibly leave unused in favor of the frontend performing the sorting logic
pub fn sort_files(files: &mut [SystemFileModel], params: &SortFilesByDTO) {
    // Date
    if let Some(ref criteria) = params.date_created {
        match criteria {
            OldestNewest::Oldest => files.sort_by(|a, b| a.date_created.cmp(&b.date_created)),
            OldestNewest::Newest => files.sort_by(|a, b| b.date_created.cmp(&a.date_created)),
        }
        return;
    }
    if let Some(ref criteria) = params.date_modified {
        match criteria {
            OldestNewest::Oldest => files.sort_by(|a, b| a.date_modified.cmp(&b.date_modified)),
            OldestNewest::Newest => files.sort_by(|a, b| b.date_modified.cmp(&a.date_modified)),
        }
        return;
    }
    // Size
    if let Some(ref criteria) = params.size {
        match criteria {
            LargestSmallest::Largest => files.sort_by(|a, b| b.size.cmp(&a.size)),
            LargestSmallest::Smallest => files.sort_by(|a, b| a.size.cmp(&b.size)),
        }
    }
}
