#[derive(serde::Serialize, serde::Deserialize)]
pub struct ScheduleModel {
    pub for_directory: String,
    pub duration_micros: i64,
}
