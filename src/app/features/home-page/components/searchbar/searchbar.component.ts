import { Component, Input, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { debounceTime, Subscription } from "rxjs";
import { SearchParamsDTO } from "@core/dtos/search-params-dto";
import { CommonModule } from "@angular/common";
import { FileResultComponent } from "../file-result/file-result.component";
import { FileModel, newDefaultFileModel } from "@core/models/file-model";
import { HomePageService, SubPage } from "../../services/home-page.service";
import { FileOperationsService } from "../../services/file-operations.service";
import { HomePageSearchService } from "../../pages/extended-search/services/home-page-search.service";

@Component({
  selector: "app-searchbar",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FileResultComponent,
    FormsModule,
  ],
  templateUrl: "./searchbar.component.html",
  styleUrl: "./searchbar.component.scss",
})
export class SearchbarComponent implements OnInit, OnDestroy {
  subscription = new Subscription();

  isOnExtendedSearchPage = false;
  exceededSearchResults = false;

  searchResults: FileModel[] = [];
  inputControl = new FormControl();

  constructor(
    private homePageService: HomePageService,
    private searchEngineService: HomePageSearchService,
    private fileOperationsService: FileOperationsService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.searchEngineService.isOnExtendedSearchPage$.subscribe(
        (x) => (this.isOnExtendedSearchPage = x)
      )
    );

    this.subscription.add(
      this.inputControl.valueChanges
        .pipe(debounceTime(100))
        .subscribe(async (value) => {
          await this.search(value);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async search(value: string) {
    // TODO: maybe make this not partial in the future
    const searchParams: Partial<SearchParamsDTO> = {
      FilePath: value,
    };

    await this.searchEngineService.search(searchParams);
  }

  onResultClick(model: FileModel) {
    //this.inlineSearchService.clearQuery();
    this.fileOperationsService.openOrNavigateToFile(model);
  }

  onBlur() {
    // This doesn't cause any rendering issues
    setTimeout(() => {
      this.searchResults.length = 0;
    }, 100);
  }

  onViewAllResultsClick() {
    this.homePageService.setPage("extendedSearch");
    this.searchResults.length = 0;
  }
}
