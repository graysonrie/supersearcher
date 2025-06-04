/**
 Corresponds to `SystemFileModel` in the Rust backend
 */
export interface FileModel {
    Name: string,
    DateModified: string,
    Metadata: string,
    FilePath: string,
    Score: number,
    Popularity: number,
    IsDirectory: boolean,
}

export function newDefaultFileModel(): FileModel {
    return {
        Name: "test",
        DateModified: "test",
        Metadata: "test",
        FilePath: "test",
        Score: 0,
        Popularity: 0,
        IsDirectory: false,
    }
}