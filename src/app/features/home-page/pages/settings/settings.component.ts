import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { IconifyIconModule } from "../../../../shared/components/icons/IconifyIcons/icon.module";
import { ExcludeDirsComponent } from "./exclude-dirs/exclude-dirs.component";
import { SetCrawlersAmtComponent } from "./set-crawlers-amt/set-crawlers-amt.component";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, IconifyIconModule, ExcludeDirsComponent, SetCrawlersAmtComponent],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css",
})
export class SettingsComponent {}
