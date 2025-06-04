import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { IndexedDirModel } from "@core/models/indexed-dir-model";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { interval, Subscription } from "rxjs";
import { IconifyIconModule } from "../../../../shared/components/icons/IconifyIcons/icon.module";
import { ButtonWIconComponent } from "../../../../shared/components/buttons/button-w-icon/button-w-icon.component";
import { StandardLoaderComponent } from "../../../../shared/components/loaders/standard-loader/standard-loader.component";
import { IndexingFilesOverlayService } from "./indexing-files-overlay.service";

@Component({
  selector: "app-info-box",
  standalone: true,
  imports: [CommonModule, IconifyIconModule, StandardLoaderComponent],
  templateUrl: "./info-box.component.html",
  styleUrl: "./info-box.component.scss",
})
export class InfoBoxComponent implements OnInit, OnDestroy {
  _items: IndexedDirModel[] = [];
  _numItemsBeingIndexed = 0;
  _show = false;
  private subscription = new Subscription();

  constructor(
    private commands: TauriCommandsService,
    private service: IndexingFilesOverlayService
  ) {
    this.subscription.add(
      this.service.itemsBeingIndexed$.subscribe((x) => (this._items = x))
    );
  }

  ngOnInit() {
    // Set up polling every 5 seconds
    this.subscription.add(
      this.service.itemsBeingIndexed$.subscribe((x) => (this._items = x))
    );
    this.subscription.add(
      this.service.numItemsBeingIndexed$.subscribe(
        (x) =>
          (this._numItemsBeingIndexed = this.numItemsBeingIndexedAsNumber(x))
      )
    );
    this.subscription.add(
      this.service.show$.subscribe((value) => {
        this._show = value;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onDropdownClick() {
    this.service.toggle();
  }

  numItemsBeingIndexedAsNumber(num: string) {
    if (num.endsWith("+")) {
      // ensure that strings like '500+' still get converted correctly
      return Number(num.substring(0, num.length - 1));
    }
    return Number(num);
  }
}
