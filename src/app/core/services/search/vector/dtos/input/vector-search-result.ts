import { FileModel } from "./file-model";

export interface VectorSearchResult {
    File: FileModel,
    Score: number
}