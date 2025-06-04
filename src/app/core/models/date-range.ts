export function newDateRange(start:Date,end:Date):DateRange{
    return {
        Start: start.toISOString(),
        End: end.toISOString()
    }
}

export interface DateRange {
    Start: string // ISO 8601 format for both dates
    End: string
}