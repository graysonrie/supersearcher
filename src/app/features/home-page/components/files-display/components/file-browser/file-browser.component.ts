import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FileResultComponent } from "../../../file-result/file-result.component";
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from "@angular/cdk/scrolling";
import { MoveItemsPopupComponent } from "./popups/move-items-popup/move-items-popup.component";
import { InlineSearchBarComponent } from "./inline-search-bar/inline-search-bar.component";
import { ContextMenuComponent } from "@shared/components/popups/context-menu/context-menu.component";
import { FileContextMenuService } from "../../../file-result/services/context-menu.service";
import { DragDropService } from "./services/interaction/dragdrop.service";
import { SelectService } from "../../services/select.service";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { FileModel } from "@core/models/file-model";
import { debounceTime, Subject, Subscription, tap } from "rxjs";
import { InlineSearchService } from "./services/inline-search.service";
import { FailedToMoveItemsPopupComponent } from "./popups/generic-err-popup/generic-err-popup.component";
import { FilesListService } from "../../services/files-list.service";
import { FileState } from "../../../file-result/file-state";
import { MoveItemsPopupStateService } from "./popups/move-items-popup/move-items-popup-state.service";
import { HomePageService } from "src/app/features/home-page/services/home-page.service";
import { FileViewType } from "../../../file-result/enums/view-type";

/** Files are passed in via an instance of a `FilesListService` */
@Component({
  selector: "app-file-browser",
  standalone: true,
  imports: [
    CommonModule,
    FileResultComponent,
    ScrollingModule,
    MoveItemsPopupComponent,
    InlineSearchBarComponent,
    FailedToMoveItemsPopupComponent,
    ContextMenuComponent,
  ],
  providers: [
    DragDropService,
    InlineSearchService,
    MoveItemsPopupStateService,
    FileContextMenuService,
  ],
  templateUrl: "./file-browser.component.html",
  styleUrl: "./file-browser.component.css",
  animations: [
    trigger("fadeAnimation", [
      state("hidden", style({ opacity: 0, display: "block" })),
      state("visible", style({ opacity: 1, display: "block" })),
      transition("hidden => visible", [
        style({ display: "block" }),
        animate("25ms ease-in"),
      ]),
    ]),
  ],
})
export class FileBrowserComponent implements OnInit, OnDestroy {
  subscription = new Subscription();
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  @ViewChild("contextMenu") contextMenu!: ContextMenuComponent;

  _arrangeFilesAsGrid = false;
  files: FileModel[] = [];
  states: FileState[] = [];

  @Input() showFullFilePaths = false;
  @Input() allowFadeIn: boolean = true;
  @Input() isLoading: boolean = false;
  @Input() viewType: FileViewType = FileViewType.Detail;

  @Output() fileClickedOn = new EventEmitter<FileModel>();

  animationState = "visible";

  selectedIndices: Set<number> = new Set();
  selectedItems: FileModel[] = [];

  private debounceTimer: any = null;

  constructor(
    private inlineSearchService: InlineSearchService,
    private filesListService: FilesListService,
    private dragService: DragDropService,
    private selectService: SelectService,
    private contextMenuService: FileContextMenuService,
    private moveItemsPopupState: MoveItemsPopupStateService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.viewType != FileViewType.Detail) this._arrangeFilesAsGrid = true;

    this.subscription.add(
      this.filesListService.observeAllFiles().subscribe((x) => {
        if (this.allowFadeIn) {
          this.hideAndFadeIn();
        } else {
          this.viewport.checkViewportSize();
        }
        this.selectService.clearSelection();
        this.files = x;
      })
    );

    this.subscription.add(
      this.filesListService
        .observeAllStates()
        .subscribe((x) => (this.states = x))
    );

    this.subscription.add(
      this.inlineSearchService.firstOccurenceOfQueryIndex$.subscribe((x) =>
        this.inlineSearchToFirstOccurence(x)
      )
    );

    this.subscription.add(
      this.selectService.selectedIndices$.subscribe(
        (x) => (this.selectedIndices = x)
      )
    );

    this.subscription.add(
      this.selectService.selectedItems$.subscribe(
        (x) => (this.selectedItems = x)
      )
    );

    this.hideAndFadeIn();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  hideAndFadeIn() {
    // Set the component to "hidden" state immediately
    this.animationState = "hidden";

    // Clear any existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set a new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.animationState = "visible";
        this.viewport?.checkViewportSize();
      });
    }, 100); // Adjust the delay (in milliseconds) as needed
  }

  // scroll to the first occurence of a file/directory with offset
  inlineSearchToFirstOccurence(index: number) {
    if (this.viewport) {
      let indexOffset = index - 6;
      if (indexOffset < 1) indexOffset = 0;
      this.viewport.scrollToIndex(indexOffset, "smooth");
    }
  }

  onFileClick(index: number, event: MouseEvent) {
    event.stopPropagation();
    const model = this.files[index];
    const state = this.states[index];
    this.fileClickedOn.emit(this.files[index]);
    this.selectService.onFileClick(index, event);
    this.selectService.setLastSelectedItemState({model,state});
  }

  onFileRightClick(index: number, event: MouseEvent) {
    if(this.selectedIndices.has(index)) {
      const indices = Array.from(this.selectedIndices);
      const files = indices.map(x=>this.files[x]);
      const states = indices.map(x=>this.states[x]);
      this.contextMenuService.openMenu(this.contextMenu, event, files, states);
    } else {
      this.contextMenuService.openMenu(this.contextMenu, event, [this.files[index]], [this.states[index]]);
    }
  }

  onFileDoubleClick(file: FileModel) {
    this.inlineSearchService.clearQuery();
    this.selectService.onFileDoubleClick(file);
  }

  onFileDragStart(event: DragEvent, index: number, item: FileModel) {
    this.selectService.populateSelected(this.files);
    let selectedSet = new Set(this.selectedItems);
    if (!selectedSet.has(item)) {
      this.selectService.clearSelection();
      this.selectService.toggleSelection(index);
      this.selectService.populateSelected(this.files);
    }
    selectedSet = new Set(this.selectedItems);
    this.dragService.onDragStart(event, selectedSet);
  }

  onFileDragEnd(event: DragEvent, targetItem: FileModel) {
    this.dragService.onDragEnd(event, targetItem);
  }

  onFileDragOver(event: DragEvent, targetItem: FileModel) {
    this.dragService.onDragOver(event, targetItem);
  }

  onFileDragLeave(event: DragEvent, targetItem: FileModel) {
    this.dragService.onDragLeave(event, targetItem);
  }

  async onFileDrop(event: DragEvent, targetItem: FileModel) {
    this.dragService.onDrop(event, targetItem);
    if (this.dragService.draggingItemsToADirectory) {
      if (this.dragService.numFilesAwaitingDrop > 0) {
        // If the popup doesn't get opened, it means the user disabled it
        this.moveItemsPopupState.setItemsAdding(this.dragService.numFilesAwaitingDrop);
        if (!this.moveItemsPopupState.attemptOpen()) {
          await this.dragService.moveDraggedItemsAsync();
        }
      }
    }
  }

  @HostListener("window:keydown", ["$event"])
  async handleKeydown(event: KeyboardEvent) {
    this.inlineSearchService.handleKeydown(event, this.files);
  }

  // Prevent the stop sign from showing up if dragging a file over the background
  onMainDragOver(event: DragEvent) {
    event.preventDefault();
  }
}
