import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ModalPopupComponent } from "@shared/components/popups/modal-popup/modal-popup.component";
import { ButtonModel } from "@shared/components/popups/modal-popup/models/ButtonModel";
import { RadioButtonComponent } from "@shared/components/buttons/radio-button/radio-button.component";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { SelectService } from "../../../../services/select.service";
import { DragDropService } from "../../services/interaction/dragdrop.service";
import { Subscription } from "rxjs";
import { DirectoryNavigatorService } from "src/app/features/home-page/services/directory-navigator.service";
import { MoveItemsPopupStateService } from "./move-items-popup-state.service";
import { PrettyButtonComponent } from "../../../../../../../../shared/components/buttons/pretty-button/pretty-button.component";

@Component({
  selector: "app-move-items-popup",
  standalone: true,
  imports: [
    CommonModule,
    ModalPopupComponent,
    RadioButtonComponent,
    PrettyButtonComponent,
  ],
  templateUrl: "./move-items-popup.component.html",
  styleUrl: "./move-items-popup.component.css",
})
export class MoveItemsPopupComponent {
  currentDir$ = this.directoryNavService.currentDir$;
  dest$ = this.dragDropService.draggingItemsTo$;
  isVisible$ = this.stateService.isVisible$;
  itemsAdding$ = this.stateService.itemsAdding$;

  constructor(
    private directoryNavService: DirectoryNavigatorService,
    private selectService: SelectService,
    private dragDropService: DragDropService,

    private stateService: MoveItemsPopupStateService
  ) {}

  async onDontAskAgainToggled(newVal: boolean) {
    this.stateService.setDontAskAgain(newVal);
  }

  async onYesClicked() {
    await this.dragDropService.moveDraggedItemsAsync();
  }

  onCloseRequested() {
    this.dragDropService.unhideAllDraggingItems();
    this.stateService.closePopup();
  }
}
