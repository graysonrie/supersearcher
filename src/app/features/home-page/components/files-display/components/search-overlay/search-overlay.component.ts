import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { SearchOverlayStateService } from "./services/search-overlay-state.service";
import { CommonModule } from "@angular/common";
import { LineInputComponent } from "../../../../../../shared/components/inputs/line-input/line-input.component";
import { LocalStreamingSearchService } from "@core/services/search/text/local-streaming-search.service";
import { SearchParamsDTO } from "@core/dtos/search-params-dto";
import { StreamingSearchParamsDTO } from "@core/dtos/streaming-search-params-dtos";
import { FileResultComponent } from "../../../file-result/file-result.component";
import { slideInRightAnimation } from "@shared/animations/slide-in-right.animation";
import { HomePageService } from "src/app/features/home-page/services/home-page.service";
import { Subscription } from "rxjs";
import { FileModel } from "@core/models/file-model";
import { quadraticEase } from "@shared/util/ease-value";
import { fadeInOnEnterAnimation } from "@shared/animations/fade-in-on-enter.animation";
import { isLetter } from "@shared/util/string";

@Component({
  selector: "app-search-overlay",
  standalone: true,
  imports: [CommonModule, LineInputComponent, FileResultComponent],
  templateUrl: "./search-overlay.component.html",
  styleUrl: "./search-overlay.component.css",
  animations: [slideInRightAnimation, fadeInOnEnterAnimation],
})
export class SearchOverlayComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  @ViewChild("searchInput") searchInput!: LineInputComponent;
  _isVisible = false;
  _lastValueWasNothing = false;
  _inputText = "";
  _resultsHeight = 0;
  _highlightSubstring:{start:number,end:number}|undefined = undefined;
  filterLabels$ = this.searchService.searchFilterLabels$;
  files: FileModel[] = [];

  constructor(
    private stateService: SearchOverlayStateService,
    private searchService: LocalStreamingSearchService,
    private homePageService: HomePageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.stateService.isVisible$.subscribe((visible) => {
        this._isVisible = visible;
        if (visible) this.onBecomeVisible();
      })
    );
    this.subscription.add(
      this.searchService.files$.subscribe((files) => {
        this.files = files;
        if (files.length==0) {
          quadraticEase(this._resultsHeight, 0, 500, "easeOut", (n) => {
            this._resultsHeight = n;
            this.cdr.detectChanges();
          });
        } else {
          quadraticEase(this._resultsHeight, 400, 500, "easeOut", (n) => {
            this._resultsHeight = n;
            this.cdr.detectChanges();
          });
        }
      })
    );
  }

  onBecomeVisible() {
    this._resultsHeight = 0;
    this.searchService.clearResults();
    this.cdr.detectChanges();
    this.searchInput.focus();
  }

  onInputTextChange(text:string) {
    this._inputText = text;
    this.handleSubstringHighlights();
    if (this._inputText.length == 0) {
      this.searchService.clearResults();
      return;
    }
    const params = {
      FilePath: this._inputText,
    };
    this.search(params);
  }

  private handleSubstringHighlights(){
    const text = this._inputText;
    if(isLetter(text[0]) && text[1] ==':'){
      this._highlightSubstring = {
        start:0,end:1
      };

    }else{
      this._highlightSubstring = undefined;
    }
  }

  onEnterPressed() {
    this.stateService.setVisibility(false);
    this.homePageService.setPage('extendedSearch');
  }

  /** The user clicked on the backdrop and now the overlay should close */
  onBackdropClicked() {
    this.stateService.setVisibility(false);
  }

  async search(params: Partial<SearchParamsDTO>) {
    let searchParams: SearchParamsDTO = {
      NumResults: 10,
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
