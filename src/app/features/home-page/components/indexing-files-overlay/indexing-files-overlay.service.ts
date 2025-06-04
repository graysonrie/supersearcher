import { Injectable, OnDestroy } from "@angular/core";
import { IndexedDirModel } from "@core/models/indexed-dir-model";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { BehaviorSubject, interval, Subscription } from "rxjs";

@Injectable({ providedIn: "root" })
export class IndexingFilesOverlayService {
  private subscription = new Subscription();

  private itemsBeingIndexedSubject = new BehaviorSubject<IndexedDirModel[]>([]);
  itemsBeingIndexed$ = this.itemsBeingIndexedSubject.asObservable();

  private numItemsBeingIndexedSubject = new BehaviorSubject<string>("0");
  numItemsBeingIndexed$ = this.numItemsBeingIndexedSubject.asObservable();

  private showSubject = new BehaviorSubject<boolean>(false);
  show$ = this.showSubject.asObservable();

  constructor(private commands: TauriCommandsService) {
    // Initial fetch
    this.getCurrentIndexingItems();

    // Set up polling every 5 seconds
    this.subscription.add(
      interval(2000).subscribe(() => {
        this.getCurrentIndexingItems();
      })
    );
  }

  private async getCurrentIndexingItems() {
    const limit = 500;
    this.itemsBeingIndexedSubject.next(
      await this.commands.viewCrawlerQueue(limit)
    );
    if (this.itemsBeingIndexedSubject.getValue().length == limit) {
      this.numItemsBeingIndexedSubject.next(`${limit}+`);
    } else {
      this.numItemsBeingIndexedSubject.next(
        this.itemsBeingIndexedSubject.getValue().length.toLocaleString()
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleOn() {
    this.showSubject.next(true);
  }
  toggleOff() {
    this.showSubject.next(false);
  }
  toggle() {
    this.showSubject.next(!this.showSubject.getValue());
  }
}
