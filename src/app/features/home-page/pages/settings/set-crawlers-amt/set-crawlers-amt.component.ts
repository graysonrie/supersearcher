import { Component, OnDestroy, OnInit } from "@angular/core";
import { SliderComponent } from "../../../../../shared/components/sliders/slider/slider.component";
import { IconifyIconModule } from "../../../../../shared/components/icons/IconifyIcons/icon.module";
import { CommonModule } from "@angular/common";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-set-crawlers-amt",
  standalone: true,
  imports: [IconifyIconModule, CommonModule],
  templateUrl: "./set-crawlers-amt.component.html",
  styleUrl: "./set-crawlers-amt.component.css",
})
export class SetCrawlersAmtComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  settings = ["Quiet", "Moderate", "Heavy"];
  selectedSettingIdx = -1;

  constructor(private configService: PersistentConfigService) {}

  async ngOnInit(): Promise<void> {
    this.subscription.add(
      this.configService.observeKey("crawlerSettings").subscribe((settings) => {
        const numCrawlers = settings.MaxNumCrawlers;
        console.log("Current max num crawlers", numCrawlers);
        if (numCrawlers < 5) {
          this.selectedSettingIdx = 0;
        } else if (numCrawlers < 8) {
          this.selectedSettingIdx = 1;
        } else {
          this.selectedSettingIdx = 2;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async setIndexingLevel(level: number) {
    let setNumCrawlers = 0;
    if (level == 0) {
      setNumCrawlers = 2;
    } else if (level == 1) {
      setNumCrawlers = 5;
    } else if (level == 2) {
      setNumCrawlers = 8;
    }
    if (setNumCrawlers == 0) {
      throw new Error("Index out of range. Should be between 0 and 2");
    }
    this.selectedSettingIdx = level;
    console.log("Setting index level to", this.selectedSettingIdx);
    await this.configService.update("crawlerSettings", {
      MaxNumCrawlers: setNumCrawlers,
    });
  }
}
