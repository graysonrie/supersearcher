import { SortFilesByDTO } from "./sort-files-by-dto";


export interface GetFilesParamsDTO{
    ShowHidden:boolean
    SortBy: SortFilesByDTO | undefined,
}

export function getFilesParams_DefaultParams():GetFilesParamsDTO{
    return {ShowHidden: false, SortBy:undefined};
}