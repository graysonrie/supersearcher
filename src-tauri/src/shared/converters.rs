use std::time::{SystemTime, SystemTimeError, UNIX_EPOCH};

#[derive(Debug)]
pub enum TimeError {
    SysError(SystemTimeError),
    Other(String),
}
pub fn system_time_to_chrono_datetime(
    system_time: SystemTime,
) -> Result<chrono::DateTime<chrono::Utc>, TimeError> {
    // Convert the SystemTime to a duration since the UNIX epoch
    let duration_since_epoch = system_time
        .duration_since(UNIX_EPOCH)
        .map_err(TimeError::SysError)?;

    // Extract seconds and nanoseconds
    let secs = duration_since_epoch.as_secs() as i64;
    let nanos = duration_since_epoch.subsec_nanos();

    match chrono::DateTime::from_timestamp(secs, nanos) {
        Some(time) => Ok(time),
        None => Err(TimeError::Other("Time is bad".to_string())),
    }
}
