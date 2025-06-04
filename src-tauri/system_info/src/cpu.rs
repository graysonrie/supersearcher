use sysinfo::{CpuRefreshKind, RefreshKind, System};

/// The returned value represents a percentage, but not a decimal one.
/// 
/// Example: function returns 8.32, this means 8.32% overall CPU usage
pub async fn get_global_cpu_usage()->f32{
    let mut s = System::new_with_specifics(
        RefreshKind::nothing().with_cpu(CpuRefreshKind::everything()),
    );
    
    // Wait a bit because CPU usage is based on diff.
    tokio::time::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL).await;
    // Refresh CPUs again to get actual value.
    s.refresh_cpu_all();
    s.global_cpu_usage()
}