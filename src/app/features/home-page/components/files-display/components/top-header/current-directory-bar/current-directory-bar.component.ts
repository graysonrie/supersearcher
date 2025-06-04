import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { BreadcrumbModel } from "./models/breadcrumb-model";
import { DirectoryNavigatorService } from "src/app/features/home-page/services/directory-navigator.service";
import { checkOverflow } from "@shared/util/element-overflow-checker";

@Component({
  selector: "app-current-directory-bar",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./current-directory-bar.component.html",
  styleUrl: "./current-directory-bar.component.scss",
})
export class CurrentDirectoryBarComponent implements AfterViewInit, OnDestroy {
  subscription = new Subscription();

  @ViewChild("textInput") textInput!: ElementRef;

  directory = "";
  visibleDirectories: BreadcrumbModel[] = [];
  showEllipsis: boolean = false;

  hasChanged = false;
  inputControl = new FormControl();
  private resizeObserver!: ResizeObserver;

  constructor(
    private directoryService: DirectoryNavigatorService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.updateVisibleDirectories();
    this.subscription.add(
      this.directoryService.currentDir$.subscribe((x) => {
        this.directory = x;
        this.updateVisibleDirectories();
      })
    );
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.updateVisibleDirectories();
      });
    });
    this.resizeObserver.observe(this.textInput.nativeElement);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.cdr.detach();
    this.resizeObserver.disconnect();
  }

  onInputChange() {
    this.hasChanged = true;
  }

  onEnterPressed() {
    this.textInput.nativeElement.blur();
  }

  async onBlur() {
    if (this.hasChanged)
      await this.directoryService.setCurrentDir(this.directory);
    this.hasChanged = false;
  }

  async onBreadcrumbClicked(model: BreadcrumbModel) {
    await this.directoryService.setCurrentDir(model.fullPath);
  }

  selectText() {
    if (this.textInput && this.textInput.nativeElement) {
      this.textInput.nativeElement.select();
    }
  }

  private updateVisibleDirectories() {
    const parts = this.directory.split("\\").filter((x) => x != "");
    let dirBuilder: string = "";
    let i = 0;
    this.visibleDirectories.length = 0;
    parts.forEach((x) => {
      if (x != "") {
        // Add a normal section
        dirBuilder += `${x}\\`;
        this.visibleDirectories.push({
          fullPath: dirBuilder,
          section: x,
          prevPaths: [],
        });
        i++;
        // Add a '>' block
        if (i < parts.length) {
          this.visibleDirectories.push({
            fullPath: "",
            section: ">",
            prevPaths: ["C:\\"],
          });
        }
      }
    });

    this.cdr.detectChanges();

    checkOverflow(this.visibleDirectories, this.textInput, ".breadcrumb");

    this.showEllipsis = this.visibleDirectories.length > 0;
  }
}
