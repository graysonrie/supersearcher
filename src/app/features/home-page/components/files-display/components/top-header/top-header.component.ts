import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DirectoryHistoryService } from "src/app/features/home-page/services/directory-history.service";

import { PinnedFilesHeaderComponent } from "./pinned-files-header/pinned-files-header.component";
import { TabsHolderComponent } from "./tabs-holder/tabs-holder.component";

import { CommonModule } from "@angular/common";
import {
  UtilButtonType,
  UtilButtonComponent,
} from "./util-button/util-button.component";
import { CurrentDirectoryBarComponent } from "./current-directory-bar/current-directory-bar.component";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { SearchbarComponent } from "../../../searchbar/searchbar.component";
import { DirectoryNavigatorService } from "src/app/features/home-page/services/directory-navigator.service";
import { checkOverflow } from "@shared/util/element-overflow-checker";

@Component({
  selector: "app-top-header",
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    PinnedFilesHeaderComponent,
    TabsHolderComponent,
    IconifyIconModule,
    UtilButtonComponent,
    CurrentDirectoryBarComponent,
  ],
  templateUrl: "./top-header.component.html",
  styleUrl: "./top-header.component.css",
})
export class TopHeaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild("toolbarButtonContainer") toolbarButtonContainer!: ElementRef;
  utilButtons: UtilButtonType[] = [
    "undo",
    "redo",
    "navigateBack",
    "new",
    "copy",
    "paste",
    "cut",
    "rename",
    "trash",
  ];

  visibleUtilButtons: UtilButtonType[] = [];
  overflowingUtilButtons: UtilButtonType[] = [];

  private resizeObserver!: ResizeObserver;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.updateVisibleItems();
      });
    });

    this.resizeObserver.observe(this.toolbarButtonContainer.nativeElement);

    this.updateVisibleItems();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.cdr.detach();
  }

  updateVisibleItems() {
    this.visibleUtilButtons.length = 0;
    this.overflowingUtilButtons.length = 0;
    this.utilButtons.forEach((x) => {
      this.visibleUtilButtons.push(x);
    });
    this.cdr.detectChanges();

    this.overflowingUtilButtons = checkOverflow(
      this.visibleUtilButtons,
      this.toolbarButtonContainer,
      ".toolbar-button",
      false,
      1
    );
  }
}
