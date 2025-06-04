use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use winapi::um::fileapi::GetLogicalDriveStringsW;

use crate::models::drive_model::DriveModel;

pub fn get_system_drives() -> Vec<DriveModel> {
    let mut buffer: [u16; 1024] = [0; 1024];
    let length = unsafe { GetLogicalDriveStringsW(buffer.len() as u32, buffer.as_mut_ptr()) };

    if length == 0 {
        println!("no drives found");
        return vec![];
    }

    let drive_str = OsString::from_wide(&buffer[..length as usize]);
    drive_str
        .to_string_lossy()
        .split('\0')
        .filter(|s| !s.is_empty())
        .map(|x| DriveModel {
            name: x.to_string(),
            label: None,
            total_space: 0,
            available_space: 0,
        })
        .collect()
}
