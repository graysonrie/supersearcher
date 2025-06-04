use std::path::Path;

use tantivy_ext::Field;

use crate::{shared::models::sys_file_model::SystemFileModel, tantivy_file_indexer::{
    services::search_index::models::file::TantivyFileModel, util::string,
}};

pub fn rank_new_file(mut file: TantivyFileModel) -> TantivyFileModel {
    file.popularity = heuristic_rank(&file).into();
    file
}

pub fn rank_existing_file(  
    mut new_file: TantivyFileModel,
    _old_file: &SystemFileModel,
) -> TantivyFileModel {
    // TODO: possible factor in the old file
    new_file.popularity = heuristic_rank(&new_file).into();
    new_file
}

/// Business logic
fn heuristic_rank(file: &TantivyFileModel) -> f64 {
    adjust_rank(1.0, file, 0.1, 0.2, 7)
}

/// Modular and adjustable ranking
fn adjust_rank(
    initial_rank: f64,
    file: &TantivyFileModel,
    base_penalty_length: f64,
    base_penalty_unreadable: f64,
    avg_name_length: usize,
) -> f64 {
    let file_name = Path::new(&file.file_path.tantivy_val())
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();
    let length_penalty = calculate_penalty_length(&file_name, base_penalty_length, avg_name_length);
    let unreadable_penalty = calculate_penalty_unreadable(&file_name, base_penalty_unreadable);

    let adjusted_rank = initial_rank * (1.0 - length_penalty) * (1.0 - unreadable_penalty);
    adjusted_rank.max(0.0) // Ensure rank doesn't go negative
}

fn calculate_penalty_length(name: &str, base_penalty: f64, avg_length: usize) -> f64 {
    let length = name.len();
    if length > avg_length {
        base_penalty * ((length as f64 / avg_length as f64).powi(2))
    } else {
        0.0
    }
}

fn calculate_penalty_unreadable(name: &str, base_penalty: f64) -> f64 {
    let noise_ratio = string::calculate_alphabetic_noise_ratio(name);

    base_penalty * noise_ratio.powi(2)
}

/*
cargo test test_rank -- --show-output
*/
// #[cfg(test)]
// mod tests {
    

//     #[test]
//     fn test_rank() {
//         print_rank("C:/some_file");
//         print_rank("C:/errereerer");
//         print_rank("C:/$B9D075E1EB7D4CED964EF9FC24A7FD75");
//     }

//     fn print_rank(path: &str) {
//         //let file = TantivyFileModel::new_shallow(path.to_string());
//         //println!("File rank: {}", rank_new_file(&file).popularity);
//     }
// }
