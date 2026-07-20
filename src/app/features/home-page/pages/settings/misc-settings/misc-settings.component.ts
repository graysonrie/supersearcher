import { Component, OnDestroy, OnInit } from "@angular/core";
import { IconifyIconModule } from "../../../../../shared/components/icons/IconifyIcons/icon.module";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-misc-settings",
  standalone: true,
  imports: [IconifyIconModule],
  templateUrl: "./misc-settings.component.html",
  styleUrl: "./misc-settings.component.css",
})
export class MiscSettingsComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  addDirectoriesToCrawlerQueueOnClick = false;

  constructor(private configService: PersistentConfigService) {}

  async ngOnInit(): Promise<void> {
    this.addDirectoriesToCrawlerQueueOnClick = await this.configService.readOrSet(
      "addDirectoriesToCrawlerQueueOnClick",
      false,
    );

    this.subscription.add(
      this.configService
        .observeKey("addDirectoriesToCrawlerQueueOnClick")
        .subscribe((value) => {
          if (value !== undefined) {
            this.addDirectoriesToCrawlerQueueOnClick = value;
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async onToggle(enabled: boolean) {
    this.addDirectoriesToCrawlerQueueOnClick = enabled;
    await this.configService.update(
      "addDirectoriesToCrawlerQueueOnClick",
      enabled,
    );
  }
}
