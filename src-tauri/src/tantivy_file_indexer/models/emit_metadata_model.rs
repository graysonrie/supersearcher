use serde::{Deserialize, Serialize};


/// Where `T` is the main item you are emitting to the frontend
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "PascalCase")]
pub struct EmitMetadataModel<T>{
    pub data:T,
    pub metadata:String,
    pub metadata_array:Vec<String>
}

impl<T> EmitMetadataModel<T>{
    pub fn new(data:T,metadata:&str)->Self{
        Self { data, metadata:metadata.to_string(), metadata_array: Vec::new() }
    }

    // Create a new EmitMetadataModel with the 'metadata_array' property
    // pub fn new_array(data:T,metadata:&str, metadata_array:Vec<&str>)->Self{
    //     Self { data, metadata:metadata.to_string(), metadata_array: metadata_array.into_iter().map(|x|x.to_string()).collect() }
    // }
}