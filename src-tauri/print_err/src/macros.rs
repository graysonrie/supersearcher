#[macro_export]
macro_rules! get_name {
    ($fn_call:expr) => {
        stringify!($fn_call);
    };
}
