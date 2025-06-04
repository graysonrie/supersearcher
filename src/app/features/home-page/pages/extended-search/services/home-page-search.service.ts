import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { SearchParamsDTO } from "@core/dtos/search-params-dto";
import { LocalStreamingSearchService } from "@core/services/search/text/local-streaming-search.service";
import { HomePageService, SubPage } from "../../../services/home-page.service";
import { BehaviorSubject, Subscription } from "rxjs";
import { StreamingSearchParamsDTO } from "@core/dtos/streaming-search-params-dtos";

@Injectable()
export class HomePageSearchService implements OnDestroy {
  private subscription = new Subscription();

  private isOnExtendedSearchPageSubject = new BehaviorSubject<boolean>(false);
  isOnExtendedSearchPage$ = this.isOnExtendedSearchPageSubject.asObservable();

  private searchQueryStrSubject = new BehaviorSubject<string>("");
  searchQueryStr$ = this.searchQueryStrSubject.asObservable();

  files$ = this.searchService.files$;

  constructor(
    private searchService: LocalStreamingSearchService,
    private homePageService: HomePageService
  ) {
    this.subscription.add(
      this.homePageService.page$.subscribe((page) => {
        this.isOnExtendedSearchPageSubject.next(page === "extendedSearch");
      })
    );
    this.subscription.add(
      this.searchService.lastSearchParams$.subscribe(params=>{
            // Assuming we are still querying based off the file path
        if(params){
          const queryStr = params.Params.FilePath;
          if(queryStr){
            this.searchQueryStrSubject.next(queryStr);
          }
        }
      })
    )
  }

  async search(params: Partial<SearchParamsDTO>) {
    this.homePageService.setPage("extendedSearch");

    let searchParams: SearchParamsDTO = {
      NumResults: 500,
      QueryType: "Hybrid",
      ...params,
    };

    let streamParams: StreamingSearchParamsDTO = {
      StreamIdentifier: "search",
      StartingSize: 10,
      NumEvents: 10,
      Params: searchParams,
    };
    await this.searchService.query(streamParams);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
