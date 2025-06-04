use std::fmt::Display;

mod macros;

/// Prints the error to stdout if there is an error. Otherwise, nothing happens.
pub fn print_err<T,E>(ident:&str, result:Result<T,E>) where E: Display{
    match result{
        Ok(_) => {},
        Err(err) => {
            println!("{}: {}",ident,err);
        },
    }
}