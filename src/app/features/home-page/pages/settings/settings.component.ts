import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { IconifyIconModule } from "../../../../shared/components/icons/IconifyIcons/icon.module";
import { ExcludeDirsComponent } from "./exclude-dirs/exclude-dirs.component";
import { SetCrawlersAmtComponent } from "./set-crawlers-amt/set-crawlers-amt.component";
import { WhitelistDirsComponent } from "./whitelist-dirs/whitelist-dirs.component";
import { MiscSettingsComponent } from "./misc-settings/misc-settings.component";
import { IndexSchedulesComponent } from "./index-schedules/index-schedules.component";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, IconifyIconModule, ExcludeDirsComponent, SetCrawlersAmtComponent, WhitelistDirsComponent, MiscSettingsComponent, IndexSchedulesComponent],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css",
})
export class SettingsComponent {}
