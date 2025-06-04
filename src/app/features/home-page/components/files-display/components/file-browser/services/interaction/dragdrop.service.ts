import {
  ElementRef,
  Injectable,
  Renderer2,
  RendererFactory2,
} from "@angular/core";
import { FileModel } from "@core/models/file-model";
import { BehaviorSubject } from "rxjs";
import { FilesListService } from "../../../../services/files-list.service";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { TauriCommandsService } from "@core/services/tauri/commands.service";

@Injectable()
export class DragDropService {
  private filesAwaitingDrop: File[] = [];

  private draggingItemsToSubject = new BehaviorSubject<FileModel | undefined>(
    undefined
  );

  draggingItemsTo$ = this.draggingItemsToSubject.asObservable();

  get numFilesAwaitingDrop() {
    return this.filesAwaitingDrop.length;
  }

  /** Returns true if the files were attempted to be dropped in a directory */
  get draggingItemsToADirectory(): boolean {
    return this.draggingItemsToSubject.getValue()?.IsDirectory ?? false;
  }

  constructor(
    private commandsService: TauriCommandsService,
    private filesListService: FilesListService
  ) {}

  onDragStart(event: DragEvent, items: Set<FileModel>) {
    event.preventDefault();
    if (items.size == 0) {
      console.warn("No items to drag");
      return;
    }
    const filePaths = Array.from(items).map((x) =>
      x.FilePath
    );

    startDrag({
      item: Array.from(items).map(x => x.FilePath),
      icon: 'assets/icons/appicon.svg'
    });
  }

  onDragOver(event: DragEvent, targetItem: FileModel) {
    event.preventDefault();
    if (targetItem.IsDirectory) {
      this.filesListService.updateFileState(targetItem, { draggedOver: true });
    }
  }

  onDragLeave(event: DragEvent, targetItem: FileModel) {
    event.preventDefault();
    this.filesListService.updateFileState(targetItem, { draggedOver: false });
  }

  onDrop(event: DragEvent, targetItem: FileModel) {
    this.filesAwaitingDrop = [];
    event.preventDefault();
    if (!event.dataTransfer?.files) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.some((x) => x.name == targetItem.Name)) {
      console.log("Same file");
      return;
    }
    this.filesAwaitingDrop = files;
    this.draggingItemsToSubject.next(targetItem);
    this.filesListService.updateFileState(targetItem, { draggedOver: false });
  }

  onDragEnd(event: DragEvent, targetItem: FileModel) {
    //this.unhideAllDraggingItems();
  }

  /** Attempt to move the items that were being dragged into their previous target */
  async moveDraggedItemsAsync() {
    const target = this.draggingItemsToSubject.getValue();
    // Ensure that the target exists and is a directory
    if (!target || !target.IsDirectory) return;

    this.filesAwaitingDrop.forEach(async (item) => {
      const file = item.name;
      const moveTo = target.FilePath;
      await this.commandsService.movePathIntoDirectory(moveTo, file);
      if (file != moveTo) {
        console.log(`Moved ${item.name} to ${moveTo}`);
      }
    });
  }

  unhideAllDraggingItems() {
    // const currentItems = this.draggedItemsSubject.getValue();
    // currentItems.forEach((f) =>
    //   this.filesListService.updateFileState(f, { hide: false })
    // );
    // this.draggedItemsSubject.next(new Set([...currentItems]));
  }
}
