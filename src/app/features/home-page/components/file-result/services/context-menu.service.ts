import { Injectable } from "@angular/core";
import { ContextMenuComponent } from "@shared/components/popups/context-menu/context-menu.component";
import { FileModel } from "@core/models/file-model";
import { PinService } from "src/app/features/home-page/services/pin.service";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { FileState } from "../file-state";

@Injectable()
export class FileContextMenuService {
  constructor(
    private pinService: PinService,
    private commandsService: TauriCommandsService
  ) { }

  openMenu(
    menu: ContextMenuComponent,
    event: MouseEvent,
    callers: FileModel[],
    states?: FileState[]
  ) {
    event.preventDefault();

    let content: any[] = [];
    if (callers.length == 1) {
      const caller = callers[0];
      const pin = this.pinService.isFilePinned(caller)
        ? {
          name: "Unpin",
          action: () => {
            this.pinService.unpinFile(caller);
          },
        }
        : {
          name: "Quick Pin",
          action: () => {
            this.pinService.pinFile(caller);
          },
        };
      content.push(pin);
    }
    if (callers.length == 1) {
      const caller = callers[0];
      const openInExplorer = {
        name: "Open in Explorer",
        action: () => {
          this.commandsService.openInExplorer(caller.FilePath);
        },
      };
      content.push(openInExplorer);
    }
    const copy = {
      name: "Copy",
      action: () => {
        this.commandsService.copyPathsToClipboard(callers.map(c => c.FilePath));
      },
    };
    content.push(copy);
    if (states && states.length == 1) {
      const state = states[0];
      if (state) {
        const rename = {
          name: "Rename",
          action: () => {
            state.requestRename = true;
          },
        };
        content.push(rename);
      }
    }

    menu.content = content;
    menu.toggleOpen(event);
  }
}
