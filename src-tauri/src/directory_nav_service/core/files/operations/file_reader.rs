use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};

pub fn read_file_bytes(file_path: String, buffer_size: usize) -> Result<Vec<u8>, String> {
    let mut file = File::open(&file_path).map_err(|err| format!("Error opening file: {}", err))?;

    let mut buffer = vec![0; buffer_size];

    let bytes_read = file
        .read(&mut buffer)
        .map_err(|err| format!("Error reading file: {}", err))?;

    buffer.truncate(bytes_read);

    Ok(buffer)
}

pub fn read_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|err| format!("Error reading file: {}", err))
}

pub fn read_file_range_bytes(
    file_path: String,
    start: u64,
    length: usize,
) -> Result<Vec<u8>, std::io::Error> {
    let mut file = File::open(&file_path)?;
    file.seek(SeekFrom::Start(start))?;
    let mut buffer = vec![0; length];
    let bytes_read = file.read(&mut buffer)?;
    buffer.truncate(bytes_read); // Handle EOF
    Ok(buffer)
}


pub fn read_file_range(
    file_path: String,
    start: u64,
    length: usize,
) -> Result<String, String> {
    let buffer = read_file_range_bytes(file_path, start, length).map_err(|err| format!("Error reading file range: {}",err))?;
    let utf = String::from_utf8(buffer).map_err(|err| format!("Error converting buffer data to utf8: {}",err))?;
    Ok(utf)
}
