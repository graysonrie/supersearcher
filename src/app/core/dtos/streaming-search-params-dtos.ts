import { SearchParamsDTO } from "./search-params-dto"

export interface StreamingSearchParamsDTO {
    StreamIdentifier:string,
    NumEvents:number,
    StartingSize:number,
    Params:SearchParamsDTO
}