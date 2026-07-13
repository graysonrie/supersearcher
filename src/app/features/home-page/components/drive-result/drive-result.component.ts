import { Component, Input, ViewChild } from "@angular/core";
import { DriveModel } from "@core/models/drive-model";
import { CommonModule } from "@angular/common";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { ButtonWIconComponent } from "../../../../shared/components/buttons/button-w-icon/button-w-icon.component";
import { DriveContextMenuService } from "./services/context-menu.service";
import { ContextMenuComponent } from "@shared/components/popups/context-menu/context-menu.component";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { isDirectoryWhitelisted } from "@shared/util/string";
import { from, map, startWith, switchMap } from "rxjs";

type DriveWhitelistStyle = "default" | "whitelisted" | "muted";

@Component({
  selector: "app-drive-result",
  standalone: true,
  imports: [CommonModule, IconifyIconModule, ButtonWIconComponent, ContextMenuComponent],
  templateUrl: "./drive-result.component.html",
  styleUrl: "./drive-result.component.scss",
  providers: [DriveContextMenuService],
})
export class DriveResultComponent {
  @Input() drive!: DriveModel;
  @ViewChild("contextMenu") contextMenu!: ContextMenuComponent;

  whitelist$ = from(
    this.config.read("crawlerWhitelistedDirectories"),
  ).pipe(
    map((whitelist) => whitelist ?? []),
    switchMap((initial) =>
      this.config.observeKey("crawlerWhitelistedDirectories").pipe(
        map((whitelist) => whitelist ?? []),
        startWith(initial),
      ),
    ),
  );

  constructor(
    private contextMenuService: DriveContextMenuService,
    private config: PersistentConfigService,
  ) {}

  onRightClick(event: MouseEvent) {
    this.contextMenuService.openMenu(this.contextMenu, event, [this.drive]);
  }

  getWhitelistStyle(whitelist: string[]): DriveWhitelistStyle {
    if (whitelist.length === 0) {
      return "default";
    }

    return isDirectoryWhitelisted(this.drive.Name, whitelist)
      ? "whitelisted"
      : "muted";
  }

  getIconColor(whitelist: string[]): string | undefined {
    const style = this.getWhitelistStyle(whitelist);

    if (style === "whitelisted") {
      return "--primary";
    }

    if (style === "muted") {
      return "--text-muted";
    }

    return undefined;
  }
}
