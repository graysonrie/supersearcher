import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { ColorThemeService } from "@core/services/customization/color-theme.service";
import { WindowsWindowChromeComponent } from "./layout/windows-window-chrome/windows-window-chrome.component";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { AddToCrawlerQueueDTO } from "@core/dtos/add-to-crawler-queue-dto";
import { TauriLifecycleService } from "@core/services/tauri/lifecycle.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    IconifyIconModule,
    WindowsWindowChromeComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
  constructor(
    private commandsService: TauriCommandsService,
    private configService: PersistentConfigService,
    private themeService: ColorThemeService,
    private lifecycleService: TauriLifecycleService
  ) {}

  async ngOnInit() {
    this.themeService.setTheme("dark-theme");
    if (await this.lifecycleService.isFirstUse()) {
      console.warn("is first use");
      await this.configService.update("crawlerSettings", { MaxNumCrawlers: 2 });
      await this.configService.update("crawlerWhitelistedExtensions", []);
      await this.configService.update("crawlerDirectoryNamesExclude", [
        "node_modules",
        "Program Files",
        "ProgramData",
        "AppData",
        "Windows",
      ]);
      const d: AddToCrawlerQueueDTO = {
        DirPath: "C:\\",
        Priority: 5,
      };
      await this.commandsService.addDirsToCrawlerQueue([d]);
    }
    await this.commandsService.dispatchCrawlers();
  }
}
