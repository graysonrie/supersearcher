import { Injectable } from "@angular/core";
import { ContextMenuComponent } from "@shared/components/popups/context-menu/context-menu.component";
import { ContextMenuButton } from "@shared/components/popups/context-menu/models/ContextMenuButton";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { FileCrawlerService } from "@core/services/files/backend/file_crawler.service";
import { DriveModel } from "@core/models/drive-model";
import { isDirectoryWhitelisted, normalizeDirectoryPath } from "@shared/util/string";

@Injectable()
export class DriveContextMenuService {
  constructor(
    private config: PersistentConfigService,
    private fileCrawlerService: FileCrawlerService,
  ) {}

  async openMenu(
    menu: ContextMenuComponent,
    event: MouseEvent,
    callers: DriveModel[],
  ) {
    event.preventDefault();

    if (callers.length !== 1) {
      return;
    }

    const caller = callers[0];
    const currentWhitelisted =
      (await this.config.read("crawlerWhitelistedDirectories")) ?? [];
    const isWhitelisted = isDirectoryWhitelisted(caller.Name, currentWhitelisted);

    const content: ContextMenuButton[] = [
      {
        name: "Index Now",
        action: () => {
          void this.indexDirectory(caller.Name);
        },
      },
    ];

    if (isWhitelisted) {
      content.push({
        name: "Remove from whitelist",
        action: () => {
          void this.removeFromWhitelist(caller.Name);
        },
      });
    } else {
      content.push({
        name: "Whitelist",
        action: () => {
          void this.addToWhitelist(caller.Name);
        },
      });
    }

    menu.content = content;
    menu.toggleOpen(event);
  }

  private async indexDirectory(path: string): Promise<void> {
    await this.fileCrawlerService.addDirectoriesToQueue([
      { DirPath: path, Priority: 0 },
    ]);
    console.log("Added directories to crawler queue:", [path]);
  }

  private async addToWhitelist(driveName: string): Promise<void> {
    const current =
      (await this.config.read("crawlerWhitelistedDirectories")) ?? [];

    if (isDirectoryWhitelisted(driveName, current)) {
      return;
    }

    await this.config.update("crawlerWhitelistedDirectories", [
      ...current,
      driveName,
    ]);
  }

  private async removeFromWhitelist(driveName: string): Promise<void> {
    const current =
      (await this.config.read("crawlerWhitelistedDirectories")) ?? [];
    const normalized = normalizeDirectoryPath(driveName);
    const filtered = current.filter(
      (entry) => normalizeDirectoryPath(entry) !== normalized,
    );

    await this.config.update("crawlerWhitelistedDirectories", filtered);
  }
}
