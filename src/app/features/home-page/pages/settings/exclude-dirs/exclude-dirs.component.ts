import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from "@angular/core";
import { IconifyIconModule } from "../../../../../shared/components/icons/IconifyIcons/icon.module";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { CommonModule } from "@angular/common";
import { ButtonWIconComponent } from "../../../../../shared/components/buttons/button-w-icon/button-w-icon.component";
import { isADiskDrive } from "@shared/util/string";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-exclude-dirs",
  standalone: true,
  imports: [
    IconifyIconModule,
    CommonModule,
    ButtonWIconComponent,
    ReactiveFormsModule,
  ],
  templateUrl: "./exclude-dirs.component.html",
  styleUrl: "./exclude-dirs.component.css",
})
export class ExcludeDirsComponent implements AfterViewInit {
  _pendingDirectoriesToAdd: FormControl[] = [];
  @ViewChildren("directoryInput") directoryInputs!: QueryList<ElementRef>;

  directoryNamesToExclude$ = this.configService.observeKey(
    "crawlerDirectoryNamesExclude"
  );
  constructor(private configService: PersistentConfigService) {}

  ngAfterViewInit() {
    // Subscribe to changes in the QueryList
    this.directoryInputs.changes.subscribe(() => {
      // Focus the last input whenever the list changes
      setTimeout(() => {
        const lastInput = this.directoryInputs.last;
        if (lastInput) {
          lastInput.nativeElement.focus();
          lastInput.nativeElement.select();
        }
      });
    });
  }

  isDiskDrive(path: string) {
    return isADiskDrive(path);
  }

  addPendingDirectory() {
    this._pendingDirectoriesToAdd.push(new FormControl("Program Files"));
  }

  onInputBlur(control: FormControl) {
    if (control.value.trim()) {
      this.commitDirectories(new Set([control.value]));
    }
  }

  onInputKeydown(event: KeyboardEvent, control: FormControl) {
    if (event.key === "Enter" && control.value.trim()) {
      event.preventDefault();
      this.commitDirectories(new Set([control.value]));
    }
  }

  // Also removes the directory if it is pending
  async commitDirectories(dirs: Set<string>) {
    const current = await this.getCurrentState();
    dirs.forEach((dir) => {
      this._pendingDirectoriesToAdd = this._pendingDirectoriesToAdd.filter(
        (control) => control.value !== dir
      );
      // Ensure there are no duplicate entries
      if (!current.includes(dir)) {
        current.push(dir);
      }
    });
    await this.configService.update("crawlerDirectoryNamesExclude", current);
  }

  async removeDirectory(dirPath: string) {
    const current = await this.getCurrentState();
    const filtered = current.filter((x) => x != dirPath);
    await this.configService.update("crawlerDirectoryNamesExclude", filtered);
  }

  async getCurrentState() {
    const current = await this.configService.read(
      "crawlerDirectoryNamesExclude"
    );
    if (!current) {
      throw new Error("Could not find key in config");
    }
    return current;
  }
}
