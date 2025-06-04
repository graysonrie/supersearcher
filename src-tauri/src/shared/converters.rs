use std::time::{SystemTime, UNIX_EPOCH};

pub fn system_time_to_chrono_datetime(system_time: SystemTime) -> chrono::DateTime<chrono::Utc> {
    // Convert the SystemTime to a duration since the UNIX epoch
    let duration_since_epoch = system_time
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    // Extract seconds and nanoseconds
    let secs = duration_since_epoch.as_secs() as i64;
    let nanos = duration_since_epoch.subsec_nanos();

    chrono::DateTime::from_timestamp(secs, nanos).expect("Time is bad")
}
