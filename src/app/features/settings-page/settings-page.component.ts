import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FileCrawlerService } from "../../core/services/files/backend/file_crawler.service";
import { IndexedDirModel } from "../../core/models/indexed-dir-model";
import { CommonModule } from "@angular/common";
import { interval, Subject, Subscription, switchMap, takeUntil } from "rxjs";

@Component({
  selector: "app-settings-page",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./settings-page.component.html",
  styleUrl: "./settings-page.component.css",
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  crawlerQueue: IndexedDirModel[] = [];
  crawlerPriorityCounts: Array<{ priority: number; count: number }> = [];
  crawlerAnalyzerData: Array<{ label: string; data: string }> = [];

  private readonly refreshIntervalMs = 4000; // 4 seconds
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private fileCrawlerService: FileCrawlerService
  ) {}

  async ngOnInit(): Promise<void> {
    interval(this.refreshIntervalMs)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.refreshCrawlerData())
      )
      .subscribe();
  }

  private async refreshCrawlerData() {
    this.crawlerPriorityCounts =
      await this.fileCrawlerService.viewCrawlerPriorityCounts();
    this.crawlerAnalyzerData =
      await this.fileCrawlerService.getCrawlerAnalyzerData();
  }

  leaveSettingsButtonClick() {
    this.router.navigate(["./home"]);
  }

  ngOnDestroy(): void {
    // Clean up the interval when the component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }
}
