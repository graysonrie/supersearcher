import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FileIconComponent } from "../../../../../file-icon/file-icon.component";
import { DirectoryTabModel } from "../tabs-holder.component";
import { CommonModule } from "@angular/common";
import { DirectoryNavigatorService } from "src/app/features/home-page/services/directory-navigator.service";
import { IconifyIconModule } from "../../../../../../../../shared/components/icons/IconifyIcons/icon.module";
import { TabsService } from "src/app/features/home-page/components/files-display/services/tabs.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-directory-tab",
  standalone: true,
  imports: [FileIconComponent, CommonModule, IconifyIconModule],
  templateUrl: "./directory-tab.component.html",
  styleUrl: "./directory-tab.component.css",
})
export class DirectoryTabComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  @Input() tab?: DirectoryTabModel;
  openPaths$ = this.tabsService.openPaths$;
  activeIndex = 0;

  constructor(
    private tabsService: TabsService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.tabsService.activeIndex$.subscribe((index) => this.activeIndex = index)
    );
  }

  onClick() {
    if (this.tab) {
      this.tabsService.navigateToTab(this.tab.index);
    }
  }

  closeTab(event: MouseEvent) {
    event.stopPropagation();
    if (this.tab) {
      this.tabsService.removeTab(this.tab.index);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
