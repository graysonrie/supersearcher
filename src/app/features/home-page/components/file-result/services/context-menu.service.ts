import { Injectable } from "@angular/core";
import { ContextMenuComponent } from "@shared/components/popups/context-menu/context-menu.component";
import { FileModel } from "@core/models/file-model";
import { PinService } from "src/app/features/home-page/services/pin.service";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { FileState } from "../file-state";
import { ContextMenuButton } from "@shared/components/popups/context-menu/models/ContextMenuButton";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import {
  isDirectoryWhitelisted,
  normalizeDirectoryPath,
} from "@shared/util/string";

@Injectable()
export class FileContextMenuService {
  constructor(
    private pinService: PinService,
    private commandsService: TauriCommandsService,
    private config: PersistentConfigService,
  ) {}

  async openMenu(
    menu: ContextMenuComponent,
    event: MouseEvent,
    callers: FileModel[],
    states?: FileState[],
  ) {
    event.preventDefault();

    let content: ContextMenuButton[] = [];
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

    const directories = callers.filter((caller) => caller.IsDirectory);
    if (directories.length > 0) {
      const currentWhitelisted =
        (await this.config.read("crawlerWhitelistedDirectories")) ?? [];
      const whitelistedDirectories = directories.filter((directory) =>
        isDirectoryWhitelisted(directory.FilePath, currentWhitelisted),
      );
      const notWhitelistedDirectories = directories.filter(
        (directory) =>
          !isDirectoryWhitelisted(directory.FilePath, currentWhitelisted),
      );

      if (notWhitelistedDirectories.length > 0) {
        content.push({
          name: "Whitelist",
          action: () => {
            void this.addToWhitelist(
              notWhitelistedDirectories.map((directory) => directory.FilePath),
            );
          },
        });
      }

      if (whitelistedDirectories.length > 0) {
        content.push({
          name: "Remove from whitelist",
          action: () => {
            void this.removeFromWhitelist(
              whitelistedDirectories.map((directory) => directory.FilePath),
            );
          },
        });
      }
    }

    const copy = {
      name: "Copy",
      action: () => {
        this.commandsService.copyPathsToClipboard(
          callers.map((c) => c.FilePath),
        );
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

  private async addToWhitelist(paths: string[]): Promise<void> {
    const current =
      (await this.config.read("crawlerWhitelistedDirectories")) ?? [];
    const updated = [...current];

    for (const path of paths) {
      if (!isDirectoryWhitelisted(path, updated)) {
        updated.push(path);
      }
    }

    await this.config.update("crawlerWhitelistedDirectories", updated);
  }

  private async removeFromWhitelist(paths: string[]): Promise<void> {
    const current =
      (await this.config.read("crawlerWhitelistedDirectories")) ?? [];
    const normalizedPaths = new Set(paths.map(normalizeDirectoryPath));
    const filtered = current.filter(
      (entry) => !normalizedPaths.has(normalizeDirectoryPath(entry)),
    );

    await this.config.update("crawlerWhitelistedDirectories", filtered);
  }
}
