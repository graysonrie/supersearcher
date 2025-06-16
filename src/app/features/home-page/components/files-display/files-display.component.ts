import { Component, OnDestroy, OnInit, Optional } from "@angular/core";
import { FileBrowserComponent } from "./components/file-browser/file-browser.component";
import { FormControl } from "@angular/forms";
import { FileModel } from "@core/models/file-model";
import { FilePreviewComponent } from "./components/file-preview/file-preview.component";
import { Observable, Subscription } from "rxjs";
import { FilesListService } from "./services/files-list.service";
import { CommonModule } from "@angular/common";
import { DirectoryNavigatorService } from "../../services/directory-navigator.service";
import { DirectoryWatcherService } from "../../services/directory-watcher.service";
import { FilesDisplayFooterComponent } from "./components/files-display-footer/files-display-footer.component";
import { TopHeaderComponent } from "./components/top-header/top-header.component";
import { SelectService } from "./services/select.service";
import { SearchOverlayStateService } from "./components/search-overlay/services/search-overlay-state.service";
import { SearchOverlayComponent } from "./components/search-overlay/search-overlay.component";
import { HomeViewComponent } from "./components/home-view/home-view.component";

@Component({
  selector: "app-files-display",
  standalone: true,
  imports: [
    FileBrowserComponent,
    CommonModule,
    FilesDisplayFooterComponent,
    TopHeaderComponent,
    SearchOverlayComponent,
    HomeViewComponent,
  ],
  providers: [FilesListService, SelectService, SearchOverlayStateService],
  templateUrl: "./files-display.component.html",
  styleUrl: "./files-display.component.scss",
})
export class FilesDisplayComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();

  _isOnHomePage = false;
  isLoading = false;
  inputControl = new FormControl();
  noFilesMsg = "";
  _errorMsg = "";

  // The file that the user last selected on (clicked)
  previewFile: FileModel | undefined;

  constructor(
    private filesListService: FilesListService,
    private directoryService: DirectoryNavigatorService,
    private selectService: SelectService,
    @Optional() private watcherService?: DirectoryWatcherService
  ) {}

  async ngOnInit() {
    this.subscription.add(
      this.directoryService.currentFiles$.subscribe((files) => {
        this.filesListService.setFiles(files);
      })
    );
    this.subscription.add(
      this.directoryService.isLoading$.subscribe((x) => (this.isLoading = x))
    );
    this.subscription.add(
      this.directoryService.currentDir$.subscribe(async (dir) => {
        this._isOnHomePage = dir === "Home";
        this.noFilesMsg = dir;
        if (this.watcherService) this.watcherService.watchDirectory(dir);
      })
    );
    if (this.watcherService) {
      this.subscription.add(
        this.watcherService.directoryChanges$.subscribe(() => {
          // this.directoryService.setCurrentDir();
        })
      );
    }
    this.subscription.add(
      this.directoryService.error$.subscribe(x=>this._errorMsg=x)
    );
  }

  onClick() {
    console.log("clicked");
    this.selectService.clearSelection();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
