/// Returns the ratio of the number of alphabetic characters to the number of other characters.
/// The higher the number, the more noise there is.
/// 
/// ### Examples:
/// 
/// Noise ratio for C:/some_file: 0.25
/// 
/// Noise ratio for C:/errereerer: 0.15384615384615385
/// 
/// Noise ratio for C:/$B9D075E1EB7D4CED964EF9FC24A7FD75: 0.5277777777777778
pub fn calculate_alphabetic_noise_ratio(string: &str) -> f64 {
    let total_chars = string.len() as f64;
    let letter_chars = string.chars().filter(|c| c.is_alphabetic()).count() as f64;
    1.0 - (letter_chars / total_chars)
}

/*
cargo test test_string -- --show-output
*/
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_string() {
        print_rank("C:/some_file");
        print_rank("C:/errereerer");
        print_rank("C:/$B9D075E1EB7D4CED964EF9FC24A7FD75");
    }

    fn print_rank(s: &str) {
        println!("Noise ratio for {}: {}", s, calculate_alphabetic_noise_ratio(s));
    }
}
