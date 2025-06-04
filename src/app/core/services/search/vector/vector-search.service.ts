import { Injectable } from "@angular/core";
import { VectorSearchParamsModel } from "./dtos/output/vector-search-params";
import { VectorSearchResult } from "./dtos/input/vector-search-result";
import { invoke } from "@tauri-apps/api/core";


@Injectable({ 'providedIn': 'root' })
export class VectorSearchEngineService {
    constructor() { }

    async query(params: VectorSearchParamsModel): Promise<VectorSearchResult[]> {
        return invoke<VectorSearchResult[]>("vector_db_query", {
            params
        }).then(result =>
            result
        ).catch((err) => {
            console.log("error executing vector query", err);
            return [];
        })
    }
}