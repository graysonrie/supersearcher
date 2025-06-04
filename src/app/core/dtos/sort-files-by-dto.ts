import { DateRange } from "@core/models/date-range";

type OldestNewest = "oldest" | "newest";
type LargestSmallest = "largest" | "smallest";
export interface SortFilesByDTO{
    DateModifiedRange:DateRange | undefined,
    DateModified: OldestNewest | undefined,

    DateCreatedRange:DateRange | undefined,
    DateCreated: OldestNewest | undefined,

    Extensions: string[],

    Size: LargestSmallest | undefined, 
    /** If `false`, then no directories will be included in the results */
    FilesOnly: boolean | undefined
}

/** Returns a new interface will all undefined values */
export function defaultSortFilesByDTO():SortFilesByDTO{
    return {
        DateModifiedRange: undefined,
        DateModified: undefined,

        DateCreatedRange: undefined,
        DateCreated: undefined,

        Extensions: [],

        Size: undefined,

        FilesOnly: undefined
    }
}