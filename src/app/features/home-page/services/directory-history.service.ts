import { Injectable, OnDestroy } from "@angular/core";
import { DirectoryNavigatorService } from "./directory-navigator.service";
import { DirectoryMetadata } from "../../../core/models/directory-metadata";
import { Subscription, BehaviorSubject } from "rxjs";
import { PersistentConfigService } from "@core/services/persistence/config.service";

/**
 * Provides functionality for the undo and redo buttons
 */
@Injectable()
export class DirectoryHistoryService implements OnDestroy {
  subscription = new Subscription();

  private selfUpdated = false;
  private currentDir: string | undefined;

  private undoStackSubject = new BehaviorSubject<string[]>([]);
  undoStack$ = this.undoStackSubject.asObservable();

  private redoStackSubject = new BehaviorSubject<string[]>([]);
  redoStack$ = this.redoStackSubject.asObservable();

  constructor(
    private directoryNavService: DirectoryNavigatorService,
  ) {
    this.subscription.add(
      this.directoryNavService.currentDir$.subscribe((dir) => {
        this.updateNavigate(dir);
      })
    );
  }

  updateNavigate(newDirectory: string) {
    const oldDir = this.currentDir;
    this.currentDir = newDirectory;
    if (this.selfUpdated) {
      this.selfUpdated = false;
      return;
    }
    if (oldDir) this.undoStackSubject.next([...this.undoStackSubject.getValue(), oldDir]);
    this.redoStackSubject.next([]); // Clear the redo stack since it is now invalidated
  }

  /** Navigate to the previously visited directory, if any */
  undo() {
    if (this.undoStackSubject.getValue().length == 0) return; // Nowhere to undo
    const lastDirectory = this.undoStackSubject.getValue().pop();
    this.undoStackSubject.next(this.undoStackSubject.getValue().slice(0, -1));
    if (this.currentDir) this.redoStackSubject.next([...this.redoStackSubject.getValue(), this.currentDir]);

    this.selfUpdated = true;
    this.directoryNavService.setCurrentDir(lastDirectory!);
  }

  /**  Navigate back to the visited directory, if any */
  redo() {
    if (this.redoStackSubject.getValue().length == 0) return; // Nowhere to redo
    const nextDirectory = this.redoStackSubject.getValue().pop();
    this.redoStackSubject.next(this.redoStackSubject.getValue().slice(0, -1));
    if (this.currentDir) this.undoStackSubject.next([...this.undoStackSubject.getValue(), this.currentDir]);

    this.selfUpdated = true;
    this.directoryNavService.setCurrentDir(nextDirectory!);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
