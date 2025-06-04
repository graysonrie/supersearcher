import {
  AfterViewInit,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { FileBrowserComponent } from "../../components/files-display/components/file-browser/file-browser.component";
import { FilesListService } from "../../components/files-display/services/files-list.service";
import { HomePageSearchService } from "./services/home-page-search.service";
import { FilesDisplayComponent } from "../../components/files-display/files-display.component";
import { SelectService } from "../../components/files-display/services/select.service";
import { SearchbarComponent } from "../../components/searchbar/searchbar.component";
import { LineInputComponent } from "../../../../shared/components/inputs/line-input/line-input.component";
import { SearchInputComponent } from "../../../../shared/components/inputs/search-input/search-input.component";
import { HomePageService } from "../../services/home-page.service";
import { LocalStreamingSearchService } from "@core/services/search/text/local-streaming-search.service";

@Component({
  selector: "app-extended-search",
  standalone: true,
  imports: [CommonModule, FileBrowserComponent, SearchInputComponent],
  providers: [FilesListService, SelectService],
  templateUrl: "./extended-search.component.html",
  styleUrl: "./extended-search.component.css",
})
export class ExtendedSearchComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private subscription = new Subscription();
  @ViewChild("searchInput") searchInput!: SearchInputComponent;
  _inputText = "";

  constructor(
    private searchService: HomePageSearchService,
    private filesListService: FilesListService,
    private selectService: SelectService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.searchService.files$.subscribe((files) => {
        this.zone.run(() => {
          this.filesListService.setFiles(files);
        });
      })
    );
    this.subscription.add(
      this.searchService.searchQueryStr$.subscribe((q) => {
        this._inputText = q;
      })
    );
  }

  ngAfterViewInit(): void {
    this.searchService.search({ FilePath: this._inputText });
    this.searchInput.focus();
  }

  onInputTextChanged(text: string) {
    this.searchService.search({ FilePath: text });
    // Ensure that selected indices don't carry over in between searches
    this.selectService.clearSelection();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
