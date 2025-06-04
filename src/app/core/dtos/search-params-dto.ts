import { SearchQueryType } from "@core/enums/search-query-type";
import { DateRange } from "@core/models/date-range";

export interface SearchParamsDTO {
  Name?: string;
  Metadata?: string;
  DateModifiedRange?: DateRange;
  DateCreatedRange?: DateRange;
  FilePath?: string;

  NumResults: number;
  QueryType: SearchQueryType;
}
