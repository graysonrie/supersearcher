import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { IconifyIconModule } from "../../../../shared/components/icons/IconifyIcons/icon.module";
import { FileViewType } from "../file-result/enums/view-type";
import { getIconFromPath } from "src/app/features/home-page/components/file-icon/get-icon-from-path";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { BehaviorSubject } from "rxjs";
import { AsyncPipe, CommonModule } from "@angular/common";

@Component({
  selector: "app-file-icon",
  standalone: true,
  imports: [IconifyIconModule, AsyncPipe, CommonModule],
  templateUrl: "./file-icon.component.html",
  styleUrl: "./file-icon.component.css",
})
export class FileIconComponent implements OnInit, OnChanges {
  _isBase64 = false;
  icon$ = new BehaviorSubject<string>("");
  @Input() filePath?: string;
  @Input() isDirectory = false;
  @Input() viewType: FileViewType = FileViewType.Detail;

  constructor(private commandsService: TauriCommandsService) {}

  ngOnInit() {
    this.updateIcon();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["filePath"] || changes["isDirectory"]) {
      this.updateIcon();
    }
  }

  private async updateIcon(): Promise<void> {
    this._isBase64 = false;
    if (this.filePath) {
      if (this.isDirectory) {
        this.icon$.next("folder");
        return;
      }
      const icon = getIconFromPath(this.filePath);
      if (icon) {
        this.icon$.next(icon);
        return;
      }
      const useSystemIcon = false; // TODO: reenable
      if (useSystemIcon) {
        const systemIcon = await this.commandsService.getFileIcon(
          this.filePath,
          20
        );
        if (systemIcon) {
          if (!systemIcon.DefaultIcon) {
            this._isBase64 = true;
            this.icon$.next(systemIcon.Base64Icon);
            return;
          }
        }
        this.icon$.next("default");
      }
    }
    this.icon$.next("default");
  }

  get iconSize(): string {
    switch (this.viewType) {
      case FileViewType.MediumIcon:
        return "2rem";
      default:
        return "1.2rem";
    }
  }

  isIconType(): boolean {
    switch (this.viewType) {
      case FileViewType.MediumIcon:
        return true;
      default:
        return false;
    }
  }
}
