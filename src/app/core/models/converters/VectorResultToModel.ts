import { VectorSearchResult } from "../../services/search/vector/dtos/input/vector-search-result";
import { FileModel, newDefaultFileModel } from "../file-model";

export function vectorResultToModel(result: VectorSearchResult): FileModel {
    return newDefaultFileModel();
}