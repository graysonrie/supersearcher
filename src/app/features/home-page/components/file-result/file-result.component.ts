import {
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FileViewType } from "./enums/view-type";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { FileModel } from "@core/models/file-model";
import { HighlightableLabelComponent } from "@shared/components/highlightable-label/highlightable-label.component";
import { PinService } from "src/app/features/home-page/services/pin.service";
import { defaultFileState, FileState } from "./file-state";
import { FileContextMenuService } from "./services/context-menu.service";
import { FormsModule } from "@angular/forms";
import { rangeToLastPeriod } from "@shared/util/string";
import { FileIconComponent } from "../file-icon/file-icon.component";
import { IndexingFilesOverlayService } from "../indexing-files-overlay/indexing-files-overlay.service";
import { IndexedDirModel } from "@core/models/indexed-dir-model";
// If you are looking for the drag functionality, it gets handled by the parent component
// 'files-display' for example

@Component({
  selector: "app-file-result",
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    IconifyIconModule,
    HighlightableLabelComponent,
    FormsModule,
    FileIconComponent,
  ],
  templateUrl: "./file-result.component.html",
  styleUrl: "./file-result.component.scss",
  animations: [],
  providers: [FileContextMenuService],
})
export class FileResultComponent implements OnInit, DoCheck {
  _isIconType = false;
  _isRenaming = false;
  _nameBeforeRename?: string;
  _filesGettingIndexed$ = this.indexingFilesOverlayService.itemsBeingIndexed$;

  @ViewChild("renameInputBox") renameBox!: ElementRef<HTMLInputElement>;

  mouseOver = false;

  get shouldGrow() {
    // * checking for mouse over here seems to be redundant
    return (this.state.draggedOver /*|| this.mouseOver*/) && !this.state.hide;
  }

  @Input() file: FileModel | undefined;
  @Input() state: FileState = defaultFileState();
  /** If the file's name is longer than the max text length, then it will be truncated */
  @Input() maxTextLength?: number;

  @Input() selected = false;
  @Input() displayPath = false;
  @Input() altColor = false;
  @Input() viewType: FileViewType = FileViewType.Detail;

  constructor(
    private pinService: PinService,
    private indexingFilesOverlayService: IndexingFilesOverlayService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._isIconType = this.isIconType(this.viewType);
  }

  ngDoCheck(): void {
    if (this.state.requestRename) {
      this.renameRequested();
    }
  }

  get fileDisplayName(): string {
    const fileName = this.fileNameField;
    if (fileName.endsWith(".lnk")) {
      return fileName.split(".")[0];
    }
    return fileName;
  }

  get fileNameField(): string {
    if (this.file) {
      const name = this.file.Name;
      if (this.maxTextLength && name.length > this.maxTextLength) {
        const text = name.substring(0, this.maxTextLength);
        return `${text}...`;
      }
      return this.file.Name;
    }
    return "";
  }

  set fileNameField(val: string) {
    if (this.file) this.file.Name = val;
  }

  get isPinned(): boolean {
    if (!this.file) return false;
    return this.pinService.isFilePinned(this.file);
  }

  onMouseEnter() {
    this.mouseOver = true;
  }

  onMouseLeave() {
    this.mouseOver = false;
  }

  renameRequested() {
    this.state.requestRename = false;
    this._isRenaming = true;
    if (this.file) {
      this._nameBeforeRename = this.file.Name;
      // Trigger the CDR so that the renameInputBox gets picked up
      // since it is typically hidden behind an ngIf
      this.cdr.detectChanges();
      this.renameBox.nativeElement.focus();
      const { start, end } = rangeToLastPeriod(this.file.Name);
      setTimeout(() => {
        this.renameBox.nativeElement.setSelectionRange(start, end);
      }, 10);
    }
  }

  cancelRename() {
    this._isRenaming = false;
    // Revert the file to its old name and don't make changes
    if (this.file && this._nameBeforeRename)
      this.file.Name = this._nameBeforeRename;
  }

  // onDragOver(event: DragEvent) {
  //   // Prevent default to allow drop
  //   event.preventDefault();
  //   if(!this.file?.IsDirectory) return;
  //   // Check if files are being dragged
  //   if (event.dataTransfer?.types.includes('Files')) {
  //     this.state.draggedOver = true;
  //   }
  // }

  // onDragLeave(event: DragEvent) {
  //   event.preventDefault();
  //   this.state.draggedOver = false;
  // }

  // onDrop(event: DragEvent){
  //   event.preventDefault();
  //   if (!event.dataTransfer?.files) return;
  //   const files = Array.from(event.dataTransfer.files);
  //   if(files.some(x=>x.name==this.file?.Name)){
  //     console.log("Same file");
  //     return;
  //   }
  // }

  private isIconType(viewType: FileViewType): boolean {
    switch (viewType) {
      case FileViewType.MediumIcon:
        return true;
      default:
        return false;
    }
  }

  isFileBeingIndexed(indexedFiles: any[]): boolean {
    return indexedFiles.some((x) => x.Path === this.file?.FilePath);
  }
}
