import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DropdownButtonModalComponent } from "@shared/components/buttons/dropdown-button-modal/dropdown-button-modal.component";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { FilesListService } from "../../../services/files-list.service";
import { SelectService } from "../../../services/select.service";
import { Subscription } from "rxjs";
import { FileModel } from "@core/models/file-model";
import { FileState } from "../../../../file-result/file-state";
import { TooltipDirective } from "@shared/components/popups/tooltip/tooltip.directive";
import { capitalizeFirstLetter } from "@shared/util/string";
import { DirectoryHistoryService } from "src/app/features/home-page/services/directory-history.service";
import { DirectoryNavigatorService } from "src/app/features/home-page/services/directory-navigator.service";

interface File {
  model: FileModel;
  state: FileState;
}

export type UtilButtonType =
  | "undo"
  | "redo"
  | "navigateBack"
  | "copy"
  | "paste"
  | "new"
  | "rename"
  | "trash"
  | "cut"
  | "more";
@Component({
  selector: "app-util-button",
  standalone: true,
  imports: [
    IconifyIconModule,
    CommonModule,
    DropdownButtonModalComponent,
    TooltipDirective,
  ],
  templateUrl: "./util-button.component.html",
  styleUrl: "./util-button.component.css",
})
export class UtilButtonComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  _alwaysActive = false;
  _isUsable = false;
  _lastSelectedFile?: File;
  _dropdownFeatures = [];
  _isDropdownType = false;
  _icon: string | undefined = undefined;
  _redoStackLen = 0;
  _undoStackLen = 0;
  _selectedFileIndices: Set<number> = new Set();

  _numSelectedItems = 0;

  constructor(
    private selectService: SelectService,
    private directoryService: DirectoryNavigatorService,
    private directoryHistoryService: DirectoryHistoryService,
  ) {}

  @Input() type: UtilButtonType = "copy";

  get utilityName(): string {
    if(this.type=='navigateBack') return 'Up';
    return capitalizeFirstLetter(this.type);
  }

  ngOnInit(): void {
    if (this.type == "new") this._isDropdownType = true;

    if(this.type == "navigateBack") this._alwaysActive = true;


    this._icon = this.type;

    this.subscription.add(
      this.selectService.lastSelectedItem$.subscribe((f) => {
        this._lastSelectedFile = f;
      })
    );
    this.subscription.add(
      this.selectService.selectedIndices$.subscribe((f) => {
        this._selectedFileIndices = f;
        this.checkIfUsable();
      })
    );
    this.subscription.add(
      this.directoryHistoryService.redoStack$.subscribe((stack) => {
        this._redoStackLen = stack.length;
        this.checkIfUsable();
      })
    );
    this.subscription.add(
      this.directoryHistoryService.undoStack$.subscribe((stack) => {
        this._undoStackLen = stack.length;
        this.checkIfUsable();
      })
    );
  }

  onClick() {
    if (this._isUsable) {
      if (this.type == "rename") {
        this.renameAction();
        return;
      }
      if (this.type == "navigateBack") {
        this.navigateBackAction();
        return;
      }
      if (this.type == "undo") {
        this.undoAction();
        return;
      }
      if (this.type == "redo") {
        this.redoAction();
        return;
      }
    }
  }

  async navigateBackAction() {
    let parent = await this.directoryService.getParentDirectory();
    await this.directoryService.setCurrentDir(parent);
  }

  async renameAction() {
    if (this._lastSelectedFile)
      this._lastSelectedFile.state.requestRename = true;
  }

  async undoAction() {
    this.directoryHistoryService.undo();
  }

  async redoAction() {
    this.directoryHistoryService.redo();
  }

  private checkIfUsable(){
    if(this._alwaysActive) {
      this._isUsable = true;
      return;
    }
    if(this.type == "redo") {
      this._isUsable = this._redoStackLen > 0;
      return;
    }
    if(this.type == "undo") {
      this._isUsable = this._undoStackLen > 0;
      return;
    }
    const n = this._selectedFileIndices.size;
    this._numSelectedItems = n;
    if (n > 0 && !(this.type == "rename" && n != 1)) {
      this._isUsable = true;
      return;
    }
    this._isUsable = false;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
