/**
 * This is the model that the Rust backend uses to store files that are in the crawler queue, meaning that these directories haven't actually been indexed yet
 */
export interface IndexedDirModel {
    Path: string,
    Priority: number
}