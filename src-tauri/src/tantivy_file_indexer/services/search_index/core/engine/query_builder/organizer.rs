use std::cmp::Ordering;

use tantivy_ext::Field;

use crate::tantivy_file_indexer::services::search_index::models::file::TantivyFileModel;

/// Only take into account scores and just sort the files based off that
pub fn sort_by_score(paths: &mut Vec<TantivyFileModel>) -> &mut Vec<TantivyFileModel>
{
    paths.sort_by(|a,b| b.score.tantivy_val().partial_cmp(&a.score.tantivy_val()).unwrap_or(Ordering::Equal));
    paths
}


#[derive(PartialEq, Eq, Hash)]
pub struct Grouping {
    drive: String,
    extension: String,
}
// Ignore scores and sorts files by their drive and extension
// pub fn sort_by_groups<I>(paths: I) -> HashMap<Grouping, Vec<TantivyFileModel>>
// where
//     I: IntoIterator<Item = TantivyFileModel>,
// {
//     let mut map: HashMap<Grouping, Vec<TantivyFileModel>> = HashMap::new();

//     for file in paths {
//         let path_str = file.file_path.tantivy_val();
//         let path = Path::new(&path_str);

//         // Extract the drive (prefix)
//         let drive = path
//             .components()
//             .next()
//             .and_then(|comp| match comp {
//                 Component::Prefix(prefix) => {
//                     Some(prefix.as_os_str().to_string_lossy().into_owned())
//                 }
//                 _ => None,
//             })
//             .unwrap_or_default();

//         // Extract the extension
//         let extension = path
//             .extension()
//             .and_then(|ext| ext.to_str())
//             .unwrap_or_default()
//             .to_string();

//         // Insert into the group
//         map.entry(Grouping { drive, extension })
//             .or_insert_with(Vec::new)
//             .push(file);
//     }

//     map
// }
